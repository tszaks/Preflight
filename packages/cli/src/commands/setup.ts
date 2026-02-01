import { runOnboarding } from './onboarding.js'

// Setup is just a re-runnable alias for the onboarding flow
export async function setupCommand() {
    await runOnboarding()
}
