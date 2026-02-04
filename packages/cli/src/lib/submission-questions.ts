import * as ui from '../ui/interactive.js'
import { subtext } from '../ui/theme.js'
import chalk from 'chalk'

// ─── Types ───────────────────────────────────────────────────────────────

export interface AppDetails {
    appName: string
    description?: string
    keywords?: string
    category?: string
    supportUrl?: string
    promotionalText?: string
    marketingUrl?: string
    signInRequired: boolean
    demoUsername?: string
    demoPassword?: string
}

export interface AgeRatingAnswers {
    cartoonViolence: number
    realisticViolence: number
    prolongedViolence: number
    sexualContent: number
    matureSuggestive: number
    profanity: number
    alcoholDrugs: number
    gamblingSimulated: number
    horrorFear: number
    medicalTreatment: number
    gamblingContests: number
    unrestrictedWebAccess: boolean
    madeForKids: boolean
}

export interface PrivacyDataType {
    collected: boolean
    linked: boolean
}

export interface PrivacyDeclarations {
    data: {
        contact: PrivacyDataType
        health: PrivacyDataType
        financial: PrivacyDataType
        location: PrivacyDataType
        sensitive: PrivacyDataType
        contacts: PrivacyDataType
        content: PrivacyDataType
        browsing: PrivacyDataType
        search: PrivacyDataType
        identifiers: PrivacyDataType
        purchases: PrivacyDataType
        usage: PrivacyDataType
        diagnostics: PrivacyDataType
        other: PrivacyDataType
    }
    tracking: boolean
}

export interface FeatureChecklist {
    ugc: boolean
    login: boolean
    iap: boolean
    subscriptions: boolean
    ads: boolean
    thirdPartyLogin: boolean
    aiContent: boolean
    healthClaims: boolean
    crypto: boolean
    miniApps: boolean
    euDistribution: boolean
    externalPayments: boolean
    creatorAgeGate?: boolean      // Conditional: shown when ugc=true
    miniAppsReviewed?: boolean    // Conditional: shown when miniApps=true
    euTraderDeclared?: boolean    // Conditional: shown when euDistribution=true
    externalLinkCompliant?: boolean // Conditional: shown when externalPayments=true
    accountDeletion?: boolean
    restorePurchases?: boolean
}

export interface ComplianceData {
    ageRatingAnswers: AgeRatingAnswers
    ageRating: string
    privacyDeclarations: PrivacyDeclarations
    checklist: FeatureChecklist
}

// ─── Categories ──────────────────────────────────────────────────────────

const CATEGORIES = [
    'Business',
    'Developer Tools',
    'Education',
    'Finance',
    'Health & Fitness',
    'Lifestyle',
    'Productivity',
    'Social Networking',
    'Utilities',
]

// ─── Age Rating Content Types ────────────────────────────────────────────

const AGE_RATING_CONTENT_TYPES = [
    { value: 'cartoonViolence' as const, label: 'Cartoon violence', hint: 'e.g., Tom & Jerry style' },
    { value: 'realisticViolence' as const, label: 'Realistic violence', hint: 'e.g., combat games' },
    { value: 'prolongedViolence' as const, label: 'Graphic/intense violence', hint: 'e.g., gore, torture' },
    { value: 'sexualContent' as const, label: 'Sexual content or nudity', hint: 'e.g., explicit images' },
    { value: 'matureSuggestive' as const, label: 'Mature or suggestive themes', hint: 'e.g., dating, romance' },
    { value: 'profanity' as const, label: 'Swearing or crude humor', hint: 'e.g., curse words' },
    { value: 'alcoholDrugs' as const, label: 'Alcohol, tobacco, or drugs', hint: 'e.g., drinking scenes' },
    { value: 'gamblingSimulated' as const, label: 'Gambling (no real money)', hint: 'e.g., casino games with fake chips' },
    { value: 'horrorFear' as const, label: 'Horror or scary content', hint: 'e.g., jump scares' },
    { value: 'medicalTreatment' as const, label: 'Medical or health advice', hint: 'e.g., treatment suggestions' },
    { value: 'gamblingContests' as const, label: 'Real money gambling or paid contests', hint: 'e.g., betting, fantasy sports' },
]

// ─── Privacy Data Types ──────────────────────────────────────────────────

const PRIVACY_DATA_TYPES = [
    { value: 'contact' as const, label: 'Contact Info', hint: 'Name, email, phone, address' },
    { value: 'health' as const, label: 'Health & Fitness', hint: 'Workouts, steps, medical info' },
    { value: 'financial' as const, label: 'Financial Info', hint: 'Credit cards, bank details' },
    { value: 'location' as const, label: 'Location', hint: 'GPS, location data' },
    { value: 'sensitive' as const, label: 'Sensitive Info', hint: 'Race, religion, politics' },
    { value: 'contacts' as const, label: 'Contacts', hint: 'Phone contacts, address book' },
    { value: 'content' as const, label: 'User Content', hint: 'Photos, videos, posts' },
    { value: 'browsing' as const, label: 'Browsing History', hint: 'Websites visited' },
    { value: 'search' as const, label: 'Search History', hint: 'In-app searches' },
    { value: 'identifiers' as const, label: 'Identifiers', hint: 'User ID, device ID' },
    { value: 'purchases' as const, label: 'Purchases', hint: 'Purchase history' },
    { value: 'usage' as const, label: 'Usage Data', hint: 'Button taps, feature usage' },
    { value: 'diagnostics' as const, label: 'Diagnostics', hint: 'Crash reports (Firebase, Sentry)' },
    { value: 'other' as const, label: 'Other Data', hint: 'Anything else not listed' },
]

// ─── Feature Checklist Items ─────────────────────────────────────────────

const FEATURE_ITEMS = [
    { value: 'ugc' as const, label: 'User Posts & Uploads', hint: 'Comments, photos, sharing' },
    { value: 'login' as const, label: 'Account / Login', hint: 'Sign up or log in required' },
    { value: 'iap' as const, label: 'Pay to Unlock Features', hint: 'One-time purchases' },
    { value: 'subscriptions' as const, label: 'Subscription / Recurring Payment', hint: 'Weekly, monthly, yearly' },
    { value: 'ads' as const, label: 'Ads in Your App', hint: 'Banner, video, or sponsored' },
    { value: 'thirdPartyLogin' as const, label: 'Sign in with Apple / Google', hint: 'Social login' },
    { value: 'aiContent' as const, label: 'AI-Generated Content', hint: 'ChatGPT, DALL-E, etc.' },
    { value: 'healthClaims' as const, label: 'Health / Medical Advice', hint: 'Diagnosis, treatment' },
    { value: 'crypto' as const, label: 'Crypto / NFTs', hint: 'Buy, sell, trade' },
    { value: 'miniApps' as const, label: 'Mini Apps / Plugins', hint: 'Hosts mini games, chatbots, or plugins' },
    { value: 'euDistribution' as const, label: 'Available in the EU', hint: 'Distributed on EU App Store' },
    { value: 'externalPayments' as const, label: 'External Payment Links (US)', hint: 'Links to pay outside Apple' },
]

// ─── Age Rating Calculation (ported from web AgeRating.tsx) ──────────────

export function calculateAgeRating(answers: AgeRatingAnswers): string {
    // 17+
    if (
        answers.prolongedViolence === 2 ||
        answers.sexualContent === 2 ||
        answers.gamblingSimulated === 2 ||
        answers.gamblingContests > 0
    ) {
        return '17+'
    }

    // 12+
    if (
        answers.realisticViolence > 0 ||
        answers.sexualContent > 0 ||
        answers.matureSuggestive === 2 ||
        answers.alcoholDrugs === 2 ||
        answers.gamblingSimulated > 0
    ) {
        return '12+'
    }

    // 9+
    if (
        answers.cartoonViolence === 2 ||
        answers.matureSuggestive > 0 ||
        answers.profanity === 2 ||
        answers.horrorFear === 2
    ) {
        return '9+'
    }

    // Default
    return '4+'
}

// ─── Collect App Details ─────────────────────────────────────────────────

export async function collectAppDetails(projectName: string, defaults?: Partial<AppDetails>): Promise<AppDetails | null> {
    const defaultName = defaults?.appName || projectName

    // Initialize state with defaults
    const state: Partial<AppDetails> = {
        appName: defaults?.appName,
        description: defaults?.description,
        keywords: defaults?.keywords,
        promotionalText: defaults?.promotionalText,
        category: defaults?.category,
        supportUrl: defaults?.supportUrl,
        marketingUrl: defaults?.marketingUrl,
        signInRequired: defaults?.signInRequired ?? false,
        demoUsername: defaults?.demoUsername,
        demoPassword: defaults?.demoPassword,
    }

    let step = 0
    // Steps:
    // 0: App Name
    // 1: Description
    // 2: Keywords
    // 3: Promotional Text
    // 4: Category
    // 5: Support URL
    // 6: Marketing URL
    // 7: Sign-in Required
    // 8: Demo Email (only if sign-in required)
    // 9: Demo Password (only if sign-in required)
    // 10: Summary/Confirm

    while (true) {
        switch (step) {
            case 0: { // App Name
                const res = await ui.text({
                    message: 'App Name',
                    placeholder: defaultName,
                    defaultValue: state.appName || defaultName,
                    validate: (val) => !val?.trim() ? 'App name is required' : undefined,
                })
                if (res === null) return null // Exit flow
                state.appName = res.trim()
                step++
                break
            }
            case 1: { // Description
                const res = await ui.text({
                    message: 'Description (press Enter to skip)',
                    placeholder: 'Describe your app as it appears in the App Store',
                    defaultValue: state.description || '',
                })
                if (res === null) { step--; break }
                state.description = res.trim() || undefined
                step++
                break
            }
            case 2: { // Keywords
                const res = await ui.text({
                    message: 'Keywords (press Enter to skip)',
                    placeholder: 'Comma-separated, 100 chars max',
                    defaultValue: state.keywords || '',
                    validate: (val) => (val && val.length > 100) ? 'Keywords must be 100 characters or less' : undefined,
                })
                if (res === null) { step--; break }
                state.keywords = res.trim() || undefined
                step++
                break
            }
            case 3: { // Promotional Text
                const res = await ui.text({
                    message: 'Promotional Text (press Enter to skip)',
                    placeholder: 'Short promotional text, 170 chars max',
                    defaultValue: state.promotionalText || '',
                    validate: (val) => (val && val.length > 170) ? 'Promotional text must be 170 characters or less' : undefined,
                })
                if (res === null) { step--; break }
                state.promotionalText = res.trim() || undefined
                step++
                break
            }
            case 4: { // Category
                const categoryOptions = [
                    { value: '__skip__' as const, label: 'Skip', hint: 'Choose later' },
                    ...CATEGORIES.map(c => ({ value: c, label: c })),
                ]
                const defaultCat = state.category || '__skip__'
                const res = await ui.select<string>({
                    message: 'Primary Category',
                    options: categoryOptions,
                    initialValue: defaultCat,
                })
                if (res === null) { step--; break }
                state.category = res === '__skip__' ? undefined : res
                step++
                break
            }
            case 5: { // Support URL
                const res = await ui.text({
                    message: 'Support URL (press Enter to skip)',
                    placeholder: 'https://example.com/support',
                    defaultValue: state.supportUrl || '',
                })
                if (res === null) { step--; break }
                state.supportUrl = res.trim() || undefined
                step++
                break
            }
            case 6: { // Marketing URL
                const res = await ui.text({
                    message: 'Marketing URL (press Enter to skip)',
                    placeholder: 'https://example.com',
                    defaultValue: state.marketingUrl || '',
                })
                if (res === null) { step--; break }
                state.marketingUrl = res.trim() || undefined
                step++
                break
            }
            case 7: { // Sign-in Required
                const res = await ui.confirm(
                    'Does your app require sign-in for review?',
                    state.signInRequired ?? false,
                )
                if (res === null) { step--; break }
                state.signInRequired = res
                // If false, skip demo creds (steps 8 & 9)
                if (!res) {
                    state.demoUsername = undefined
                    state.demoPassword = undefined
                    step = 10
                } else {
                    step++
                }
                break
            }
            case 8: { // Demo Email
                const res = await ui.text({
                    message: 'Demo Email',
                    placeholder: 'test@example.com',
                    defaultValue: state.demoUsername || '',
                    validate: (val) => !val?.trim() ? 'Demo email is required when sign-in is required' : undefined,
                })
                if (res === null) { step--; break }
                state.demoUsername = res.trim()
                step++
                break
            }
            case 9: { // Demo Password
                const res = await ui.password({
                    message: 'Demo Password',
                    defaultValue: state.demoPassword || '',
                    validate: (val) => !val?.trim() ? 'Demo password is required when sign-in is required' : undefined,
                })
                if (res === null) { step--; break }
                state.demoPassword = res
                step++
                break
            }
            // 10: Summary Confirmation
            case 10: {
                console.log()
                const summaryLines = [
                    `App Name: ${state.appName}`,
                    `Description: ${state.description || '[empty]'}`,
                    `Keywords: ${state.keywords || '[empty]'}`,
                    `Promotional Text: ${state.promotionalText || '[empty]'}`,
                    `Category: ${state.category || '[empty]'}`,
                    `Support URL: ${state.supportUrl || '[empty]'}`,
                    `Marketing URL: ${state.marketingUrl || '[empty]'}`,
                    `Sign-in Required: ${state.signInRequired ? 'Yes' : 'No'}`,
                    ...(state.signInRequired ? [`Demo Email: ${state.demoUsername || '[empty]'}`] : []),
                ]
                ui.note(summaryLines.join('\n'), 'App Details Summary')

                const action = await ui.select<'continue' | 'edit'>({
                    message: 'Review app details',
                    options: [
                        { value: 'continue', label: 'Continue to Compliance', hint: 'Looks good' },
                        { value: 'edit', label: 'Edit a field', hint: 'Make changes' },
                    ],
                })

                if (action === null) {
                    // Logic: Back from summary goes to last active step
                    if (state.signInRequired) step = 9
                    else step = 7 // Go back to sign-in toggle (skip demo creds)
                    break
                }

                if (action === 'continue') {
                    // Return valid object
                    return state as AppDetails
                } else {
                    // Quick edit menu
                    const fieldOptions = [
                        { value: 'appName', label: `App Name: ${state.appName}` },
                        { value: 'description', label: `Description: ${state.description || '[empty]'}` },
                        { value: 'keywords', label: `Keywords: ${state.keywords || '[empty]'}` },
                        { value: 'promotionalText', label: `Promotional Text: ${state.promotionalText || '[empty]'}` },
                        { value: 'category', label: `Category: ${state.category || '[empty]'}` },
                        { value: 'supportUrl', label: `Support URL: ${state.supportUrl || '[empty]'}` },
                        { value: 'marketingUrl', label: `Marketing URL: ${state.marketingUrl || '[empty]'}` },
                        { value: 'signInRequired', label: `Sign-in Required: ${state.signInRequired ? 'Yes' : 'No'}` },
                        ...(state.signInRequired ? [
                            { value: 'demoUsername', label: `Demo Email: ${state.demoUsername || '[empty]'}` },
                            { value: 'demoPassword', label: 'Demo Password: [hidden]' },
                        ] : []),
                        { value: 'back', label: 'Back' },
                    ]

                    const fieldToEdit = await ui.select<string>({
                        message: 'Which field to edit?',
                        options: fieldOptions,
                    })

                    if (fieldToEdit === null || fieldToEdit === 'back') {
                        // Stay on summary
                        break
                    }

                    // Map field to step number to jump there
                    switch (fieldToEdit) {
                        case 'appName': step = 0; break
                        case 'description': step = 1; break
                        case 'keywords': step = 2; break
                        case 'promotionalText': step = 3; break
                        case 'category': step = 4; break
                        case 'supportUrl': step = 5; break
                        case 'marketingUrl': step = 6; break
                        case 'signInRequired': step = 7; break
                        case 'demoUsername': step = 8; break
                        case 'demoPassword': step = 9; break
                    }
                    // After jumping, flow continues from that step
                    break
                }
            }
        }
    }
}

// ─── Collect Age Rating ──────────────────────────────────────────────────

export async function collectAgeRating(): Promise<{ answers: AgeRatingAnswers; rating: string } | null> {
    ui.log.step(subtext('Step 1 of 3: Age Rating'))

    // Default all-No answers
    const defaultAnswers: AgeRatingAnswers = {
        cartoonViolence: 0,
        realisticViolence: 0,
        prolongedViolence: 0,
        sexualContent: 0,
        matureSuggestive: 0,
        profanity: 0,
        alcoholDrugs: 0,
        gamblingSimulated: 0,
        horrorFear: 0,
        medicalTreatment: 0,
        gamblingContests: 0,
        unrestrictedWebAccess: false,
        madeForKids: false,
    }

    // Gate question
    const hasMatureContent = await ui.confirm(
        'Does your app contain any mature content? (violence, sexual content, drugs, gambling, horror)',
        false,
    )
    if (hasMatureContent === null) return null

    if (!hasMatureContent) {
        const rating = calculateAgeRating(defaultAnswers)
        ui.log.success(`Age Rating: ${rating}`)
        return { answers: defaultAnswers, rating }
    }

    return collectAgeRatingDetailed(defaultAnswers)
}

async function collectAgeRatingDetailed(
    answers: AgeRatingAnswers,
): Promise<{ answers: AgeRatingAnswers; rating: string } | null> {
    const updatedAnswers = { ...answers }

    // Dynamic list of steps
    // We start with 'types'. After 'types' is answered, we inject severity steps.
    const steps: Array<
        | { type: 'types' }
        | { type: 'severity'; key: string; label: string }
        | { type: 'web' }
        | { type: 'kids' }
    > = [{ type: 'types' }, { type: 'web' }, { type: 'kids' }]

    let currentStepIdx = 0

    while (true) {
        if (currentStepIdx < 0) return null // Back out of detailed flow
        if (currentStepIdx >= steps.length) break // Done

        const step = steps[currentStepIdx]

        switch (step.type) {
            case 'types': {
                // Determine initial checklist from current zero-answers vs existing answers
                // But updatedAnswers might have 1s and 2s. We just care which keys are > 0.
                const initialSelected = AGE_RATING_CONTENT_TYPES
                    .filter(t => (updatedAnswers as any)[t.value] > 0)
                    .map(t => t.value)

                const selectedTypes = await ui.multiselect<string>({
                    message: 'Which types of content does your app contain? (Space to select, Enter to confirm)',
                    options: AGE_RATING_CONTENT_TYPES,
                    initialValue: initialSelected,
                })

                if (selectedTypes === null) {
                    currentStepIdx--
                    break
                }

                // Reset all to 0 first to clear unselected ones
                for (const t of AGE_RATING_CONTENT_TYPES) {
                    (updatedAnswers as any)[t.value] = 0
                }

                // Re-populate steps. 
                // Keep 'types' at 0. Remove old severities. Append new severities. Then web/kids.
                const severitySteps = selectedTypes.map(key => {
                    const typeInfo = AGE_RATING_CONTENT_TYPES.find(t => t.value === key)!
                    return { type: 'severity' as const, key, label: typeInfo.label }
                })

                // Set default severity to 1 if it was 0 (newly selected)
                // If it was already > 0 (kept selected), keep value.
                for (const key of selectedTypes) {
                    if ((updatedAnswers as any)[key] === 0) {
                        (updatedAnswers as any)[key] = 1
                    }
                }

                // Replace steps array structure
                steps.length = 0
                steps.push({ type: 'types' })
                steps.push(...severitySteps)
                steps.push({ type: 'web' })
                steps.push({ type: 'kids' })

                currentStepIdx++
                break
            }

            case 'severity': {
                const currentVal = (updatedAnswers as any)[step.key]
                // 1 or 2
                const initialVal = currentVal > 0 ? String(currentVal) as '1' | '2' : '1'

                const severity = await ui.select<'1' | '2'>({
                    message: `${step.label}: how much?`,
                    options: [
                        { value: '1', label: 'A little', hint: 'Minor/occasional' },
                        { value: '2', label: 'A lot', hint: 'Frequent/prominent' },
                    ],
                    initialValue: initialVal,
                })

                if (severity === null) {
                    currentStepIdx--
                    break
                }

                (updatedAnswers as any)[step.key] = parseInt(severity)
                currentStepIdx++
                break
            }

            case 'web': {
                const webAccess = await ui.confirm(
                    'Can users browse any website in your app? (e.g., in-app browser)',
                    updatedAnswers.unrestrictedWebAccess,
                )
                if (webAccess === null) {
                    currentStepIdx--
                    break
                }
                updatedAnswers.unrestrictedWebAccess = webAccess
                currentStepIdx++
                break
            }

            case 'kids': {
                const madeForKids = await ui.confirm(
                    'Is this app designed specifically for kids under 13?',
                    updatedAnswers.madeForKids,
                )
                if (madeForKids === null) {
                    currentStepIdx--
                    break
                }
                updatedAnswers.madeForKids = madeForKids
                currentStepIdx++
                break
            }
        }
    }

    const rating = calculateAgeRating(updatedAnswers)
    ui.log.success(`Age Rating: ${rating}`)

    return { answers: updatedAnswers, rating }
}

// ─── Collect Privacy Data ────────────────────────────────────────────────

export async function collectPrivacyData(): Promise<PrivacyDeclarations | null> {
    ui.log.step(subtext('Step 2 of 3: Privacy & Data'))

    const emptyData = Object.fromEntries(
        PRIVACY_DATA_TYPES.map(t => [t.value, { collected: false, linked: false }])
    ) as PrivacyDeclarations['data']

    // State
    const state = {
        collectsData: false,
        data: { ...emptyData },
        tracking: false
    }

    // Dynamic steps
    const steps: Array<
        | { type: 'gate' }
        | { type: 'types' }
        | { type: 'linked'; key: string; label: string }
        | { type: 'tracking' }
    > = [{ type: 'gate' }]

    let currentStepIdx = 0

    while (true) {
        if (currentStepIdx < 0) return null
        if (currentStepIdx >= steps.length) break

        const step = steps[currentStepIdx]

        switch (step.type) {
            case 'gate': {
                const collectsData = await ui.confirm('Does your app collect any user data?', state.collectsData)
                if (collectsData === null) {
                    currentStepIdx--
                    break
                }

                state.collectsData = collectsData

                if (!collectsData) {
                    // Reset to empty if changed to No
                    state.data = { ...emptyData }
                    state.tracking = false
                    steps.length = 1 // Just gate
                    // Done
                    return { data: state.data, tracking: false }
                } else {
                    // Populate steps if Yes
                    steps.length = 0
                    steps.push({ type: 'gate' })
                    steps.push({ type: 'types' })
                    // We'll inject linked steps after types
                    steps.push({ type: 'tracking' })
                }
                currentStepIdx++
                break
            }

            case 'types': {
                // If we are here, collectsData is true
                // Get currently collected keys
                const currentKeys = PRIVACY_DATA_TYPES
                    .filter(t => (state.data as any)[t.value].collected)
                    .map(t => t.value)

                const collectedTypes = await ui.multiselect<string>({
                    message: 'What data does your app collect? (Space to select, Enter to confirm)',
                    options: PRIVACY_DATA_TYPES,
                    initialValue: currentKeys,
                })

                if (collectedTypes === null) {
                    currentStepIdx--
                    break
                }

                // Reset collected status based on selection
                for (const t of PRIVACY_DATA_TYPES) {
                    const isSelected = collectedTypes.includes(t.value)
                    const currentObj = (state.data as any)[t.value]
                    if (isSelected !== currentObj.collected) {
                        currentObj.collected = isSelected
                        // If unselected, reset linked
                        if (!isSelected) currentObj.linked = false
                    }
                }

                // Re-calculate linked steps
                const linkedSteps = collectedTypes.map(key => {
                    const typeInfo = PRIVACY_DATA_TYPES.find(t => t.value === key)!
                    return { type: 'linked' as const, key, label: typeInfo.label }
                })

                // Re-build steps array
                steps.length = 0
                steps.push({ type: 'gate' })
                steps.push({ type: 'types' })
                steps.push(...linkedSteps)
                steps.push({ type: 'tracking' })

                currentStepIdx++
                break
            }

            case 'linked': {
                // Calculate position among linked steps for numbering
                const linkedSteps = steps.filter(s => s.type === 'linked')
                const linkedIndex = linkedSteps.findIndex(s => s.type === 'linked' && s.key === step.key)
                const linkedTotal = linkedSteps.length

                const typeObj = (state.data as any)[step.key]
                const linked = await ui.confirm(
                    `(${linkedIndex + 1}/${linkedTotal}) Can you tie ${step.label} to a specific person?`,
                    typeObj.linked,
                )

                if (linked === null) {
                    currentStepIdx--
                    break
                }
                typeObj.linked = linked
                currentStepIdx++
                break
            }

            case 'tracking': {
                const tracking = await ui.confirm(
                    'Does your app use data to track users across other companies\' apps and websites?',
                    state.tracking,
                )

                if (tracking === null) {
                    currentStepIdx--
                    break
                }
                state.tracking = tracking
                currentStepIdx++
                break
            }
        }
    }

    return { data: state.data, tracking: state.tracking }
}

// ─── Collect Feature Checklist ───────────────────────────────────────────

export async function collectFeatureChecklist(): Promise<FeatureChecklist | null> {
    ui.log.step(subtext('Step 3 of 3: Features'))

    let selectedFeatures: string[] = []
    let checklist: FeatureChecklist | null = null

    // Helper to build object
    const buildChecklist = (features: string[]): FeatureChecklist => ({
        ugc: features.includes('ugc'),
        login: features.includes('login'),
        iap: features.includes('iap'),
        subscriptions: features.includes('subscriptions'),
        ads: features.includes('ads'),
        thirdPartyLogin: features.includes('thirdPartyLogin'),
        aiContent: features.includes('aiContent'),
        healthClaims: features.includes('healthClaims'),
        crypto: features.includes('crypto'),
        miniApps: features.includes('miniApps'),
        euDistribution: features.includes('euDistribution'),
        externalPayments: features.includes('externalPayments'),
        // Conditionals preserved from 'checklist' object if exists, else undefined
        accountDeletion: checklist?.accountDeletion,
        restorePurchases: checklist?.restorePurchases,
        creatorAgeGate: checklist?.creatorAgeGate,
        miniAppsReviewed: checklist?.miniAppsReviewed,
        euTraderDeclared: checklist?.euTraderDeclared,
        externalLinkCompliant: checklist?.externalLinkCompliant,
    })

    const steps: Array<
        | { type: 'select' }
        | { type: 'confirm' } // Summary confirmation
        | { type: 'followup'; key: keyof FeatureChecklist; label: string; condition: (c: FeatureChecklist) => boolean }
    > = [{ type: 'select' }]

    let currentStepIdx = 0

    while (true) {
        if (currentStepIdx < 0) return null
        if (currentStepIdx >= steps.length) break

        const step = steps[currentStepIdx]

        // Ensure checklist object is up to date with selection
        checklist = buildChecklist(selectedFeatures)

        switch (step.type) {
            case 'select': {
                const result = await ui.multiselect<string>({
                    message: 'Which features does your app include? (Space to select, Enter to confirm)',
                    options: FEATURE_ITEMS,
                    initialValue: selectedFeatures,
                })
                if (result === null) {
                    currentStepIdx--
                    break
                }
                selectedFeatures = result
                checklist = buildChecklist(selectedFeatures)

                // Re-build steps
                steps.length = 0
                steps.push({ type: 'select' })
                steps.push({ type: 'confirm' })

                // Add follow-ups
                if (checklist.login) {
                    steps.push({
                        type: 'followup',
                        key: 'accountDeletion',
                        label: 'Does your app have an account deletion button? (Apple requires this!)',
                        condition: () => true
                    })
                }
                if (checklist.iap || checklist.subscriptions) {
                    steps.push({
                        type: 'followup',
                        key: 'restorePurchases',
                        label: 'Does your app have a "Restore Purchases" button? (Apple requires this!)',
                        condition: () => true
                    })
                }
                if (checklist.ugc) {
                    steps.push({
                        type: 'followup',
                        key: 'creatorAgeGate',
                        label: 'Do you verify content creators are 13+ (or local minimum age)?',
                        condition: () => true
                    })
                }
                if (checklist.miniApps) {
                    steps.push({
                        type: 'followup',
                        key: 'miniAppsReviewed',
                        label: 'Have all mini app/plugins been individually submitted for Apple review?',
                        condition: () => true
                    })
                }
                if (checklist.euDistribution) {
                    steps.push({
                        type: 'followup',
                        key: 'euTraderDeclared',
                        label: 'Have you declared your trader status in App Store Connect? (EU DSA requirement)',
                        condition: () => true
                    })
                }
                if (checklist.externalPayments) {
                    steps.push({
                        type: 'followup',
                        key: 'externalLinkCompliant',
                        label: 'Do you use StoreKit External Link Account API with Apple\'s disclosure sheet?',
                        condition: () => true
                    })
                }

                currentStepIdx++
                break
            }

            case 'confirm': {
                console.log()
                const selectedLabels = selectedFeatures
                    .map(f => FEATURE_ITEMS.find(i => i.value === f)?.label || f)
                    .join(', ')
                ui.log.info(`Selected: ${selectedLabels || 'None'}`)

                const action = await ui.select<'continue' | 'edit'>({
                    message: 'Continue with these features?',
                    options: [
                        { value: 'continue', label: 'Continue', hint: 'Proceed to follow-up questions' },
                        { value: 'edit', label: 'Edit selection', hint: 'Go back and modify' },
                    ],
                })

                if (action === null || action === 'edit') {
                    // Go back to select
                    currentStepIdx = 0 // Jump back to start
                    break
                }

                currentStepIdx++
                break
            }

            case 'followup': {
                const currentVal = (checklist as any)[step.key] ?? false
                const confirmed = await ui.confirm(step.label, currentVal)

                if (confirmed === null) {
                    currentStepIdx--
                    break
                }

                (checklist as any)[step.key] = confirmed
                currentStepIdx++
                break
            }
        }
    }

    return checklist
}

// ─── Orchestrate All Compliance ──────────────────────────────────────────

export async function collectCompliance(defaults?: Partial<ComplianceData>): Promise<ComplianceData | null> {
    // Track completion of each phase
    const state: {
        ageRating?: { answers: AgeRatingAnswers; rating: string }
        privacy?: PrivacyDeclarations
        checklist?: FeatureChecklist
    } = {}

    while (true) {
        // Show phase selector with progress indicators
        const options: Array<{ value: string; label: string; hint: string }> = [
            {
                value: 'age',
                label: state.ageRating ? chalk.green('1. Age Rating ✓') : '1. Age Rating',
                hint: state.ageRating ? `Rated ${state.ageRating.rating}` : 'Not completed',
            },
            {
                value: 'privacy',
                label: state.privacy ? chalk.green('2. Privacy & Data ✓') : '2. Privacy & Data',
                hint: state.privacy ? 'Completed' : 'Not completed',
            },
            {
                value: 'features',
                label: state.checklist ? chalk.green('3. Features ✓') : '3. Features',
                hint: state.checklist ? 'Completed' : 'Not completed',
            },
        ]

        // Only show Continue when ALL complete
        if (state.ageRating && state.privacy && state.checklist) {
            options.push({
                value: 'continue',
                label: 'Continue to Review',
                hint: 'All sections complete',
            })
        }

        options.push({ value: 'back', label: 'Back', hint: 'Return to app details' })

        const choice = await ui.select<string>({
            message: 'Compliance Information',
            options,
        })

        if (choice === null || choice === 'back') return null
        if (choice === 'continue') {
            return {
                ageRatingAnswers: state.ageRating!.answers,
                ageRating: state.ageRating!.rating,
                privacyDeclarations: state.privacy!,
                checklist: state.checklist!,
            }
        }

        // Call appropriate phase function
        console.log()
        switch (choice) {
            case 'age':
                const ageResult = await collectAgeRating()
                if (ageResult !== null) state.ageRating = ageResult
                console.log()
                break
            case 'privacy':
                const privacyResult = await collectPrivacyData()
                if (privacyResult !== null) state.privacy = privacyResult
                console.log()
                break
            case 'features':
                const featuresResult = await collectFeatureChecklist()
                if (featuresResult !== null) state.checklist = featuresResult
                console.log()
                break
        }
    }
}

// ─── Format compliance data for API submission ───────────────────────────

export function formatComplianceForApi(compliance: ComplianceData): Record<string, any> {
    return {
        age_rating: compliance.ageRatingAnswers,
        age_rating_result: compliance.ageRating,
        privacy_declarations: {
            data: compliance.privacyDeclarations.data,
            tracking: compliance.privacyDeclarations.tracking,
        },
        checklist: compliance.checklist,
    }
}

// ─── Format for display in summary ───────────────────────────────────────

export function formatComplianceSummary(compliance: ComplianceData): string[] {
    const lines: string[] = []

    lines.push(`  Age Rating: ${compliance.ageRating}`)

    // Privacy summary
    const collectedTypes = Object.entries(compliance.privacyDeclarations.data)
        .filter(([_, v]) => v.collected)
        .map(([k, _]) => {
            const typeInfo = PRIVACY_DATA_TYPES.find(t => t.value === k)
            return typeInfo?.label || k
        })

    if (collectedTypes.length > 0) {
        lines.push(`  Privacy:    ${collectedTypes.join(', ')}`)
    } else {
        lines.push(`  Privacy:    No data collected`)
    }

    // Features summary
    const enabledFeatures = Object.entries(compliance.checklist)
        .filter(([_, v]) => v === true)
        .map(([k, _]) => {
            const featureInfo = FEATURE_ITEMS.find(f => f.value === k)
            return featureInfo?.label || k
        })

    if (enabledFeatures.length > 0) {
        lines.push(`  Features:   ${enabledFeatures.join(', ')}`)
    } else {
        lines.push(`  Features:   None selected`)
    }

    return lines
}
