import * as ui from '../ui/interactive.js'
import { subtext } from '../ui/theme.js'

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

export async function collectAppDetails(projectName: string): Promise<AppDetails | null> {
    const skipGate = await ui.select<'fill' | 'skip'>({
        message: 'App Details (you can always add these later on the web)',
        options: [
            { value: 'fill', label: 'Fill in now', hint: 'Name, description, keywords, category' },
            { value: 'skip', label: 'Skip for now', hint: 'Just use the project name' },
        ],
    })

    if (skipGate === null) return null
    if (skipGate === 'skip') {
        return {
            appName: projectName,
            signInRequired: false,
        }
    }

    // App Name (required, pre-filled from project)
    const appName = await ui.text({
        message: 'App Name',
        placeholder: projectName,
        defaultValue: projectName,
        validate: (val) => {
            if (!val?.trim()) return 'App name is required'
        },
    })
    if (appName === null) return null

    // Description (optional)
    const description = await ui.text({
        message: 'Description (press Enter to skip)',
        placeholder: 'Describe your app as it appears in the App Store',
    })
    if (description === null) return null

    // Keywords (optional)
    const keywords = await ui.text({
        message: 'Keywords (press Enter to skip)',
        placeholder: 'Comma-separated, 100 chars max',
        validate: (val) => {
            if (val && val.length > 100) return 'Keywords must be 100 characters or less'
        },
    })
    if (keywords === null) return null

    // Promotional Text (optional)
    const promotionalText = await ui.text({
        message: 'Promotional Text (press Enter to skip)',
        placeholder: 'Short promotional text, 170 chars max',
        validate: (val) => {
            if (val && val.length > 170) return 'Promotional text must be 170 characters or less'
        },
    })
    if (promotionalText === null) return null

    // Category (optional)
    const categoryOptions = [
        { value: '__skip__' as const, label: 'Skip', hint: 'Choose later' },
        ...CATEGORIES.map(c => ({ value: c, label: c })),
    ]
    const category = await ui.select<string>({
        message: 'Primary Category',
        options: categoryOptions,
    })
    if (category === null) return null

    // Support URL (optional)
    const supportUrl = await ui.text({
        message: 'Support URL (press Enter to skip)',
        placeholder: 'https://example.com/support',
    })
    if (supportUrl === null) return null

    // Marketing URL (optional)
    const marketingUrl = await ui.text({
        message: 'Marketing URL (press Enter to skip)',
        placeholder: 'https://example.com',
    })
    if (marketingUrl === null) return null

    // Sign-in Required?
    const signInRequired = await ui.confirm('Does your app require sign-in for review?', false)
    if (signInRequired === null) return null

    let demoUsername: string | undefined
    let demoPassword: string | undefined

    if (signInRequired) {
        const email = await ui.text({
            message: 'Demo Email',
            placeholder: 'test@example.com',
            validate: (val) => {
                if (!val?.trim()) return 'Demo email is required when sign-in is required'
            },
        })
        if (email === null) return null
        demoUsername = email

        const pass = await ui.password({
            message: 'Demo Password',
            validate: (val) => {
                if (!val?.trim()) return 'Demo password is required when sign-in is required'
            },
        })
        if (pass === null) return null
        demoPassword = pass
    }

    return {
        appName: appName.trim(),
        description: description?.trim() || undefined,
        keywords: keywords?.trim() || undefined,
        category: category === '__skip__' ? undefined : category,
        supportUrl: supportUrl?.trim() || undefined,
        promotionalText: promotionalText?.trim() || undefined,
        marketingUrl: marketingUrl?.trim() || undefined,
        signInRequired,
        demoUsername,
        demoPassword,
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
        ui.log.success(`Age Rating: ${rating} (no mature content)`)

        const looksRight = await ui.confirm('Does that look right?', true)
        if (looksRight === null) return null
        if (!looksRight) {
            // Let them go through the detailed flow
            return collectAgeRatingDetailed(defaultAnswers)
        }

        return { answers: defaultAnswers, rating }
    }

    return collectAgeRatingDetailed(defaultAnswers)
}

async function collectAgeRatingDetailed(
    answers: AgeRatingAnswers,
): Promise<{ answers: AgeRatingAnswers; rating: string } | null> {
    // Multiselect: which content types are present?
    const selectedTypes = await ui.multiselect<string>({
        message: 'Which types of content does your app contain? (Space to select, Enter to confirm)',
        options: AGE_RATING_CONTENT_TYPES,
    })
    if (selectedTypes === null) return null

    const updatedAnswers = { ...answers }

    // For each selected type, ask severity
    for (const typeKey of selectedTypes) {
        const typeInfo = AGE_RATING_CONTENT_TYPES.find(t => t.value === typeKey)
        if (!typeInfo) continue

        const severity = await ui.select<'1' | '2'>({
            message: `${typeInfo.label}: how much?`,
            options: [
                { value: '1', label: 'A little', hint: 'Minor/occasional' },
                { value: '2', label: 'A lot', hint: 'Frequent/prominent' },
            ],
        })
        if (severity === null) return null

        ;(updatedAnswers as any)[typeKey] = parseInt(severity)
    }

    // Boolean flags
    const webAccess = await ui.confirm('Can users browse any website in your app? (e.g., in-app browser)', false)
    if (webAccess === null) return null
    updatedAnswers.unrestrictedWebAccess = webAccess

    const madeForKids = await ui.confirm('Is this app designed specifically for kids under 13?', false)
    if (madeForKids === null) return null
    updatedAnswers.madeForKids = madeForKids

    const rating = calculateAgeRating(updatedAnswers)
    ui.log.success(`Age Rating: ${rating}`)

    return { answers: updatedAnswers, rating }
}

// ─── Collect Privacy Data ────────────────────────────────────────────────

export async function collectPrivacyData(): Promise<PrivacyDeclarations | null> {
    ui.log.step(subtext('Step 2 of 3: Privacy & Data'))

    // Gate question
    const collectsData = await ui.confirm('Does your app collect any user data?', false)
    if (collectsData === null) return null

    const emptyData = Object.fromEntries(
        PRIVACY_DATA_TYPES.map(t => [t.value, { collected: false, linked: false }])
    ) as PrivacyDeclarations['data']

    if (!collectsData) {
        return { data: emptyData, tracking: false }
    }

    // Multiselect: which data types are collected?
    const collectedTypes = await ui.multiselect<string>({
        message: 'What data does your app collect? (Space to select, Enter to confirm)',
        options: PRIVACY_DATA_TYPES,
    })
    if (collectedTypes === null) return null

    const data = { ...emptyData }

    // For each collected type, ask if linked to user
    for (const typeKey of collectedTypes) {
        (data as any)[typeKey] = { collected: true, linked: false }

        const linked = await ui.confirm(
            `Can you tie ${PRIVACY_DATA_TYPES.find(t => t.value === typeKey)?.label || typeKey} to a specific person? (e.g., through their account)`,
            false,
        )
        if (linked === null) return null
        ;(data as any)[typeKey].linked = linked
    }

    // Tracking question
    const tracking = await ui.confirm(
        'Does your app use data to track users across other companies\' apps and websites?',
        false,
    )
    if (tracking === null) return null

    return { data, tracking }
}

// ─── Collect Feature Checklist ───────────────────────────────────────────

export async function collectFeatureChecklist(): Promise<FeatureChecklist | null> {
    ui.log.step(subtext('Step 3 of 3: Features'))

    const selectedFeatures = await ui.multiselect<string>({
        message: 'Which features does your app include? (Space to select, Enter to confirm)',
        options: FEATURE_ITEMS,
    })
    if (selectedFeatures === null) return null

    const checklist: FeatureChecklist = {
        ugc: selectedFeatures.includes('ugc'),
        login: selectedFeatures.includes('login'),
        iap: selectedFeatures.includes('iap'),
        subscriptions: selectedFeatures.includes('subscriptions'),
        ads: selectedFeatures.includes('ads'),
        thirdPartyLogin: selectedFeatures.includes('thirdPartyLogin'),
        aiContent: selectedFeatures.includes('aiContent'),
        healthClaims: selectedFeatures.includes('healthClaims'),
        crypto: selectedFeatures.includes('crypto'),
        miniApps: selectedFeatures.includes('miniApps'),
        euDistribution: selectedFeatures.includes('euDistribution'),
        externalPayments: selectedFeatures.includes('externalPayments'),
    }

    // Conditional follow-ups
    if (checklist.login) {
        const hasAccountDeletion = await ui.confirm(
            'Does your app have an account deletion button? (Apple requires this!)',
            false,
        )
        if (hasAccountDeletion === null) return null
        checklist.accountDeletion = hasAccountDeletion
    }

    if (checklist.iap || checklist.subscriptions) {
        const hasRestorePurchases = await ui.confirm(
            'Does your app have a "Restore Purchases" button? (Apple requires this!)',
            false,
        )
        if (hasRestorePurchases === null) return null
        checklist.restorePurchases = hasRestorePurchases
    }

    // Creator age gate (conditional on UGC)
    if (checklist.ugc) {
        const hasCreatorAgeGate = await ui.confirm(
            'Do you verify content creators are 13+ (or local minimum age)?',
            false,
        )
        if (hasCreatorAgeGate === null) return null
        checklist.creatorAgeGate = hasCreatorAgeGate
    }

    // Mini apps individually reviewed (conditional on miniApps)
    if (checklist.miniApps) {
        const miniAppsReviewed = await ui.confirm(
            'Have all mini apps/plugins been individually submitted for Apple review?',
            false,
        )
        if (miniAppsReviewed === null) return null
        checklist.miniAppsReviewed = miniAppsReviewed
    }

    // EU trader status (conditional on EU distribution)
    if (checklist.euDistribution) {
        const euTraderDeclared = await ui.confirm(
            'Have you declared your trader status in App Store Connect? (EU DSA requirement)',
            false,
        )
        if (euTraderDeclared === null) return null
        checklist.euTraderDeclared = euTraderDeclared
    }

    // External payment link compliance (conditional on external payments)
    if (checklist.externalPayments) {
        const externalLinkCompliant = await ui.confirm(
            'Do you use StoreKit External Link Account API with Apple\'s disclosure sheet?',
            false,
        )
        if (externalLinkCompliant === null) return null
        checklist.externalLinkCompliant = externalLinkCompliant
    }

    return checklist
}

// ─── Orchestrate All Compliance ──────────────────────────────────────────

export async function collectCompliance(): Promise<ComplianceData | null> {
    // Age Rating
    const ageResult = await collectAgeRating()
    if (ageResult === null) return null

    // Privacy Data
    const privacyResult = await collectPrivacyData()
    if (privacyResult === null) return null

    // Feature Checklist
    const checklistResult = await collectFeatureChecklist()
    if (checklistResult === null) return null

    return {
        ageRatingAnswers: ageResult.answers,
        ageRating: ageResult.rating,
        privacyDeclarations: privacyResult,
        checklist: checklistResult,
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
