import { homedir } from 'node:os'
import * as ui from '../ui/interactive.js'
import { brand, subtext } from '../ui/theme.js'
import { isLoggedIn, markAsRun, setLastScannedPath } from '../lib/config.js'
import { loginWithBrowser } from '../lib/auth.js'
import { findXcodeProjects, findProjectInDir } from '../lib/project-finder.js'

export async function runOnboarding() {
    ui.brandSplash()
    ui.intro('Welcome to Preflight!')

    ui.log.message('Let\'s get you set up. This takes about 30 seconds.')

    // Step 1: Account
    if (!isLoggedIn()) {
        const authChoice = await ui.select<'signup' | 'login' | 'skip'>({
            message: 'Step 1 of 2: Set up your account',
            options: [
                { value: 'signup', label: 'Open browser to sign up', hint: 'Create a free account' },
                { value: 'login', label: 'I already have an account', hint: 'Log in' },
                { value: 'skip', label: 'Skip for now', hint: 'Scan works without login' },
            ],
        })

        if (authChoice === null) return

        if (authChoice === 'signup' || authChoice === 'login') {
            const s = ui.spinner()
            s.start('Opening browser...')
            const result = await loginWithBrowser()
            s.stop(result ? `Logged in as ${result.email}` : 'Login skipped')
        }
    } else {
        ui.log.success('Already logged in. Skipping account setup.')
    }

    // Step 2: Find Xcode projects
    const projects = findXcodeProjects()
    const cwdProject = findProjectInDir(process.cwd())

    if (projects.length > 0 || cwdProject) {
        const allProjects = cwdProject
            ? [cwdProject, ...projects.filter((p) => p.path !== cwdProject.path)]
            : projects

        const choices = allProjects.slice(0, 5).map((proj) => ({
            value: proj.path,
            label: `${proj.name} (${proj.type === 'xcworkspace' ? '.xcworkspace' : '.xcodeproj'})`,
            hint: proj.path.replace(homedir(), '~'),
        }))

        choices.push({
            value: '__skip__',
            label: 'Skip - I\'ll scan later',
            hint: '',
        })

        const projectChoice = await ui.select<string>({
            message: 'Step 2 of 2: Choose your Xcode project',
            options: choices,
        })

        if (projectChoice === null) return

        if (projectChoice !== '__skip__') {
            setLastScannedPath(projectChoice)
            ui.log.success(`Project saved! Run ${brand('preflight scan')} to scan it.`)
        }
    } else {
        ui.log.info('No Xcode projects found on your Mac.\nRun ' + brand('preflight scan <path>') + ' when you\'re ready.')
    }

    markAsRun()

    ui.outro('You\'re all set! Run ' + brand('preflight') + ' to get started.')
}
