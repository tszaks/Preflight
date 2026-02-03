import { DraftState } from './types.js'

export type StepResult =
    | { action: 'next' }
    | { action: 'back' }
    | { action: 'cancel' }
    | { action: 'save_draft' }

export interface SubmissionStep {
    name: string
    run(state: DraftState): Promise<StepResult>
}
