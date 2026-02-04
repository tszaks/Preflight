import * as ui from '../../ui/interactive.js'
import { brand, subtext } from '../../ui/theme.js'
import { DraftState, FileToUpload } from './types.js'
import chalk from 'chalk'

export type DashboardAction =
    | 'asc'
    | 'screenshots'
    | 'appDetails'
    | 'compliance'
    | 'review'
    | 'save_draft'
    | 'exit'
    | 'edit_menu'
    | 'back'

interface SectionStatus {
    id: DashboardAction
    name: string
    complete: boolean
    summary: string
    required: boolean
    stepNumber: number
}

export class DashboardView {
    constructor(
        private state: DraftState,
        private filesToUpload: FileToUpload[],
        private ascEmail?: string
    ) { }

    private getSections(): SectionStatus[] {
        const screenshotCount = this.filesToUpload.filter(f => f.type === 'screenshot').length
        const hasAppDetails = !!(this.state.appName && this.state.description)
        const hasCompliance = !!this.state.compliance

        return [
            {
                id: 'appDetails',
                name: 'App Details',
                complete: hasAppDetails,
                summary: hasAppDetails ? this.state.appName! : 'Name, description, keywords...',
                required: true,
                stepNumber: 1,
            },
            {
                id: 'screenshots',
                name: 'Screenshots',
                complete: screenshotCount > 0,
                summary: screenshotCount > 0 ? `${screenshotCount} images ready` : 'Add app screenshots',
                required: false,
                stepNumber: 2,
            },
            {
                id: 'compliance',
                name: 'Compliance',
                complete: hasCompliance,
                summary: hasCompliance ? `Age ${this.state.compliance!.ageRating}` : 'Age rating, privacy info...',
                required: true,
                stepNumber: 3,
            },
            {
                id: 'review',
                name: 'Final Review',
                complete: false, // Always false until submitted (which exits flow)
                summary: 'Review & submit',
                required: true,
                stepNumber: 4,
            },
        ]
    }

    private canSubmit(): boolean {
        const sections = this.getSections()
        // Check all required EXCEPT review itself
        return sections.filter(s => s.required && s.id !== 'review').every(s => s.complete)
    }

    private getNextStep(): SectionStatus | null {
        const sections = this.getSections()
        // Strictly follow order: 1 -> 2 -> 3 -> 4
        // Find first incomplete step, regardless of required status
        // Exception: 'review' (step 4) only if all REQUIRED steps are done
        const firstIncomplete = sections.find(s => !s.complete)
        if (!firstIncomplete) return null

        // If next is review, make sure we are actually allowed to review
        if (firstIncomplete.id === 'review' && !this.canSubmit()) {
            return null
        }

        return firstIncomplete
    }

    async render(projectName: string, email?: string, credits?: number): Promise<DashboardAction> {
        const sections = this.getSections()
        const nextStep = this.getNextStep()
        const completedCount = sections.filter(s => s.complete).length
        // Check requirement excluding 'review' step (since it's the final action)
        const requiredComplete = sections.filter(s => s.required && s.id !== 'review').every(s => s.complete)

        // Show the giant ASCII logo header
        ui.renderHeader(email, credits)

        console.log(brand(`  ◆ Submission: ${projectName}`))
        console.log()

        // Contextual guidance message
        if (completedCount === 0) {
            console.log(chalk.cyan('    ℹ Complete the steps below to get an AI review of your app.'))
            console.log(chalk.dim('      We\'ll check for App Store guideline issues before you submit to Apple.'))
            console.log()
        } else if (!requiredComplete) {
            console.log(chalk.cyan(`    ℹ Complete the required steps to continue.`))
            console.log()
        } else {
            console.log(chalk.green('    ● Ready to submit! All required steps complete.'))
            console.log()
        }

        // Progress indicator - colors match step list (Green=Done, White=Current, Dim=Future)
        const progressBar = sections.map(s => {
            if (s.complete) return chalk.green('●')
            if (nextStep?.id === s.id) return chalk.white('○')
            return chalk.dim('○')
        }).join(' ')
        console.log(`    Progress: ${progressBar}  ${chalk.dim(`(${completedCount}/${sections.length})`)}`)
        console.log()

        // Render section status with step numbers
        for (const section of sections) {
            const stepNum = chalk.dim(`${section.stepNumber}.`)

            // Highlight logical "Next Step"
            const isNext = nextStep?.id === section.id

            let icon, nameText = section.name

            // Add recommendation hint to name in THE LIST (not the menu)
            if (!section.required) {
                nameText += chalk.dim(' (optional, but recommended)')
            }

            let name
            if (section.complete) {
                // Completed
                icon = chalk.green('●')
                name = chalk.green(nameText)
            } else if (isNext) {
                // Current / Next Step (Active)
                icon = chalk.white('○')
                name = chalk.white(nameText)
            } else {
                // Future / Skipped
                icon = chalk.dim('○')
                name = chalk.dim(nameText)
            }

            const summary = section.complete
                ? subtext(section.summary)
                : chalk.dim(section.summary)

            console.log(`  ${stepNum} ${icon} ${name.padEnd(22)}`)
            console.log(`     ${summary}`)
        }
        console.log()

        // Internal menu loop
        let currentMenu: 'main' | 'edit' = 'main'

        while (true) {
            const options: Array<{ value: DashboardAction; label: string; hint?: string }> = []
            let message = 'What would you like to do?'

            if (currentMenu === 'edit') {
                // EDIT SUBMENU (Only accessible from Final Page)
                message = chalk.bold('Select a section to edit:')
                for (const section of sections) {
                    options.push({
                        value: section.id,
                        label: `Edit ${section.name}`,
                        hint: section.complete ? 'Completed' : (section.required ? 'Required' : 'Recommended'),
                    })
                }
                options.push({ value: 'back', label: 'Back' })

            } else {
                // MAIN MENU
                if (requiredComplete) {
                    message = `\n  ${chalk.bold('Ready to submit! Or continue editing:')}`
                    // --- FINAL PAGE LAYOUT ---

                    // 1. Approve and Submit
                    options.push({
                        value: 'review',
                        label: chalk.bold.green('Approve and Submit!'),
                        hint: '100 Credits',
                    })

                    // 2. Make changes submenu
                    options.push({
                        value: 'edit_menu',
                        label: chalk.dim('Edit review details'),
                        hint: 'Modify completed steps'
                    })

                    // 3. Save Draft
                    options.push({
                        value: 'save_draft',
                        label: chalk.dim('Save Draft & Exit'),
                        hint: 'Resume later',
                    })

                    // 4. Exit
                    options.push({
                        value: 'exit',
                        label: chalk.red('Exit Without Saving'),
                    })

                } else {
                    message = `\n  Continue with Step ${nextStep?.stepNumber || 1}:`
                    // --- PROGRESS LAYOUT (Simplified) ---

                    // 1. Next Sequential Step (Top Priority)
                    if (nextStep && !nextStep.complete) {
                        // Clean name for button (remove parentheticals like "(optional)")
                        const cleanName = nextStep.name.replace(/\s*\(.*\)/, '')
                        options.push({
                            value: nextStep.id,
                            label: chalk.bold.white(`Start Step ${nextStep.stepNumber}: ${cleanName}`),
                            hint: nextStep.required ? 'Required' : 'Recommended',
                        })
                    }

                    // 2. Edit Menu (Collapsed)
                    options.push({
                        value: 'edit_menu',
                        label: chalk.dim('Edit other steps...'),
                        hint: 'Modify completed/skipped steps'
                    })

                    // 3. Save Draft
                    options.push({
                        value: 'save_draft',
                        label: chalk.dim('Save Draft & Exit'),
                    })

                    // 4. Exit
                    options.push({
                        value: 'exit',
                        label: chalk.red('Exit Without Saving'),
                    })
                }
            }

            const choice = await ui.select<DashboardAction>({
                message,
                options,
                initialValue: nextStep?.id || 'review'
            })

            // Navigation
            if (choice === 'edit_menu') {
                currentMenu = 'edit'
                continue
            }
            if (choice === 'back') {
                currentMenu = 'main'
                continue
            }

            // ESC logic (null) handled by returning null (caller handles)
            if (choice === null) {
                return null as unknown as DashboardAction
            }

            return choice as DashboardAction
        }
    }
}
