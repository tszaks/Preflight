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

export async function collectAppDetails(projectName: string, defaults?: Partial<AppDetails>): Promise<AppDetails | null> {
    const defaultName = defaults?.appName || projectName

    let details: AppDetails | null = null
    let confirmed = false

    while (!confirmed) {
        // App Name (required, pre-filled from project or draft)
        const appName = await ui.text({
            message: 'App Name',
            placeholder: defaultName,
            defaultValue: details?.appName || defaultName,
            validate: (val) => {
                if (!val?.trim()) return 'App name is required'
            },
        })
        if (appName === null) return null

        // Description (optional)
        const description = await ui.text({
            message: 'Description (press Enter to skip)',
            placeholder: 'Describe your app as it appears in the App Store',
            defaultValue: details?.description || (defaults?.description ? defaults.description : ''),
        })
        if (description === null) return null

        // Keywords (optional)
        const keywords = await ui.text({
            message: 'Keywords (press Enter to skip)',
            placeholder: 'Comma-separated, 100 chars max',
            defaultValue: details?.keywords || (defaults?.keywords ? defaults.keywords : ''),
            validate: (val) => {
                if (val && val.length > 100) return 'Keywords must be 100 characters or less'
            },
        })
        if (keywords === null) return null

        // Promotional Text (optional)
        const promotionalText = await ui.text({
            message: 'Promotional Text (press Enter to skip)',
            placeholder: 'Short promotional text, 170 chars max',
            defaultValue: details?.promotionalText || (defaults?.promotionalText ? defaults.promotionalText : ''),
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
        const defaultCategory: string = details?.category || (defaults?.category ? defaults.category : '__skip__')
        const category: string | null = await ui.select<string>({
            message: 'Primary Category',
            options: categoryOptions,
            initialValue: defaultCategory,
        })
        if (category === null) return null

        // Support URL (optional)
        const supportUrl = await ui.text({
            message: 'Support URL (press Enter to skip)',
            placeholder: 'https://example.com/support',
            defaultValue: details?.supportUrl || (defaults?.supportUrl ? defaults.supportUrl : ''),
        })
        if (supportUrl === null) return null

        // Marketing URL (optional)
        const marketingUrl = await ui.text({
            message: 'Marketing URL (press Enter to skip)',
            placeholder: 'https://example.com',
            defaultValue: details?.marketingUrl || (defaults?.marketingUrl ? defaults.marketingUrl : ''),
        })
        if (marketingUrl === null) return null

        // Sign-in Required?
        const signInRequired = await ui.confirm(
            'Does your app require sign-in for review?',
            details?.signInRequired ?? (defaults?.signInRequired ?? false),
        )
        if (signInRequired === null) return null

        let demoUsername: string | undefined
        let demoPassword: string | undefined

        if (signInRequired) {
            const email = await ui.text({
                message: 'Demo Email',
                placeholder: 'test@example.com',
                defaultValue: details?.demoUsername || (defaults?.demoUsername ? defaults.demoUsername : ''),
                validate: (val) => {
                    if (!val?.trim()) return 'Demo email is required when sign-in is required'
                },
            })
            if (email === null) return null
            demoUsername = email

            const pass = await ui.password({
                message: 'Demo Password',
                defaultValue: details?.demoPassword || (defaults?.demoPassword ? defaults.demoPassword : ''),
                validate: (val) => {
                    if (!val?.trim()) return 'Demo password is required when sign-in is required'
                },
            })
            if (pass === null) return null
            demoPassword = pass
        }

        details = {
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

        // Show summary and ask to confirm or edit
        console.log()
        const summaryLines = [
            `App Name: ${details.appName}`,
            `Description: ${details.description || '[empty]'}`,
            `Keywords: ${details.keywords || '[empty]'}`,
            `Promotional Text: ${details.promotionalText || '[empty]'}`,
            `Category: ${details.category || '[empty]'}`,
            `Support URL: ${details.supportUrl || '[empty]'}`,
            `Marketing URL: ${details.marketingUrl || '[empty]'}`,
            `Sign-in Required: ${details.signInRequired ? 'Yes' : 'No'}`,
            ...(details.signInRequired ? [`Demo Email: ${details.demoUsername || '[empty]'}`] : []),
        ]
        ui.note(summaryLines.join('\n'), 'App Details Summary')

        const action = await ui.select<'continue' | 'edit'>({
            message: 'Review app details',
            options: [
                { value: 'continue', label: 'Continue to Compliance', hint: 'Looks good' },
                { value: 'edit', label: 'Edit a field', hint: 'Make changes' },
            ],
        })

        if (action === null) return null
        if (action === 'continue') {
            confirmed = true
        } else {
            // Show field selector
            const fieldOptions = [
                { value: 'appName', label: `App Name: ${details.appName}` },
                { value: 'description', label: `Description: ${details.description || '[empty]'}` },
                { value: 'keywords', label: `Keywords: ${details.keywords || '[empty]'}` },
                { value: 'promotionalText', label: `Promotional Text: ${details.promotionalText || '[empty]'}` },
                { value: 'category', label: `Category: ${details.category || '[empty]'}` },
                { value: 'supportUrl', label: `Support URL: ${details.supportUrl || '[empty]'}` },
                { value: 'marketingUrl', label: `Marketing URL: ${details.marketingUrl || '[empty]'}` },
                { value: 'signInRequired', label: `Sign-in Required: ${details.signInRequired ? 'Yes' : 'No'}` },
                ...(details.signInRequired ? [
                    { value: 'demoUsername', label: `Demo Email: ${details.demoUsername || '[empty]'}` },
                    { value: 'demoPassword', label: 'Demo Password: [hidden]' },
                ] : []),
                { value: 'back', label: 'Back to summary' },
            ]

            const fieldToEdit = await ui.select<string>({
                message: 'Which field to edit?',
                options: fieldOptions,
            })

            if (fieldToEdit === null || fieldToEdit === 'back') continue

            // Re-prompt just that field
            console.log()
            switch (fieldToEdit) {
                case 'appName':
                    const newName = await ui.text({
                        message: 'App Name',
                        defaultValue: details.appName,
                        validate: (val) => {
                            if (!val?.trim()) return 'App name is required'
                        },
                    })
                    if (newName !== null) details.appName = newName.trim()
                    break
                case 'description':
                    const newDesc = await ui.text({
                        message: 'Description',
                        defaultValue: details.description || '',
                    })
                    if (newDesc !== null) details.description = newDesc.trim() || undefined
                    break
                case 'keywords':
                    const newKeywords = await ui.text({
                        message: 'Keywords',
                        defaultValue: details.keywords || '',
                        validate: (val) => {
                            if (val && val.length > 100) return 'Keywords must be 100 characters or less'
                        },
                    })
                    if (newKeywords !== null) details.keywords = newKeywords.trim() || undefined
                    break
                case 'promotionalText':
                    const newPromo = await ui.text({
                        message: 'Promotional Text',
                        defaultValue: details.promotionalText || '',
                        validate: (val) => {
                            if (val && val.length > 170) return 'Promotional text must be 170 characters or less'
                        },
                    })
                    if (newPromo !== null) details.promotionalText = newPromo.trim() || undefined
                    break
                case 'category':
                    const newCategory = await ui.select<string>({
                        message: 'Primary Category',
                        options: [
                            { value: '__skip__', label: 'Skip', hint: 'Choose later' },
                            ...CATEGORIES.map(c => ({ value: c, label: c })),
                        ],
                        initialValue: details.category || '__skip__',
                    })
                    if (newCategory !== null) {
                        details.category = newCategory === '__skip__' ? undefined : newCategory
                    }
                    break
                case 'supportUrl':
                    const newSupport = await ui.text({
                        message: 'Support URL',
                        defaultValue: details.supportUrl || '',
                    })
                    if (newSupport !== null) details.supportUrl = newSupport.trim() || undefined
                    break
                case 'marketingUrl':
                    const newMarketing = await ui.text({
                        message: 'Marketing URL',
                        defaultValue: details.marketingUrl || '',
                    })
                    if (newMarketing !== null) details.marketingUrl = newMarketing.trim() || undefined
                    break
                case 'signInRequired':
                    const newSignIn = await ui.confirm(
                        'Does your app require sign-in for review?',
                        details.signInRequired,
                    )
                    if (newSignIn !== null) {
                        details.signInRequired = newSignIn
                        // Clear credentials if turning off sign-in
                        if (!newSignIn) {
                            details.demoUsername = undefined
                            details.demoPassword = undefined
                        }
                    }
                    break
                case 'demoUsername':
                    const newEmail = await ui.text({
                        message: 'Demo Email',
                        defaultValue: details.demoUsername || '',
                        validate: (val) => {
                            if (!val?.trim()) return 'Demo email is required'
                        },
                    })
                    if (newEmail !== null) details.demoUsername = newEmail.trim()
                    break
                case 'demoPassword':
                    const newPass = await ui.password({
                        message: 'Demo Password',
                        validate: (val) => {
                            if (!val?.trim()) return 'Demo password is required'
                        },
                    })
                    if (newPass !== null) details.demoPassword = newPass
                    break
            }
            console.log()
        }
    }

    return details
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

            ; (updatedAnswers as any)[typeKey] = parseInt(severity)
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
            ; (data as any)[typeKey].linked = linked
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

    let selectedFeatures: string[] = []
    let checklist: FeatureChecklist | null = null
    let confirmed = false

    while (!confirmed) {
        const result = await ui.multiselect<string>({
            message: 'Which features does your app include? (Space to select, Enter to confirm)',
            options: FEATURE_ITEMS,
            initialValue: selectedFeatures,
        })
        if (result === null) return null

        selectedFeatures = result

        // Build checklist from selection
        checklist = {
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

        // Show summary of selected features
        console.log()
        const selectedLabels = selectedFeatures
            .map(f => FEATURE_ITEMS.find(i => i.value === f)?.label || f)
            .join(', ')
        ui.log.info(`Selected: ${selectedLabels || 'None'}`)

        // Confirm or edit
        const action = await ui.select<'continue' | 'edit'>({
            message: 'Continue with these features?',
            options: [
                { value: 'continue', label: 'Continue', hint: 'Proceed to follow-up questions' },
                { value: 'edit', label: 'Edit selection', hint: 'Go back and modify' },
            ],
        })

        if (action === null) return null
        if (action === 'continue') {
            confirmed = true
            break
        }
        console.log()
    }

    if (!checklist) return null

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
            'Have all mini app/plugins been individually submitted for Apple review?',
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
                label: `1. Age Rating ${state.ageRating ? '✓' : ''}`,
                hint: state.ageRating ? `Rated ${state.ageRating.rating}` : 'Not completed',
            },
            {
                value: 'privacy',
                label: `2. Privacy & Data ${state.privacy ? '✓' : ''}`,
                hint: state.privacy ? 'Completed' : 'Not completed',
            },
            {
                value: 'features',
                label: `3. Features ${state.checklist ? '✓' : ''}`,
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
