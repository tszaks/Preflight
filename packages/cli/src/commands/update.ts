import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import * as ui from '../ui/interactive.js'
import { brand, subtext, brandDim } from '../ui/theme.js'

// Small delay for visual feedback
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

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

// Simple messages for each step
const messages = {
    checking: 'Checking current version...',
    scanning: 'Checking for updates...',
    upToDate: 'Already up to date.',
    downloading: 'Downloading...',
    installing: 'Installing...',
    done: 'Done',
    restart: 'Restart your terminal to use the new version.',
    failed: 'Update failed',
    noRegistry: 'Could not reach npm registry',
}

export async function updateCommand() {
    const current = getCurrentVersion()

    const s = ui.spinner()

    // Step 1: Show current version
    s.start(messages.checking)
    await wait(500)
    s.stop(`Current: ${brand(`v${current}`)}`)

    // Step 2: Check registry
    s.start(messages.scanning)
    const latest = await getLatestVersion()

    if (!latest) {
        s.stop(messages.noRegistry)
        ui.log.error('Failed to reach npm registry. Check your internet connection.')
        console.log()
        await ui.keypress('Press Enter to continue...')
        return
    }

    if (compareSemver(current, latest) >= 0) {
        s.stop(`Latest: ${brand(`v${latest}`)}`)
        console.log()
        ui.log.success('Preflight is up to date.')
        console.log()
        await ui.keypress('Press Enter to continue...')
        return
    }

    // Update available
    s.stop(`Update available: ${brand(`v${latest}`)}`)
    console.log()
    console.log(`  ${brandDim(`v${current}`)} ${subtext('→')} ${brand(`v${latest}`)}`)
    console.log()

    const shouldInstall = await ui.confirm('Install update now?')
    if (!shouldInstall) {
        console.log()
        console.log(subtext(`  Run later: npm install -g preflightlaunch@latest`))
        console.log()
        return
    }

    // Step 3: Install
    s.start(messages.installing)

    try {
        execFileSync('npm', ['install', '-g', 'preflightlaunch@latest'], {
            stdio: 'pipe',
            timeout: 60000,
        })
        s.stop(messages.done)

        // Step 4: Done
        console.log()
        console.log(`  Updated: ${brandDim(`v${current}`)} ${subtext('→')} ${brand(`v${latest}`)}`)
        console.log(subtext(`  ${messages.restart}`))
        console.log()
    } catch (err) {
        s.stop(messages.failed)

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
