import type { CheckCategory, SeverityLevel } from '../types';

/**
 * A single checklist rule definition.
 *
 * Tiers:
 *   1 = Automated (evaluated from uploaded files + form data)
 *   2 = Self-Report (user answers yes/no questions -> deterministic pass/fail)
 *   3 = Informational (always shown as info-level tips)
 */
export interface ChecklistRule {
    id: string;
    tier: 1 | 2 | 3;
    category: CheckCategory;
    severity: SeverityLevel;
    title: string;
    description: string;
    guideline_ref?: string;
    fix_suggestion: string;
    source: string;
}

// ============================================================
// Tier 1: Automated Description Checks (regex/keyword)
// ============================================================

export const DESCRIPTION_RULES: ChecklistRule[] = [
    {
        id: 'desc_forbidden_labels',
        tier: 1,
        category: 'description',
        severity: 'critical',
        title: 'Forbidden labels in app name or description',
        description: 'App name or description contains "beta", "demo", "test", "coming soon", or "under construction". Apple rejects apps that appear unfinished.',
        guideline_ref: '2.1 + 2.2 — App Completeness / Beta Testing',
        fix_suggestion: 'Remove all beta/demo/test/coming soon labels. Your app must appear complete and production-ready.',
        source: 'Apple Guideline 2.1 + 2.2 (pre-release software) + Reddit/SO rejection reports',
    },
    {
        id: 'desc_price_in_name',
        tier: 1,
        category: 'metadata',
        severity: 'critical',
        title: 'Price reference in app name or subtitle',
        description: 'App name or subtitle contains price-related terms like "$", "free", "sale", "discount", or "cheap". Apple forbids price references in metadata.',
        guideline_ref: '2.3.7 — Accurate Metadata',
        fix_suggestion: 'Remove all price references from your app name and subtitle. Use the pricing section instead.',
        source: 'Apple Guideline 2.3.7 + developer forum reports',
    },
    {
        id: 'desc_platform_in_name',
        tier: 1,
        category: 'metadata',
        severity: 'warning',
        title: 'Platform name in app name or subtitle',
        description: 'App name or subtitle contains platform names like "iOS", "iPhone", "iPad", "Apple Watch", or "Android". Apple discourages platform-specific naming.',
        guideline_ref: '2.3.7 — Accurate Metadata',
        fix_suggestion: 'Remove platform names from your app name and subtitle. Your app is already on the App Store — users know it\'s for iOS.',
        source: 'Apple Guideline 2.3.10 (app name restrictions)',
    },
    {
        id: 'desc_misleading_superlatives',
        tier: 1,
        category: 'description',
        severity: 'warning',
        title: 'Unsubstantiated superlatives in description',
        description: 'Description contains claims like "#1", "best", "top-rated", "most popular", "leading", or "world\'s first" without qualification.',
        guideline_ref: '2.3.7 — Accurate Metadata',
        fix_suggestion: 'Either remove superlative claims or qualify them with verifiable data (e.g., "#1 in Finance category, Jan 2025").',
        source: 'Apple Guideline 2.3.7 + App Store rejection patterns',
    },
    {
        id: 'desc_placeholder_content',
        tier: 1,
        category: 'description',
        severity: 'critical',
        title: 'Placeholder content detected',
        description: 'Description or metadata contains placeholder text like "lorem ipsum", "TODO", "TBD", "example.com", "test@", or "[insert here]".',
        guideline_ref: '2.1 — App Completeness',
        fix_suggestion: 'Replace all placeholder content with final, production-ready text.',
        source: 'Apple Guideline 2.1 + common rejection reason',
    },
    {
        id: 'desc_ai_no_disclosure',
        tier: 1,
        category: 'content_policy',
        severity: 'warning',
        title: 'AI features mentioned without data disclosure',
        description: 'Description mentions AI, machine learning, or generative features but the app doesn\'t disclose data sharing practices in the privacy nutrition label.',
        guideline_ref: '5.1.1(i) — Data Collection and Storage',
        fix_suggestion: 'If your app uses AI/ML, ensure your privacy nutrition label accurately reflects any data sent to third-party AI services.',
        source: 'Apple November 2025 guidelines update + developer reports',
    },
    {
        id: 'desc_competitor_names',
        tier: 1,
        category: 'description',
        severity: 'warning',
        title: 'Competitor app mentioned in description',
        description: 'Mentioning other apps by name may be flagged during review. Apple discourages referencing competitor products.',
        guideline_ref: '2.3.10 — Accurate Metadata',
        fix_suggestion: 'Remove specific competitor names. Use generic terms like "other apps" or "similar services" instead.',
        source: 'Apple Guideline 2.3.10 + App Store rejection patterns',
    },
    {
        id: 'desc_medical_claims',
        tier: 1,
        category: 'description',
        severity: 'warning',
        title: 'Potential medical claim detected',
        description: 'Descriptions suggesting an app can diagnose, treat, cure, or prevent medical conditions require evidence and may trigger additional review.',
        guideline_ref: '1.4.1 — Medical: Physical harm',
        fix_suggestion: 'If your app provides health information, clarify it is for informational purposes only and not a substitute for professional medical advice.',
        source: 'Apple Guideline 1.4.1 + FDA digital health guidelines',
    },
    {
        id: 'desc_performance_guarantee',
        tier: 1,
        category: 'description',
        severity: 'warning',
        title: 'Performance guarantee or absolute claim detected',
        description: 'Absolute guarantees like "100% accurate" or "guaranteed results" may be considered misleading.',
        guideline_ref: '2.3 — Accurate Metadata',
        fix_suggestion: 'Use qualified language instead, such as "designed to be highly accurate" or "aims to provide reliable results."',
        source: 'Apple Guideline 2.3 + App Store rejection patterns',
    },
    {
        id: 'desc_earnings_claims',
        tier: 1,
        category: 'description',
        severity: 'warning',
        title: 'Earnings or revenue claim detected',
        description: 'Claims about specific earnings potential may be considered misleading and trigger App Review scrutiny.',
        guideline_ref: '2.3 — Accurate Metadata',
        fix_suggestion: 'Remove specific dollar amounts. If applicable, include appropriate disclaimers about results varying.',
        source: 'Apple Guideline 2.3 + App Store rejection patterns',
    },
];

// ============================================================
// Tier 1: Privacy Policy Keyword Checks
// ============================================================

export const PRIVACY_POLICY_RULES: ChecklistRule[] = [
    {
        id: 'privacy_data_collection',
        tier: 1,
        category: 'content_policy',
        severity: 'warning',
        title: 'Privacy policy missing data collection section',
        description: 'Privacy policy does not mention how user data is collected.',
        guideline_ref: '5.1.1 — Data Collection and Storage',
        fix_suggestion: 'Add a clear section describing what data your app collects and how.',
        source: 'Apple Guideline 5.1.1',
    },
    {
        id: 'privacy_data_retention',
        tier: 1,
        category: 'content_policy',
        severity: 'warning',
        title: 'Privacy policy missing data retention section',
        description: 'Privacy policy does not mention how long user data is retained.',
        guideline_ref: '5.1.1 — Data Collection and Storage',
        fix_suggestion: 'Add a section explaining your data retention periods and deletion policies.',
        source: 'Apple Guideline 5.1.1',
    },
    {
        id: 'privacy_data_deletion',
        tier: 1,
        category: 'content_policy',
        severity: 'warning',
        title: 'Privacy policy missing data deletion section',
        description: 'Privacy policy does not describe how users can request data deletion.',
        guideline_ref: '5.1.1(v) — Account Deletion',
        fix_suggestion: 'Add instructions for users to request deletion of their data.',
        source: 'Apple Guideline 5.1.1(v)',
    },
    {
        id: 'privacy_contact_info',
        tier: 1,
        category: 'content_policy',
        severity: 'warning',
        title: 'Privacy policy missing contact information',
        description: 'Privacy policy does not include contact details for privacy inquiries.',
        guideline_ref: '5.1.1 — Data Collection and Storage',
        fix_suggestion: 'Add a contact email or form for privacy-related questions.',
        source: 'Apple Guideline 5.1.1',
    },
    {
        id: 'privacy_children',
        tier: 1,
        category: 'content_policy',
        severity: 'info',
        title: 'Privacy policy does not address children\'s data',
        description: 'Privacy policy does not mention children\'s data handling. Required if your app targets users under 13 or is in the Kids category.',
        guideline_ref: '1.3 — Kids Category',
        fix_suggestion: 'If applicable, add a COPPA compliance section addressing children\'s data collection.',
        source: 'Apple Guideline 1.3 + COPPA requirements',
    },
    {
        id: 'privacy_data_sharing',
        tier: 1,
        category: 'content_policy',
        severity: 'warning',
        title: 'Privacy policy missing data sharing section',
        description: 'Privacy policy does not mention how user data is shared with third parties.',
        guideline_ref: '5.1.1 — Data Collection and Storage',
        fix_suggestion: 'Add a section describing whether and how user data is shared with third parties, partners, or service providers.',
        source: 'Apple Guideline 5.1.1',
    },
    {
        id: 'privacy_user_rights',
        tier: 1,
        category: 'content_policy',
        severity: 'warning',
        title: 'Privacy policy missing user rights section',
        description: 'Privacy policy does not describe user rights regarding their data (access, deletion, portability, opt-out).',
        guideline_ref: '5.1.1 — Data Collection and Storage',
        fix_suggestion: 'Add a section describing users\' rights over their data, including how to access, correct, delete, or port their information.',
        source: 'Apple Guideline 5.1.1 + GDPR/CCPA requirements',
    },
    {
        id: 'privacy_international_transfers',
        tier: 1,
        category: 'content_policy',
        severity: 'info',
        title: 'Privacy policy does not address international data transfers',
        description: 'Privacy policy does not mention international data transfers or regional compliance (GDPR, CCPA).',
        guideline_ref: '5.1.1 — Data Collection and Storage',
        fix_suggestion: 'If applicable, add a section describing international data transfers and compliance with regional privacy laws (GDPR, CCPA).',
        source: 'Apple Guideline 5.1.1 + international privacy regulations',
    },
    {
        id: 'privacy_manifest_cross_ref',
        tier: 1,
        category: 'content_policy',
        severity: 'warning',
        title: 'Privacy manifest declares data not mentioned in policy',
        description: 'The privacy manifest declares data collection types that aren\'t referenced in the privacy policy text.',
        guideline_ref: '5.1.1 — Data Collection and Storage',
        fix_suggestion: 'Ensure your privacy policy covers all data types declared in your privacy manifest.',
        source: 'Apple Guideline 5.1.1 + developer rejection stories',
    },
];

// ============================================================
// Tier 2: Self-Report Rules (form answers -> pass/fail)
// ============================================================

export interface SelfReportRule extends ChecklistRule {
    /** The form field that triggers this check */
    trigger_field: string;
    /** Expected value of trigger field for this rule to apply (true = feature exists) */
    trigger_value: boolean;
    /** The form field to evaluate (if different from trigger) */
    confirm_field?: string;
    /** Expected value of confirm field for a pass (true = compliance confirmed) */
    pass_value: boolean;
}

export const SELF_REPORT_RULES: SelfReportRule[] = [
    // === Content & Features ===
    {
        id: 'sr_ugc_moderation',
        tier: 2,
        category: 'content_policy',
        severity: 'critical',
        title: 'User-generated content requires moderation',
        description: 'App has user-generated content but does not confirm reporting, blocking, and filtering capabilities.',
        guideline_ref: '1.2 — User-Generated Content',
        fix_suggestion: 'Implement content reporting, user blocking, and content filtering. These are mandatory for any UGC features.',
        source: 'Apple Guideline 1.2 — common rejection reason for UGC apps (Safety category #5 overall per Apple 2024 Transparency Report)',
        trigger_field: 'has_ugc',
        trigger_value: true,
        confirm_field: 'has_ugc_moderation',
        pass_value: true,
    },
    {
        id: 'sr_health_disclaimers',
        tier: 2,
        category: 'content_policy',
        severity: 'critical',
        title: 'Health/medical claims require disclaimers',
        description: 'App makes health or medical claims but does not confirm appropriate disclaimers are present.',
        guideline_ref: '1.4.1 — Medical: Physical harm',
        fix_suggestion: 'Add disclaimers like "This app is not a substitute for professional medical advice" and ensure claims are evidence-based.',
        source: 'Apple Guideline 1.4.1 + FDA digital health guidelines',
        trigger_field: 'makes_health_claims',
        trigger_value: true,
        confirm_field: 'has_health_disclaimers',
        pass_value: true,
    },
    {
        id: 'sr_ai_content_filtering',
        tier: 2,
        category: 'content_policy',
        severity: 'warning',
        title: 'AI-generated content requires filtering',
        description: 'App generates AI content but does not confirm content filtering is in place.',
        guideline_ref: '1.2 — User-Generated Content (extended to AI)',
        fix_suggestion: 'Implement content filtering for AI outputs. Ensure AI cannot generate harmful, illegal, or inappropriate content.',
        source: 'Apple November 2025 guidelines update on generative AI',
        trigger_field: 'generates_ai_content',
        trigger_value: true,
        confirm_field: 'has_ai_content_filtering',
        pass_value: true,
    },

    // === Monetization ===
    {
        id: 'sr_subscription_terms',
        tier: 2,
        category: 'content_policy',
        severity: 'critical',
        title: 'Subscription terms not displayed on paywall',
        description: 'App has subscriptions but paywall may not display required terms: price, billing period, and subscription length. Apple also strongly recommends auto-renewal notice and cancellation instructions.',
        guideline_ref: '3.1.2 — Subscriptions',
        fix_suggestion: 'Display on your paywall: subscription price, billing period, and length (required). Also recommended: auto-renewal notice, cancellation instructions, and charge timing disclosure.',
        source: 'Apple Guideline 3.1.2 + Schedule 2 §3.8(b) — common monetization rejection reason',
        trigger_field: 'has_subscriptions',
        trigger_value: true,
        confirm_field: 'subscription_terms_on_paywall',
        pass_value: true,
    },
    {
        id: 'sr_digital_outside_iap',
        tier: 2,
        category: 'content_policy',
        severity: 'critical',
        title: 'Digital goods sold outside Apple IAP',
        description: 'App sells digital content or features without using Apple\'s In-App Purchase system.',
        guideline_ref: '3.1.1 — In-App Purchase',
        fix_suggestion: 'All digital goods and services must use Apple\'s IAP. Physical goods and services may use external payment.',
        source: 'Apple Guideline 3.1.1 — most litigated rejection reason',
        trigger_field: 'sells_digital_outside_iap',
        trigger_value: true,
        pass_value: false, // If they say yes (sells outside), that's a fail
    },
    {
        id: 'sr_subscriptions_without_login',
        tier: 2,
        category: 'content_policy',
        severity: 'warning',
        title: 'Restore Purchases must be available before login',
        description: 'Apple requires users to restore subscriptions via their Apple ID without creating an app account first. Add a "Restore Purchases" button to your pre-login or welcome screen so returning users can recover their subscription immediately.',
        guideline_ref: '3.1.2(a) — Subscription Management',
        fix_suggestion: 'Add a visible "Restore Purchases" button on your welcome or onboarding screen (before login). Use StoreKit\'s restorePurchases() to verify subscription status via Apple ID.',
        source: 'Apple Guideline 3.1.2(a)',
        trigger_field: 'has_subscriptions',
        trigger_value: true,
        confirm_field: 'subscriptions_without_login',
        pass_value: true,
    },

    // === Technical ===
    {
        id: 'sr_screenshots_match_ui',
        tier: 2,
        category: 'screenshots',
        severity: 'critical',
        title: 'Screenshots do not match current app UI',
        description: 'App screenshots shown on the App Store do not accurately represent the current app interface.',
        guideline_ref: '2.3.3 — Screenshots',
        fix_suggestion: 'Update screenshots to reflect the current version of your app. Do not use misleading or outdated screenshots.',
        source: 'Apple Guideline 2.3.3 — common metadata rejection reason',
        trigger_field: 'screenshots_match_ui',
        trigger_value: false,
        pass_value: false, // false trigger_value means the "no" answer triggers a fail
    },
    {
        id: 'sr_ipv6',
        tier: 2,
        category: 'content_policy',
        severity: 'warning',
        title: 'App not tested on IPv6-only network',
        description: 'App has not been verified to work on an IPv6-only network. Apple\'s review network is IPv6-only.',
        guideline_ref: '2.5.5 — IPv6 Support',
        fix_suggestion: 'Test your app on an IPv6-only network. On Mac: System Preferences > Sharing > Internet Sharing > "Create NAT64 Network".',
        source: 'Apple Guideline 2.5.5 + developer.apple.com/support/ipv6 + developer forum reports',
        trigger_field: 'tested_ipv6',
        trigger_value: false,
        pass_value: false,
    },
    {
        id: 'sr_contextual_permissions',
        tier: 2,
        category: 'content_policy',
        severity: 'warning',
        title: 'Permissions not requested at contextual time',
        description: 'App requests permissions (camera, location, etc.) at launch or before the feature is needed, instead of at the moment the user initiates the relevant action.',
        guideline_ref: '5.1.1(ii) + HIG: Accessing Private Data',
        fix_suggestion: 'Request permissions only when the user initiates a feature that requires them. Never ask on first launch.',
        source: 'Apple HIG: Accessing Private Data + Guideline 5.1.1(ii) + developer forum reports',
        trigger_field: 'contextual_permissions',
        trigger_value: false,
        pass_value: false,
    },
    {
        id: 'sr_alternate_icons',
        tier: 2,
        category: 'content_policy',
        severity: 'info',
        title: 'Alternate app icons only in Settings',
        description: 'App offers alternate icons but only through the system Settings app, not within the app itself.',
        guideline_ref: '4.0 — Design: Preamble',
        fix_suggestion: 'If you offer alternate icons, include the option within your app\'s own settings screen, not just via iOS Settings.',
        source: 'Apple HIG + developer community best practice',
        trigger_field: 'has_alternate_icons',
        trigger_value: true,
        pass_value: true, // If they confirm it's in-app, it's fine
    },

    // === Authentication (reuses existing field) ===
    {
        id: 'sr_sign_in_with_apple',
        tier: 2,
        category: 'content_policy',
        severity: 'critical',
        title: 'Sign in with Apple not offered alongside third-party login',
        description: 'App uses third-party login (Google, Facebook, etc.) but does not offer Sign in with Apple as an alternative.',
        guideline_ref: '4.8 — Sign in with Apple',
        fix_suggestion: 'Add Sign in with Apple (or an equivalent privacy-respecting login) alongside any third-party login providers.',
        source: 'Apple Guideline 4.8 — required since iOS 13 when using third-party social login',
        trigger_field: 'has_third_party_login',
        trigger_value: true,
        confirm_field: 'sign_in_required',
        pass_value: true, // This rule is evaluated specially by conditional-warnings already
    },
];

// ============================================================
// Tier 3: Informational (always shown, cannot automate)
// ============================================================

export const INFORMATIONAL_RULES: ChecklistRule[] = [
    {
        id: 'info_no_feature_switch',
        tier: 3,
        category: 'content_policy',
        severity: 'info',
        title: 'Do not switch features after approval',
        description: 'Apple prohibits changing your app\'s core functionality after review approval. This includes enabling hidden features, switching UI, or activating gambling/adult content.',
        guideline_ref: '5.6 — Developer Code of Conduct',
        fix_suggestion: 'Ensure the app submitted for review is identical to what users will download. Any post-approval changes should go through a new review.',
        source: 'Apple Guideline 5.6 — "bait-and-switch" is a permanent ban risk (account termination)',
    },
    {
        id: 'info_original_value',
        tier: 3,
        category: 'content_policy',
        severity: 'info',
        title: 'Ensure original value (not a copycat)',
        description: 'Apple rejects apps that are clones or copycats of existing apps, or that simply wrap a website in a WebView without meaningful native functionality.',
        guideline_ref: '4.1 — Copycats',
        fix_suggestion: 'Ensure your app provides unique value. If wrapping a website, add significant native features (offline mode, push notifications, etc.).',
        source: 'Apple Guideline 4.1 + Guideline 4.2 (Minimum Functionality)',
    },
    {
        id: 'info_value_beyond_ads',
        tier: 3,
        category: 'content_policy',
        severity: 'info',
        title: 'App must provide value beyond ads',
        description: 'Apps whose primary purpose is displaying ads will be rejected. Ensure your app provides genuine utility.',
        guideline_ref: '3.2.2 — Unacceptable Business Model',
        fix_suggestion: 'Ensure advertising is supplementary, not the primary experience. The app must function meaningfully even without ads.',
        source: 'Apple Guideline 3.2.2',
    },
    {
        id: 'info_b2b_distribution',
        tier: 3,
        category: 'content_policy',
        severity: 'info',
        title: 'B2B apps may need Custom App Distribution',
        description: 'If your app is designed exclusively for business use (internal tools, enterprise features), it may be better distributed through Apple Business Manager.',
        guideline_ref: '3.2 — Other Business Model Issues',
        fix_suggestion: 'If your app is B2B-only, consider Apple Business Manager / Custom App Distribution instead of the public App Store.',
        source: 'Apple Guideline 3.2',
    },
];

// ============================================================
// All rules combined
// ============================================================

export const ALL_RULES: ChecklistRule[] = [
    ...DESCRIPTION_RULES,
    ...PRIVACY_POLICY_RULES,
    ...SELF_REPORT_RULES,
    ...INFORMATIONAL_RULES,
];

/**
 * Privacy policy keyword mapping.
 * Each key is a required section, value is an array of keywords to search for.
 * If at least one keyword is found, the section is considered present.
 */
export const PRIVACY_POLICY_KEYWORDS: Record<string, string[]> = {
    data_collection: [
        'collect', 'data we collect', 'information we collect',
        'personal data', 'personal information', 'gather',
        'data collection', 'what we collect',
    ],
    data_retention: [
        'retain', 'retention', 'how long', 'store', 'storage period',
        'keep your data', 'data retention', 'preserved',
    ],
    data_deletion: [
        'delete', 'deletion', 'erase', 'remove your data',
        'right to delete', 'account deletion', 'data removal',
        'request deletion',
    ],
    contact_info: [
        'contact us', 'contact information', 'reach us', 'email us',
        'privacy@', 'support@', 'data protection officer',
    ],
    children: [
        'children', 'child', 'minors', 'under 13', 'under 16',
        'coppa', 'kids', 'parental consent', 'age',
    ],
    data_sharing: [
        'share', 'third party', 'third-party', 'partners', 'vendors',
        'service providers', 'disclose', 'data sharing', 'shared with',
    ],
    user_rights: [
        'right to delete', 'right to access', 'data portability', 'opt out',
        'opt-out', 'withdraw consent', 'your rights', 'data subject rights',
        'right to know', 'right to correct',
    ],
    international_transfers: [
        'international', 'cross-border', 'european', 'gdpr', 'ccpa',
        'california', 'transfer', 'data transfer', 'eu', 'eea',
    ],
};

/**
 * Privacy manifest → privacy policy cross-reference mapping.
 * Keys are data collection declaration fields, values are keywords
 * that should appear in the privacy policy if that data type is declared.
 */
export const MANIFEST_POLICY_CROSS_REF: Record<string, string[]> = {
    contactInfo: ['email', 'phone', 'contact', 'name', 'address'],
    healthFitness: ['health', 'fitness', 'medical', 'wellness', 'workout'],
    financialInfo: ['financial', 'payment', 'banking', 'credit', 'transaction', 'income'],
    location: ['location', 'gps', 'geographic', 'geolocation'],
    sensitiveInfo: ['sensitive', 'biometric', 'racial', 'ethnic', 'political', 'religious'],
    contacts: ['contacts', 'address book', 'phone book'],
    userContent: ['content', 'photos', 'videos', 'files', 'uploads', 'user content'],
    browsingHistory: ['browsing', 'browsing history', 'web history', 'sites visited'],
    searchHistory: ['search', 'search history', 'queries'],
    identifiers: ['device id', 'identifier', 'advertising id', 'idfa', 'idfv'],
    purchases: ['purchase', 'transaction', 'buying', 'order history'],
    usageData: ['usage', 'analytics', 'app usage', 'interaction', 'telemetry'],
    diagnostics: ['diagnostic', 'crash', 'performance', 'error log'],
};

/**
 * Description checks: forbidden terms in app name/subtitle.
 * Each entry: [regex pattern, rule ID to associate with]
 */
export const FORBIDDEN_NAME_PATTERNS: Array<{ pattern: RegExp; ruleId: string }> = [
    { pattern: /\b(beta|demo|test(?:ing)?|trial|coming\s+soon|under\s+construction|wip|prototype)\b/i, ruleId: 'desc_forbidden_labels' },
    { pattern: /(\$|free|sale|discount|cheap|promo|offer|price|deal|bargain)\b/i, ruleId: 'desc_price_in_name' },
    { pattern: /\b(ios|iphone|ipad|apple\s*watch|android|mobile)\b/i, ruleId: 'desc_platform_in_name' },
];

export const FORBIDDEN_DESCRIPTION_PATTERNS: Array<{ pattern: RegExp; ruleId: string; confidence?: number }> = [
    { pattern: /\b(beta|demo|test\s+version|coming\s+soon|under\s+construction|work\s+in\s+progress)\b/i, ruleId: 'desc_forbidden_labels' },
    { pattern: /\b(lorem\s+ipsum|todo|tbd|\[insert|example\.com|test@|placeholder|xxx|sample\s+text)\b/i, ruleId: 'desc_placeholder_content' },
    { pattern: /\b(#1|number\s*one|best\s+app|top[- ]rated|most\s+popular|leading|world'?s?\s+first|award[- ]winning)\b/i, ruleId: 'desc_misleading_superlatives' },
    { pattern: /\b(whatsapp|instagram|tiktok|snapchat|facebook|twitter|youtube|spotify|uber|netflix|amazon|google|apple\s+music|discord)\b/i, ruleId: 'desc_competitor_names', confidence: 75 },
    { pattern: /\b(diagnos(?:e|is|tic)|treat(?:s|ment)?|cure(?:s|d)?|prevent(?:s|ion)?)\b[^.]{0,50}\b(disease|illness|condition|disorder|cancer|diabetes|depression|anxiety)\b/i, ruleId: 'desc_medical_claims', confidence: 70 },
    { pattern: /\b(guaranteed?|100%\s*(?:accurate|safe|secure|effective|reliable)|money[- ]?back|no[- ]?risk|risk[- ]?free)\b/i, ruleId: 'desc_performance_guarantee', confidence: 70 },
    { pattern: /\b(?:earn|make)\s+\$\d+|\$\d+.*\b(?:per|a|each)\s+(?:day|week|month|year)\b/i, ruleId: 'desc_earnings_claims', confidence: 75 },
];

export const AI_MENTION_PATTERN = /\b(artificial\s+intelligence|machine\s+learning|ai[- ]powered|gpt|llm|generative\s+ai|neural|deep\s+learning|ai\s+assistant|chatbot)\b/i;
