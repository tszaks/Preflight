import type { CategoryContext } from './index';

export const SOCIAL_CONTEXT: CategoryContext = {
    category: 'Social Networking',
    common_patterns: [
        'User profiles with avatars, bios, and follower counts are standard social features',
        'Content feeds with likes, comments, and shares are expected UGC patterns',
        'Direct messaging and chat features are standard communication tools',
        'Photo/video sharing with filters and editing is expected functionality',
        'Location sharing and check-ins are common social features',
        'Social media platforms operating in Australia may need under-16 account restrictions and age-assurance disclosures',
        'Age-sensitive social apps distributed in Brazil, Australia, Singapore, Utah, or Louisiana may need region-specific age-assurance handling',
    ],
    specific_guidelines: [
        'Section 1.2 - User-generated content requires filtering, reporting, blocking, and published contact info',
        'Section 1.1 - Must moderate for objectionable content',
        'Section 5.1.1 - Social apps collect personal data and need robust privacy policies',
        'Section 1.3 - If targeting users under 13, must comply with COPPA',
        'App Store Connect - Certain social media platforms operating in Australia must prevent users under 16 from having accounts and should disclose age assurance through the age rating/product page flow',
        'App Store Connect - Regional age-assurance laws may require Declared Age Range, parent or guardian permission for significant updates, and aligned age-rating disclosures',
    ],
    false_positive_overrides: [
        'Sample user profiles in screenshots are NOT fake endorsements',
        'Follower/like counts in demo data are NOT misleading metrics',
        'Chat bubbles in screenshots are expected demo content, NOT real conversations',
        'Location pins on maps are standard feature demonstrations',
        'Notification badges are standard UI elements, NOT dark patterns',
    ],
};
