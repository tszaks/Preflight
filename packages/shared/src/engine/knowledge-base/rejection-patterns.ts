/**
 * Verified rejection patterns from real App Store submissions.
 * Sources: r/iOSProgramming, Apple Developer Forums, Stack Overflow [app-store-rejection]
 *
 * Each pattern includes the guideline section and a description of what triggers it.
 * Only patterns with multiple independent reports and <2 years old are included.
 */

export interface RejectionPattern {
    id: string;
    guideline: string;
    category: string;
    title: string;
    trigger: string;
    fix: string;
}

export const REJECTION_PATTERNS: RejectionPattern[] = [
    // Metadata rejections
    {
        id: 'meta-price-in-name',
        guideline: '2.3.7',
        category: 'metadata',
        title: 'Price in app name',
        trigger: 'Including "Free", "$0.99", pricing info, or "Sale" in the app name or subtitle',
        fix: 'Remove all pricing references from the app name and subtitle. Use the description or promotional text instead.',
    },
    {
        id: 'meta-platform-in-name',
        guideline: '2.3.10',
        category: 'metadata',
        title: 'Platform reference in name',
        trigger: 'Including "iOS", "iPhone", "iPad", "Apple Watch", or "for iOS" in the app name',
        fix: 'Remove platform references. Apple already shows what platforms your app supports.',
    },
    {
        id: 'meta-keyword-stuffing',
        guideline: '2.3.7',
        category: 'metadata',
        title: 'Keyword stuffing in name/subtitle',
        trigger: 'Cramming unrelated keywords, competitor names, or category names into the title/subtitle',
        fix: 'Keep your app name focused and brandable. Use the keywords field for discoverability terms.',
    },
    {
        id: 'meta-misleading-description',
        guideline: '2.3',
        category: 'metadata',
        title: 'Misleading description',
        trigger: 'Description mentions features not actually present in the app, or overpromises capabilities',
        fix: 'Ensure every feature mentioned in the description is accessible in the shipped version.',
    },
    {
        id: 'meta-placeholder-content',
        guideline: '2.1',
        category: 'metadata',
        title: 'Placeholder/test content',
        trigger: 'Lorem ipsum, TODO, "coming soon" features, test data visible in screenshots',
        fix: 'Replace all placeholder content with final copy. Remove any test/debug UI.',
    },
    {
        id: 'meta-competitor-mention',
        guideline: '2.3',
        category: 'metadata',
        title: 'Competitor name in metadata',
        trigger: 'Mentioning competitor app names in title, subtitle, keywords, or description',
        fix: 'Remove competitor references. Describe your own app\'s unique value instead.',
    },

    // Screenshot rejections
    {
        id: 'screen-wrong-device',
        guideline: '2.3.3',
        category: 'screenshots',
        title: 'Wrong device frame',
        trigger: 'Using iPhone frames for iPad screenshots or vice versa, or outdated device frames',
        fix: 'Use current device frames matching the screenshot dimensions, or no frames at all.',
    },
    {
        id: 'screen-fake-ui',
        guideline: '2.3.3',
        category: 'screenshots',
        title: 'Fake UI elements',
        trigger: 'Screenshots showing UI that doesn\'t exist in the app, fabricated notifications, or fake system UI',
        fix: 'Only show actual app screenshots. Marketing overlays are fine but don\'t fake system elements.',
    },
    {
        id: 'screen-wrong-dimensions',
        guideline: '2.3.3',
        category: 'screenshots',
        title: 'Invalid screenshot dimensions',
        trigger: 'Screenshots that don\'t match required dimensions for any supported device size',
        fix: 'Use exact pixel dimensions accepted by App Store Connect. Current primary examples: 6.9" iPhone (1320x2868, 1290x2796, or 1260x2736), 6.5" iPhone (1284x2778 or 1242x2688), 6.3"/6.1" iPhone (1206x2622, 1179x2556, 1170x2532, 1125x2436, or 1080x2340), 13" iPad (2064x2752 or 2048x2732), and 11" iPad (1488x2266, 1668x2420, 1668x2388, or 1640x2360).',
    },

    // Privacy rejections
    {
        id: 'privacy-no-policy',
        guideline: '5.1.1',
        category: 'privacy_manifest',
        title: 'Missing or unreachable privacy policy',
        trigger: 'Privacy policy URL returns 404, is a placeholder, or is missing entirely',
        fix: 'Provide a working HTTPS URL to a privacy policy that covers all data your app collects.',
    },
    {
        id: 'privacy-missing-manifest',
        guideline: '5.1',
        category: 'privacy_manifest',
        title: 'Missing privacy manifest',
        trigger: 'App or bundled third-party SDK uses required-reason APIs without the required PrivacyInfo.xcprivacy manifest in the owning app, framework, or dynamic library bundle',
        fix: 'Add a PrivacyInfo.xcprivacy file for your app code, and update or replace third-party SDKs so each SDK bundle declares its own required-reason API usage with valid reason codes.',
    },
    {
        id: 'privacy-wrong-reasons',
        guideline: '5.1',
        category: 'privacy_manifest',
        title: 'Invalid API reason codes',
        trigger: 'Privacy manifest declares API usage but with incorrect or missing reason codes',
        fix: 'Each NSPrivacyAccessedAPIType must have at least one valid NSPrivacyAccessedAPITypeReasons entry.',
    },
    {
        id: 'privacy-undeclared-tracking',
        guideline: '5.1.2',
        category: 'privacy_manifest',
        title: 'Undeclared tracking',
        trigger: 'App contacts tracking domains or uses IDFA without declaring tracking in the manifest',
        fix: 'Set NSPrivacyTracking to YES if your app tracks users, and list all tracking domains.',
    },
    {
        id: 'privacy-mismatch',
        guideline: '5.1.1',
        category: 'privacy_manifest',
        title: 'Privacy policy vs manifest mismatch',
        trigger: 'Privacy policy doesn\'t mention data types declared in the privacy manifest, or vice versa',
        fix: 'Align your privacy policy text with your privacy manifest declarations.',
    },

    // Info.plist rejections
    {
        id: 'plist-missing-usage',
        guideline: '5.1.1',
        category: 'info_plist',
        title: 'Missing usage description',
        trigger: 'App requests permission (camera, photos, location, etc.) without a usage description string',
        fix: 'Add a clear, specific usage description for every permission your app requests.',
    },
    {
        id: 'plist-vague-usage',
        guideline: '5.1.1',
        category: 'info_plist',
        title: 'Vague usage description',
        trigger: 'Usage description is generic ("This app needs access") without explaining why specifically',
        fix: 'Explain the specific feature that needs the permission. E.g., "Take photos for your profile picture".',
    },
    {
        id: 'plist-background-mode',
        guideline: '2.5.4',
        category: 'info_plist',
        title: 'Unjustified background mode',
        trigger: 'Declaring background modes (audio, location, fetch) that the app doesn\'t actually use',
        fix: 'Only declare background modes your app actively uses. Remove unused UIBackgroundModes entries.',
    },

    // URL rejections
    {
        id: 'url-not-reachable',
        guideline: '2.1',
        category: 'urls',
        title: 'Unreachable URL',
        trigger: 'Privacy policy, support, or marketing URL returns error, times out, or is not HTTPS',
        fix: 'Ensure all URLs are live, HTTPS, and return a 200 status code. Test them before submission.',
    },
    {
        id: 'url-placeholder',
        guideline: '2.1',
        category: 'urls',
        title: 'Placeholder URL',
        trigger: 'URLs pointing to example.com, localhost, placeholder pages, or "under construction" pages',
        fix: 'Replace with real, live URLs containing actual content relevant to your app.',
    },

    // Content policy rejections
    {
        id: 'content-wrong-rating',
        guideline: '2.3',
        category: 'content_policy',
        title: 'Incorrect age rating',
        trigger: 'App content doesn\'t match the selected age rating (e.g., mature content with 4+ rating)',
        fix: 'Select an age rating that accurately reflects your app\'s content using Apple\'s current questionnaire. Global ratings for current OS releases use 4+, 9+, 13+, 16+, and 18+, while some storefronts display region-specific ratings such as Australia 16+/R 18+ and Vietnam 00+/12+/16+/18+. Keep content descriptors accurate and rate higher when needed.',
    },
    {
        id: 'content-ugc-no-moderation',
        guideline: '1.2',
        category: 'content_policy',
        title: 'UGC without moderation',
        trigger: 'App has user-generated content without content filtering, reporting, or blocking mechanisms. As of Feb 2026, random or anonymous chat features are explicitly prohibited.',
        fix: 'Implement content moderation: filtering, user reporting, blocking, and published contact info. Remove any anonymous/random chat features entirely.',
    },
    {
        id: 'content-medical-disclaimer',
        guideline: '1.4',
        category: 'content_policy',
        title: 'Medical claims without disclaimer',
        trigger: 'Health/fitness app making medical claims without appropriate disclaimers',
        fix: 'Add clear disclaimers that the app is not a medical device and doesn\'t replace professional advice.',
    },
    {
        id: 'content-regulated-medical-device-status',
        guideline: 'ASC-Regulated-Medical-Device',
        category: 'content_policy',
        title: 'Regulated medical device status missing',
        trigger: 'Health & Fitness or Medical app distributed in the EEA, UK, or U.S. has regulated medical device functionality, or frequent Medical or Treatment Information in the age rating questionnaire, but App Store Connect regulated medical device status is not provided',
        fix: 'If the app qualifies, provide regulated medical device status in App Store Connect with relevant regulatory information, contact details, and safety information. If it is not a regulated medical device, select No. Existing qualifying apps must declare by early 2027 to keep submitting updates.',
    },

    // Business model rejections
    {
        id: 'biz-external-purchase',
        guideline: '3.1.1',
        category: 'content_policy',
        title: 'External purchase for digital goods',
        trigger: 'App directs users to purchase digital content/subscriptions outside of In-App Purchase without qualifying for and implementing Apple\'s regional external-purchase requirements',
        fix: 'Use Apple In-App Purchase unless a regional exception applies. For permitted storefronts, implement the required StoreKit external-purchase entitlement/API, disclosure sheet, eligibility checks, review-note details, transaction reporting, and child-safety requirements. Brazil support applies to iOS 26.5 or later and requires Apple IAP to be offered at least as prominently when alternative in-app payment options are merchandised. In Brazil, use parental gates or consent where required and call StoreKit canMakePayments before purchase or payment-information flows.',
    },
    {
        id: 'biz-minimum-functionality',
        guideline: '4.2',
        category: 'content_policy',
        title: 'Insufficient functionality',
        trigger: 'App is essentially a web wrapper, has minimal native features, or provides little value',
        fix: 'Add meaningful native functionality. The app should provide value beyond what a website offers.',
    },
    {
        id: 'privacy-ai-data-sharing',
        guideline: '5.1.2(i)',
        category: 'content_policy',
        title: 'AI feature sends data without consent',
        trigger: 'App sends personal data to third-party AI services without first explaining what data is sent, naming who receives it, and asking permission before transmission',
        fix: 'Show explicit in-app consent before any personal data is sent to third-party AI. Name each AI provider, describe the data shared and purpose, offer a denial path, and mirror the disclosure in the privacy policy. Do not rely on privacy policy or terms text alone.',
    },
    {
        id: 'biz-loan-apr-violation',
        guideline: '3.2.2(ix)',
        category: 'content_policy',
        title: 'Loan app exceeds APR cap',
        trigger: 'Loan or lending app offers annual percentage rates exceeding 36%, or fails to clearly disclose APR, fees, and repayment terms',
        fix: 'Ensure your loan app clearly displays the APR (must not exceed 36%), all fees, and repayment schedule. Apple enforces this cap under guideline 3.2.2(ix).',
    },
    {
        id: 'meta-brand-impersonation',
        guideline: '5.2',
        category: 'metadata',
        title: 'Brand impersonation in metadata',
        trigger: 'App name, icon, or screenshots closely mimic a well-known brand, or the app falsely implies affiliation with another company',
        fix: 'Remove any brand similarities. Use original branding. If you have a legitimate partnership, provide documentation to App Review.',
    },
    {
        id: 'content-creator-age-restriction',
        guideline: '1.2.1',
        category: 'content_policy',
        title: 'UGC missing creator age verification',
        trigger: 'App allows content creation or posting without verifying the creator is at least 13 years old (or local minimum age)',
        fix: 'Implement age verification for content creators. Users under 13 (or local minimum) must not be able to create, post, or share content publicly. See guideline 1.2.1(a).',
    },
    {
        id: 'biz-restore-purchases',
        guideline: '3.1.1',
        category: 'content_policy',
        title: 'Missing Restore Purchases button',
        trigger: 'App has in-app purchases or subscriptions but does not provide a visible "Restore Purchases" button',
        fix: 'Add a clearly visible "Restore Purchases" button accessible from your paywall or settings. This is required for all apps with non-consumable IAP or subscriptions.',
    },
    {
        id: 'biz-iap-products-not-reviewable',
        guideline: '2.1(b)',
        category: 'content_policy',
        title: 'In-app purchase products not reviewable',
        trigger: 'App includes in-app purchases or subscriptions, but products are missing from the review submission, not in a reviewable App Store Connect state, missing review screenshots or metadata, or cannot be fetched by the reviewer build',
        fix: 'Before submission, make sure every first-time IAP or subscription is complete in App Store Connect, included in the app review submission or reviewSubmission items, has required review metadata/screenshots, is fetchable by the review build, and is explained in App Review notes if any configured product cannot be found or reviewed.',
    },
    {
        id: 'biz-brazil-betting-license',
        guideline: 'ASC-Brazil-Betting-License',
        category: 'content_policy',
        title: 'Brazil fixed-odds betting license missing',
        trigger: 'App includes fixed-odds betting or real-money gambling features and is distributed in Brazil, but does not provide a valid SPA license and supporting documentation in App Review Information',
        fix: 'If distributing fixed-odds betting in Brazil, submit a new app version, enter the SPA license details in App Review notes, attach supporting documentation, and ensure age-rating answers and gambling-risk disclosures are accurate. Updating App Review Information alone does not start license verification.',
    },
    {
        id: 'biz-eu-dsa-trader',
        guideline: '5.5.1',
        category: 'content_policy',
        title: 'Missing EU DSA trader status',
        trigger: 'Developer distributes app in the EU but has not declared trader status and provided required business information under the Digital Services Act',
        fix: 'In App Store Connect, declare your trader status (individual or organization). EU-based traders must provide business name, address, registration number, and contact info per DSA requirements.',
    },
    {
        id: 'content-mini-app-compliance',
        guideline: '4.7',
        category: 'content_policy',
        title: 'Mini app/HTML5 game non-compliance',
        trigger: 'App hosts mini apps, plugins, or HTML5 games that have not been individually reviewed or that download executable code',
        fix: 'All mini apps, HTML5 games, and plugins must be individually submitted for review. They cannot download or execute code not contained in the app bundle. See guideline 4.7.',
    },
    {
        id: 'biz-low-value-saturated-category',
        guideline: '4.3(b)',
        category: 'content_policy',
        title: 'Low-value app in saturated category',
        trigger: 'App is a dating, flashlight, sound effects, wallpaper, simple timer, fortune telling, drinking game, Kama Sutra, fart, or burp app without a meaningfully different or improved experience',
        fix: 'Make the differentiated value obvious in the app, first screenshots, and description. Avoid template clones, thin variants, and repeated submissions of low-effort apps in saturated categories.',
    },
    {
        id: 'content-live-activities-spam',
        guideline: '4.5.3',
        category: 'content_policy',
        title: 'Live Activities or Apple services used for spam',
        trigger: 'App uses Live Activities, Push Notifications, Game Center, or other Apple services to spam, phish, or send unsolicited messages',
        fix: 'Use Apple services only for user-requested, app-relevant updates. Remove promotional, phishing-like, or unsolicited messaging from Live Activities and notification surfaces.',
    },
    {
        id: 'content-anonymous-chat',
        guideline: '1.2',
        category: 'content_policy',
        title: 'Anonymous or random chat prohibited',
        trigger: 'App provides random or anonymous chat functionality (Chatroulette-style, anonymous messaging, random stranger matching)',
        fix: 'Anonymous/random chat apps are explicitly prohibited under guideline 1.2 as of February 2026. Remove these features entirely or implement full identity verification, content moderation, and reporting. Apps with anonymous chat "may be removed without notice."',
    },
    {
        id: 'content-social-media-time-allowance',
        guideline: 'ASC-Time-Allowances',
        category: 'content_policy',
        title: 'Social media capabilities not declared for Time Allowances',
        trigger: 'App includes a social feed or similar user-generated content surface that redistributes, amplifies, or lets users interact with content visible to many users, but the App Store Connect age rating questionnaire is not updated to declare social media capabilities',
        fix: 'Starting September 2026, answer the App Store Connect social media capabilities question before submitting updates. If social features are disabled for users under 13, use at least the Declared Age Range API to check age ranges and keep the age rating answers aligned with that behavior.',
    },
    {
        id: 'content-australia-social-under16',
        guideline: 'ASC-Australia-Social-Media',
        category: 'content_policy',
        title: 'Australia social media under-16 access not addressed',
        trigger: 'Social media platform operates in Australia but does not prevent users under 16 from having accounts, does not deactivate underage accounts, or does not disclose age assurance and age suitability details in App Store metadata',
        fix: 'If the Australian social media law applies, block under-16 account access for Australia, monitor new signups, consider the Declared Age Range API or another age-assurance method, disclose age controls in the age rating questionnaire, and add an Age Suitability URL or description text for region-specific restrictions.',
    },
    {
        id: 'content-regional-age-assurance',
        guideline: 'ASC-Regional-Age-Assurance',
        category: 'content_policy',
        title: 'Regional age assurance obligations not addressed',
        trigger: 'App is distributed in Texas, Brazil, Australia, Singapore, Utah, or Louisiana and includes age-sensitive social, UGC, 18+, or significant-update flows without using available age-assurance signals or documenting how parent or guardian consent is handled where required',
        fix: 'Review regional obligations with counsel, then use Apple-supported tools where applicable: Declared Age Range for age category and regulatory signals, PermissionKit Significant Update actions for parent or guardian permission, StoreKit age rating properties, and App Store Server Notifications. Keep App Store Connect age-rating answers and App Review notes aligned with the implemented age-assurance behavior.',
    },
] as const;
