import * as ui from '../../../ui/interactive.js'
import { apiRequest } from '../../../lib/api-client.js'
import { SubmissionStep, StepResult } from '../BaseStep.js'
import { DraftState } from '../types.js'
import chalk from 'chalk'
import { subtext, brand } from '../../../ui/theme.js'

export class AscStep implements SubmissionStep {
    name = 'App Store Connect'

    async run(state: DraftState): Promise<StepResult> {
        // Checking existing connection
        const ascConnected = await this.getAscStatus()

        let shouldConnect = false

        if (ascConnected) {
            try {
                const statusRes = await apiRequest('/api/asc/connect')
                if (statusRes.ok) {
                    const statusData = await statusRes.json()

                    if (statusData.connected && statusData.appId) {
                        const hasManualEntries = !!(state.description || state.keywords || state.supportUrl)
                        shouldConnect = await this.askToAutofill(statusData.appName, hasManualEntries)

                        if (shouldConnect) {
                            const result = await this.performAutofill(statusData.appId, state)
                            if (result.success) {
                                console.log()
                                ui.log.success('Connected to App Store Connect')
                                console.log()

                                // Show what was imported
                                if (result.appName) console.log(`  ${chalk.green('✓')} App Name: ${brand(result.appName)}`)
                                if (result.description) console.log(`  ${chalk.green('✓')} Description: ${subtext(result.description.slice(0, 50) + (result.description.length > 50 ? '...' : ''))}`)
                                if (result.keywords) console.log(`  ${chalk.green('✓')} Keywords: ${subtext(result.keywords.slice(0, 50) + (result.keywords.length > 50 ? '...' : ''))}`)
                                if (result.category) console.log(`  ${chalk.green('✓')} Category: ${result.category}`)
                                if (result.supportUrl) console.log(`  ${chalk.green('✓')} Support URL: ${subtext(result.supportUrl)}`)
                                console.log()

                                await ui.keypress('Press Enter to continue...')
                            }
                        } else {
                            ui.log.info('Skipped autofill. Continuing with manual entry.')
                        }
                    } else {
                        ui.log.warning('No app selected in App Store Connect.')
                        ui.log.info('Configure your ASC connection from the main menu first.')
                        console.log()
                        await ui.keypress('Press Enter to continue...')
                    }
                }
            } catch {
                ui.log.error('Could not reach App Store Connect.')
                await ui.keypress('Press Enter to continue...')
            }
        } else {
            const wantsToConnect = await ui.confirm(
                'Connect to App Store Connect to auto-fill app details?',
                false,
            )
            if (wantsToConnect === null) return { action: 'cancel' }
            if (wantsToConnect) {
                ui.log.info('Configure ASC connection from the main menu first.')
                console.log()
                await ui.keypress('Press Enter to continue...')
            }
        }

        return { action: 'next' }
    }

    private async getAscStatus(): Promise<boolean> {
        return true // Validation happens in the run loop logic mostly
    }

    private async askToAutofill(appName: string, hasManualEntries: boolean): Promise<boolean> {
        if (hasManualEntries) {
            ui.log.warning('You have manually entered app details.')
            const overwrite = await ui.confirm(
                `Autofill from App Store Connect? This will overwrite your entries. (${appName || 'Connected app'})`,
                false,
            )
            return overwrite === true
        } else {
            const useAutofill = await ui.confirm(
                `Autofill from App Store Connect? (${appName || 'Connected app'})`,
                true,
            )
            return useAutofill === true
        }
    }

    private async performAutofill(appId: string, state: DraftState): Promise<{
        success: boolean
        appName?: string
        description?: string
        keywords?: string
        category?: string
        supportUrl?: string
    }> {
        const s = ui.spinner()
        s.start('Fetching from App Store Connect...')

        try {
            const autofillRes = await apiRequest('/api/asc/autofill', {
                method: 'POST',
                body: JSON.stringify({ appId }),
            })
            const autofillData = await autofillRes.json()

            s.stop(autofillRes.ok ? 'Data received' : 'Autofill failed')

            if (autofillRes.ok && autofillData?.data) {
                const data = autofillData.data
                state.appName = data.app_name || state.appName
                state.description = data.description || state.description
                state.keywords = data.keywords || state.keywords
                state.category = data.category || state.category
                state.supportUrl = data.support_url || state.supportUrl
                state.promotionalText = data.promotional_text || state.promotionalText
                state.marketingUrl = data.marketing_url || state.marketingUrl
                state._ascConnected = true

                return {
                    success: true,
                    appName: data.app_name,
                    description: data.description,
                    keywords: data.keywords,
                    category: data.category,
                    supportUrl: data.support_url,
                }
            }
        } catch {
            s.stop('Autofill failed')
        }
        return { success: false }
    }
}

