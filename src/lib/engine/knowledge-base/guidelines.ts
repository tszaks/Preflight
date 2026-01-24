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

    // Section 5: Legal
    '5.1': {
        section: '5.1',
        title: 'Privacy',
        summary: 'Apps must comply with applicable privacy laws and include a privacy policy. Data collection must be disclosed and limited to what is necessary.',
    },
    '5.1.1': {
        section: '5.1.1',
        title: 'Data Collection and Storage',
        summary: 'Apps that collect personal data must have a privacy policy and secure user consent. Only collect data necessary for the app\'s core functionality.',
    },
    '5.1.2': {
        section: '5.1.2',
        title: 'Data Use and Sharing',
        summary: 'Data collected for one purpose must not be repurposed without user consent. Data must not be shared with third parties without disclosure.',
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
