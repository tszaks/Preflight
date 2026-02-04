import { DraftState } from './types.js'

export type StepResult =
    | { action: 'next' }
    | { action: 'back' }
    | { action: 'cancel' }
    | { action: 'save_draft' }

export interface FlowContext {
    email?: string
    credits?: number
    skipAutofillConfirm?: boolean // Skip ASC autofill confirmation (used by Easy Setup)
}

export interface SubmissionStep {
    name: string
    run(state: DraftState, context?: FlowContext): Promise<StepResult>
}

