import * as ui from '../../../ui/interactive.js'
import * as p from '@clack/prompts'
import { apiRequest } from '../../../lib/api-client.js'
import { SubmissionStep, StepResult, FlowContext } from '../BaseStep.js'
import { DraftState } from '../types.js'
import chalk from 'chalk'
import { subtext, brand } from '../../../ui/theme.js'

export class AscStep implements SubmissionStep {
    name = 'App Store Connect'

    async run(state: DraftState, context?: FlowContext): Promise<StepResult> {
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

                        // Skip confirmation if coming from Easy Setup (or no manual entries to overwrite)
                        if (context?.skipAutofillConfirm && !hasManualEntries) {
                            shouldConnect = true
                        } else {
                            shouldConnect = await this.askToAutofill(statusData.appName, hasManualEntries)
                        }

                        if (shouldConnect) {
                            const result = await this.performAutofill(statusData.appId, state)
                            if (result.success) {
                                console.log()
                                ui.log.success('Connected to App Store Connect')
                                console.log()

                                // ─── Basic Info ──────────────────────────────────────────
                                if (result.appName) console.log(`  ${chalk.green('✓')} App Name: ${brand(result.appName)}`)
                                if (result.description) console.log(`  ${chalk.green('✓')} Description: ${subtext(result.description.slice(0, 50) + (result.description.length > 50 ? '...' : ''))}`)
                                if (result.keywords) console.log(`  ${chalk.green('✓')} Keywords: ${subtext(result.keywords.slice(0, 50) + (result.keywords.length > 50 ? '...' : ''))}`)
                                if (result.category) console.log(`  ${chalk.green('✓')} Category: ${result.category}`)
                                if (result.supportUrl) console.log(`  ${chalk.green('✓')} Support URL: ${subtext(result.supportUrl)}`)
                                if (result.copyright) console.log(`  ${chalk.green('✓')} Copyright: ${subtext(result.copyright)}`)

                                // ─── Screenshots ───────────────────────────────────────── (example usage)
                                if (result.screenshotCount !== undefined) {
                                    const icon = result.screenshotCount > 0 ? chalk.green('✓') : chalk.yellow('○')
                                    console.log(`  ${icon} Screenshots: ${result.screenshotCount} uploaded`)
                                }

                                // ─── Monetization ────────────────────────────────────────
                                if (result.subscriptionCount !== undefined || result.iapCount !== undefined) {
                                    console.log()
                                    console.log(`  ${chalk.dim('Monetization:')}`)
                                    if (result.subscriptionCount !== undefined) {
                                        const icon = result.subscriptionCount > 0 ? chalk.green('✓') : chalk.dim('○')
                                        console.log(`    ${icon} ${result.subscriptionCount} Subscription${result.subscriptionCount !== 1 ? 's' : ''}`)
                                    }
                                    if (result.iapCount !== undefined) {
                                        const icon = result.iapCount > 0 ? chalk.green('✓') : chalk.dim('○')
                                        console.log(`    ${icon} ${result.iapCount} In-App Purchase${result.iapCount !== 1 ? 's' : ''}`)
                                    }
                                }

                                // ─── Age Rating ──────────────────────────────────────────
                                if (result.ageRating) {
                                    console.log()
                                    console.log(`  ${chalk.green('✓')} Age Rating: ${result.ageRating}`)
                                }

                                // ─── App Privacy Status ───────────────────────────────────
                                if (result.privacyConfigured !== undefined) {
                                    const icon = result.privacyConfigured ? chalk.green('✓') : chalk.dim('○')
                                    const status = result.privacyConfigured ? 'Configured' : 'Not configured'
                                    console.log(`  ${icon} App Privacy: ${status}`)
                                }

                                // ─── Review Contact ──────────────────────────────────────
                                if (result.reviewContact) {
                                    console.log(`  ${chalk.green('✓')} Review Contact: ${result.reviewContact}`)
                                }

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
        copyright?: string
        screenshotCount?: number
        subscriptionCount?: number
        iapCount?: number
        ageRating?: string
        privacyConfigured?: boolean
        reviewContact?: string
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

                // ─── Basic Metadata ──────────────────────────────────────────
                state.appName = data.app_name || state.appName
                state.description = data.description || state.description
                state.keywords = data.keywords || state.keywords
                state.category = data.category || state.category
                state.supportUrl = data.support_url || state.supportUrl
                state.promotionalText = data.promotional_text || state.promotionalText
                state.marketingUrl = data.marketing_url || state.marketingUrl
                state.privacyPolicyUrl = data.privacy_policy_url || state.privacyPolicyUrl

                // ─── Version Info ────────────────────────────────────────────
                state.copyright = data.copyright || state.copyright
                state.version = data.version || state.version

                // ─── Review Credentials ──────────────────────────────────────
                state.signInRequired = data.sign_in_required ?? state.signInRequired
                state.demoUsername = data.demo_username || state.demoUsername
                state.demoPassword = data.demo_password || state.demoPassword
                state.reviewNotes = data.review_notes || state.reviewNotes

                // ─── Review Contact ──────────────────────────────────────────
                if (data.contact_first_name || data.contact_email) {
                    state.reviewContact = {
                        firstName: data.contact_first_name || undefined,
                        lastName: data.contact_last_name || undefined,
                        email: data.contact_email || undefined,
                        phone: data.contact_phone || undefined,
                    }
                }

                // ─── Screenshots (for analysis) ──────────────────────────────
                if (data.screenshots && Array.isArray(data.screenshots)) {
                    state.screenshots = data.screenshots.map((s: any) => ({
                        deviceType: s.device_type,
                        count: s.count,
                    }))

                    // Download screenshots for analysis
                    const tempPaths: string[] = []
                    const { tmpdir } = await import('node:os')
                    const { join } = await import('node:path')
                    const { writeFile, mkdir } = await import('node:fs/promises')

                    const tempDir = join(tmpdir(), 'preflight-asc-screenshots')
                    await mkdir(tempDir, { recursive: true })

                    // s.message('Downloading screenshots from App Store Connect...')
                    // Use a spinner instead of a static message for better feedback on long downloads
                    const dlSpinner = p.spinner()
                    dlSpinner.start('Downloading screenshots from App Store Connect...')

                    try {
                        for (const group of data.screenshots) {
                            if (group.images && Array.isArray(group.images)) {
                                for (const img of group.images) {
                                    if (img.url) {
                                        try {
                                            const res = await fetch(img.url)
                                            if (res.ok) {
                                                const buffer = Buffer.from(await res.arrayBuffer())
                                                const filename = `${group.device_type}_${img.file_name || 'screenshot.png'}`
                                                const destPath = join(tempDir, filename)
                                                await writeFile(destPath, buffer)
                                                tempPaths.push(destPath)
                                                // Optional: update message for progress?
                                                // dlSpinner.message(`Downloading screenshots... (${tempPaths.length})`) 
                                            }
                                        } catch (err) {
                                            // Ignore download failures for individual images
                                        }
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        // Ignore general failure
                    }

                    if (tempPaths.length > 0) {
                        state._tempScreenshotPaths = tempPaths
                        state._screenshotPaths = tempPaths
                        dlSpinner.stop(`Downloaded ${tempPaths.length} screenshots from ASC`)
                        // ui.log.success(`Downloaded ${tempPaths.length} screenshots from ASC`)
                    } else {
                        dlSpinner.stop('No screenshots downloaded')
                    }
                }

                // ─── Subscriptions (for analysis) ────────────────────────────
                if (data.subscriptions && Array.isArray(data.subscriptions)) {
                    state.subscriptions = data.subscriptions.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        productId: s.product_id,
                        state: s.state,
                        groupName: s.group_name,
                    }))
                }

                // ─── In-App Purchases (for analysis) ─────────────────────────
                if (data.in_app_purchases && Array.isArray(data.in_app_purchases)) {
                    state.inAppPurchases = data.in_app_purchases.map((iap: any) => ({
                        id: iap.id,
                        name: iap.name,
                        productId: iap.product_id,
                        type: iap.type,
                        state: iap.state,
                    }))
                }

                // ─── Age Rating (for analysis) ───────────────────────────────
                if (data.age_rating) {
                    state.ageRating = {
                        rating: data.age_rating.rating,
                        gambling: data.age_rating.gambling || false,
                        unrestrictedWebAccess: data.age_rating.unrestricted_web_access || false,
                        kidsAgeBand: data.age_rating.kids_age_band || null,
                        seventeenPlus: data.age_rating.seventeen_plus || false,
                    }
                }

                // ─── App Privacy Status ───────────────────────────────────────
                if (data.privacy_status) {
                    state.privacyStatus = {
                        configured: data.privacy_status.configured || false,
                        privacyPolicyUrl: data.privacy_status.privacy_policy_url || null,
                    }
                }

                state._ascConnected = true

                // Calculate totals for display
                const screenshotCount = state.screenshots?.reduce((sum, s) => sum + s.count, 0) || 0
                const subscriptionCount = state.subscriptions?.length || 0
                const iapCount = state.inAppPurchases?.length || 0

                // Format review contact for display
                let reviewContact: string | undefined
                if (state.reviewContact?.firstName || state.reviewContact?.email) {
                    reviewContact = [
                        state.reviewContact.firstName,
                        state.reviewContact.lastName
                    ].filter(Boolean).join(' ') || state.reviewContact.email
                }

                return {
                    success: true,
                    appName: data.app_name,
                    description: data.description,
                    keywords: data.keywords,
                    category: data.category,
                    supportUrl: data.support_url,
                    copyright: data.copyright,
                    screenshotCount,
                    subscriptionCount,
                    iapCount,
                    ageRating: state.ageRating?.rating || undefined,
                    privacyConfigured: state.privacyStatus?.configured,
                    reviewContact,
                }
            }
        } catch {
            s.stop('Autofill failed')
        }
        return { success: false }
    }
}
