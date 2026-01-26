/**
 * Streamlined Launch Checklist
 *
 * Quick reference for developers who have built their app and need to know
 * what's required to submit to the App Store.
 *
 * NOT a tutorial - just a checklist of what you need.
 */

export type ChecklistPhase = 'pre_submission' | 'during_review' | 'post_approval';

export type ChecklistCategory =
    | 'account'
    | 'app_build'
    | 'metadata'
    | 'legal'
    | 'review'
    | 'post_launch';

export interface ChecklistItem {
    id: string;
    phase: ChecklistPhase;
    category: ChecklistCategory;
    title: string;
    description: string;
    helpful_link?: string;
    is_required: boolean;
    order: number;
}

export const LAUNCH_CHECKLIST: ChecklistItem[] = [
    // ============================================
    // PHASE 1: PRE-SUBMISSION
    // ============================================

    {
        id: 'developer-account',
        phase: 'pre_submission',
        category: 'account',
        title: 'Apple Developer Account',
        description: '$99/year membership required. Enroll at developer.apple.com. Takes 24-48 hours for approval.',
        helpful_link: 'https://developer.apple.com/programs/enroll/',
        is_required: true,
        order: 1,
    },
    {
        id: 'banking-setup',
        phase: 'pre_submission',
        category: 'account',
        title: 'Banking & Tax Info',
        description: 'Required before you can submit ANY app. Go to App Store Connect > Agreements, Tax, and Banking.',
        helpful_link: 'https://appstoreconnect.apple.com',
        is_required: true,
        order: 2,
    },
    {
        id: 'archive-upload',
        phase: 'pre_submission',
        category: 'app_build',
        title: 'Build & Upload',
        description: 'Archive in Xcode (Product > Archive), then upload to App Store Connect. Bundle ID must match exactly.',
        helpful_link: 'https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds',
        is_required: true,
        order: 3,
    },
    {
        id: 'metadata',
        phase: 'pre_submission',
        category: 'metadata',
        title: 'App Store Metadata',
        description: 'App name (30 chars), subtitle (30 chars), description (4000 chars), keywords (100 chars, comma-separated).',
        helpful_link: 'https://developer.apple.com/help/app-store-connect/reference/app-information',
        is_required: true,
        order: 4,
    },
    {
        id: 'screenshots',
        phase: 'pre_submission',
        category: 'metadata',
        title: 'Screenshots',
        description: 'At least 1 per device size. Required: 6.7" iPhone (1290x2796px). PNG or JPEG, no transparency.',
        helpful_link: 'https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications',
        is_required: true,
        order: 5,
    },
    {
        id: 'privacy-policy',
        phase: 'pre_submission',
        category: 'legal',
        title: 'Privacy Policy URL',
        description: 'Must be HTTPS, publicly accessible, and actually contain a privacy policy. Required for all apps.',
        helpful_link: 'https://developer.apple.com/app-store/app-privacy-details/',
        is_required: true,
        order: 6,
    },
    {
        id: 'support-url',
        phase: 'pre_submission',
        category: 'legal',
        title: 'Support URL',
        description: 'Working URL where users can get help. Can be a simple contact page.',
        is_required: true,
        order: 7,
    },
    {
        id: 'privacy-manifest',
        phase: 'pre_submission',
        category: 'legal',
        title: 'Privacy Manifest (If Required)',
        description: 'PrivacyInfo.xcprivacy file needed if you use UserDefaults, file timestamps, or other "required reason APIs".',
        helpful_link: 'https://developer.apple.com/documentation/bundleresources/privacy_manifest_files',
        is_required: false,
        order: 8,
    },

    // ============================================
    // PHASE 2: DURING REVIEW
    // ============================================

    {
        id: 'review-timeline',
        phase: 'during_review',
        category: 'review',
        title: 'Review Timeline',
        description: 'Usually 24-48 hours. Check status in App Store Connect. Don\'t cancel and resubmit - it resets your place in line.',
        is_required: true,
        order: 9,
    },
    {
        id: 'rejection-response',
        phase: 'during_review',
        category: 'review',
        title: 'If Rejected',
        description: 'Check Resolution Center for details. Fix the specific issue mentioned, increment build number, resubmit.',
        helpful_link: 'https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/reply-to-app-review-messages',
        is_required: false,
        order: 10,
    },

    // ============================================
    // PHASE 3: POST-APPROVAL
    // ============================================

    {
        id: 'release',
        phase: 'post_approval',
        category: 'post_launch',
        title: 'Release Your App',
        description: 'Choose manual or automatic release. Tip: Don\'t release on Fridays in case issues arise.',
        is_required: true,
        order: 11,
    },
    {
        id: 'monitor',
        phase: 'post_approval',
        category: 'post_launch',
        title: 'Monitor & Iterate',
        description: 'Check crash reports in App Store Connect > Analytics. Respond to reviews. Plan your first update.',
        helpful_link: 'https://developer.apple.com/app-store-connect/analytics/',
        is_required: false,
        order: 12,
    },
];

// Helper functions

export function getChecklistByPhase(phase: ChecklistPhase): ChecklistItem[] {
    return LAUNCH_CHECKLIST
        .filter(item => item.phase === phase)
        .sort((a, b) => a.order - b.order);
}

export function getChecklistForCategory(category: string): ChecklistItem[] {
    // Category filtering removed - simplified checklist applies to all apps
    return LAUNCH_CHECKLIST.sort((a, b) => a.order - b.order);
}

export function getRequiredItems(): ChecklistItem[] {
    return LAUNCH_CHECKLIST
        .filter(item => item.is_required)
        .sort((a, b) => a.order - b.order);
}

export function getChecklistSummary(): {
    pre_submission: { total: number; required: number };
    during_review: { total: number; required: number };
    post_approval: { total: number; required: number };
} {
    const phases: ChecklistPhase[] = ['pre_submission', 'during_review', 'post_approval'];
    const summary = {} as Record<ChecklistPhase, { total: number; required: number }>;

    for (const phase of phases) {
        const items = getChecklistByPhase(phase);
        summary[phase] = {
            total: items.length,
            required: items.filter(i => i.is_required).length,
        };
    }

    return summary;
}
