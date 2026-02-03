import * as ui from '../../ui/interactive.js'
import { SubmissionStep, StepResult } from './BaseStep.js'
import { DraftState } from './types.js'

export class SubmissionFlow {
    private steps: SubmissionStep[] = []
    private currentStepIndex = 0

    constructor(
        private state: DraftState,
        private saveDraftCallback: (state: DraftState) => Promise<void>
    ) { }

    addStep(step: SubmissionStep) {
        this.steps.push(step)
    }

    async start(): Promise<'completed' | 'cancelled'> {
        // Hydrate step based on state if possible
        if (this.state._flowPosition) {
            // We could map _flowPosition string to index, but for simplicity let's just 
            // stick to 0 unless we implement robust mapping.
            // The original code tried to track this string.
            // We can iterate steps and find one matching the name/id if we want.
        }

        while (this.currentStepIndex < this.steps.length) {
            if (this.currentStepIndex < 0) {
                // Should not happen, but if back is pressed on first step
                return 'cancelled'
            }

            const step = this.steps[this.currentStepIndex]

            // Print Step Header
            console.log()
            ui.log.step(`Step ${this.currentStepIndex + 1} of ${this.steps.length}: ${step.name}`)
            console.log()

            const result = await step.run(this.state)

            switch (result.action) {
                case 'next':
                    this.currentStepIndex++
                    // Update flow position in state (approximate)
                    this.updateFlowMetadata()
                    break
                case 'back':
                    this.currentStepIndex--
                    break
                case 'cancel':
                case 'save_draft':
                    await this.saveDraftCallback(this.state)
                    return 'cancelled'
            }
        }

        return 'completed'
    }

    private updateFlowMetadata() {
        // Map index to the string types expected by the backend
        // This is a bit loose but maintains backward compatibility with the DraftState interface
        const mapping = ['asc', 'screenshots', 'appDetails', 'compliance', 'review']
        if (this.currentStepIndex < mapping.length) {
            this.state._flowPosition = mapping[this.currentStepIndex] as any
        }
    }
}
