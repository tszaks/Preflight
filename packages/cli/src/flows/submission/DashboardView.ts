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
                id: 'compliance',
                name: 'Compliance',
                complete: hasCompliance,
                summary: hasCompliance ? `Age ${this.state.compliance!.ageRating}` : 'Age rating, privacy info...',
                required: true,
                stepNumber: 2,
            },
            {
                id: 'screenshots',
                name: 'Screenshots',
                complete: screenshotCount > 0,
                summary: screenshotCount > 0 ? `${screenshotCount} images ready` : 'Add app screenshots',
                required: false,
                stepNumber: 3,
            },
        ]
    }

    private canSubmit(): boolean {
        const sections = this.getSections()
        return sections.filter(s => s.required).every(s => s.complete)
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
        const requiredComplete = sections.filter(s => s.required).every(s => s.complete)

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

        // Progress indicator
        const progressBar = sections.map(s => s.complete ? chalk.green('●') : chalk.dim('○')).join(' ')
        console.log(`    Progress: ${progressBar}  ${chalk.dim(`(${completedCount}/${sections.length})`)}`)
        console.log()

        // Render section status with step numbers
        for (const section of sections) {
            const stepNum = chalk.dim(`${section.stepNumber}.`)
            const icon = section.complete ? chalk.green('✓') : (section.required ? chalk.yellow('○') : chalk.dim('○'))
            const name = section.complete ? chalk.green(section.name) : (section.required ? chalk.white(section.name) : chalk.dim(section.name))
            const tag = section.required ? chalk.yellow('required') : chalk.dim('optional')
            const summary = section.complete
                ? subtext(section.summary)
                : chalk.dim(section.summary)

            // Highlight next step
            const isNext = nextStep?.id === section.id
            const pointer = isNext ? chalk.cyan('→ ') : '  '

            console.log(`  ${pointer}${stepNum} ${icon} ${name.padEnd(22)} ${section.complete ? '' : `[${tag}]`}`)
            console.log(`       ${summary}`)
        }
        console.log()

        // Build options with clear guidance
        const options: { value: DashboardAction; label: string; hint?: string }[] = []

        // Show next recommended action prominently
        if (nextStep && !nextStep.complete) {
            options.push({
                value: nextStep.id,
                label: `Start Step ${nextStep.stepNumber}: ${nextStep.name}`,
                hint: nextStep.required ? 'Required' : 'Recommended',
            })
        }

        // Add other sections
        for (const section of sections) {
            if (section.id !== nextStep?.id) {
                if (section.complete) {
                    options.push({
                        value: section.id,
                        label: `Edit ${section.name}`,
                        hint: section.summary,
                    })
                } else {
                    options.push({
                        value: section.id,
                        label: `Configure ${section.name}`,
                        hint: section.required ? 'Required' : 'Optional',
                    })
                }
            }
        }

        // Review & Submit (only if can submit)
        if (requiredComplete) {
            options.push({
                value: 'review',
                label: '✔ Review & Submit',
                hint: 'Ready! (100 credits)',
            })
        }

        // ASC option (edit or connect)
        options.push({
            value: 'asc',
            label: this.ascEmail ? 'Edit ASC Connection' : 'Connect App Store Connect',
            hint: this.ascEmail || 'Auto-fill app info',
        })

        // Save draft option
        options.push({
            value: 'save_draft',
            label: 'Save Draft & Exit',
            hint: 'Resume later',
        })

        // Exit without saving
        options.push({
            value: 'exit',
            label: 'Exit',
            hint: 'Exit without saving',
        })

        const choice = await ui.select<DashboardAction>({
            message: requiredComplete ? 'Ready to submit! Or continue editing:' : 'What would you like to do?',
            options,
        })

        // ESC pressed - stay in dashboard (will re-render)
        if (choice === null) {
            return null as unknown as DashboardAction
        }

        return choice
    }
}

