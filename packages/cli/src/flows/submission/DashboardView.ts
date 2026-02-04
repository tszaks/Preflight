import * as ui from '../../ui/interactive.js'
import { brand, subtext } from '../../ui/theme.js'
import { DraftState, FileToUpload } from './types.js'
import chalk from 'chalk'

export type DashboardAction =
    | 'asc'
    | 'screenshots'
    | 'app_details'
    | 'compliance'
    | 'review'
    | 'save_draft'
    | 'exit'

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
                id: 'app_details',
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
                summary: 'Sign off & submit',
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
        // Find first incomplete required step
        const incompleteRequired = sections.find(s => s.required && !s.complete)
        if (incompleteRequired) return incompleteRequired
        // If all required done, find first incomplete optional
        return sections.find(s => !s.complete) || null
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
            console.log(chalk.green('    ✓ Ready to submit! All required steps complete.'))
            console.log()
        }

        // Progress indicator - colors match step list
        const progressBar = sections.map(s => {
            if (s.complete) return chalk.green('●')
            return s.required ? chalk.red('○') : chalk.yellow('○')
        }).join(' ')
        console.log(`    Progress: ${progressBar}  ${chalk.dim(`(${completedCount}/${sections.length})`)}`)
        console.log()

        // Render section status with step numbers
        for (const section of sections) {
            const stepNum = chalk.dim(`${section.stepNumber}.`)
            // Color coding: green = complete, red = required incomplete, yellow = optional incomplete
            const icon = section.complete
                ? chalk.green('✓')
                : (section.required ? chalk.red('○') : chalk.yellow('○'))
            const name = section.complete
                ? chalk.green(section.name)
                : (section.required ? chalk.red(section.name) : chalk.yellow(section.name))
            const summary = section.complete
                ? subtext(section.summary)
                : chalk.dim(section.summary)

            // Highlight next step (only if not done)
            const isNext = nextStep?.id === section.id
            const pointer = isNext ? chalk.cyan('→ ') : '  '

            console.log(`  ${pointer}${stepNum} ${icon} ${name.padEnd(22)}`)
            console.log(`       ${summary}`)
        }
        console.log()

        // Internal menu loop
        let currentMenu: 'main' | 'edit' = 'main'

        while (true) {
            const options: { value: string; label: string; hint?: string }[] = []

            if (currentMenu === 'edit') {
                // EDIT SUBMENU (Only accessible from Final Page)
                for (const section of sections) {
                    options.push({
                        value: section.id,
                        label: `Edit ${section.name}`,
                        hint: section.complete ? 'Completed' : (section.required ? 'Required' : 'Optional'),
                    })
                }
                options.push({ value: 'back', label: 'Back' })

            } else {
                // MAIN MENU
                if (requiredComplete) {
                    // --- FINAL PAGE LAYOUT ---
                    // 1. Make changes submenu
                    options.push({
                        value: 'edit_menu',
                        label: 'Make changes to this review',
                        hint: 'Edit details, compliance, or screenshots'
                    })

                    // 2. Approve and Submit
                    options.push({
                        value: 'review',
                        label: 'Approve and Submit!',
                        hint: '100 Credits',
                    })

                    // 3. Save Draft
                    options.push({
                        value: 'save_draft',
                        label: 'Save Draft & Exit',
                        hint: 'Resume later',
                    })

                    // 4. Exit
                    options.push({
                        value: 'exit',
                        label: 'Exit Without Saving',
                    })

                } else {
                    // --- PROGRESS LAYOUT (Original Style) ---

                    // 1. Next Recommended Step
                    if (nextStep && !nextStep.complete) {
                        options.push({
                            value: nextStep.id,
                            label: `Start Step ${nextStep.stepNumber}: ${nextStep.name}`,
                            hint: nextStep.required ? 'Required' : 'Recommended',
                        })
                    }

                    // 2. Other Steps (Edit/Configure)
                    for (const section of sections) {
                        if (section.id !== nextStep?.id) {
                            options.push({
                                value: section.id,
                                label: section.complete ? `Edit ${section.name}` : `Configure ${section.name}`,
                                hint: section.summary,
                            })
                        }
                    }

                    // 3. Save Draft
                    options.push({
                        value: 'save_draft',
                        label: 'Save Draft & Exit',
                        hint: 'Resume later',
                    })

                    // 4. Exit
                    options.push({
                        value: 'exit',
                        label: 'Exit Without Saving',
                    })
                }
            }

            const choice = await ui.select<string>({
                message: requiredComplete ? 'Ready to submit! Or continue editing:' : 'What would you like to do?',
                options,
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
