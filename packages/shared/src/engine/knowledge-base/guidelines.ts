/**
 * Structured Apple App Store Review Guidelines
 * Source: https://developer.apple.com/app-store/review/guidelines/
 *
 * Organized by the 5 major sections Apple uses.
 * Each guideline includes section number for reference in reports.
 */

export interface Guideline {
    section: string;
    title: string;
    summary: string;
}

export const GUIDELINES: Record<string, Guideline> = {
    // Section 1: Safety
    '1.1': {
        section: '1.1',
        title: 'Objectionable Content',
        summary: 'Apps should not include content that is offensive, insensitive, upsetting, intended to disgust, in exceptionally poor taste, or just plain creepy.',
    },
    '1.2': {
        section: '1.2',
        title: 'User-Generated Content',
        summary: 'Apps with user-generated content must include content filtering, reporting mechanisms, blocking capabilities, and published contact info for concerns. Developers are responsible for removing content that violates Guideline 1.2 and may need to provide an improvement plan after App Review identifies violative content. Random or anonymous chat apps (Chatroulette-style, anonymous messaging) are explicitly prohibited and may be removed without notice.',
    },
    '1.3': {
        section: '1.3',
        title: 'Kids Category',
        summary: 'Apps in the Kids category must not include links out, purchasing opportunities, or other distractions unless reserved for a designated area behind a parental gate.',
    },
    '1.4': {
        section: '1.4',
        title: 'Physical Harm',
        summary: 'Apps should not encourage illegal or reckless behavior that could result in physical harm.',
    },
    '1.5': {
        section: '1.5',
        title: 'Developer Information',
        summary: 'Developers must provide accurate contact information and be reachable by users and Apple. A support URL is required.',
    },
    '1.6': {
        section: '1.6',
        title: 'Data Security',
        summary: 'Apps must implement appropriate security measures to ensure proper handling of user information collected pursuant to the Apple Developer Program License Agreement and these Guidelines.',
    },
    '1.7': {
        section: '1.7',
        title: 'Reporting Criminal Activity',
        summary: 'Apps must report child sexual abuse material (CSAM) and other criminal content to appropriate authorities.',
    },
    '1.2.1': {
        section: '1.2.1',
        title: 'Creator Content Age Rating Controls',
        summary: 'Creator-content apps must moderate user-generated creator content, communicate which content requires additional purchases, and provide a way for users to identify content that exceeds the app age rating. Under 1.2.1(a), creator apps must use an age restriction mechanism based on verified or declared age to limit underage access to content above the app rating.',
    },
    'ASC-Time-Allowances': {
        section: 'ASC-Time-Allowances',
        title: 'Time Allowances Social Media Declaration',
        summary: 'Starting July 2026, the App Store Connect age rating questionnaire lets developers indicate whether apps or games include social media capabilities. Starting September 2026, apps and games must provide this declaration when submitting new versions or updates. Apps that redistribute, amplify, or interact with user-generated content through feeds or similar discovery methods may be classified as Social Media for Time Allowances and receive a minimum 13+ age rating unless under-13 access is disabled and checked with the Declared Age Range API.',
    },
    'ASC-Australia-Social-Media': {
        section: 'ASC-Australia-Social-Media',
        title: 'Australia Social Media Age Restrictions',
        summary: 'Beginning December 10, 2025, certain social media platforms operating in Australia must prevent people under 16 from having a social media account. Apple recommends using age assurance such as the Declared Age Range API, accurate App Store description text, in-app controls disclosures, higher age ratings when appropriate, and an Age Suitability URL for region-specific details.',
    },
    'ASC-Regional-Age-Ratings': {
        section: 'ASC-Regional-Age-Ratings',
        title: 'Regional Age Rating Values',
        summary: 'App Store Connect maps age rating questionnaire answers into global ratings and region-specific ratings. Developers must answer the updated questionnaire, including in-app controls, capabilities, medical or wellness topics, violent themes, and the effect of AI assistants or chatbot functionality on sensitive-content frequency. Australia now maps loot boxes to 16+ and infrequent simulated gambling to R 18+; Vietnam uses 00+, 12+, 16+, and 18+ regional ratings; and Korea can show GRAC-driven All, 12+, 15+, or 19+ regional ratings for Games, Entertainment, or simulated-gambling apps.',
    },
    'ASC-Regional-Age-Assurance': {
        section: 'ASC-Regional-Age-Assurance',
        title: 'Regional Age Assurance Requirements',
        summary: 'Apple provides Declared Age Range, PermissionKit Significant Update actions, StoreKit age rating properties, and App Store Server Notifications to help developers meet regional age-assurance obligations in Texas, Brazil, Australia, Singapore, Utah, and Louisiana. Apple says the full regional age-assurance framework set requires building with Xcode 26.2 and the iOS/iPadOS 26.2 SDK or later, with additional required-regulatory-feature and significant-update acknowledgement APIs in iOS/iPadOS 26.4. Since June 4, 2026, new Apple Accounts in Texas are subject to SB2420 age assurance, parent or guardian consent for downloads, Apple In-App Purchases, and significant changes, plus consent-revocation notifications. For new Apple Accounts in Utah as of May 6, 2026, and Louisiana as of July 1, 2026, age categories are shared with apps when requested through the Declared Age Range API. Since February 24, 2026, the App Store blocks 18+ downloads in Australia, Brazil, and Singapore unless users are confirmed adults, and developers may still have separate obligations to independently confirm age or obtain parent or guardian permission for significant updates. Sandbox testing for age ranges, location-based restrictions, approval-state changes, and consent revocation starts with iOS/iPadOS 26.2.',
    },
    'ASC-Accessibility-Nutrition-Labels': {
        section: 'ASC-Accessibility-Nutrition-Labels',
        title: 'Accessibility Nutrition Labels',
        summary: 'App Store Connect lets developers publish Accessibility Nutrition Labels for supported device families. Labels are voluntary at launch, but Apple says accessibility support details will eventually be required for new apps and updates. Developers should audit common tasks before claiming support, keep responses current, and avoid misleading accessibility metadata under Guideline 2.3.',
    },

    // Section 2: Performance
    '2.1': {
        section: '2.1',
        title: 'App Completeness',
        summary: 'Submissions must be final versions with all necessary metadata and URLs fully functional. Test and placeholder content must be removed. In-app purchase products and subscriptions must be complete, visible, functional, in a reviewable App Store Connect state, and submitted through Apple\'s separate IAP/subscription review flow; first-time IAPs and subscriptions must be submitted with a new app version.',
    },
    '2.3': {
        section: '2.3',
        title: 'Accurate Metadata',
        summary: 'Metadata must accurately reflect app functionality. App name, description, screenshots must not include misleading content, pricing info in the name, or reference other platforms.',
    },
    '2.3.2': {
        section: '2.3.2',
        title: 'In-App Purchase Metadata',
        summary: 'Apps with in-app purchases must make descriptions, screenshots, previews, display names, promotional images, and other public IAP metadata appropriate and accurate. Promoted IAP and win-back offer images should uniquely represent the product or offer and must not reuse the app icon, app screenshots, or duplicate images across promoted items.',
    },
    '2.3.7': {
        section: '2.3.7',
        title: 'Accurate Screenshots',
        summary: 'Screenshots must accurately represent the app experience. Marketing text in screenshots must reflect actual app functionality.',
    },
    '2.4': {
        section: '2.4',
        title: 'Hardware Compatibility',
        summary: 'Apps must work on current hardware and OS versions. Apps should not bundle unused frameworks or perform unnecessary background processing.',
    },
    '2.5': {
        section: '2.5',
        title: 'Software Requirements',
        summary: 'Apps must be self-contained, use documented APIs, and not download executable code. Required frameworks must be embedded in the bundle.',
    },
    '2.5.2': {
        section: '2.5.2',
        title: 'Self-Contained App Bundle',
        summary: 'Apps must be self-contained and may not download, install, or execute code that introduces or changes app features or functionality after App Review. Educational coding apps have a limited exception only when downloaded code is used solely for education and the source is completely viewable and editable by the user.',
    },

    '2.5.14': {
        section: '2.5.14',
        title: 'Recording and Logging',
        summary: 'Apps that record camera, microphone, screen, or user inputs must request explicit user consent and provide a clear visual or audible indication when recording is active. This includes analytics SDKs that capture screen recordings.',
    },
    '2.5.18': {
        section: '2.5.18',
        title: 'Display Advertising',
        summary: 'Display ads must be limited to the main app binary (not extensions, App Clips, widgets, keyboards, or watchOS). Interstitial ads must have visible close buttons. Apps must include the ability to report ads. Behavioral/targeted ads based on health, medical, school, or children\'s data are prohibited.',
    },

    // Section 3: Business
    '3.1': {
        section: '3.1',
        title: 'Payments',
        summary: 'In-app purchases must use the In-App Purchase API unless a regional external-purchase exception applies. Physical goods/services can use external payment.',
    },
    '3.1.1': {
        section: '3.1.1',
        title: 'In-App Purchase',
        summary: 'Apps offering digital goods or services for purchase must use In-App Purchase unless they qualify for and correctly implement a regional external-purchase option. This includes subscriptions, premium features, and digital content.',
    },
    '3.1.2': {
        section: '3.1.2',
        title: 'Subscriptions',
        summary: 'Auto-renewable subscription apps must clearly describe subscription terms, pricing, billing duration, renewal behavior, and free trial conditions before purchase. Variations of the same subscription service should be configured inside one App Store Connect subscription group so customers can upgrade, downgrade, and crossgrade cleanly. Paywalls should not use confusing trial toggles, hidden trial terms, misleading visual hierarchy, or unclear eligibility flows that could prevent users from understanding what they will be charged. If offering monthly billing with a 12-month commitment, disclose the monthly price, total commitment price, number of required payments, and cancellation/renewal behavior, and handle StoreKit commitment metadata correctly.',
    },
    '3.1.1(a)': {
        section: '3.1.1(a)',
        title: 'External Purchase Links and Alternative Payments',
        summary: 'Apps may communicate or offer alternative purchase methods for digital goods only where Apple permits them, such as the United States storefront, EU storefronts with the required StoreKit External Purchase Link entitlement, Japan on iOS 26.2 or later, and Brazil on iOS 26.5 or later with the StoreKit External Purchases or Offers entitlement. Current Apple Developer Program members must accept the updated agreement terms for Brazil options by July 6, 2026. Follow regional disclosure, eligibility, review-note, reporting, and child-safety requirements, including parental gates or consent where required and StoreKit canMakePayments checks before purchase or payment-information flows. For Japan, external-purchase reports are manual on iOS 26.2 and 26.3, and use the External Purchase Server API on iOS 26.4 or later.',
    },
    '3.1.5': {
        section: '3.1.5',
        title: 'Crypto and NFTs',
        summary: 'Apps may facilitate cryptocurrency transactions and display NFTs. Crypto apps must comply with local regulations. NFTs cannot unlock features or functionality within the app.',
    },
    '3.2.2(ix)': {
        section: '3.2.2(ix)',
        title: 'Lending APR Cap',
        summary: 'Loan and lending apps must not offer annual percentage rates exceeding 36%. All rates, fees, and repayment terms must be clearly disclosed before the user commits.',
    },
    '3.2': {
        section: '3.2',
        title: 'Other Business Model Issues',
        summary: 'Apps must not be designed for the purpose of advertising, contain no substantive content, or act as a simple web clip.',
    },

    // Section 4: Design
    '4.0': {
        section: '4.0',
        title: 'Design - General',
        summary: 'Apps should provide a unique, high-quality experience. Simple websites repackaged as apps or apps with minimal functionality may be rejected.',
    },
    '4.1': {
        section: '4.1',
        title: 'Copycats',
        summary: 'Apps must not simply duplicate another app or be a mere copy. Create something unique and useful.',
    },
    '4.2': {
        section: '4.2',
        title: 'Minimum Functionality',
        summary: 'Apps should include sufficient content and features to provide value beyond a repackaged website.',
    },
    '4.3': {
        section: '4.3',
        title: 'Spam',
        summary: 'Do not create multiple Bundle IDs for the same app or submit apps that are indistinguishable from what is already widely available. Apple may reject or remove low-value apps in saturated categories.',
    },
    '4.3(a)': {
        section: '4.3(a)',
        title: 'Duplicate App Bundle IDs',
        summary: 'Do not create multiple Bundle IDs for essentially the same app, such as separate city, team, school, or location variants. Use one app with in-app variation where possible.',
    },
    '4.3(b)': {
        section: '4.3(b)',
        title: 'Low-Value or Saturated App Categories',
        summary: 'Apps must not be indistinguishable from popular or widely available categories. Dating, flashlight, sound effects, wallpaper, simple timer, and fortune telling apps need a meaningfully different or improved experience, and repeated low-effort submissions can put the developer account at risk.',
    },
    '4.1(c)': {
        section: '4.1(c)',
        title: 'Copycat Enforcement (Strengthened)',
        summary: 'Strengthened in November 2025. Apps must not replicate the UI, branding, or core functionality of existing popular apps. Apple now uses automated detection for copycat identification.',
    },
    '4.7': {
        section: '4.7',
        title: 'Mini Apps, Mini Games, Streaming Games, Chatbots, and Plug-ins',
        summary: 'Apps that host mini apps, streaming games, chatbots, or plug-ins must ensure each is individually reviewed. Mini apps cannot download executable code beyond what is in the app bundle.',
    },
    '4.7.2': {
        section: '4.7.2',
        title: 'Mini App Content Standards',
        summary: 'Mini apps must meet the same content standards as standalone apps. The host app is responsible for ensuring all mini apps comply with the App Store Review Guidelines.',
    },
    '4.7.5': {
        section: '4.7.5',
        title: 'Streaming Game Services',
        summary: 'Streaming game services may offer a catalog app. Each game must have its own product page on the App Store and be individually reviewed.',
    },
    '4.8': {
        section: '4.8',
        title: 'Sign in with Apple',
        summary: 'Apps that use third-party social login (Google, Facebook, etc.) must also offer Sign in with Apple as an equivalent option. Required since iOS 13.',
    },
    '4.9': {
        section: '4.9',
        title: 'Apple Pay',
        summary: 'Apps using Apple Pay must provide all material purchase information to the user prior to sale and must use Apple Pay branding and user interface elements correctly per Apple\'s guidelines and identity standards.',
    },
    '4.10': {
        section: '4.10',
        title: 'Monetizing Built-In Capabilities',
        summary: 'Apps may not monetize built-in hardware or OS capabilities (e.g., push notifications, camera, gyroscope) or Apple services. Apps that do so may be rejected.',
    },
    '4.5.3': {
        section: '4.5.3',
        title: 'Apple Services Misuse',
        summary: 'Do not use Apple services, including Game Center, Push Notifications, or Live Activities, to spam, phish, send unsolicited messages, or exploit user identifiers.',
    },
    'ASC-Game-Center-Entitlement': {
        section: 'ASC-Game-Center-Entitlement',
        title: 'Game Center Entitlement and Configuration',
        summary: 'New apps and app updates for iOS, iPadOS, or tvOS that offer Game Center features must include the Game Center entitlement in the entitlements plist and configure Game Center features in App Store Connect before submission.',
    },

    // Section 5: Legal
    '5.1': {
        section: '5.1',
        title: 'Privacy',
        summary: 'Apps must comply with applicable privacy laws and include a privacy policy. Data collection must be disclosed and limited to what is necessary. Developers are responsible for third-party SDK code included in the app, including privacy manifests for Apple-listed commonly used SDKs and valid signatures when those listed SDKs are added as binary dependencies.',
    },
    '5.1.1': {
        section: '5.1.1',
        title: 'Data Collection and Storage',
        summary: 'Apps that collect personal data must have a privacy policy and secure user consent. Only collect data necessary for the app\'s core functionality. Apps using third-party AI services must disclose what user data is shared and identify those services in the privacy policy.',
    },
    '5.1.2': {
        section: '5.1.2',
        title: 'Data Use and Sharing',
        summary: 'Data collected for one purpose must not be repurposed without user consent. Per 5.1.2(i), apps must clearly disclose where personal data will be shared, including with third-party AI, and obtain explicit permission before sharing it.',
    },
    '5.2': {
        section: '5.2',
        title: 'Intellectual Property',
        summary: 'Apps must not infringe on third-party intellectual property rights. Use only content you have rights to.',
    },
    '5.3': {
        section: '5.3',
        title: 'Gaming, Gambling, and Lotteries',
        summary: 'Gambling apps must be geo-restricted to jurisdictions where legal and require appropriate licenses. Fixed-odds betting apps distributed in Brazil require a valid SPA license and supporting details in App Review Information.',
    },
    'ASC-Brazil-Betting-License': {
        section: 'ASC-Brazil-Betting-License',
        title: 'Brazil Fixed-Odds Betting License',
        summary: 'Apps with fixed-odds betting features can be distributed on the App Store in Brazil only with a valid fixed-odds betting license from the Secretariat of Prizes and Bets (SPA). Developers must submit a new app version, enter license details in App Review notes, and attach supporting documents to start license verification.',
    },
    '5.4': {
        section: '5.4',
        title: 'VPN Apps',
        summary: 'VPN apps must use the NEVPNManager API and may not sell or distribute data.',
    },
    '5.1.3': {
        section: '5.1.3',
        title: 'Health and Health Research',
        summary: 'Health research apps must obtain informed consent and approval from an ethics review board. Health data must be handled with extra care and not shared with third parties for non-health purposes.',
    },
    'ASC-Regulated-Medical-Device': {
        section: 'ASC-Regulated-Medical-Device',
        title: 'Regulated Medical Device Status',
        summary: 'Health & Fitness or Medical apps, and apps marked as containing frequent Medical or Treatment Information, may need to provide a regulated medical device status in App Store Connect for distribution in the EEA, UK, or U.S. New qualifying apps require this status now; existing qualifying apps must provide it by early 2027 to continue submitting updates.',
    },
    '5.1.4': {
        section: '5.1.4',
        title: 'Kids',
        summary: 'Apps in the Kids category or that target children under 13 must comply with COPPA and similar laws. No third-party analytics, advertising, or data collection is permitted.',
    },
    '5.1.5': {
        section: '5.1.5',
        title: 'Location Services',
        summary: 'Use Location Services only when it is directly relevant to the features and services provided by the app. Location-based APIs should not be used to provide emergency services or for autonomous vehicle control.',
    },
    '5.5': {
        section: '5.5',
        title: 'Mobile Device Management',
        summary: 'MDM apps that offer Mobile Device Management services must request the MDM capability from Apple. MDM must only be used by commercial enterprises, educational institutions, or government agencies. MDM apps may not sell, use, or disclose data to third parties.',
    },
    '5.5.1': {
        section: '5.5.1',
        title: 'EU Digital Services Act',
        summary: 'Apps distributed in the EU must comply with the Digital Services Act. Developers must declare their trader status and provide required business information in App Store Connect. Non-compliance led to 135,000+ app removals in 2025.',
    },
    '5.6': {
        section: '5.6',
        title: 'Developer Code of Conduct',
        summary: 'Developers must act with integrity. Repeated policy violations or manipulative behavior can result in removal from the program.',
    },
} as const;

/**
 * Get a guideline reference string for use in reports
 */
export function getGuidelineRef(section: string): string {
    const guideline = GUIDELINES[section];
    if (!guideline) return `Section ${section}`;
    return `Section ${section} - ${guideline.title}`;
}
