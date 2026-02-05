import * as ui from '../../ui/interactive.js'
import { SubmissionStep, StepResult, FlowContext } from './BaseStep.js'
import { DraftState, FileToUpload } from './types.js'
import { DashboardView, DashboardAction } from './DashboardView.js'
import chalk from 'chalk'

export class SubmissionFlow {
    private steps: Map<string, SubmissionStep> = new Map()
    private context: FlowContext
    private setupComplete: boolean = false

    constructor(
        private state: DraftState,
        private filesToUpload: FileToUpload[],
        private projectName: string,
        private ascEmail: string | undefined,
        private credits: number | undefined,
        private saveDraftCallback: (state: DraftState, skipConfirmation?: boolean) => Promise<boolean>,
        private userEmail?: string
    ) {
        this.context = { email: userEmail, credits }

        // If we have any of these, we've clearly moved past the initial setup choice.
        const setupDone = !!(
            this.state._flowPosition ||
            this.state.description ||
            this.state.category ||
            this.state.keywords ||
            this.state._ascConnected
        )

        if (setupDone) {
            this.setupComplete = true
        }
    }

    addStep(id: string, step: SubmissionStep) {
        this.steps.set(id, step)
    }

    /**
     * Show setup choice - Easy (ASC) vs Manual
     * Returns true if user wants to continue, false if cancelled
     */
    async showSetupChoice(): Promise<boolean> {
        ui.renderHeader(this.context.email, this.context.credits)
        console.log()
        console.log(chalk.white('    ℹ Let\'s get your app ready for review.'))
        console.log(chalk.dim('      Choose how you\'d like to set up:'))
        console.log()

        const choice = await ui.select<'easy' | 'manual' | 'cancel'>({
            message: 'Setup Method',
            options: [
                {
                    value: 'easy',
                    label: 'Easy Setup',
                    hint: 'Connect to App Store Connect and auto-fill your app info',
                },
                {
                    value: 'manual',
                    label: 'Manual Setup',
                    hint: 'Enter app details yourself',
                },
                {
                    value: 'cancel',
                    label: 'Cancel',
                    hint: 'Exit without saving',
                },
            ],
        })

        if (choice === null || choice === 'cancel') {
            return false
        }

        if (choice === 'easy') {
            // Run ASC step immediately with skip confirmation flag
            this.context.skipAutofillConfirm = true
            const ascStep = this.steps.get('asc')
            if (ascStep) {
                ui.renderHeader(this.context.email, this.context.credits)
                console.log()
                ui.log.step('App Store Connect Setup')
                console.log()
                const result = await ascStep.run(this.state, this.context)
                if (result.action === 'next') {
                    // Successfully connected
                    this.state._flowPosition = 'appDetails'
                    this.setupComplete = true

                    // Wire up screenshots if downloaded
                    await this.updateScreenshotsFromState()

                    return true
                }
                // If they cancelled/went back, we stay in setup phase
                return this.showSetupChoice() // recursive retry or they can pick manual/cancel
            }
        } else if (choice === 'manual') {
            this.state._flowPosition = 'appDetails'
            this.setupComplete = true
            return true
        }

        return false
    }

    async start(): Promise<'completed' | 'cancelled'> {
        // Show setup choice if not already done
        if (!this.setupComplete) {
            const shouldContinue = await this.showSetupChoice()
            if (!shouldContinue) {
                return 'cancelled'
            }
        }

        const dashboard = new DashboardView(this.state, this.filesToUpload, this.ascEmail)

        while (true) {
            const action = await dashboard.render(this.projectName, this.context.email, this.context.credits)

            // ESC pressed - just re-render
            if (action === null) {
                continue
            }

            switch (action) {
                case 'exit':
                    const confirmExit = await ui.dangerConfirm('Exit without saving? Your progress will be lost.')
                    if (confirmExit) {
                        return 'cancelled'
                    }
                    // User said No - return to dashboard
                    break

                case 'save_draft':
                    const saved = await this.saveDraftCallback(this.state, true)
                    if (saved) {
                        await ui.keypress('Press Enter to exit...')
                        return 'cancelled'
                    }
                    // User said No - return to dashboard
                    break

                case 'review':
                    // Run review step with header
                    const reviewStep = this.steps.get('review')
                    if (reviewStep) {
                        ui.renderHeader(this.context.email, this.context.credits)
                        const result = await reviewStep.run(this.state, this.context)
                        if (result.action === 'next') {
                            return 'completed' // Submit!
                        }
                        if (result.action === 'save_draft') {
                            const reviewSaved = await this.saveDraftCallback(this.state, true)
                            if (reviewSaved) {
                                await ui.keypress('Press Enter to exit...')
                                return 'cancelled'
                            }
                            // User said No - return to dashboard
                        }
                        // 'back' returns to dashboard
                    }
                    break

                case 'asc':
                case 'screenshots':
                case 'appDetails':
                case 'compliance':
                    const result = await this.runSection(action)
                    if (result === 'save_draft') {
                        const sectionSaved = await this.saveDraftCallback(this.state, true)
                        if (sectionSaved) {
                            await ui.keypress('Press Enter to exit...')
                            return 'cancelled'
                        }
                        // User said No - return to dashboard
                    }
                    break
            }
        }
    }

    private async runSection(sectionId: DashboardAction): Promise<'save_draft' | 'back' | 'next' | void> {
        const step = this.steps.get(sectionId)
        if (!step) {
            ui.log.warning(`Section ${sectionId} not configured`)
            return
        }

        // Render header before each section
        ui.renderHeader(this.context.email, this.context.credits)
        console.log()
        ui.log.step(step.name)
        console.log()

        const result = await step.run(this.state, this.context)

        switch (result.action) {
            case 'next':
                // Section complete, update flow position and return to dashboard
                // If we just finished ASC and have downloaded screenshots, add them to the upload list
                if (sectionId === 'asc') {
                    await this.updateScreenshotsFromState()
                }

                this.state._flowPosition = sectionId === 'asc' ? 'appDetails' : sectionId as any
                return 'next'
            case 'back':
                // User wants to go back - return to dashboard
                return 'back'
            case 'save_draft':
                // Update flow position before saving
                this.state._flowPosition = sectionId as any
                return 'save_draft'
            case 'cancel':
                // User cancelled the step. Return to dashboard.
                return 'back'
        }
    }

    private async updateScreenshotsFromState() {
        if (this.state._tempScreenshotPaths && this.state._tempScreenshotPaths.length > 0) {
            const { basename } = await import('node:path')

            // Clear existing screenshots (prioritize ASC ones if user chose autofill)
            // We reverse iterate to safely splice
            for (let i = this.filesToUpload.length - 1; i >= 0; i--) {
                if (this.filesToUpload[i].type === 'screenshot') {
                    this.filesToUpload.splice(i, 1)
                }
            }

            // Add new ones
            this.state._tempScreenshotPaths.forEach((path, i) => {
                // Only add up to 10
                if (i < 10) {
                    this.filesToUpload.push({
                        type: 'screenshot',
                        index: i,
                        filename: basename(path),
                        path: path
                    })
                }
            })
        }
    }
}
