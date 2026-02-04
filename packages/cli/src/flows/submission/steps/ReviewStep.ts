import * as ui from '../../../ui/interactive.js'
import { formatBytes, icons, subtext } from '../../../ui/theme.js'
import { getFileSize } from '../../../lib/scanner.js'
import { SubmissionStep, StepResult } from '../BaseStep.js'
import { DraftState, FileToUpload } from '../types.js'
import chalk from 'chalk'

export class ReviewStep implements SubmissionStep {
    name = 'Review'

    constructor(
        private appName: string,
        private dir: string,
        private files: FileToUpload[]
    ) { }

    async run(state: DraftState): Promise<StepResult> {
        state._reviewCompleted = true
        console.log()

        // UX Intervention: Visual "Receipt" of files
        // We will display a nice tree/list of what's about to be sent

        ui.log.info(chalk.bold(`Ready to submit: ${state.appName || this.appName}`))
        console.log(subtext(`Location: ${this.dir}`))
        console.log()

        // Group files by type for better visualization
        const screenshots = this.files.filter(f => f.type === 'screenshot')
        const others = this.files.filter(f => f.type !== 'screenshot')

        console.log(chalk.bold('  Build Assets'))
        if (others.length === 0) {
            console.log(subtext('     (No IPA or metadata files)'))
        } else {
            for (const f of others) {
                const size = getFileSize(f.path)
                console.log(`     - ${f.filename} ${subtext(formatBytes(size))}`)
            }
        }
        console.log()

        console.log(chalk.bold(`  Screenshots (${screenshots.length})`))
        if (screenshots.length === 0) {
            console.log(subtext('     (No screenshots provided)'))
        } else {
            // Don't list all 10 if there are many, maybe summary? 
            // UX Expert said "tree view", listing them with sizes is good.
            for (const f of screenshots) {
                const size = getFileSize(f.path)
                console.log(`     - ${f.filename} ${subtext(formatBytes(size))}`)
            }
        }
        console.log()

        // Compliance check 
        const comp = state.compliance
        if (comp) {
            console.log(chalk.bold('  Compliance'))
            console.log(`     Age Rating: ${comp.ageRating}`)
            console.log(`     Tracking: ${comp.privacyDeclarations.tracking ? 'Yes' : 'No'}`)
            console.log()
        }

        const action = await ui.select<'submit' | 'back' | 'save' | 'exit'>({
            message: `Submit review? (100 credits)`,
            options: [
                { value: 'submit', label: 'Submit review', hint: '100 credits will be deducted' },
                { value: 'back', label: 'Go back to edit', hint: 'Change app details or compliance' },
                { value: 'save', label: 'Save draft & exit', hint: 'Save progress and exit' },
                { value: 'exit', label: chalk.red('Exit without saving'), hint: 'Your progress will be lost' },
            ],
        })

        if (action === null || action === 'save') return { action: 'save_draft' }
        if (action === 'back') return { action: 'back' }
        if (action === 'exit') {
            const confirmExit = await ui.dangerConfirm('Exit without saving? Your progress will be lost.')
            if (confirmExit) {
                return { action: 'cancel' }
            }
            // User said No - stay on screen
            return this.run(state)
        }

        // Final confirmation
        return { action: 'next' }
    }


}
