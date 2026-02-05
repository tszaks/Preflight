import { collectCompliance } from '../../../lib/submission-questions.js'
import { SubmissionStep, StepResult } from '../BaseStep.js'
import { DraftState } from '../types.js'

export class ComplianceStep implements SubmissionStep {
    name = 'Compliance'

    async run(state: DraftState): Promise<StepResult> {
        // Pass ASC data for auto-population if available
        const compliance = await collectCompliance(state.compliance, state.ageRating, state.privacyStatus)

        if (compliance === null) {
            return { action: 'back' }
        }

        state.compliance = compliance
        return { action: 'next' }
    }
}
