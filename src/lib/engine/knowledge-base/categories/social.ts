import type { CategoryContext } from './index';

export const SOCIAL_CONTEXT: CategoryContext = {
    category: 'Social Networking',
    common_patterns: [
        'User profiles with avatars, bios, and follower counts are standard social features',
        'Content feeds with likes, comments, and shares are expected UGC patterns',
        'Direct messaging and chat features are standard communication tools',
        'Photo/video sharing with filters and editing is expected functionality',
        'Location sharing and check-ins are common social features',
    ],
    specific_guidelines: [
        'Section 1.2 - User-generated content requires filtering, reporting, blocking, and published contact info',
        'Section 1.1 - Must moderate for objectionable content',
        'Section 5.1.1 - Social apps collect personal data and need robust privacy policies',
        'Section 1.3 - If targeting users under 13, must comply with COPPA',
    ],
    false_positive_overrides: [
        'Sample user profiles in screenshots are NOT fake endorsements',
        'Follower/like counts in demo data are NOT misleading metrics',
        'Chat bubbles in screenshots are expected demo content, NOT real conversations',
        'Location pins on maps are standard feature demonstrations',
        'Notification badges are standard UI elements, NOT dark patterns',
    ],
};
