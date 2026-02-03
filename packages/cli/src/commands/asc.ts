import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { apiRequest } from '../lib/api-client.js'
import { setAscConnected } from '../lib/config.js'
import { createSpinner } from '../ui/spinner.js'
import * as ui from '../ui/interactive.js'
import { brand, subtext, brandDim } from '../ui/theme.js'

// ─── Connect to App Store Connect ───────────────────────────────────────

export async function ascConnectCommand() {
    ui.log.step('Connect to App Store Connect')
    console.log(subtext('  You\'ll need your API key from App Store Connect > Users and Access > Integrations.'))
    console.log()

    // Key ID
    const keyId = await ui.text({
        message: 'Key ID',
        placeholder: 'e.g. ABC123DEF4',
        validate: (val) => {
            if (!val?.trim()) return 'Key ID is required'
        },
    })
    if (keyId === null) return

    // Issuer ID
    const issuerId = await ui.text({
        message: 'Issuer ID',
        placeholder: 'e.g. 12345678-1234-1234-1234-123456789012',
        validate: (val) => {
            if (!val?.trim()) return 'Issuer ID is required'
        },
    })
    if (issuerId === null) return

    // .p8 file path
    const p8Path = await ui.text({
        message: 'Path to .p8 private key file',
        placeholder: '~/Downloads/AuthKey_ABC123DEF4.p8',
        validate: (val) => {
            if (!val?.trim()) return 'File path is required'
            const resolved = resolve(val.replace(/^~/, process.env.HOME || ''))
            if (!existsSync(resolved)) return `File not found: ${resolved}`
            if (!resolved.endsWith('.p8')) return 'File must be a .p8 key file'
        },
    })
    if (p8Path === null) return

    // Read the .p8 file
    const resolvedP8 = resolve(p8Path.replace(/^~/, process.env.HOME || ''))
    let privateKey: string
    try {
        privateKey = readFileSync(resolvedP8, 'utf-8')
    } catch {
        ui.log.error('Could not read .p8 file.')
        return
    }

    // Send to API
    const s = ui.spinner()
    s.start('Connecting to App Store Connect...')

    try {
        const res = await apiRequest('/api/asc/connect', {
            method: 'POST',
            body: JSON.stringify({
                keyId: keyId.trim(),
                issuerId: issuerId.trim(),
                privateKey,
            }),
        })
        const data = await res.json()

        if (!res.ok) {
            s.stop('Connection failed')
            ui.log.error(data.message || 'Failed to connect to App Store Connect')
            return
        }

        s.stop('Connected to App Store Connect!')

        // Show apps if available
        if (data.apps && data.apps.length > 0) {
            console.log()
            ui.log.success(`Team: ${data.teamName || 'Your team'}`)
            console.log()

            // Let user select their app
            const appOptions = data.apps.map((app: { id: string; name: string; bundleId?: string }) => ({
                value: app.id,
                label: app.name,
                hint: app.bundleId || '',
            }))

            const selectedApp = await ui.select<string>({
                message: 'Select your app',
                options: appOptions,
            })

            if (selectedApp !== null) {
                // Trigger autofill to store the app selection
                const autofillSpinner = ui.spinner()
                autofillSpinner.start('Saving app selection...')

                const autofillRes = await apiRequest('/api/asc/autofill', {
                    method: 'POST',
                    body: JSON.stringify({ appId: selectedApp }),
                })

                if (autofillRes.ok) {
                    const autofillData = await autofillRes.json()
                    autofillSpinner.stop('App selected')
                    ui.log.success(`Connected: ${autofillData.app_name || 'App'} is ready for autofill.`)
                } else {
                    autofillSpinner.stop('App selection saved')
                }
            }
        } else {
            ui.log.success('Connected! Your App Store Connect data is now available for autofill.')
        }

        setAscConnected(true)
        console.log()
    } catch (err) {
        s.stop('Connection failed')
        ui.log.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
}

// ─── Check ASC Status ───────────────────────────────────────────────────

export async function ascStatusCommand() {
    const s = createSpinner('Checking App Store Connect status...')
    s.start()

    try {
        const res = await apiRequest('/api/asc/connect')
        const data = await res.json()

        s.stop()

        if (!res.ok) {
            ui.log.error(data.message || 'Could not check status')
            return
        }

        console.log()
        console.log(brand('  App Store Connect'))
        console.log()

        if (data.connected) {
            console.log(`  Status:  ${brandDim('Connected')}`)
            if (data.appName) console.log(`  App:     ${data.appName}`)
            if (data.keyId) console.log(`  Key ID:  ${data.keyId.slice(0, 3)}${'*'.repeat(Math.max(0, data.keyId.length - 3))}`)
        } else {
            console.log(`  Status:  ${subtext('Not connected')}`)
            console.log()
            console.log(subtext(`  Run ${brand('preflight asc connect')} to set up.`))
        }
        console.log()
    } catch (err) {
        s.stop()
        ui.log.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
}

// ─── Refresh ASC Data ──────────────────────────────────────────────

export async function ascRefreshCommand() {
    const s = ui.spinner()
    s.start('Checking App Store Connect...')

    try {
        // First check if connected
        const statusRes = await apiRequest('/api/asc/connect')
        const statusData = await statusRes.json()

        if (!statusRes.ok || !statusData.connected) {
            s.stop('Not connected')
            ui.log.warning('App Store Connect is not connected.')
            console.log(subtext(`  Run ${brand('preflight asc connect')} to set up.`))
            console.log()
            return
        }

        s.message('Pulling latest data from App Store Connect...')

        // Call autofill to refresh metadata
        const res = await apiRequest('/api/asc/autofill', {
            method: 'POST',
            body: JSON.stringify({ appId: statusData.appId }),
        })
        const data = await res.json()

        if (!res.ok) {
            s.stop('Refresh failed')
            ui.log.error(data.message || 'Could not refresh data from App Store Connect')
            return
        }

        s.stop('Data refreshed!')
        console.log()

        // Show what was pulled
        if (data.app_name) console.log(`  App:          ${brand(data.app_name)}`)
        if (data.description) console.log(`  Description:  ${subtext(data.description.slice(0, 60) + (data.description.length > 60 ? '...' : ''))}`)
        if (data.keywords) console.log(`  Keywords:     ${subtext(data.keywords.slice(0, 60) + (data.keywords.length > 60 ? '...' : ''))}`)
        if (data.category) console.log(`  Category:     ${subtext(data.category)}`)
        if (data.support_url) console.log(`  Support URL:  ${subtext(data.support_url)}`)
        console.log()
        ui.log.success('This data will autofill your next submission.')
        console.log()
    } catch (err) {
        s.stop('Refresh failed')
        ui.log.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
}

// ─── Disconnect ASC ─────────────────────────────────────────────────────

export async function ascDisconnectCommand() {
    const confirmed = await ui.confirm('Disconnect from App Store Connect?', false)
    if (confirmed === null || !confirmed) return

    const s = createSpinner('Disconnecting...')
    s.start()

    try {
        const res = await apiRequest('/api/asc/connect', {
            method: 'DELETE',
        })

        s.stop()

        if (res.ok) {
            setAscConnected(false)
            ui.log.success('Disconnected from App Store Connect.')
        } else {
            const data = await res.json()
            ui.log.error(data.message || 'Could not disconnect')
        }
    } catch (err) {
        s.stop()
        ui.log.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
}

// ─── Interactive ASC Menu ───────────────────────────────────────────────

export async function ascInteractiveMenu() {
    while (true) {
        const choice = await ui.select<'connect' | 'refresh' | 'status' | 'disconnect' | 'back'>({
            message: 'App Store Connect',
            options: [
                { value: 'connect', label: 'Connect', hint: 'Set up API key' },
                { value: 'refresh', label: 'Refresh', hint: 'Pull latest data from ASC' },
                { value: 'status', label: 'View Status', hint: 'Check connection' },
                { value: 'disconnect', label: 'Disconnect', hint: 'Remove API key' },
                { value: 'back', label: 'Back to menu' },
            ],
        })

        if (choice === null || choice === 'back') return

        switch (choice) {
            case 'connect':
                await ascConnectCommand()
                break
            case 'refresh':
                await ascRefreshCommand()
                break
            case 'status':
                await ascStatusCommand()
                break
            case 'disconnect':
                await ascDisconnectCommand()
                break
        }
    }
}
