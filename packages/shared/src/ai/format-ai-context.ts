type Severity = 'critical' | 'warning' | 'info' | 'pass' | string

export interface AiContextItem {
    severity?: Severity
    category?: string | null
    guideline_ref?: string | null
    title?: string | null
    description?: string | null
    fix_suggestion?: string | null
    confidence?: number | null
    pattern_id?: string | null
}

export interface AiContextReport {
    score_overall?: number | null
    score_metadata?: number | null
    score_screenshots?: number | null
    score_privacy?: number | null
    score_plist?: number | null
    score_urls?: number | null
    score_content?: number | null
    score_ipa_binary?: number | null
    summary?: string | null
    improved_version?: string | null
}

export interface AiContextSubmission {
    id?: string
    app_name?: string | null
    version?: string | null
    category?: string | null
    privacy_url?: string | null
    support_url?: string | null
    marketing_url?: string | null
    sign_in_required?: boolean | null
    demo_username?: string | null
    demo_password?: string | null
    // JSON fields (stored in Supabase as JSONB)
    age_rating?: unknown
    privacy_declarations?: unknown
    checklist?: unknown
    created_at?: string | null
}

export interface FormatAiContextInput {
    submission?: AiContextSubmission | null
    report?: AiContextReport | null
    items?: AiContextItem[] | null
    fileTypes?: string[] | null
    /**
     * Redact sensitive submission fields (demo password, etc).
     * Defaults to true.
     */
    redactSensitive?: boolean
}

function safeString(v: unknown): string {
    if (v == null) return ''
    return typeof v === 'string' ? v : String(v)
}

function jsonStringify(obj: unknown): string {
    try {
        return JSON.stringify(obj, null, 2)
    } catch {
        return '"[unserializable]"'
    }
}

function severityEmoji(sev: string | undefined | null): string {
    const s = (sev || '').toLowerCase()
    if (s === 'critical') return '🔴'
    if (s === 'warning') return '🟡'
    if (s === 'info') return 'ℹ️'
    if (s === 'pass') return '✅'
    return '•'
}

export function calculateAgeRatingFromAnswers(raw: unknown): string | null {
    if (!raw || typeof raw !== 'object') return null
    const a = raw as Record<string, unknown>
    const n = (k: string): number => (typeof a[k] === 'number' ? (a[k] as number) : 0)

    // Match web + CLI questionnaire logic.
    if (n('prolongedViolence') === 2 || n('sexualContent') === 2 || n('gamblingSimulated') === 2 || n('gamblingContests') > 0) {
        return '17+'
    }
    if (n('realisticViolence') > 0 || n('sexualContent') > 0 || n('matureSuggestive') === 2 || n('alcoholDrugs') === 2 || n('gamblingSimulated') > 0) {
        return '12+'
    }
    if (n('cartoonViolence') === 2 || n('matureSuggestive') > 0 || n('profanity') === 2 || n('horrorFear') === 2) {
        return '9+'
    }
    return '4+'
}

type PrivacyCollectedLinked = { collected?: boolean; linked?: boolean }
type ParsedPrivacy = { tracking?: boolean; data?: Record<string, PrivacyCollectedLinked> }

function parsePrivacyDeclarations(raw: unknown): ParsedPrivacy | null {
    if (!raw || typeof raw !== 'object') return null
    const obj = raw as Record<string, unknown>

    // Preferred format (web + CLI): { data: { contact: {collected, linked}, ... }, tracking: boolean }
    if (obj.data && typeof obj.data === 'object') {
        const data = obj.data as Record<string, unknown>
        const out: Record<string, PrivacyCollectedLinked> = {}
        for (const [k, v] of Object.entries(data)) {
            if (v && typeof v === 'object') {
                const vv = v as Record<string, unknown>
                out[k] = { collected: vv.collected === true, linked: vv.linked === true }
            }
        }
        return { tracking: obj.tracking === true, data: out }
    }

    // Fallback: older/alternate formats might already be flattened
    const out: Record<string, PrivacyCollectedLinked> = {}
    for (const [k, v] of Object.entries(obj)) {
        if (k === 'tracking') continue
        if (v && typeof v === 'object') {
            const vv = v as Record<string, unknown>
            if ('collected' in vv || 'linked' in vv) {
                out[k] = { collected: vv.collected === true, linked: vv.linked === true }
            }
        }
    }
    return { tracking: obj.tracking === true, data: Object.keys(out).length ? out : undefined }
}

const PRIVACY_LABELS: Record<string, string> = {
    contact: 'Contact Info',
    health: 'Health & Fitness',
    financial: 'Financial Info',
    location: 'Location',
    sensitive: 'Sensitive Info',
    contacts: 'Contacts',
    content: 'User Content',
    browsing: 'Browsing History',
    search: 'Search History',
    identifiers: 'Identifiers',
    purchases: 'Purchases',
    usage: 'Usage Data',
    diagnostics: 'Diagnostics',
    other: 'Other Data',
}

const CHECKLIST_LABELS: Record<string, string> = {
    ugc: 'User Posts & Uploads (UGC)',
    login: 'Account / Login',
    iap: 'Pay to Unlock Features (IAP)',
    subscriptions: 'Subscription / Recurring Payment',
    ads: 'Ads',
    thirdPartyLogin: 'Third-party Social Login',
    aiContent: 'AI-Generated Content',
    healthClaims: 'Health / Medical Advice',
    crypto: 'Crypto / NFTs',
    miniApps: 'Mini Apps / Plugins',
    euDistribution: 'Distributed in the EU',
    externalPayments: 'External Payment Links (US)',
    accountDeletion: 'Account Deletion Button',
    restorePurchases: 'Restore Purchases Button',
    ugcModeration: 'UGC Moderation Controls',
    healthDisclaimers: 'Health Disclaimers',
    aiContentFiltering: 'AI Output Filtering',
    subscriptionTerms: 'Subscription Terms on Paywall',
    sellsDigitalOutsideIap: 'Digital Goods Outside IAP',
    subscriptionsWithoutLogin: 'Subscriptions Without Login',
    screenshotsMatchUi: 'Screenshots Match Current UI',
    testedIpv6: 'Tested on IPv6',
    contextualPermissions: 'Contextual Permission Prompts',
    alternateIcons: 'Alternate App Icons',
    creatorAgeGate: 'Creator Age Gate / Verification',
    miniAppsReviewed: 'Mini Apps Individually Reviewed',
    euTraderDeclared: 'EU Trader Status Declared',
    externalLinkCompliant: 'External Link API Compliance',
}

function truthyKeys(obj: unknown): string[] {
    if (!obj || typeof obj !== 'object') return []
    const o = obj as Record<string, unknown>
    return Object.entries(o)
        .filter(([_, v]) => v === true)
        .map(([k]) => k)
}

function redactSubmission(sub: AiContextSubmission, redactSensitive: boolean): AiContextSubmission {
    if (!redactSensitive) return sub
    return {
        ...sub,
        demo_password: sub.demo_password ? '[redacted]' : sub.demo_password,
    }
}

export function formatAiContext({
    submission,
    report,
    items,
    fileTypes,
    redactSensitive = true,
}: FormatAiContextInput): string {
    const lines: string[] = []
    const safeSub = submission ? redactSubmission(submission, redactSensitive) : null
    const safeItems = Array.isArray(items) ? items : []

    lines.push('# Preflight App Store Review Report (AI Context)')
    lines.push('')
    lines.push('This export includes the report + findings *and* the user-provided submission answers so an AI can cross-verify self-report vs artifacts vs findings.')
    lines.push('')

    if (safeSub?.id) lines.push(`Submission ID: ${safeSub.id}`)
    if (safeSub?.app_name) lines.push(`App: ${safeString(safeSub.app_name)}${safeSub.version ? ` v${safeString(safeSub.version)}` : ''}`)
    if (safeSub?.created_at) lines.push(`Created: ${safeString(safeSub.created_at)}`)
    if (safeSub?.id || safeSub?.app_name || safeSub?.created_at) lines.push('')

    if (report?.score_overall != null) {
        lines.push(`Approval Chance: ${report.score_overall}/100`)
        lines.push('')
    }

    if (report?.summary) {
        lines.push('## Summary')
        lines.push(safeString(report.summary))
        lines.push('')
    }

    // What We Checked section
    lines.push('## What We Checked')
    lines.push('- App metadata (name, description, keywords, URLs)')
    if (fileTypes && Array.isArray(fileTypes)) {
        const hasIpa = fileTypes.includes('ipa')
        const hasPlist = fileTypes.includes('plist')
        const hasManifest = fileTypes.includes('manifest')
        const screenshotCount = fileTypes.filter(t => t === 'screenshot').length

        if (screenshotCount > 0) lines.push(`- ${screenshotCount} screenshot${screenshotCount === 1 ? '' : 's'} (dimensions, file size)`)
        if (hasPlist) lines.push('- Info.plist (permissions, build settings, usage descriptions)')
        if (hasManifest) lines.push('- PrivacyInfo.xcprivacy (privacy manifest, API declarations)')
        if (hasIpa) {
            lines.push('- IPA binary (frameworks, entitlements, Mach-O symbols, imported symbols)')
            lines.push('- Privacy cross-reference (manifest vs detected SDKs)')
        }
    } else {
        lines.push('- Screenshots, Info.plist, privacy manifest (if provided)')
        lines.push('- IPA binary analysis (if provided)')
    }
    lines.push('- URL reachability (privacy policy, support, marketing URLs)')
    lines.push('- Apple guideline compliance (account deletion, restore purchases, SIWA, subscriptions)')
    lines.push('- AI content analysis (description, screenshots, privacy policy)')
    lines.push('')

    if (report) {
        lines.push('## Category Scores')
        const scoreLines: Array<[string, number | null | undefined]> = [
            ['Metadata', report.score_metadata],
            ['Screenshots', report.score_screenshots],
            ['Privacy', report.score_privacy],
            ['Info.plist', report.score_plist],
            ['URLs', report.score_urls],
            ['Content', report.score_content],
            ['IPA Binary', report.score_ipa_binary],
        ]
        for (const [label, score] of scoreLines) {
            if (typeof score === 'number') lines.push(`- ${label}: ${score}`)
        }
        lines.push('')
    }

    // User-provided answers
    if (safeSub) {
        lines.push('## Submission Answers (User Provided)')
        lines.push('')

        lines.push('### App Review Details')
        if (safeSub.category) lines.push(`- Category: ${safeString(safeSub.category)}`)
        if (safeSub.privacy_url) lines.push(`- Privacy Policy URL: ${safeString(safeSub.privacy_url)}`)
        if (safeSub.support_url) lines.push(`- Support URL: ${safeString(safeSub.support_url)}`)
        if (safeSub.marketing_url) lines.push(`- Marketing URL: ${safeString(safeSub.marketing_url)}`)
        if (typeof safeSub.sign_in_required === 'boolean') lines.push(`- Sign-in required: ${safeSub.sign_in_required ? 'Yes' : 'No'}`)
        if (safeSub.demo_username) lines.push(`- Demo username: ${safeString(safeSub.demo_username)}`)
        if (safeSub.demo_password) lines.push(`- Demo password: ${safeString(safeSub.demo_password)}`)
        lines.push('')

        // Age rating
        lines.push('### Age Rating')
        const ageRatingObj = safeSub.age_rating
        const computedAge = calculateAgeRatingFromAnswers(ageRatingObj)
        if (computedAge) lines.push(`- Computed rating (from answers): ${computedAge}`)
        lines.push('')
        lines.push('Raw answers:')
        lines.push('```json')
        lines.push(jsonStringify(ageRatingObj))
        lines.push('```')
        lines.push('')

        // Privacy declarations
        lines.push('### Privacy Declarations')
        const pd = parsePrivacyDeclarations(safeSub.privacy_declarations)
        if (pd?.data) {
            const collected = Object.entries(pd.data)
                .filter(([_, v]) => v?.collected)
                .map(([k, v]) => ({ key: k, label: PRIVACY_LABELS[k] || k, linked: !!v?.linked }))
                .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

            if (collected.length) {
                lines.push('Collected data types:')
                for (const c of collected) {
                    lines.push(`- ${c.label}${c.linked ? ' (linked to identity)' : ''}`)
                }
            } else {
                lines.push('- Collected data types: none indicated')
            }
            if (typeof pd.tracking === 'boolean') lines.push(`- Tracking: ${pd.tracking ? 'Yes' : 'No'}`)
        } else {
            lines.push('- No privacy declarations found on submission')
        }
        lines.push('')
        lines.push('Raw privacy declarations:')
        lines.push('```json')
        lines.push(jsonStringify(safeSub.privacy_declarations))
        lines.push('```')
        lines.push('')

        // Checklist
        lines.push('### Feature Checklist')
        const checklistTrue = truthyKeys(safeSub.checklist)
        if (checklistTrue.length) {
            lines.push('Confirmed features:')
            for (const k of checklistTrue.sort()) {
                lines.push(`- ${CHECKLIST_LABELS[k] || k}`)
            }
        } else {
            lines.push('- No features were confirmed (checklist empty)')
        }
        lines.push('')
        lines.push('Raw checklist:')
        lines.push('```json')
        lines.push(jsonStringify(safeSub.checklist))
        lines.push('```')
        lines.push('')
    }

    if (safeItems.length) {
        lines.push('## Findings (Report Items)')
        lines.push('')
        safeItems.forEach((item, i) => {
            const sev = item.severity || 'info'
            lines.push(`${i + 1}. ${severityEmoji(sev)} ${safeString(item.title || 'Issue')}`.trim())
            if (item.guideline_ref) lines.push(`   Guideline: ${safeString(item.guideline_ref)}`)
            if (item.category) lines.push(`   Category: ${safeString(item.category)}`)
            if (typeof item.confidence === 'number') lines.push(`   Confidence: ${item.confidence}/100`)
            if (item.description) lines.push(`   Details: ${safeString(item.description)}`)
            if (item.fix_suggestion) lines.push(`   Fix: ${safeString(item.fix_suggestion)}`)
            lines.push('')
        })
    }

    if (report?.improved_version) {
        lines.push('## Improved App Description (Generated)')
        lines.push(safeString(report.improved_version))
        lines.push('')
    }

    return lines.join('\n')
}

