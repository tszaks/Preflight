/**
 * Pro Tips - Insider knowledge that saves first-time publishers from costly mistakes.
 *
 * These are the "nobody told me" gotchas that experienced developers know but
 * first-timers learn the hard way. Organized by category and feature.
 *
 * Sources:
 * - Apple App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
 * - Apple Developer Program Enrollment: https://developer.apple.com/programs/enroll/
 * - Apple D-U-N-S Help: https://developer.apple.com/help/account/membership/D-U-N-S/
 * - FDA Mobile Medical Applications: https://www.fda.gov/medical-devices/digital-health-center-excellence/device-software-functions-including-mobile-medical-applications
 * - Apple Kids Category: https://developer.apple.com/kids/
 * - Apple Account Deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app/
 *
 * Last verified: January 2026
 */

export interface ProTip {
    id: string;
    title: string;
    description: string;
    why_it_matters: string;
    action: string;
    cost_impact?: string;
    time_impact?: string;
    link?: string;
    severity: 'critical' | 'important' | 'helpful';
}

export interface CategoryTips {
    category: string;
    tips: ProTip[];
}

export interface FeatureTips {
    feature: string;
    detection_hints: string[]; // Keywords/patterns to detect this feature
    tips: ProTip[];
}

// =============================================================================
// CATEGORY-SPECIFIC PRO TIPS
// =============================================================================

export const CATEGORY_PRO_TIPS: CategoryTips[] = [
    {
        category: 'Finance',
        tips: [
            {
                id: 'finance-legal-entity',
                title: 'Financial services apps should be submitted by the financial institution',
                description:
                    "Per Guideline 3.2.1(viii): Apps for financial trading, investing, or money management should be submitted by the financial institution performing such services. Per Guideline 5.1.1(ix): Apps in highly-regulated fields like banking and financial services should be submitted by a legal entity, not an individual developer. Simple budget trackers may have more flexibility, but apps connecting to banks or offering financial services face strict requirements.",
                why_it_matters:
                    "Apps are frequently rejected when the seller name doesn't match the financial institution. Apple enforces this strictly for consumer protection. Note: Both Individual and Organization accounts cost $99/year - there's no pricing difference.",
                action:
                    "If your app connects to banks, processes payments, or offers financial services: 1) Consider enrolling as an Organization (same $99/year cost but shows company name), 2) Ensure your seller name matches the entity providing financial services, 3) Have licensing documentation ready for App Review.",
                cost_impact: '$99/year for both Individual and Organization accounts',
                time_impact: 'Organization enrollment requires D-U-N-S (up to 5 business days to receive, plus 2 days for Apple sync)',
                link: 'https://developer.apple.com/app-store/review/guidelines/#business',
                severity: 'critical',
            },
            {
                id: 'finance-disclaimer',
                title: 'Add a financial advice disclaimer',
                description:
                    "If your app provides any financial information, recommendations, or calculations, you need a disclaimer stating it's not financial advice.",
                why_it_matters:
                    "Apps that appear to offer financial advice without proper disclaimers get rejected or removed after launch.",
                action:
                    'Add a disclaimer in your app\'s settings or onboarding that says something like: "This app is for informational purposes only and does not constitute financial advice."',
                severity: 'important',
            },
            {
                id: 'finance-security',
                title: 'Expect extra security scrutiny',
                description:
                    "Finance apps go through additional security review. Apple may ask about your data handling, encryption methods, and security certifications.",
                why_it_matters:
                    "Be prepared for follow-up questions from App Review. Having documentation ready speeds up approval.",
                action:
                    'Prepare a brief security document explaining: 1) How you handle sensitive data, 2) What encryption you use, 3) Where data is stored, 4) Your authentication methods.',
                time_impact: 'Reviews may take 1-2 days longer',
                severity: 'helpful',
            },
            {
                id: 'finance-plaid-requirement',
                title: 'Bank connections require OAuth or official SDKs',
                description:
                    "If your app connects to banks, you must use official aggregator SDKs (like Plaid, MX, Yodlee) or OAuth. Scraping login credentials is prohibited.",
                why_it_matters:
                    "Apps that ask users to enter bank credentials directly get rejected for security violations.",
                action:
                    "Use an official bank data aggregator like Plaid, which handles authentication securely and is App Store approved.",
                link: 'https://plaid.com/',
                severity: 'critical',
            },
        ],
    },
    {
        category: 'Health & Fitness',
        tips: [
            {
                id: 'health-medical-device',
                title: 'Medical apps may need FDA clearance',
                description:
                    "If your app diagnoses, treats, or monitors health conditions, it may be classified as a medical device requiring FDA approval. General wellness apps (fitness tracking, calorie counting, mood journaling) are typically exempt.",
                why_it_matters:
                    "Apple will ask for FDA documentation for apps making diagnostic claims. Per Guideline 1.4.1: Apps claiming to measure via device sensors alone (blood pressure, temperature, glucose, blood oxygen) are NOT permitted.",
                action:
                    'Review FDA guidance. If your app is purely informational or general wellness (step counting, mood tracking), you\'re likely fine. If it makes diagnostic claims or controls medical equipment, consult regulatory guidance. Submit FDA clearance documentation link if you have it.',
                link: 'https://www.fda.gov/medical-devices/digital-health-center-excellence/device-software-functions-including-mobile-medical-applications',
                severity: 'critical',
            },
            {
                id: 'health-data-accuracy',
                title: "Don't make accuracy claims without proof",
                description:
                    "Per Guideline 1.4.1: Apps must clearly disclose data and methodology supporting accuracy claims for health measurements. Claims like '99% accurate' or 'clinically proven' require supporting documentation.",
                why_it_matters:
                    "Unsubstantiated health claims get rejected under Guideline 1.4 (Physical Harm). Apple may request clinical studies.",
                action:
                    'Remove specific accuracy percentages unless you have clinical studies. Use softer language: "designed to help you track" instead of "accurately measures". If you have clinical validation, include it in your submission.',
                severity: 'important',
            },
            {
                id: 'health-healthkit-advertising-ban',
                title: 'HealthKit data CANNOT be used for advertising (strict prohibition)',
                description:
                    "Per Guideline 5.1.2: Health data from HealthKit, Clinical Health Records API, and MovementDisorder APIs may NOT be used for advertising, marketing, or use-based data mining purposes. This is a strict prohibition with limited exceptions.",
                why_it_matters:
                    "Using health data for ads is an instant rejection. Apple explicitly prohibits: targeted/behavioral advertising based on health data, sharing health data with ad networks, using health data for user profiling.",
                action:
                    "Ensure HealthKit data is used ONLY for: 1) Health management features that directly benefit the user, 2) Health research with proper consent. Never pass health data to analytics/ad SDKs. Review your third-party SDKs to ensure none access health data.",
                link: 'https://developer.apple.com/documentation/healthkit/protecting-user-privacy',
                severity: 'critical',
            },
            {
                id: 'health-healthkit-privacy',
                title: 'HealthKit requires specific permission descriptions and privacy policy',
                description:
                    "Apps using HealthKit must: 1) Provide specific usage descriptions for each data type accessed, 2) Include a privacy policy clearly disclosing health data usage, 3) Not store personal health information in iCloud, 4) Not write false or inaccurate data to HealthKit.",
                why_it_matters:
                    "Vague HealthKit usage descriptions get rejected. Missing privacy policy = rejection. Writing inaccurate data can lead to removal.",
                action:
                    'For each HealthKit permission, write specific explanation: "We read your step count to calculate daily calories burned" not just "To track your fitness". Create privacy policy section specifically addressing health data collection and usage.',
                severity: 'important',
            },
            {
                id: 'health-research-ethics',
                title: 'Health research apps require ethics board approval',
                description:
                    "Per Guideline 5.1.3: Apps conducting health-related human subject research must secure approval from an independent ethics review board. Proof of approval must be provided upon request.",
                why_it_matters:
                    "Research apps without ethics approval will be rejected. This applies to all apps using Apple ResearchKit.",
                action:
                    "If conducting health research: 1) Obtain IRB (Institutional Review Board) approval before submission, 2) Have approval documentation ready for App Review, 3) Ensure informed consent covers: nature, purpose, duration, procedures, risks, benefits, data confidentiality, withdrawal process.",
                severity: 'critical',
            },
        ],
    },
    {
        category: 'Games',
        tips: [
            {
                id: 'games-loot-boxes',
                title: 'Loot boxes require odds disclosure (global Apple policy)',
                description:
                    "Per Guideline 3.1.1: Apps offering 'loot boxes' or other mechanisms that provide randomized virtual items for purchase must disclose the odds of receiving each type of item to customers PRIOR to purchase. This is a global Apple requirement, not region-specific.",
                why_it_matters:
                    "This policy mirrors China's legal requirement but Apple enforces it globally on the App Store. Non-compliance results in rejection. While regional laws vary (China mandates by law, UK/Europe rely on self-regulation), Apple's global store policy requires disclosure everywhere.",
                action:
                    'Add a clearly visible "drop rates" or "odds" button/link near any randomized purchase. Display exact percentages for each possible reward tier BEFORE the user can purchase.',
                link: 'https://developer.apple.com/app-store/review/guidelines/#in-app-purchase',
                severity: 'critical',
            },
            {
                id: 'games-age-rating',
                title: 'Simulated gambling requires 17+ rating',
                description:
                    "Any simulated gambling (poker, slots, betting) even without real money requires a 17+ age rating.",
                why_it_matters:
                    "If your game has casino-style mechanics and is rated below 17+, it will be rejected.",
                action:
                    'If your game has any gambling mechanics, set age rating to 17+. This includes social casinos and any "spin to win" mechanics.',
                severity: 'important',
            },
            {
                id: 'games-sign-in-apple',
                title: 'Third-party login requires Sign in with Apple OR equivalent privacy-focused alternative',
                description:
                    "Per Guideline 4.8 (updated January 2024): If your app uses third-party/social login (Google, Facebook, etc.), you must ALSO offer Sign in with Apple OR an equivalent alternative login that: 1) Limits data collection to name and email, 2) Allows users to keep their email private, 3) Does not track users for advertising without consent.",
                why_it_matters:
                    "This was updated in January 2024 - Sign in with Apple is no longer the ONLY option, but you must offer SOME privacy-focused login alternative. Most apps still use Sign in with Apple as it's the easiest compliant option.",
                action:
                    "Either: 1) Add Sign in with Apple (recommended - easiest compliance), or 2) Implement another privacy-focused login meeting the three criteria above. Display at least as prominently as other login options.",
                link: 'https://developer.apple.com/sign-in-with-apple/',
                severity: 'critical',
            },
        ],
    },
    {
        category: 'Social Networking',
        tips: [
            {
                id: 'social-ugc-moderation',
                title: 'User content requires moderation',
                description:
                    "Any app where users can post content visible to others must have content moderation - either automated filtering or human review.",
                why_it_matters:
                    "Apps without moderation get rejected under guideline 1.2 (User Generated Content).",
                action:
                    'Implement: 1) Content reporting mechanism, 2) Block/mute users feature, 3) Terms of service prohibiting bad content, 4) Response process for reports. Consider using AI moderation APIs.',
                severity: 'critical',
            },
            {
                id: 'social-account-deletion',
                title: 'Users must be able to delete their account (mandatory since June 30, 2022)',
                description:
                    "Per Guideline 5.1.1(v): If your app supports account creation, you must also offer account deletion within the app. This became mandatory on June 30, 2022 (originally planned for January 31, 2022 but extended). Account deletion must actually delete the account from your records, not just deactivate it.",
                why_it_matters:
                    "Apps without in-app account deletion are rejected. Temporary disable/deactivate is NOT sufficient - users must be able to permanently delete their account and personal data. If you use Sign in with Apple, you must also revoke user tokens via the REST API.",
                action:
                    'Add a "Delete Account" option in Settings that: 1) Clearly explains what data will be deleted, 2) Requires confirmation, 3) Actually deletes all user data (not just deactivates), 4) If using Sign in with Apple, revokes tokens via REST API.',
                link: 'https://developer.apple.com/support/offering-account-deletion-in-your-app/',
                severity: 'critical',
            },
            {
                id: 'social-contact-access',
                title: "Don't auto-follow contacts",
                description:
                    "If your app accesses contacts, you cannot automatically follow or add them as friends without explicit user action.",
                why_it_matters:
                    "Auto-adding contacts is a privacy violation that gets apps rejected and can result in removal.",
                action:
                    "Show users their contacts who are on the app, but require them to tap 'Add' or 'Follow' for each one individually.",
                severity: 'important',
            },
        ],
    },
    {
        category: 'Kids',
        tips: [
            {
                id: 'kids-coppa',
                title: 'Kids category has strict COPPA requirements (Guideline 1.3)',
                description:
                    "Per Guideline 1.3: Apps in the Kids category must comply with COPPA and cannot transmit personally identifiable information or device information to third parties. Prohibited data includes: IDFA, name, date of birth, email, location, and any device/network info that could identify users. Third-party analytics/ads are generally prohibited unless they meet strict criteria (no data collection, human-reviewed ad creatives).",
                why_it_matters:
                    "Violations can result in app removal and FTC fines. Note: As of 2025, the amended COPPA rules expanded the definition of personal information to include geolocation, photos/videos with child's image, audio with child's voice, and screen/user names.",
                action:
                    'For Kids apps: 1) Remove third-party analytics that collect ANY identifiable data, 2) No behavioral/targeted advertising, 3) No social features, 4) No links outside app without parental gate, 5) Ads must be human-reviewed for age appropriateness.',
                link: 'https://developer.apple.com/kids/',
                severity: 'critical',
            },
            {
                id: 'kids-parental-gate',
                title: 'External links need parental gates',
                description:
                    "Per Guideline 1.3: Any link that takes users outside your app (web, App Store, other apps) or any purchasing/distracting content requires a parental gate.",
                why_it_matters:
                    "Kids apps without parental gates for external links, purchases, or distractions get rejected.",
                action:
                    'Before any external link or purchase prompt, implement a parental gate: simple math problem, instruction like "Ask a parent to enter 47", or "Have an adult hold these two buttons simultaneously".',
                severity: 'critical',
            },
            {
                id: 'kids-age-rating-2026',
                title: 'New age rating system - respond by January 31, 2026',
                description:
                    "Apple updated the age rating system in 2025 to add 13+, 16+, and 18+ ratings to existing 4+ and 9+. New age rating questions identify sensitive content including AI assistants and chatbot functionality. Developers must provide responses to updated age rating questions by January 31, 2026.",
                why_it_matters:
                    "After January 31, 2026, apps without updated age rating responses may face submission interruptions in App Store Connect.",
                action:
                    'Go to App Store Connect and complete the updated age rating questionnaire before January 31, 2026. Consider how AI features impact your content rating.',
                link: 'https://developer.apple.com/news/?id=ks775ehf',
                severity: 'important',
            },
        ],
    },
    {
        category: 'Shopping',
        tips: [
            {
                id: 'shopping-physical-goods',
                title: 'Physical goods can use external payment',
                description:
                    "Unlike digital goods, physical products and real-world services can be purchased outside of Apple's in-app purchase system.",
                why_it_matters:
                    "This means you can use Stripe, PayPal, or your own payment processor and keep 100% (minus their fees) instead of paying Apple 30%.",
                action:
                    "For physical goods (merchandise, food delivery, ride-sharing), use your preferred payment processor. Only digital goods/services require Apple's IAP.",
                cost_impact: 'Save up to 30% on transactions',
                severity: 'helpful',
            },
            {
                id: 'shopping-reader-rule',
                title: 'Content apps may qualify for Reader App exception',
                description:
                    "Apps that let users access previously purchased content (magazines, newspapers, books, audio, video) may be able to link to external signup.",
                why_it_matters:
                    "Reader apps can now include a link to their website for account management, potentially avoiding 30% Apple tax.",
                action:
                    'If your app is primarily for consuming content purchased elsewhere, review the Reader App guidelines to see if you qualify.',
                link: 'https://developer.apple.com/support/reader-apps/',
                severity: 'helpful',
            },
        ],
    },
    {
        category: 'Education',
        tips: [
            {
                id: 'education-volume-purchase',
                title: 'Consider Volume Purchase Program for schools',
                description:
                    "If your app is for classrooms, enable the Volume Purchase Program (VPP) so schools can buy multiple copies at once.",
                why_it_matters:
                    "Schools prefer VPP apps because they can distribute licenses easily. This can be a major sales channel.",
                action:
                    "In App Store Connect, go to Pricing and Availability > App Distribution Methods > Enable Volume Purchase for educational institutions.",
                severity: 'helpful',
            },
            {
                id: 'education-managed-apple-ids',
                title: 'Support Managed Apple IDs',
                description:
                    "Many schools use Managed Apple IDs which have restrictions. Ensure your app works without features that are blocked (like iCloud, Game Center, etc.).",
                why_it_matters:
                    "If your app requires features blocked by Managed Apple IDs, it won't work in most school deployments.",
                action:
                    "Test your app with iCloud disabled and Game Center unavailable. Provide fallbacks for any restricted features.",
                severity: 'important',
            },
        ],
    },
    {
        category: 'Medical',
        tips: [
            {
                id: 'medical-legal-entity',
                title: 'Medical apps in highly-regulated fields should be submitted by legal entities',
                description:
                    "Per Guideline 5.1.1(ix): Apps in highly-regulated fields like healthcare that require sensitive user information should be submitted by a legal entity providing the services, not an individual developer. Note: Both Individual and Organization accounts cost $99/year.",
                why_it_matters:
                    "Apps connecting to health systems or providing medical services face stricter review. Organization enrollment requires D-U-N-S registration but same $99/year cost as individual.",
                action:
                    "For apps providing health services: 1) Consider enrolling as Organization (same $99/year, shows company name), 2) Prepare documentation of your entity's credentials, 3) Have any regulatory clearances ready for review.",
                cost_impact: '$99/year for both Individual and Organization accounts',
                time_impact: 'D-U-N-S: up to 5 business days + 2 days for Apple sync',
                link: 'https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage',
                severity: 'critical',
            },
            {
                id: 'medical-fda-class',
                title: 'Know your FDA classification - most wellness apps are exempt',
                description:
                    "FDA uses risk-based classification: Class I (low risk, general controls, mostly exempt), Class II (moderate risk, requires 510(k) clearance), Class III (high risk, requires premarket approval). General wellness apps (fitness tracking, mood tracking, step counting) are typically NOT regulated. Apps that diagnose, treat, or monitor specific conditions MAY be medical devices.",
                why_it_matters:
                    "Apple may ask for FDA documentation for apps making diagnostic claims. Per Guideline 1.4.1: Apps claiming to measure via device sensors alone (blood pressure, temperature, glucose, blood oxygen) are NOT permitted.",
                action:
                    "Determine if your app: 1) General wellness only (exempt - step counting, mood tracking, general fitness), 2) Clinical decision support (may be exempt), 3) Transforms device into medical device or controls medical equipment (likely regulated - consult FDA guidance). If you have regulatory clearance, include link in submission.",
                link: 'https://www.fda.gov/medical-devices/digital-health-center-excellence/device-software-functions-including-mobile-medical-applications',
                severity: 'critical',
            },
            {
                id: 'medical-no-sensor-claims',
                title: 'Device sensor measurements are prohibited for medical claims',
                description:
                    "Per Guideline 1.4.1: Apps cannot claim to measure blood pressure, temperature, blood glucose levels, or blood oxygen levels using only device sensors (camera, accelerometer, etc.). These require actual medical devices.",
                why_it_matters:
                    "Apps making these claims are rejected immediately. Even soft claims like 'estimate' or 'approximate' for these measurements will likely be rejected.",
                action:
                    "Remove any claims about measuring medical vitals via phone sensors. If you integrate with actual medical devices (Bluetooth glucose meters, etc.), that's acceptable with proper documentation.",
                severity: 'critical',
            },
        ],
    },
];

// =============================================================================
// FEATURE-SPECIFIC PRO TIPS
// =============================================================================

export const FEATURE_PRO_TIPS: FeatureTips[] = [
    {
        feature: 'Subscriptions',
        detection_hints: ['subscription', 'subscribe', 'premium', 'pro', 'monthly', 'yearly', 'annual'],
        tips: [
            {
                id: 'subs-restore-button',
                title: 'Restore Purchases button is mandatory',
                description:
                    "Every app with subscriptions must have a clearly visible 'Restore Purchases' button.",
                why_it_matters:
                    "This is explicitly checked during review. Missing restore button = automatic rejection.",
                action:
                    "Add a 'Restore Purchases' button on your paywall/subscription screen and in Settings. Make it easy to find.",
                severity: 'critical',
            },
            {
                id: 'subs-free-trial-clarity',
                title: 'Free trial terms must be crystal clear',
                description:
                    "If you offer a free trial, you must clearly state: trial length, when billing starts, how much will be charged, and how to cancel.",
                why_it_matters:
                    "Unclear trial terms lead to user complaints and rejection. Apple is very strict about this.",
                action:
                    'Near your "Start Free Trial" button, display: "7-day free trial, then $9.99/month. Cancel anytime in Settings > Subscriptions."',
                severity: 'critical',
            },
            {
                id: 'subs-price-tiers',
                title: 'Use Apple\'s price tiers for global pricing',
                description:
                    "Apple has preset price tiers that automatically adjust for different currencies and tax regions. Use these instead of manual pricing.",
                why_it_matters:
                    "Price tiers ensure compliant pricing worldwide and automatically handle currency fluctuations.",
                action:
                    "In App Store Connect, select a price tier rather than entering custom amounts. Tier 1 = $0.99, Tier 10 = $9.99, etc.",
                severity: 'helpful',
            },
        ],
    },
    {
        feature: 'In-App Purchases',
        detection_hints: ['in-app purchase', 'IAP', 'buy', 'coins', 'gems', 'credits', 'unlock'],
        tips: [
            {
                id: 'iap-digital-only',
                title: 'Only digital goods must use Apple IAP',
                description:
                    "In-app purchase is required only for digital goods and services consumed within the app. Physical goods, real-world services, and person-to-person services can use external payment.",
                why_it_matters:
                    "Using external payment for digital goods = rejection. Using IAP for physical goods = unnecessary 30% fee.",
                action:
                    "Audit your purchases: Digital content (unlocks, virtual currency, subscriptions) = IAP. Physical goods, food delivery, ride-sharing = external payment OK.",
                severity: 'critical',
            },
            {
                id: 'iap-consumable-restore',
                title: "Consumables don't need restore, but non-consumables do",
                description:
                    "Consumable purchases (coins, gems) don't need to be restored. Non-consumables (unlocks, remove ads) must be restorable.",
                why_it_matters:
                    "If users can't restore their permanent purchases after reinstalling, your app will be rejected.",
                action:
                    "Implement receipt validation and restore functionality for all non-consumable and subscription purchases.",
                severity: 'important',
            },
        ],
    },
    {
        feature: 'Push Notifications',
        detection_hints: ['push notification', 'notification', 'alert', 'reminder'],
        tips: [
            {
                id: 'push-permission-timing',
                title: "Don't ask for notification permission immediately",
                description:
                    "Asking for push notification permission the moment the app opens leads to lower opt-in rates and can be seen as aggressive.",
                why_it_matters:
                    "Users who haven't seen value yet will decline. Once declined, it's hard to ask again.",
                action:
                    "Wait until a logical moment (after completing onboarding, after first meaningful action) to ask for notifications. Explain the benefit first.",
                severity: 'helpful',
            },
            {
                id: 'push-marketing-separate',
                title: 'Separate transactional and marketing notifications',
                description:
                    "Users should be able to opt out of marketing notifications while still receiving important transactional ones.",
                why_it_matters:
                    "Apps that spam notifications get uninstalled. Giving users control increases retention.",
                action:
                    "In your notification settings, let users toggle: 'Important updates' (always on by default), 'Tips & promotions' (optional).",
                severity: 'helpful',
            },
        ],
    },
    {
        feature: 'Camera/Photo Access',
        detection_hints: ['camera', 'photo', 'picture', 'image', 'scan', 'QR'],
        tips: [
            {
                id: 'camera-limited-library',
                title: 'Use Limited Photo Library access when possible',
                description:
                    "iOS 14+ offers 'Limited' photo access where users select specific photos. Use this instead of requesting full library access when you don't need everything.",
                why_it_matters:
                    "Users are more likely to grant limited access than full access. Better privacy = higher trust.",
                action:
                    "Use PHPickerViewController instead of UIImagePickerController for photo selection. It doesn't require permission prompts.",
                severity: 'helpful',
            },
            {
                id: 'camera-usage-string',
                title: 'Write specific camera usage descriptions',
                description:
                    "Vague descriptions like 'This app needs camera access' get rejected. Explain exactly why.",
                why_it_matters:
                    "Apple checks usage descriptions during review. Generic ones are increasingly rejected.",
                action:
                    "Instead of 'To take photos', write 'To scan receipts for expense tracking' or 'To take a profile picture for your account'.",
                severity: 'important',
            },
        ],
    },
    {
        feature: 'Location',
        detection_hints: ['location', 'GPS', 'map', 'nearby', 'geolocation', 'geofence'],
        tips: [
            {
                id: 'location-when-in-use-first',
                title: 'Ask for "When In Use" before "Always"',
                description:
                    'Request "When In Use" location first. Only after the user has seen value should you optionally upgrade to "Always" if truly needed.',
                why_it_matters:
                    "Asking for 'Always' location upfront has very low approval rates and can trigger extra App Review scrutiny.",
                action:
                    'Start with "When In Use". If you need background location, explain why and use the provisional "Always" upgrade flow.',
                severity: 'important',
            },
            {
                id: 'location-background-indicator',
                title: 'Background location shows blue bar',
                description:
                    "When your app uses location in the background, iOS shows a prominent blue bar saying your app is using location.",
                why_it_matters:
                    "Users seeing this bar unexpectedly may delete your app. Make sure background location is truly necessary.",
                action:
                    "Only use background location if essential (navigation, fitness tracking). For check-ins or nearby content, 'When In Use' is sufficient.",
                severity: 'helpful',
            },
        ],
    },
    {
        feature: 'AI/ML Features',
        detection_hints: ['AI', 'artificial intelligence', 'machine learning', 'ML', 'GPT', 'ChatGPT', 'Claude', 'LLM'],
        tips: [
            {
                id: 'ai-content-moderation',
                title: 'AI-generated content needs moderation',
                description:
                    "If your app uses AI to generate content (text, images), you need content filtering to prevent harmful or inappropriate outputs.",
                why_it_matters:
                    "Apps that can generate offensive content via AI get rejected under guideline 1.1.",
                action:
                    "Implement content filtering on AI outputs. Most AI APIs (OpenAI, Claude) have built-in safety filters - keep them enabled. Add your own additional filters for your use case.",
                severity: 'critical',
            },
            {
                id: 'ai-not-human',
                title: "Don't present AI as human",
                description:
                    "If your app has an AI assistant or chatbot, it must be clear to users that they're talking to AI, not a human.",
                why_it_matters:
                    "Presenting AI as human is deceptive and can lead to rejection under guideline 5.6 (Developer Code of Conduct).",
                action:
                    "Clearly label AI features: 'AI Assistant', 'Powered by AI', or 'Chat with our AI'. Never imply human operators when there aren't any.",
                severity: 'important',
            },
            {
                id: 'ai-accuracy-disclaimer',
                title: 'Add AI accuracy disclaimer',
                description:
                    "AI can hallucinate or provide incorrect information. Include a disclaimer that AI responses should be verified.",
                why_it_matters:
                    "If users rely on incorrect AI information, you could face liability and bad reviews.",
                action:
                    'Add a small disclaimer: "AI responses may not always be accurate. Please verify important information."',
                severity: 'helpful',
            },
        ],
    },
    {
        feature: 'Sign In with Apple',
        detection_hints: ['login', 'sign in', 'sign up', 'account', 'authentication', 'Google login', 'Facebook login'],
        tips: [
            {
                id: 'siwa-required',
                title: 'Sign in with Apple OR equivalent privacy-focused login required (updated Jan 2024)',
                description:
                    "Per Guideline 4.8 (updated January 2024): Apps using third-party/social login (Google, Facebook, Twitter, etc.) must ALSO offer Sign in with Apple OR an equivalent alternative that: 1) Limits data collection to name and email, 2) Allows users to keep email private, 3) Does not track users for advertising without consent.",
                why_it_matters:
                    "This was updated in January 2024 - Sign in with Apple is no longer the ONLY option, but you must offer SOME privacy-focused alternative. Most developers still use Sign in with Apple as it's the easiest path to compliance.",
                action:
                    "Either: 1) Add Sign in with Apple (recommended), or 2) Implement equivalent privacy-focused login meeting Apple's three criteria. Display at least as prominently as other login options (same size button, same screen).",
                link: 'https://developer.apple.com/sign-in-with-apple/',
                severity: 'critical',
            },
            {
                id: 'siwa-exceptions',
                title: 'Know the Sign in with Apple exceptions',
                description:
                    "Sign in with Apple/equivalent is NOT required if: 1) Your app uses only your company's own account system, 2) Education/enterprise app requiring institutional account, 3) App uses government/industry citizen ID system, 4) Client app for specific third-party service requiring direct sign-in to access content.",
                why_it_matters:
                    "If you fall into an exception category, you don't need to implement Sign in with Apple. Many developers add it unnecessarily.",
                action:
                    "Review if your app qualifies for an exception. If your app ONLY uses your own account system (no Google, Facebook, etc.), Sign in with Apple is optional.",
                severity: 'helpful',
            },
            {
                id: 'siwa-hide-email',
                title: 'Handle "Hide My Email" relay addresses',
                description:
                    "Users can choose to hide their real email. Sign in with Apple will provide a relay address like 'xyz123@privaterelay.appleid.com' that forwards to their real email.",
                why_it_matters:
                    "If your app validates email domains or requires 'real' emails, it will break for Hide My Email users. This is a significant portion of privacy-conscious users.",
                action:
                    "Accept all email formats from Sign in with Apple. Don't validate domains. Use the unique user ID (not email) as the primary identifier. Emails sent to relay addresses do reach the user.",
                severity: 'important',
            },
        ],
    },
    {
        feature: 'Bluetooth',
        detection_hints: ['bluetooth', 'BLE', 'wireless', 'pair', 'connect device'],
        tips: [
            {
                id: 'bluetooth-background',
                title: 'Bluetooth background modes require justification',
                description:
                    "Using bluetooth-central or bluetooth-peripheral background modes? Apple will ask why it's necessary.",
                why_it_matters:
                    "Unjustified background modes are rejected. You may receive a request for additional information during review.",
                action:
                    "Only enable Bluetooth background modes if truly needed (health devices, IoT control). Prepare a document explaining why background operation is essential.",
                severity: 'important',
            },
        ],
    },
];

// =============================================================================
// GENERAL PRO TIPS (Apply to all apps)
// =============================================================================

export const GENERAL_PRO_TIPS: ProTip[] = [
    {
        id: 'general-review-times',
        title: 'App Store review typically takes 24-48 hours (90% within 24 hours)',
        description:
            "Apple states that 90% of app submissions are reviewed within 24 hours. Most apps are reviewed in 24-48 hours. First-time submissions or complex apps may take longer (up to 72 hours). Finance, health, education, and content-based apps face stricter reviews.",
        why_it_matters:
            "Build 3-5 days buffer into your launch timeline for unexpected delays. Reviews can be slower during holidays (Apple warns about this in December).",
        action:
            "Submit early if you have a deadline. Ensure your app is fully working with test credentials and clear privacy policies to avoid delays from reviewer questions.",
        time_impact: '24-48 hours typical, up to 72 hours for first submissions or complex apps',
        link: 'https://developer.apple.com/distribute/app-review/',
        severity: 'helpful',
    },
    {
        id: 'general-duns-timeline',
        title: 'D-U-N-S registration takes up to 5 business days (not 2-4 weeks)',
        description:
            "Per Apple's official documentation: D-U-N-S numbers are provided by Dun & Bradstreet within up to 5 business days. After receiving your D-U-N-S, allow up to 2 additional business days for Apple to sync the data. Total: approximately 7 business days. Regional variations: USA/Canada fastest (1-5 days), Asia 5-15 days, Africa/Latin America up to 20 days.",
        why_it_matters:
            "Organization enrollment requires D-U-N-S. Plan for 1-2 weeks before you can enroll as an organization, not 2-4 weeks as commonly stated.",
        action:
            "Start D-U-N-S request early at https://developer.apple.com/enroll/duns-lookup/. Have business registration documents ready. If process takes longer than 2 weeks, contact D&B support.",
        time_impact: 'Up to 5 business days for D-U-N-S + 2 days for Apple sync',
        link: 'https://developer.apple.com/help/account/membership/D-U-N-S/',
        severity: 'important',
    },
    {
        id: 'general-pricing',
        title: 'Apple Developer Program: $99/year for BOTH Individual and Organization',
        description:
            "Individual and Organization accounts cost the same: $99 USD per year. The $299/year Apple Developer Enterprise Program is a separate program for internal-only app distribution to employees (requires 100+ employees). Fee waivers available for nonprofits, educational institutions, and government entities.",
        why_it_matters:
            "Many developers incorrectly believe Organization accounts cost more. They cost the same as Individual accounts.",
        action:
            "Choose Organization if you want your company name on the App Store (requires D-U-N-S). Choose Individual if publishing under your personal name.",
        cost_impact: '$99/year for both Individual and Organization',
        link: 'https://developer.apple.com/support/compare-memberships/',
        severity: 'helpful',
    },
    {
        id: 'general-ai-transparency-2025',
        title: 'AI transparency requirement enforcement starting November 2025',
        description:
            "Starting November 13, 2025, Apple enforces updated AI transparency guidelines: Developers must clearly inform users if personal data is shared with third-party AI services and secure explicit consent before proceeding.",
        why_it_matters:
            "Apps using third-party AI (OpenAI, Claude, etc.) must disclose this and get user consent for data sharing.",
        action:
            "If your app uses third-party AI services: 1) Add clear disclosure about AI data sharing, 2) Implement consent mechanism before sending user data to AI services, 3) Update privacy policy to reflect AI usage.",
        severity: 'important',
    },
    {
        id: 'general-ios26-sdk-april-2026',
        title: 'iOS 26 SDK required for all submissions starting April 2026',
        description:
            "Starting April 2026, all app submissions must be built with the iOS 26 SDK or later. This requires Xcode 17 or later.",
        why_it_matters:
            "Apps built with older SDKs will be rejected after April 2026. Plan your Xcode upgrade timeline.",
        action:
            "Update to Xcode 17+ and iOS 26 SDK before April 2026. Test your app thoroughly with the new SDK.",
        link: 'https://developer.apple.com/news/upcoming-requirements/',
        severity: 'important',
    },
    {
        id: 'general-vpn-crypto-org-required',
        title: 'VPN and Crypto Wallet apps REQUIRE Organization enrollment',
        description:
            "Per Guidelines 5.4 and 3.1.5: VPN apps and cryptocurrency wallet apps must be enrolled as an Organization (not Individual). VPNs must use NEVPNManager API. Crypto wallets must facilitate virtual currency storage only.",
        why_it_matters:
            "Individual developers cannot publish VPN or crypto wallet apps. These categories have explicit Organization requirements.",
        action:
            "If building VPN or crypto wallet: 1) Enroll as Organization ($99/year, requires D-U-N-S), 2) For VPN: use NEVPNManager API, 3) Prepare documentation about your organization's credentials.",
        severity: 'critical',
    },
    {
        id: 'general-loan-app-restrictions',
        title: 'Personal loan apps have strict APR and term restrictions',
        description:
            "Per Guideline 3.2.1(viii): Personal loan apps must disclose all loan terms including APR. Maximum APR is capped at 36% including all fees. Loans cannot require repayment in 60 days or less.",
        why_it_matters:
            "Predatory lending apps are rejected. These restrictions are strictly enforced.",
        action:
            "If offering loans: 1) Display all terms clearly before commitment, 2) Ensure APR (including fees) is 36% or less, 3) Loan term must be greater than 60 days, 4) Include required licensing documentation.",
        severity: 'critical',
    },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets all applicable pro tips based on the app's category and detected features.
 * Includes general tips that apply to all apps.
 */
export function getApplicableProTips(
    category: string,
    description: string,
    manifestContent?: string,
    includeGeneralTips: boolean = true
): ProTip[] {
    const tips: ProTip[] = [];
    const searchText = `${description} ${manifestContent || ''}`.toLowerCase();

    // Get category-specific tips
    const categoryTips = CATEGORY_PRO_TIPS.find(
        c => c.category.toLowerCase() === category.toLowerCase()
    );
    if (categoryTips) {
        tips.push(...categoryTips.tips);
    }

    // Get feature-specific tips based on detection hints
    for (const featureTips of FEATURE_PRO_TIPS) {
        const hasFeature = featureTips.detection_hints.some(hint =>
            searchText.includes(hint.toLowerCase())
        );
        if (hasFeature) {
            tips.push(...featureTips.tips);
        }
    }

    // Include general tips that apply to all apps
    if (includeGeneralTips) {
        tips.push(...GENERAL_PRO_TIPS);
    }

    // Deduplicate by ID
    const seen = new Set<string>();
    return tips.filter(tip => {
        if (seen.has(tip.id)) return false;
        seen.add(tip.id);
        return true;
    });
}

/**
 * Gets only the general pro tips that apply to all apps.
 */
export function getGeneralProTips(): ProTip[] {
    return [...GENERAL_PRO_TIPS];
}

/**
 * Gets all pro tips organized by severity.
 */
export function getProTipsBySeverity(tips: ProTip[]): {
    critical: ProTip[];
    important: ProTip[];
    helpful: ProTip[];
} {
    return {
        critical: tips.filter(t => t.severity === 'critical'),
        important: tips.filter(t => t.severity === 'important'),
        helpful: tips.filter(t => t.severity === 'helpful'),
    };
}
