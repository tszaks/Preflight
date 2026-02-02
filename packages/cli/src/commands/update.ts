import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import * as ui from '../ui/interactive.js'
import { brand, subtext, brandDim } from '../ui/theme.js'

// Get current installed version from package.json
function getCurrentVersion(): string {
    const require = createRequire(import.meta.url)
    const pkg = require('../../package.json')
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

export async function updateCommand() {
    const current = getCurrentVersion()

    const s = ui.spinner()
    s.start('Checking for updates...')

    const latest = await getLatestVersion()

    if (!latest) {
        s.stop('Could not check for updates')
        ui.log.error('Failed to reach npm registry. Check your internet connection.')
        return
    }

    if (compareSemver(current, latest) >= 0) {
        s.stop('Up to date!')
        console.log()
        console.log(`  ${brand('Preflight')} ${brandDim(`v${current}`)} is the latest version.`)
        console.log()
        return
    }

    s.stop(`Update available: ${current} → ${latest}`)
    console.log()

    // Run the global install
    const installSpinner = ui.spinner()
    installSpinner.start(`Installing v${latest}...`)

    try {
        execFileSync('npm', ['install', '-g', 'preflightlaunch@latest'], {
            stdio: 'pipe',
            timeout: 60000,
        })
        installSpinner.stop(`Updated to v${latest}!`)
        console.log()
        console.log(`  ${brand('Preflight')} has been updated to ${brandDim(`v${latest}`)}.`)
        console.log()
    } catch (err) {
        installSpinner.stop('Update failed')

        // Common failure: permissions
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('EACCES') || msg.includes('permission')) {
            console.log()
            ui.log.warning('Permission denied. Try running with sudo:')
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
