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
        summary: 'Apps with user-generated content must include content filtering, reporting mechanisms, blocking capabilities, and published contact info for concerns.',
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
        title: 'Alternative Dispute Resolution',
        summary: 'Developers may include information about alternative dispute resolution in their metadata.',
    },
    '1.7': {
        section: '1.7',
        title: 'Reporting Criminal Activity',
        summary: 'Apps must report child sexual abuse material (CSAM) and other criminal content to appropriate authorities.',
    },
    '1.2.1': {
        section: '1.2.1',
        title: 'Creator Age Requirements',
        summary: 'Apps with user-generated content must verify that content creators meet the minimum age requirement (13+ or local minimum). Added November 2025.',
    },

    // Section 2: Performance
    '2.1': {
        section: '2.1',
        title: 'App Completeness',
        summary: 'Submissions must be final versions with all necessary metadata and URLs fully functional. Test and placeholder content must be removed.',
    },
    '2.3': {
        section: '2.3',
        title: 'Accurate Metadata',
        summary: 'Metadata must accurately reflect app functionality. App name, description, screenshots must not include misleading content, pricing info in the name, or reference other platforms.',
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

    // Section 3: Business
    '3.1': {
        section: '3.1',
        title: 'Payments',
        summary: 'In-app purchases must use the In-App Purchase API. Digital content and services must be purchased through Apple. Physical goods/services can use external payment.',
    },
    '3.1.1': {
        section: '3.1.1',
        title: 'In-App Purchase',
        summary: 'Apps offering digital goods or services for purchase must use In-App Purchase. This includes subscriptions, premium features, and digital content.',
    },
    '3.1.1(a)': {
        section: '3.1.1(a)',
        title: 'External Payment Links (US)',
        summary: 'Per the Epic v. Apple ruling (May 2025), US apps may include links to external payment methods for digital goods. Must use StoreKit External Link Account API and display Apple\'s required disclosure sheet.',
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
        summary: 'Do not create multiple Bundle IDs for the same app. Apps that are essentially the same should be combined into a single app.',
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
        title: 'Streaming Games',
        summary: 'Streaming game services can offer their games through the App Store. Individual games within the service must each appear as a separate listing.',
    },
    '4.10': {
        section: '4.10',
        title: 'Notarization for Sideloading (EU)',
        summary: 'In the EU under the Digital Markets Act, apps distributed outside the App Store must still undergo Apple\'s notarization process for baseline security and privacy checks.',
    },

    // Section 5: Legal
    '5.1': {
        section: '5.1',
        title: 'Privacy',
        summary: 'Apps must comply with applicable privacy laws and include a privacy policy. Data collection must be disclosed and limited to what is necessary.',
    },
    '5.1.1': {
        section: '5.1.1',
        title: 'Data Collection and Storage',
        summary: 'Apps that collect personal data must have a privacy policy and secure user consent. Only collect data necessary for the app\'s core functionality. Apps using AI features must disclose data sharing with third-party AI services.',
    },
    '5.1.2': {
        section: '5.1.2',
        title: 'Data Use and Sharing',
        summary: 'Data collected for one purpose must not be repurposed without user consent. Data must not be shared with third parties without disclosure. Per 5.1.2(i), apps must obtain explicit consent before sending user data to third-party AI/ML services.',
    },
    '5.2': {
        section: '5.2',
        title: 'Intellectual Property',
        summary: 'Apps must not infringe on third-party intellectual property rights. Use only content you have rights to.',
    },
    '5.3': {
        section: '5.3',
        title: 'Gaming, Gambling, and Lotteries',
        summary: 'Gambling apps must be geo-restricted to jurisdictions where legal and require appropriate licenses.',
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
    '5.1.4': {
        section: '5.1.4',
        title: 'Kids',
        summary: 'Apps in the Kids category or that target children under 13 must comply with COPPA and similar laws. No third-party analytics, advertising, or data collection is permitted.',
    },
    '5.1.5': {
        section: '5.1.5',
        title: 'Sign in with Apple',
        summary: 'If your app exclusively uses a third-party or social login service to set up or authenticate the user, you must also offer Sign in with Apple as an equivalent option.',
    },
    '5.5': {
        section: '5.5',
        title: 'EU Digital Services Act',
        summary: 'Apps distributed in the EU must comply with the Digital Services Act. Developers must declare their trader status and provide required business information. Non-compliance led to 135,000+ app removals in 2025.',
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
