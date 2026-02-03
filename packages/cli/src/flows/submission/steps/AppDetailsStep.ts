import * as ui from '../../../ui/interactive.js'
import { collectAppDetails, AppDetails } from '../../../lib/submission-questions.js'
import { SubmissionStep, StepResult } from '../BaseStep.js'
import { DraftState } from '../types.js'

export class AppDetailsStep implements SubmissionStep {
    name = 'App Details'

    constructor(private projectName: string) { }

    async run(state: DraftState): Promise<StepResult> {
        const defaults: Partial<AppDetails> = {
            appName: state.appName,
            description: state.description,
            keywords: state.keywords,
            category: state.category,
            supportUrl: state.supportUrl,
            promotionalText: state.promotionalText,
            marketingUrl: state.marketingUrl,
            signInRequired: state.signInRequired,
            demoUsername: state.demoUsername,
            demoPassword: state.demoPassword,
        }

        const appDetails = await collectAppDetails(this.projectName, defaults)

        if (appDetails === null) {
            // User pressed Escape - ask what they want to do
            const action = await ui.select<'back' | 'cancel'>({
                message: 'App details cancelled',
                options: [
                    { value: 'back', label: 'Go back', hint: 'Return to previous step' },
                    { value: 'cancel', label: 'Save draft & exit', hint: 'Save progress and exit' },
                ],
            })

            if (action === null || action === 'cancel') return { action: 'save_draft' }
            return { action: 'back' }
        }

        // update state
        state.appName = appDetails.appName
        state.description = appDetails.description
        state.keywords = appDetails.keywords
        state.category = appDetails.category
        state.supportUrl = appDetails.supportUrl
        state.promotionalText = appDetails.promotionalText
        state.marketingUrl = appDetails.marketingUrl
        state.signInRequired = appDetails.signInRequired
        state.demoUsername = appDetails.demoUsername
        state.demoPassword = appDetails.demoPassword

        return { action: 'next' }
    }
}
