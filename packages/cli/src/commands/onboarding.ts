import * as ui from '../ui/interactive.js'
import { brand, subtext } from '../ui/theme.js'
import { isLoggedIn, markAsRun } from '../lib/config.js'
import { loginWithBrowser } from '../lib/auth.js'

// Screen 0: Welcome screen (first run only)
export async function showWelcomeScreen(): Promise<boolean> {
    ui.renderHeader()
    console.log('   Preflight scans your app for common issues that')
    console.log('   cause App Store rejections -- before you submit.')
    console.log()
    console.log(subtext('   How it works:'))
    console.log(subtext('   1. Point us to your Xcode project'))
    console.log(subtext('   2. We scan for 100+ rejection risks'))
    console.log(subtext('   3. Get a detailed report with fixes'))
    console.log()

    const result = await ui.select<'start'>({
        message: 'Ready?',
        options: [
            { value: 'start', label: 'Get Started' },
        ],
    })

    if (result === null) return false

    markAsRun()
    return true
}

// Screen 1: Auth screen (login or signup)
export async function showAuthScreen(): Promise<boolean> {
    ui.renderHeader()

    const authChoice = await ui.select<'signup' | 'login'>({
        message: 'How would you like to get started?',
        options: [
            { value: 'signup', label: 'Create a free account', hint: 'Sign up with email, GitHub, or Google' },
            { value: 'login', label: 'I already have an account', hint: 'Log in with email, GitHub, or Google' },
        ],
    })

    if (authChoice === null) return false

    if (authChoice === 'signup') {
        const s = ui.spinner()
        s.start('Opening signup page in browser...')

        try {
            await loginWithBrowser('signup')
        } catch {
            s.stop('Could not open browser')
        }
        s.stop('Signup page opened')

        ui.log.info('Create your account in the browser, then come back here.')
        console.log()

        const ready = await ui.confirm('Done signing up? Ready to log in?')
        if (ready === null || !ready) {
            ui.log.info(subtext('Run `preflight` anytime to come back.'))
            return false
        }
    }

    // Both paths end with login
    const s = ui.spinner()
    s.start('Opening login page... Waiting for you to finish in browser.')

    try {
        const result = await loginWithBrowser('login')
        if (result) {
            s.stop(`Logged in as ${result.email}`)
            return true
        } else {
            s.stop('Login timed out or was cancelled')
            ui.log.warning('Run `preflight` anytime to try again.')
            return false
        }
    } catch {
        s.stop('Could not open browser')
        ui.log.warning('Run `preflight login` to try from the command line.')
        return false
    }
}

// Legacy onboarding function (kept for setup command compatibility)
export async function runOnboarding() {
    if (!isLoggedIn()) {
        const welcomed = await showWelcomeScreen()
        if (!welcomed) return

        const authenticated = await showAuthScreen()
        if (!authenticated) return
    } else {
        markAsRun()
        ui.log.success('Already logged in.')
    }
}
