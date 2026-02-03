import * as ui from '../../ui/interactive.js'
import { SubmissionStep, StepResult, FlowContext } from './BaseStep.js'
import { DraftState, FileToUpload } from './types.js'
import { DashboardView, DashboardAction } from './DashboardView.js'

export class SubmissionFlow {
    private steps: Map<string, SubmissionStep> = new Map()
    private context: FlowContext

    constructor(
        private state: DraftState,
        private filesToUpload: FileToUpload[],
        private projectName: string,
        private ascEmail: string | undefined,
        private credits: number | undefined,
        private saveDraftCallback: (state: DraftState) => Promise<void>,
        private userEmail?: string
    ) {
        this.context = { email: userEmail, credits }
    }

    addStep(id: string, step: SubmissionStep) {
        this.steps.set(id, step)
    }

    async start(): Promise<'completed' | 'cancelled'> {
        const dashboard = new DashboardView(this.state, this.filesToUpload, this.ascEmail)

        while (true) {
            const action = await dashboard.render(this.projectName, this.context.email, this.context.credits)

            switch (action) {
                case 'save_draft':
                    await this.saveDraftCallback(this.state)
                    ui.log.success('Draft saved!')
                    return 'cancelled'

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
                            await this.saveDraftCallback(this.state)
                            return 'cancelled'
                        }
                        // 'back' returns to dashboard
                    }
                    break

                case 'asc':
                case 'screenshots':
                case 'app_details':
                case 'compliance':
                    await this.runSection(action)
                    break
            }
        }
    }

    private async runSection(sectionId: DashboardAction): Promise<void> {
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
                // Section complete, return to dashboard
                break
            case 'back':
                // User wants to go back - return to dashboard
                break
            case 'save_draft':
                // Will be handled in main loop after returning
                break
            case 'cancel':
                // Same as save_draft for sections
                break
        }

        // All paths return to dashboard
    }
}

