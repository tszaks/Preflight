import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import * as ui from '../ui/interactive.js'
import { brand, subtext, brandDim } from '../ui/theme.js'

// Small delay for visual feedback
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

// Pick a random item from an array
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

// Get current installed version from package.json
function getCurrentVersion(): string {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    const pkgPath = resolve(__dirname, '..', 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    return pkg.version
}

// Fetch latest version from npm registry
async function getLatestVersion(): Promise<string | null> {
    try {
        const res = await fetch('https://registry.npmjs.org/preflightlaunch/latest')
        if (!res.ok) return null
        const data = await res.json()
        return data.version ?? null
    } catch {
        return null
    }
}

// Compare semver strings (returns -1, 0, or 1)
function compareSemver(a: string, b: string): number {
    const pa = a.split('.').map(Number)
    const pb = b.split('.').map(Number)
    for (let i = 0; i < 3; i++) {
        if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1
        if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1
    }
    return 0
}

// Witty messages for each step (rocket-themed)
const messages = {
    checking: [
        'Running pre-launch diagnostics...',
        'Checking the flight manifest...',
        'Inspecting the landing gear...',
        'Running systems check...',
        'Calibrating the altimeter...',
        'Reviewing the flight plan...',
        'Consulting the tower...',
        'Checking fuel levels...',
        'Scanning the instrument panel...',
        'Warming up the engines...',
    ],
    scanning: [
        'Scanning mission control for new firmware...',
        'Pinging the mothership...',
        'Checking if the future has arrived...',
        'Asking the internet nicely...',
        'Phoning home...',
        'Intercepting transmissions from npm...',
        'Decoding signals from the registry...',
        'Searching the cosmos for updates...',
        'Tuning into mission control...',
        'Receiving satellite data...',
    ],
    upToDate: [
        'Your rocket is already top-shelf.',
        'Nothing to see here. Already running the latest.',
        'Ahead of the curve. No update needed.',
        'All caught up. Go build something.',
        'Running the newest gear. You are cleared for takeoff.',
        'Peak performance. No upgrades available.',
        'Already on the bleeding edge.',
        'The latest and greatest is already onboard.',
        'Your firmware is fresh. Carry on.',
        'Mission control confirms: you are current.',
    ],
    downloading: [
        'Fueling the rocket...',
        'Loading cargo into the bay...',
        'Downloading fresh payload...',
        'Grabbing the goods from npm...',
        'Fetching the new hotness...',
        'Pulling packages from orbit...',
        'Syncing with the mothership...',
        'Transferring new firmware...',
        'Beaming down the update...',
        'Acquiring new modules...',
    ],
    installing: [
        'Strapping in for launch...',
        'Bolting on the upgrades...',
        'Swapping out the old parts...',
        'Welding the new bits into place...',
        'Running final assembly...',
        'Tightening the bolts...',
        'Locking in the payload...',
        'Configuring the new thrusters...',
        'Applying the finishing touches...',
        'Wiring up the cockpit...',
    ],
    done: [
        'All systems go',
        'Green across the board',
        'Ready for takeoff',
        'Locked and loaded',
        'Ship shape',
        'Good to go',
        'Systems nominal',
        'Flight ready',
        'Cleared for launch',
        'In the green',
    ],
    liftoff: [
        'Liftoff.',
        'We have liftoff.',
        '3... 2... 1... Updated.',
        'The eagle has landed.',
        'Mission complete.',
        'Smooth landing.',
        'Touchdown.',
        'New firmware online.',
        'Upgrade successful.',
        'Roger that. Update complete.',
    ],
    restart: [
        'Restart your terminal to fly the new version.',
        'Open a new terminal to take the new version for a spin.',
        'Close and reopen your terminal to activate.',
        'New terminal session needed to use the update.',
        'Pop open a fresh terminal to ride the new version.',
    ],
    failed: [
        'Launch aborted',
        'Mission scrubbed',
        'Abort, abort, abort',
        'We have a problem',
        'Engines stalled',
    ],
    noRegistry: [
        'Houston, we have a problem',
        'Lost contact with mission control',
        'Radio silence from npm',
        'Signal lost',
        'Transmission failed',
    ],
}

export async function updateCommand() {
    const current = getCurrentVersion()

    const s = ui.spinner()

    // Step 1: Show current version
    s.start(pick(messages.checking))
    await wait(1000)
    s.stop(`Current: ${brand(`v${current}`)}`)

    // Step 2: Check registry
    s.start(pick(messages.scanning))
    const latest = await getLatestVersion()
    await wait(800)

    if (!latest) {
        s.stop(pick(messages.noRegistry))
        ui.log.error('Failed to reach npm registry. Check your internet connection.')
        return
    }

    if (compareSemver(current, latest) >= 0) {
        s.stop(`Latest: ${brand(`v${latest}`)}`)
        await wait(400)
        console.log()
        console.log(`  ${brand('Preflight')} is up to date. ${subtext(pick(messages.upToDate))}`)
        console.log()
        return
    }

    // Update available
    s.stop(`New payload detected: ${brand(`v${latest}`)}`)
    console.log()
    console.log(`  ${brandDim(`v${current}`)} ${subtext('-->')} ${brand(`v${latest}`)}`)
    console.log()
    await wait(500)

    // Step 3: Download
    s.start(pick(messages.downloading))
    await wait(1500)
    s.stop('Downloaded')

    // Step 4: Install
    s.start(pick(messages.installing))

    try {
        execFileSync('npm', ['install', '-g', 'preflightlaunch@latest'], {
            stdio: 'pipe',
            timeout: 60000,
        })
        await wait(1000)
        s.stop(pick(messages.done))

        // Step 5: Done
        await wait(400)
        console.log()
        console.log(`  ${brand(pick(messages.liftoff))} ${brandDim(`v${current}`)} ${subtext('-->')} ${brand(`v${latest}`)}`)
        console.log(subtext(`  ${pick(messages.restart)}`))
        console.log()
    } catch (err) {
        s.stop(pick(messages.failed))

        // Common failure: permissions
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('EACCES') || msg.includes('permission')) {
            console.log()
            ui.log.warning('Permission denied. Try with sudo:')
            console.log(subtext(`  sudo npm install -g preflightlaunch@latest`))
            console.log()
        } else {
            console.log()
            ui.log.error('Could not update automatically. Run manually:')
            console.log(subtext(`  npm install -g preflightlaunch@latest`))
            console.log()
        }
    }
}
