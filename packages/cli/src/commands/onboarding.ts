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

    // Step 1: Account (required)
    if (!isLoggedIn()) {
        let authenticated = false

        while (!authenticated) {
            const authChoice = await ui.select<'signup' | 'login'>({
                message: 'Step 1 of 2: Set up your account',
                options: [
                    { value: 'signup', label: 'Create a free account', hint: 'Opens browser' },
                    { value: 'login', label: 'I already have an account', hint: 'Opens browser' },
                ],
            })

            if (authChoice === null) return

            if (authChoice === 'signup') {
                const s = ui.spinner()
                s.start('Opening signup page...')
                await loginWithBrowser('signup')
                s.stop('Signup page opened in browser')
                ui.log.info('After creating your account, come back here and log in.')

                // Now prompt them to log in
                const s2 = ui.spinner()
                s2.start('Opening login page...')
                const result = await loginWithBrowser('login')
                if (result) {
                    s2.stop(`Logged in as ${result.email}`)
                    authenticated = true
                } else {
                    s2.stop('Login failed or timed out')
                    ui.log.warning('Let\'s try again.')
                }
            } else {
                const s = ui.spinner()
                s.start('Opening login page...')
                const result = await loginWithBrowser('login')
                if (result) {
                    s.stop(`Logged in as ${result.email}`)
                    authenticated = true
                } else {
                    s.stop('Login failed or timed out')
                    ui.log.warning('Let\'s try again.')
                }
            }
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
