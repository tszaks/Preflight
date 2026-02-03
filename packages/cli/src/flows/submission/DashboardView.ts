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

interface SectionStatus {
    id: DashboardAction
    name: string
    complete: boolean
    summary: string
    required: boolean
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
                id: 'asc',
                name: 'ASC Account',
                complete: !!this.ascEmail,
                summary: this.ascEmail || 'Not connected',
                required: false,
            },
            {
                id: 'screenshots',
                name: 'Screenshots',
                complete: screenshotCount > 0,
                summary: screenshotCount > 0 ? `${screenshotCount} images ready` : 'None selected',
                required: false,
            },
            {
                id: 'app_details',
                name: 'App Details',
                complete: hasAppDetails,
                summary: hasAppDetails ? this.state.appName! : 'Required',
                required: true,
            },
            {
                id: 'compliance',
                name: 'Compliance',
                complete: hasCompliance,
                summary: hasCompliance ? `Age ${this.state.compliance!.ageRating}` : 'Required',
                required: true,
            },
        ]
    }

    private canSubmit(): boolean {
        const sections = this.getSections()
        return sections.filter(s => s.required).every(s => s.complete)
    }

    async render(projectName: string, email?: string, credits?: number): Promise<DashboardAction> {
        const sections = this.getSections()

        // Show the giant ASCII logo header
        ui.renderHeader(email, credits)

        console.log(brand(`  ◆ Submission Dashboard: ${projectName}`))
        console.log()

        // Render section status
        for (const section of sections) {
            const icon = section.complete ? chalk.green('✓') : chalk.dim('○')
            const name = section.complete ? section.name : chalk.dim(section.name)
            const summary = section.complete
                ? subtext(section.summary)
                : (section.required ? chalk.yellow(section.summary) : subtext(section.summary))

            console.log(`    ${icon} ${name.padEnd(18)} ${summary}`)
        }
        console.log()

        // Build options
        const options: { value: DashboardAction; label: string; hint?: string }[] = []

        // Add incomplete required sections first
        const incompleteRequired = sections.filter(s => s.required && !s.complete)
        if (incompleteRequired.length > 0) {
            for (const section of incompleteRequired) {
                options.push({
                    value: section.id,
                    label: `Configure ${section.name}`,
                    hint: 'Required',
                })
            }
        }

        // Add edit options for complete sections
        for (const section of sections) {
            if (section.complete || !section.required) {
                options.push({
                    value: section.id,
                    label: section.complete ? `Edit ${section.name}` : `Configure ${section.name}`,
                    hint: section.complete ? section.summary : 'Optional',
                })
            }
        }

        // Review & Submit (only if can submit)
        if (this.canSubmit()) {
            options.push({
                value: 'review',
                label: 'Review & Submit',
                hint: '100 credits',
            })
        }

        // Always allow save draft
        options.push({
            value: 'save_draft',
            label: 'Save Draft & Exit',
            hint: 'Resume later',
        })

        const choice = await ui.select<DashboardAction>({
            message: 'What would you like to do?',
            options,
        })

        if (choice === null) {
            return 'save_draft'
        }

        return choice
    }
}
