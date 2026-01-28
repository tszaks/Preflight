/**
 * Actual Apple App Store Review Guidelines text.
 * Injected into AI prompts so Claude references REAL guidelines, not hallucinated ones.
 *
 * Source: https://developer.apple.com/app-store/review/guidelines/
 * Last updated: 2025
 */

export const GUIDELINES_TEXT: Record<string, string> = {
    '1.1': `Section 1.1 - Objectionable Content
Apps should not include content that is offensive, insensitive, upsetting, intended to disgust, in exceptionally poor taste, or just plain creepy. Apps with user-generated content or services that end up being used primarily for pornographic content, Chatroulette-style experiences, objectification of real people, making physical threats, or bullying may be removed.`,

    '1.2': `Section 1.2 - User-Generated Content
Apps with user-generated content or services must include:
(i) A method for filtering objectionable material from being posted to the app
(ii) A mechanism for users to flag objectionable content
(iii) The ability to block abusive users from the service
(iv) Published contact information so users can easily reach you
Apps with user-generated content must take care not to include content that facilitates harassment, threats, or bullying.`,

    '1.3': `Section 1.3 - Kids Category
Apps in the Kids category must not include links out of the app, purchasing opportunities, or other distractions to kids unless reserved for a designated area behind a parental gate. Apps in the Kids category should not include third-party analytics or third-party advertising.`,

    '1.4': `Section 1.4 - Physical Harm
Apps should not encourage illegal or reckless behavior. Medical apps that provide inaccurate data or information, or that could be used as a diagnostic tool, could put patients at risk and will be rejected.`,

    '2.1': `Section 2.1 - App Completeness
Submissions to App Review, including apps you make available for pre-order, should be final versions with all necessary metadata and fully functional URLs included. All placeholder text, empty websites, and other temporary content should be cleaned up before submitting.`,

    '2.3': `Section 2.3 - Accurate Metadata
Customers should know what they're getting when they download or buy your app, so make sure all your app metadata, including privacy information, is accurate. The app description, screenshots, and previews should accurately reflect the app's core experience.
Don't include: misleading content, prices in the app name or screenshots (unless your app is about price comparison), references to other mobile platforms, or content that doesn't reflect the app's purpose.`,

    '2.3.7': `Section 2.3.7 - Accurate Screenshots
App screenshots and previews should reflect the actual app experience and not include content that doesn't accurately represent what the user will see. Marketing text overlay is permitted but should not dominate the screenshot or misrepresent app functionality.`,

    '2.4': `Section 2.4 - Hardware Compatibility
To ensure people get the most out of your app, iPhone apps should run on iPad whenever possible. Apps should use APIs and frameworks for their intended purposes and indicate in the Xcode project which interfaces your app supports.`,

    '2.5': `Section 2.5 - Software Requirements
Apps must be self-contained, may not read or write data outside the designated container area, may not download, install, or execute code, and should not use documented APIs for unintended purposes. Apps must use the appropriate APIs and frameworks.`,

    '3.1': `Section 3.1 - Payments
If you want to unlock features or functionality within your app (by way of subscriptions, in-game currencies, game levels, access to premium content, or unlocking a full version), you must use in-app purchase. Apps may not use their own mechanisms to unlock content or functionality.`,

    '3.1.1': `Section 3.1.1 - In-App Purchase
Apps offering digital goods or services for purchase must use in-app purchase. This includes subscriptions, game currencies, game levels, access to premium content, or unlocking a full version. Apps must not directly or indirectly target iOS users to use a purchasing method other than in-app purchase.

Auto-renewable subscriptions:
- Must provide ongoing value
- Must clearly identify subscription terms, pricing, and renewal behavior
- Users must be able to manage and cancel subscriptions easily`,

    '3.2': `Section 3.2 - Other Business Model Issues
The following are not appropriate for the App Store:
(i) Creating an app that appears confusingly similar to an existing app
(ii) Monetizing built-in capabilities provided by the hardware or operating system
(iii) Apps that are primarily marketing materials or ads`,

    '4.0': `Section 4.0 - Design (General)
Apple values simplicity, refinement, and innovation in app design. Apps should provide a unique, high-quality experience. Apps that offer little value, are poorly designed, or just bundle web content, will be rejected.`,

    '4.1': `Section 4.1 - Copycats
Come up with your own ideas. Don't simply copy the latest popular app on the App Store, or make some minor changes to another app's name or UI and pass it off as your own.`,

    '4.2': `Section 4.2 - Minimum Functionality
Your app should include features, content, and UI that elevate it beyond a repackaged website. If your app doesn't provide some sort of lasting entertainment value or adequate utility, it may not be accepted.`,

    '4.3': `Section 4.3 - Spam
Don't create multiple Bundle IDs of the same app. If your app has different versions for specific locations, sports teams, universities, etc., consider submitting a single app and provide the variations using in-app purchase.`,

    '5.1': `Section 5.1 - Privacy
Protecting user privacy is paramount in the Apple ecosystem. Apps must comply with all applicable legal requirements, include a privacy policy accessible within the app and on the App Store listing, and request access only to data relevant to the core functionality of the app.`,

    '5.1.1': `Section 5.1.1 - Data Collection and Storage
(i) Apps that collect user or usage data must have a privacy policy and secure user consent
(ii) Apps that store personal data must do so securely
(iii) Apps using Apple's APIs to collect data must clearly identify the usage in the app's privacy manifest
(iv) Apps must not require users to share personal data to function, unless directly relevant
(v) Apps connected to financial services must use appropriate encryption and security measures`,

    '5.1.2': `Section 5.1.2 - Data Use and Sharing
(i) Data collected for one purpose must not be repurposed without user consent
(ii) Data must not be shared with third parties who do not have a privacy policy
(iii) Data shared with third parties must be limited to what is necessary
(iv) Apps must not secretly collect data or transmit data about the user without consent`,

    '5.2': `Section 5.2 - Intellectual Property
Make sure your app only includes content that you created or that you have a license to use. If you've gone beyond what's allowed, your app may be removed.`,

    '5.3': `Section 5.3 - Gaming, Gambling, and Lotteries
Gambling, gaming, and lotteries can be tricky to manage. Apps that offer real-money gambling must have necessary licensing, be geo-restricted, and be free on the App Store. Lottery apps must be sponsored by the lottery authority.`,

    '5.6': `Section 5.6 - Developer Code of Conduct
Please treat everyone with respect, whether in your app or in developer interactions. Repeated manipulative or deceptive behavior or other fraudulent conduct will result in your removal from the Apple Developer Program.`,
};

/**
 * Get formatted guideline text for specific sections.
 * Returns a string suitable for injection into AI prompts.
 */
export function getGuidelinesText(sections: string[]): string {
    const texts: string[] = [];

    for (const section of sections) {
        const text = GUIDELINES_TEXT[section];
        if (text) {
            texts.push(text);
        }
    }

    if (texts.length === 0) return '';

    return `\n=== RELEVANT APPLE GUIDELINES (Use ONLY these section numbers in your findings) ===\n\n${texts.join('\n\n')}\n\n=== END GUIDELINES ===`;
}
