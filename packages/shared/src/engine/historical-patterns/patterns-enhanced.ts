/**
 * Enhanced rejection patterns with matching criteria.
 *
 * Extends the original knowledge-base patterns with programmatic matching:
 * - Category filters (Finance, Health, Social, etc.)
 * - Keyword triggers (searched in app name, subtitle, description, keywords)
 * - Feature flag requirements (has_iap, has_ugc, sign_in_required, etc.)
 *
 * Sources: r/iOSProgramming, Apple Developer Forums, Stack Overflow [app-store-rejection],
 * Apple's published App Review Guidelines and App Store Connect documentation.
 */

export interface EnhancedRejectionPattern {
    id: string;
    guideline: string;
    /** Maps to CheckCategory enum */
    category: string;
    title: string;
    /** Human-readable description of what triggers this rejection */
    trigger: string;
    fix: string;
    /** Matching criteria for automated pattern scoring */
    match?: {
        /** App Store categories this applies to (lowercase). Empty/undefined = all categories. */
        categories?: string[];
        /** Keywords searched in name, subtitle, description, keywords (case-insensitive) */
        keywords?: string[];
        /** Feature flags from HardRulesInput that must be true to match */
        features_required?: string[];
        /** Feature flags that must be false/null to match */
        features_absent?: string[];
        /** Minimum number of criteria (keywords + features) that must match. Default 1. */
        min_matches?: number;
        /** Base confidence score for this pattern (40-70). Default 50. */
        base_confidence?: number;
    };
}

export const ENHANCED_PATTERNS: EnhancedRejectionPattern[] = [
    // ============================================================
    // METADATA PATTERNS (from original knowledge-base + expanded)
    // ============================================================
    {
        id: 'meta-price-in-name',
        guideline: '2.3.7',
        category: 'metadata',
        title: 'Price in app name',
        trigger: 'Including "Free", "$0.99", pricing info, or "Sale" in the app name or subtitle',
        fix: 'Remove all pricing references from the app name and subtitle. Use the description or promotional text instead.',
        match: {
            keywords: ['free', 'sale', '$', 'discount', 'promo', 'offer', 'cheap'],
            base_confidence: 55,
        },
    },
    {
        id: 'meta-platform-in-name',
        guideline: '2.3.10',
        category: 'metadata',
        title: 'Platform reference in name',
        trigger: 'Including "iOS", "iPhone", "iPad", "Apple Watch", or "for iOS" in the app name',
        fix: 'Remove platform references. Apple already shows what platforms your app supports.',
        match: {
            keywords: ['for ios', 'for iphone', 'for ipad', 'apple watch', 'ios app'],
            base_confidence: 60,
        },
    },
    {
        id: 'meta-keyword-stuffing',
        guideline: '2.3.7',
        category: 'metadata',
        title: 'Keyword stuffing in name/subtitle',
        trigger: 'Cramming unrelated keywords, competitor names, or category names into the title/subtitle',
        fix: 'Keep your app name focused and brandable. Use the keywords field for discoverability terms.',
        // No auto-match: requires NLP-level analysis
    },
    {
        id: 'meta-misleading-description',
        guideline: '2.3',
        category: 'metadata',
        title: 'Misleading description',
        trigger: 'Description mentions features not actually present in the app, or overpromises capabilities',
        fix: 'Ensure every feature mentioned in the description is accessible in the shipped version.',
        match: {
            keywords: ['coming soon', 'in development', 'future update', 'planned feature', 'will be available'],
            base_confidence: 60,
        },
    },
    {
        id: 'meta-placeholder-content',
        guideline: '2.1',
        category: 'metadata',
        title: 'Placeholder/test content',
        trigger: 'Lorem ipsum, TODO, "coming soon" features, test data visible in screenshots',
        fix: 'Replace all placeholder content with final copy. Remove any test/debug UI.',
        match: {
            keywords: ['lorem ipsum', 'todo', 'placeholder', 'test data', 'sample app'],
            base_confidence: 65,
        },
    },
    {
        id: 'meta-competitor-mention',
        guideline: '2.3',
        category: 'metadata',
        title: 'Competitor name in metadata',
        trigger: 'Mentioning competitor app names in title, subtitle, keywords, or description',
        fix: "Remove competitor references. Describe your own app's unique value instead.",
        // No auto-match: would need a competitor name database
    },
    {
        id: 'meta-accessibility-labels-inaccurate',
        guideline: 'ASC-Accessibility-Nutrition-Labels',
        category: 'metadata',
        title: 'Accessibility labels do not match app support',
        trigger: 'App Store Connect Accessibility Nutrition Label responses claim support that users cannot complete across the app\'s common tasks, or the responses are not kept current after app changes',
        fix: 'Audit common tasks for each supported device family before publishing accessibility labels. Only claim VoiceOver, Voice Control, Larger Text, Dark Interface, Differentiate Without Color Alone, Sufficient Contrast, Reduced Motion, Captions, or Audio Descriptions support when Apple\'s criteria are met, and update labels when app behavior changes.',
        match: {
            keywords: [
                'accessibility nutrition label', 'accessibility labels', 'voiceover',
                'voice control', 'larger text', 'dynamic type', 'captions',
                'reduced motion', 'sufficient contrast',
            ],
            base_confidence: 45,
        },
    },

    // ============================================================
    // SCREENSHOT PATTERNS
    // ============================================================
    {
        id: 'screen-wrong-device',
        guideline: '2.3.3',
        category: 'screenshots',
        title: 'Wrong device frame',
        trigger: 'Using iPhone frames for iPad screenshots or vice versa, or outdated device frames',
        fix: 'Use current device frames matching the screenshot dimensions, or no frames at all.',
        // No auto-match: requires image analysis (handled by Screenshot AI)
    },
    {
        id: 'screen-fake-ui',
        guideline: '2.3.3',
        category: 'screenshots',
        title: 'Fake UI elements',
        trigger: "Screenshots showing UI that doesn't exist in the app, fabricated notifications, or fake system UI",
        fix: "Only show actual app screenshots. Marketing overlays are fine but don't fake system elements.",
        // No auto-match: requires image analysis
    },

    // ============================================================
    // PRIVACY PATTERNS
    // ============================================================
    {
        id: 'privacy-no-policy',
        guideline: '5.1.1',
        category: 'privacy_manifest',
        title: 'Missing or unreachable privacy policy',
        trigger: 'Privacy policy URL returns 404, is a placeholder, or is missing entirely',
        fix: 'Provide a working HTTPS URL to a privacy policy that covers all data your app collects.',
        // Handled by hard rules (URL reachability check)
    },
    {
        id: 'privacy-missing-manifest',
        guideline: '5.1',
        category: 'privacy_manifest',
        title: 'Missing privacy manifest',
        trigger: 'App or bundled third-party SDK uses required-reason APIs without the required PrivacyInfo.xcprivacy manifest in the owning app, framework, or dynamic library bundle',
        fix: 'Add a PrivacyInfo.xcprivacy file for your app code, and update or replace third-party SDKs so each SDK bundle declares its own required-reason API usage with valid reason codes.',
        // Handled by hard rules
    },
    {
        id: 'privacy-required-reason-api',
        guideline: '5.1',
        category: 'privacy_manifest',
        title: 'Required-reason API not declared',
        trigger: 'Binary uses required-reason APIs (UserDefaults, file timestamps, disk space) without manifest declarations',
        fix: 'Declare each required-reason API type with valid reason codes in PrivacyInfo.xcprivacy.',
        // Handled by hard rules / binary scan
    },
    {
        id: 'privacy-tracking-without-att',
        guideline: '5.1.2',
        category: 'privacy_manifest',
        title: 'Tracking declared without ATT',
        trigger: 'Privacy manifest declares tracking but ATT usage or NSUserTrackingUsageDescription is missing',
        fix: 'Implement AppTrackingTransparency and provide NSUserTrackingUsageDescription.',
        // Handled by hard rules / binary scan
    },

    // ============================================================
    // INFO.PLIST PATTERNS
    // ============================================================
    {
        id: 'plist-missing-usage',
        guideline: '5.1.1',
        category: 'info_plist',
        title: 'Missing usage description',
        trigger: 'App requests permission (camera, photos, location, etc.) without a usage description string',
        fix: 'Add a clear, specific usage description for every permission your app requests.',
        // Handled by hard rules
    },
    {
        id: 'plist-vague-usage',
        guideline: '5.1.1',
        category: 'info_plist',
        title: 'Vague usage description',
        trigger: 'Usage description is generic ("This app needs access") without explaining why specifically',
        fix: 'Explain the specific feature that needs the permission. E.g., "Take photos for your profile picture".',
        // Handled by hard rules
    },
    {
        id: 'plist-background-mode',
        guideline: '2.5.4',
        category: 'info_plist',
        title: 'Unjustified background mode',
        trigger: "Declaring background modes (audio, location, fetch) that the app doesn't actually use",
        fix: 'Only declare background modes your app actively uses. Remove unused UIBackgroundModes entries.',
        // Handled by hard rules
    },
    {
        id: 'plist-ats-exceptions',
        guideline: '2.5.1',
        category: 'info_plist',
        title: 'ATS exceptions too broad',
        trigger: 'NSAllowsArbitraryLoads or insecure ATS exception domains are enabled',
        fix: 'Use HTTPS by default and scope ATS exceptions to specific domains only when required.',
        // Handled by hard rules
    },
    {
        id: 'plist-required-capabilities',
        guideline: '2.1',
        category: 'info_plist',
        title: 'Invalid UIRequiredDeviceCapabilities',
        trigger: 'UIRequiredDeviceCapabilities is invalid, empty, or requires legacy hardware',
        fix: 'Use valid capability keys and avoid legacy architecture requirements.',
        // Handled by hard rules
    },
    {
        id: 'plist-att-usage-description',
        guideline: '5.1.2',
        category: 'info_plist',
        title: 'Missing NSUserTrackingUsageDescription',
        trigger: 'App Tracking Transparency APIs are used without a purpose string',
        fix: 'Add NSUserTrackingUsageDescription with a clear explanation for users.',
        // Handled by hard rules / binary scan
    },
    {
        id: 'plist-query-schemes',
        guideline: '2.1',
        category: 'info_plist',
        title: 'Invalid LSApplicationQueriesSchemes',
        trigger: 'LSApplicationQueriesSchemes contains invalid, duplicate, or placeholder URL schemes',
        fix: 'Use valid URL scheme strings and remove placeholders or duplicates.',
        // Handled by hard rules
    },

    // ============================================================
    // URL PATTERNS
    // ============================================================
    {
        id: 'url-not-reachable',
        guideline: '2.1',
        category: 'urls',
        title: 'Unreachable URL',
        trigger: 'Privacy policy, support, or marketing URL returns error, times out, or is not HTTPS',
        fix: 'Ensure all URLs are live, HTTPS, and return a 200 status code. Test them before submission.',
        // Handled by hard rules
    },
    {
        id: 'url-placeholder',
        guideline: '2.1',
        category: 'urls',
        title: 'Placeholder URL',
        trigger: 'URLs pointing to example.com, localhost, placeholder pages, or "under construction" pages',
        fix: 'Replace with real, live URLs containing actual content relevant to your app.',
        // Handled by hard rules
    },
    {
        id: 'url-associated-domains',
        guideline: '2.1',
        category: 'urls',
        title: 'Associated domains missing AASA file',
        trigger: 'Associated domains are declared but the Apple App Site Association file is missing or invalid',
        fix: 'Host a valid AASA file at /.well-known/apple-app-site-association for each domain.',
        // Handled by hard rules
    },

    // ============================================================
    // CONTENT POLICY PATTERNS (from original + expanded)
    // ============================================================
    {
        id: 'content-wrong-rating',
        guideline: '2.3',
        category: 'content_policy',
        title: 'Incorrect age rating',
        trigger: "App content doesn't match the selected age rating (e.g., mature content with 4+ rating)",
        fix: 'Select an age rating that accurately reflects your app\'s content and keep the App Store Connect content descriptors current, including in-app controls, capabilities, medical or wellness topics, violent themes, and any sensitive content surfaced by AI assistants or chatbot functionality. Current global ratings are 4+, 9+, 13+, 16+, and 18+, with additional region-specific values in some storefronts such as Australia, Vietnam, and Korea. When in doubt, rate higher.',
        // No simple auto-match
    },
    {
        id: 'content-ugc-no-moderation',
        guideline: '1.2',
        category: 'content_policy',
        title: 'UGC without moderation',
        trigger: 'App has user-generated content without content filtering, reporting, or blocking mechanisms',
        fix: 'Implement content moderation: filtering, user reporting, blocking, and published contact info.',
        match: {
            features_required: ['has_ugc'],
            features_absent: ['has_ugc_moderation'],
            base_confidence: 65,
        },
    },
    {
        id: 'content-medical-disclaimer',
        guideline: '1.4',
        category: 'content_policy',
        title: 'Medical claims without disclaimer',
        trigger: 'Health/fitness app making medical claims without appropriate disclaimers',
        fix: 'Add clear disclaimers that the app is not a medical device and doesn\'t replace professional advice.',
        match: {
            features_required: ['makes_health_claims'],
            features_absent: ['has_health_disclaimers'],
            base_confidence: 60,
        },
    },
    {
        id: 'biz-external-purchase',
        guideline: '3.1.1',
        category: 'content_policy',
        title: 'External purchase for digital goods',
        trigger: "App directs users to purchase digital content/subscriptions outside of In-App Purchase without qualifying for and implementing Apple's regional external-purchase requirements",
        fix: "Use Apple In-App Purchase unless a regional exception applies. For permitted storefronts, implement the required StoreKit external-purchase entitlement/API, disclosure sheet, eligibility checks, review-note details, transaction reporting, and child-safety requirements. Japan support applies to iOS 26.2 or later and Brazil support applies to iOS 26.5 or later. Current Apple Developer Program members must accept the updated agreement terms for Brazil options by July 6, 2026. In Japan and Brazil, use parental gates or consent where required, call StoreKit canMakePayments before purchase or payment-information flows, and follow Apple transaction reporting deadlines.",
        match: {
            features_required: ['sells_digital_outside_iap'],
            base_confidence: 70,
        },
    },
    {
        id: 'biz-subscription-products-separate-groups',
        guideline: '3.1.2',
        category: 'content_policy',
        title: 'Subscription variations split across groups',
        trigger: 'Auto-renewable subscription durations, prices, or tiers for the same service are configured as separate subscription groups instead of products or levels within one group',
        fix: 'Put monthly, annual, trial, and tier variations for the same subscription service in the same App Store Connect subscription group. Use separate groups only for independent services a customer can hold at the same time, and make sure the reviewed app version exposes the submitted products.',
        match: {
            features_required: ['has_subscriptions'],
            keywords: ['subscription group', 'monthly', 'annual', 'yearly', 'tier', 'upgrade', 'downgrade', 'crossgrade'],
            min_matches: 2,
            base_confidence: 55,
        },
    },
    {
        id: 'biz-brazil-betting-license',
        guideline: 'ASC-Brazil-Betting-License',
        category: 'content_policy',
        title: 'Brazil fixed-odds betting license missing',
        trigger: 'App appears to offer fixed-odds betting or real-money wagering that may need Brazil SPA license documentation',
        fix: 'If distributing fixed-odds betting in Brazil, submit a new app version with SPA license details in App Review notes and attach supporting documents. Keep age rating answers and gambling-risk disclosures accurate.',
        match: {
            categories: ['games', 'sports', 'entertainment'],
            keywords: ['fixed odds', 'fixed-odds', 'betting', 'sportsbook', 'wager', 'real money gambling', 'brazil'],
            min_matches: 2,
            base_confidence: 50,
        },
    },
    {
        id: 'biz-minimum-functionality',
        guideline: '4.2',
        category: 'content_policy',
        title: 'Insufficient functionality',
        trigger: 'App is essentially a web wrapper, has minimal native features, or provides little value',
        fix: 'Add meaningful native functionality. The app should provide value beyond what a website offers.',
        match: {
            keywords: ['webview', 'web view', 'wrapper', 'hybrid app', 'website app'],
            base_confidence: 50,
        },
    },
    {
        id: 'biz-low-value-saturated-category',
        guideline: '4.3(b)',
        category: 'content_policy',
        title: 'Low-value app in saturated category',
        trigger: 'App appears to be in a saturated category Apple calls out for indistinguishable or low-effort submissions',
        fix: 'Make the differentiated value obvious in the app, first screenshots, and description. Avoid template clones, thin variants, and repeated submissions of low-effort apps.',
        match: {
            keywords: [
                'dating', 'flashlight', 'sound effects', 'wallpaper', 'simple timer',
                'fortune telling', 'drinking game', 'kama sutra', 'fart', 'burp',
            ],
            base_confidence: 55,
        },
    },
    {
        id: 'content-live-activities-spam',
        guideline: '4.5.3',
        category: 'content_policy',
        title: 'Live Activities or Apple services used for spam',
        trigger: 'App describes promotional, unsolicited, spam-like, or phishing-like messaging through Live Activities, notifications, Game Center, or other Apple services',
        fix: 'Use Apple services only for user-requested, app-relevant updates. Remove promotional, phishing-like, or unsolicited messaging from Live Activities and notification surfaces.',
        match: {
            keywords: [
                'live activities', 'live activity', 'push notifications', 'game center',
                'promotion', 'promotional', 'marketing notification', 'unsolicited',
                'phishing', 'spam',
            ],
            base_confidence: 50,
        },
    },

    // ============================================================
    // NEW: FINANCE-SPECIFIC PATTERNS
    // ============================================================
    {
        id: 'finance-investment-advice',
        guideline: '2.3',
        category: 'content_policy',
        title: 'Finance app lacking disclaimers',
        trigger: 'Finance apps mentioning investment, trading, or financial advice without disclaimers',
        fix: 'Add clear disclaimers that the app does not provide financial advice. Include risk disclosures.',
        match: {
            categories: ['finance', 'business'],
            keywords: ['invest', 'trading', 'stock', 'portfolio', 'financial advice', 'returns', 'wealth'],
            base_confidence: 50,
        },
    },
    {
        id: 'finance-crypto-compliance',
        guideline: '3.1.5(b)',
        category: 'content_policy',
        title: 'Cryptocurrency regulatory compliance',
        trigger: 'Apps facilitating cryptocurrency exchange or wallet functionality',
        fix: "Ensure compliance with all local financial regulations and Apple's cryptocurrency guidelines.",
        match: {
            categories: ['finance'],
            keywords: ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'wallet', 'defi', 'nft', 'token'],
            base_confidence: 55,
        },
    },
    {
        id: 'finance-subscription-iap',
        guideline: '3.1.1',
        category: 'content_policy',
        title: 'Finance app subscription via IAP',
        trigger: 'Finance apps with premium features must use Apple IAP for subscriptions unless a regional external-purchase exception applies',
        fix: 'Ensure digital subscriptions are offered through In-App Purchase unless a regional external-purchase exception applies and is fully implemented. Physical goods/services are exempt.',
        match: {
            categories: ['finance'],
            features_required: ['has_subscriptions'],
            base_confidence: 45,
        },
    },
    {
        id: 'finance-account-deletion',
        guideline: '5.1.1',
        category: 'content_policy',
        title: 'Account deletion requirement for finance apps',
        trigger: 'Finance apps with accounts must provide account deletion (extra scrutiny due to data sensitivity)',
        fix: 'Implement a clear account deletion option in settings. This must delete server-side data, not just local.',
        match: {
            categories: ['finance'],
            features_required: ['sign_in_required'],
            features_absent: ['has_account_deletion'],
            base_confidence: 60,
        },
    },

    // ============================================================
    // NEW: HEALTH/FITNESS PATTERNS
    // ============================================================
    {
        id: 'health-medical-device',
        guideline: '1.4.1',
        category: 'content_policy',
        title: 'Medical device classification risk',
        trigger: 'Health apps that diagnose, treat, or monitor medical conditions may require FDA clearance',
        fix: 'If your app diagnoses or treats conditions, consult regulatory guidelines. Add "not a medical device" disclaimers.',
        match: {
            categories: ['health-fitness', 'medical'],
            keywords: ['diagnos', 'treatment', 'blood pressure', 'heart rate monitor', 'glucose', 'medical'],
            base_confidence: 50,
        },
    },
    {
        id: 'health-regulated-medical-device-status',
        guideline: 'ASC-Regulated-Medical-Device',
        category: 'content_policy',
        title: 'Regulated medical device status',
        trigger: 'Health & Fitness or Medical apps distributed in the EEA, UK, or U.S. may need to provide regulated medical device status in App Store Connect',
        fix: 'If the app qualifies as a regulated medical device, provide the status and regulatory details in App Store Connect. If it does not qualify, select No. Existing qualifying apps must declare by early 2027 to keep submitting updates.',
        match: {
            categories: ['health-fitness', 'medical'],
            keywords: ['diagnos', 'treatment', 'clinical', 'medical device', 'patient', 'monitor'],
            base_confidence: 45,
        },
    },
    {
        id: 'health-data-sensitivity',
        guideline: '5.1.2',
        category: 'content_policy',
        title: 'Health data privacy requirements',
        trigger: 'Health apps collecting sensitive data need extra privacy protections',
        fix: 'Declare health data collection in your privacy manifest. Encrypt health data at rest and in transit.',
        match: {
            categories: ['health-fitness', 'medical'],
            keywords: ['health data', 'medical record', 'patient', 'symptom', 'prescription', 'mental health'],
            base_confidence: 50,
        },
    },
    {
        id: 'health-fitness-claims',
        guideline: '1.4',
        category: 'content_policy',
        title: 'Unsubstantiated fitness claims',
        trigger: 'Fitness apps claiming guaranteed results ("Lose 10 lbs in a week")',
        fix: 'Avoid specific outcome promises. Use language like "may help" or "designed to support".',
        match: {
            categories: ['health-fitness'],
            keywords: ['guaranteed', 'lose weight', 'burn fat', 'cure', 'heal', 'miracle'],
            base_confidence: 55,
        },
    },

    // ============================================================
    // NEW: SOCIAL/UGC PATTERNS
    // ============================================================
    {
        id: 'social-coppa',
        guideline: '1.3',
        category: 'content_policy',
        title: 'COPPA compliance for kids content',
        trigger: 'Social apps with content accessible by children under 13 must comply with COPPA',
        fix: 'Implement age gating or ensure COPPA-compliant data collection. Consider the Kids Category guidelines.',
        match: {
            categories: ['social-networking', 'education'],
            keywords: ['kids', 'children', 'teens', 'young', 'school', 'student'],
            features_required: ['has_ugc'],
            min_matches: 2,
            base_confidence: 50,
        },
    },
    {
        id: 'social-blocking-reporting',
        guideline: '1.2',
        category: 'content_policy',
        title: 'Missing block/report functionality',
        trigger: 'Social apps must provide mechanisms to block and report abusive users',
        fix: 'Add user blocking, content reporting, and a way to contact you for abuse reports.',
        match: {
            features_required: ['has_ugc'],
            keywords: ['social', 'chat', 'message', 'community', 'forum', 'comment'],
            base_confidence: 55,
        },
    },
    {
        id: 'content-social-media-time-allowance',
        guideline: 'ASC-Time-Allowances',
        category: 'content_policy',
        title: 'Social media capabilities declaration required',
        trigger: 'Apps with social feeds or similar user-generated content discovery surfaces should answer the App Store Connect social media capabilities question starting July 2026 and must declare social media capabilities for Time Allowances before submitting updates starting September 2026',
        fix: 'Update the App Store Connect age rating questionnaire to declare social media capabilities. If social features are disabled for users under 13, use at least the Declared Age Range API to check age ranges.',
        match: {
            categories: ['social-networking'],
            keywords: ['feed', 'follow', 'followers', 'post', 'comment', 'share', 'community', 'profile'],
            min_matches: 1,
            base_confidence: 55,
        },
    },
    {
        id: 'content-australia-social-under16',
        guideline: 'ASC-Australia-Social-Media',
        category: 'content_policy',
        title: 'Australia social media under-16 access not addressed',
        trigger: 'Social media platform operates in Australia but does not prevent users under 16 from having accounts or disclose age assurance and age suitability details',
        fix: 'If the Australian social media law applies, block under-16 account access for Australia, monitor new signups, use the Declared Age Range API or another age-assurance method where appropriate, and document age restrictions through App Store metadata or an Age Suitability URL.',
        match: {
            categories: ['social-networking'],
            keywords: ['australia', 'under 16', 'under-16', 'age assurance', 'declared age range', 'social media'],
            features_required: ['has_ugc'],
            min_matches: 2,
            base_confidence: 55,
        },
    },
    {
        id: 'content-regional-age-assurance',
        guideline: 'ASC-Regional-Age-Assurance',
        category: 'content_policy',
        title: 'Regional age assurance obligations not addressed',
        trigger: 'Apps with age-sensitive social, UGC, 18+, Apple In-App Purchase, or significant-update flows may need region-specific age assurance in Texas, Brazil, Australia, Singapore, Utah, or Louisiana',
        fix: 'Where regional law applies, align App Store Connect age-rating answers, App Review notes, Declared Age Range requests, PermissionKit Significant Update actions, StoreKit age rating properties, and App Store Server Notifications including consent revocation with your age-assurance flow. New Apple Accounts are subject to state-specific age-assurance handling in Utah as of May 6, 2026, Texas as of June 4, 2026, and Louisiana as of July 1, 2026.',
        match: {
            categories: ['social-networking', 'games', 'entertainment'],
            keywords: ['texas', 'brazil', 'australia', 'singapore', 'utah', 'louisiana', '18+', 'age assurance', 'declared age range', 'significant update', 'parental consent', 'consent revocation'],
            features_required: ['has_ugc'],
            min_matches: 2,
            base_confidence: 50,
        },
    },
    {
        id: 'social-login-requirement',
        guideline: '4.0',
        category: 'content_policy',
        title: 'Sign in with Apple requirement',
        trigger: 'Apps with third-party login (Google, Facebook) must also offer Sign in with Apple',
        fix: 'Add Sign in with Apple as a login option alongside other third-party providers.',
        match: {
            features_required: ['has_third_party_login'],
            base_confidence: 65,
        },
    },

    // ============================================================
    // NEW: AI/ML PATTERNS
    // ============================================================
    {
        id: 'ai-content-generation',
        guideline: '1.2',
        category: 'content_policy',
        title: 'AI-generated content moderation',
        trigger: 'Apps generating AI content must have content filtering to prevent harmful outputs',
        fix: 'Implement content filtering for AI outputs. Prevent generation of harmful, illegal, or explicit content.',
        match: {
            features_required: ['generates_ai_content'],
            features_absent: ['has_ai_content_filtering'],
            base_confidence: 60,
        },
    },
    {
        id: 'privacy-ai-data-sharing',
        guideline: '5.1.2(i)',
        category: 'content_policy',
        title: 'Third-party AI data sharing consent missing',
        trigger: 'App sends personal data to third-party AI services without explicit pre-transmission consent that names the provider and data shared',
        fix: 'Before sending personal data to third-party AI, show in-app consent that names each provider, describes what data is sent and why, links to the privacy policy, and lets users decline. Keep the privacy policy and App Review notes aligned.',
        match: {
            keywords: ['openai', 'anthropic', 'claude', 'gemini', 'mistral', 'third-party ai', 'llm', 'chatbot'],
            features_required: ['generates_ai_content'],
            base_confidence: 55,
        },
    },
    {
        id: 'ai-transparency',
        guideline: '2.3',
        category: 'metadata',
        title: 'AI transparency disclosure',
        trigger: 'Apps powered by AI/ML should disclose AI usage in their description',
        fix: 'Mention that your app uses AI in the description. Users should know when they are interacting with AI.',
        match: {
            keywords: ['ai', 'artificial intelligence', 'machine learning', 'chatbot', 'gpt', 'llm'],
            features_required: ['generates_ai_content'],
            base_confidence: 45,
        },
    },

    // ============================================================
    // NEW: SUBSCRIPTION/IAP PATTERNS
    // ============================================================
    {
        id: 'sub-terms-visibility',
        guideline: '3.1.2',
        category: 'content_policy',
        title: 'Subscription terms not visible',
        trigger: 'Subscription apps must clearly display price, duration, and auto-renewal terms on the paywall',
        fix: 'Show subscription price, billing period, and "Payment will be charged to iTunes Account" text on the paywall.',
        match: {
            features_required: ['has_subscriptions'],
            base_confidence: 55,
        },
    },
    {
        id: 'sub-restore-purchases',
        guideline: '3.1.1',
        category: 'content_policy',
        title: 'Missing Restore Purchases button',
        trigger: 'Apps with IAP must include a way to restore previous purchases',
        fix: 'Add a visible "Restore Purchases" button, typically on the paywall or in settings.',
        match: {
            features_required: ['has_iap'],
            features_absent: ['has_restore_purchases'],
            base_confidence: 65,
        },
    },
    {
        id: 'biz-iap-products-not-reviewable',
        guideline: '2.1(b)',
        category: 'content_policy',
        title: 'In-app purchase products not reviewable',
        trigger: 'App includes in-app purchases or subscriptions, but products are not submitted through Apple\'s IAP/subscription review flow, not in a reviewable App Store Connect state, missing review screenshots or metadata, or cannot be fetched by the reviewer build',
        fix: 'Before submission, make sure every IAP or subscription is complete in App Store Connect, has required review metadata/screenshots, is submitted through Apple\'s separate IAP/subscription review process, and is fetchable by the review build. First-time IAPs and subscriptions must be submitted with a new app version; they are not generic App Review submission items.',
        match: {
            features_required: ['has_iap'],
            keywords: ['subscription', 'paywall', 'in-app purchase', 'iap', 'premium', 'restore purchases'],
            base_confidence: 60,
        },
    },
    {
        id: 'sub-free-trial-clarity',
        guideline: '3.1.2',
        category: 'content_policy',
        title: 'Free trial terms or toggle flow unclear',
        trigger: 'Free trial offers must clearly state what happens when the trial ends and must not use confusing trial/non-trial toggles that hide actual price, renewal terms, or eligibility',
        fix: 'Remove free-trial toggles, check introductory offer eligibility before rendering trial copy, and clearly state the post-trial price, auto-renewal behavior, billing period, and how to cancel before purchase.',
        match: {
            features_required: ['has_subscriptions'],
            keywords: ['free trial', 'try free', 'trial period', 'days free', 'trial toggle', 'paywall toggle'],
            base_confidence: 60,
        },
    },

    // ============================================================
    // NEW: NEW APP PATTERNS (first submission)
    // ============================================================
    {
        id: 'new-app-demo-account',
        guideline: '2.1',
        category: 'metadata',
        title: 'Demo account for review (new apps)',
        trigger: 'New apps requiring login should provide demo credentials in the review notes',
        fix: 'In App Store Connect review notes, provide a test account with email and password for the reviewer.',
        match: {
            features_required: ['is_new_app', 'sign_in_required'],
            base_confidence: 60,
        },
    },
    {
        id: 'new-app-scrutiny',
        guideline: '4.0',
        category: 'content_policy',
        title: 'First submission receives extra scrutiny',
        trigger: 'New apps undergo more detailed review than updates. Common rejection areas: metadata, functionality, design.',
        fix: 'Double-check all metadata, ensure the app provides clear value, and test all core flows thoroughly.',
        match: {
            features_required: ['is_new_app'],
            base_confidence: 40,
        },
    },

    // ============================================================
    // NEW: ACCOUNT DELETION PATTERNS
    // ============================================================
    {
        id: 'account-deletion-required',
        guideline: '5.1.1',
        category: 'content_policy',
        title: 'Account deletion requirement',
        trigger: 'All apps with account creation must offer account deletion within the app',
        fix: 'Add a visible account deletion option in settings. Must delete server-side data, not just sign out.',
        match: {
            features_required: ['sign_in_required'],
            features_absent: ['has_account_deletion'],
            base_confidence: 65,
        },
    },

    // ============================================================
    // NEW: PERMISSION PATTERNS
    // ============================================================
    {
        id: 'permission-contextual',
        guideline: '5.1.1',
        category: 'info_plist',
        title: 'Permission requests must be contextual',
        trigger: 'Requesting permissions at launch instead of when the feature is first used',
        fix: 'Request each permission at the moment the user tries to use the related feature, not at app launch.',
        match: {
            features_absent: ['contextual_permissions'],
            base_confidence: 50,
        },
    },

    // ============================================================
    // NEW: TECHNICAL PATTERNS
    // ============================================================
    {
        id: 'tech-ipv6-required',
        guideline: '2.1',
        category: 'urls',
        title: 'IPv6 compatibility required',
        trigger: 'App must work on IPv6-only networks. Apple tests on IPv6 during review.',
        fix: 'Test your app on an IPv6-only network. Avoid hardcoded IPv4 addresses.',
        match: {
            features_absent: ['tested_ipv6'],
            base_confidence: 45,
        },
    },
    {
        id: 'tech-alternate-icons',
        guideline: '2.3.10',
        category: 'metadata',
        title: 'Alternate app icon compliance',
        trigger: 'Apps with alternate icons must include all icons in the app bundle and they must match guidelines',
        fix: 'Ensure all alternate icons meet Apple size/format requirements. No trademarked content in alt icons.',
        match: {
            features_required: ['has_alternate_icons'],
            base_confidence: 45,
        },
    },
];
