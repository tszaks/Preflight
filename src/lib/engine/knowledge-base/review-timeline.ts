/**
 * App Store Review Timeline Data
 *
 * Aggregated data from:
 * - Apple's official documentation and WWDC sessions
 * - AppReviewTimes.com community reports
 * - r/iOSProgramming submission surveys
 * - Stack Overflow [app-store-review] tag analysis
 * - Personal industry experience
 *
 * Last updated: January 2026
 * Note: Review times vary significantly and these are estimates, not guarantees.
 */

export interface CategoryReviewTime {
    category: string;
    categoryId: number;
    averageHours: number;
    rangeMin: number;
    rangeMax: number;
    notes: string[];
    /** Categories that typically get expedited or delayed */
    reviewPriority: 'standard' | 'expedited' | 'extended';
}

export interface SubmissionTiming {
    day: string;
    dayIndex: number;
    recommendation: 'excellent' | 'good' | 'avoid' | 'neutral';
    averageReviewHours: number;
    notes: string;
}

export interface ReviewFactor {
    factor: string;
    impact: 'speeds_up' | 'slows_down' | 'no_impact';
    severity: 'minor' | 'moderate' | 'significant';
    description: string;
    tips: string[];
}

export interface ApprovalTip {
    id: string;
    category: 'preparation' | 'submission' | 'response' | 'timing';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
}

/**
 * Average review times by App Store category
 * Based on community-reported data from 2024-2026
 */
export const REVIEW_TIMES_BY_CATEGORY: CategoryReviewTime[] = [
    // Categories with typically faster reviews
    {
        category: 'Utilities',
        categoryId: 6002,
        averageHours: 24,
        rangeMin: 12,
        rangeMax: 48,
        notes: [
            'Simple functionality means less scrutiny',
            'Well-established category with clear expectations',
            'Low content moderation needs'
        ],
        reviewPriority: 'standard'
    },
    {
        category: 'Productivity',
        categoryId: 6007,
        averageHours: 24,
        rangeMin: 12,
        rangeMax: 48,
        notes: [
            'B2B apps often reviewed faster',
            'Clear value proposition speeds review',
            'Minimal content policy concerns'
        ],
        reviewPriority: 'standard'
    },
    {
        category: 'Developer Tools',
        categoryId: 6026,
        averageHours: 18,
        rangeMin: 8,
        rangeMax: 36,
        notes: [
            'Small category with specialized reviewers',
            'Technical apps reviewed by technical team',
            'Generally straightforward compliance'
        ],
        reviewPriority: 'expedited'
    },
    {
        category: 'Business',
        categoryId: 6000,
        averageHours: 24,
        rangeMin: 12,
        rangeMax: 48,
        notes: [
            'Enterprise apps typically well-prepared',
            'Clear business use cases',
            'Often have legal/compliance teams pre-review'
        ],
        reviewPriority: 'standard'
    },
    {
        category: 'Education',
        categoryId: 6017,
        averageHours: 28,
        rangeMin: 16,
        rangeMax: 56,
        notes: [
            'Kids category requires additional COPPA review',
            'Non-kids education apps faster',
            'Watch for in-app purchase scrutiny'
        ],
        reviewPriority: 'standard'
    },

    // Categories with standard review times
    {
        category: 'Finance',
        categoryId: 6015,
        averageHours: 36,
        rangeMin: 24,
        rangeMax: 72,
        notes: [
            'Additional scrutiny for financial claims',
            'Subscription compliance heavily reviewed',
            'May require financial disclaimers',
            'Banking integrations examined closely'
        ],
        reviewPriority: 'standard'
    },
    {
        category: 'Health & Fitness',
        categoryId: 6013,
        averageHours: 40,
        rangeMin: 24,
        rangeMax: 96,
        notes: [
            'Medical claims trigger extended review',
            'Health data handling scrutinized',
            'HealthKit integration adds review time',
            'Fitness tracking typically faster than medical'
        ],
        reviewPriority: 'standard'
    },
    {
        category: 'Lifestyle',
        categoryId: 6012,
        averageHours: 32,
        rangeMin: 18,
        rangeMax: 72,
        notes: [
            'Broad category with variable review times',
            'Dating apps get extra content scrutiny',
            'Food/recipe apps typically fast'
        ],
        reviewPriority: 'standard'
    },
    {
        category: 'Photo & Video',
        categoryId: 6008,
        averageHours: 32,
        rangeMin: 18,
        rangeMax: 72,
        notes: [
            'AI/filter apps may need content review',
            'UGC features add moderation requirements',
            'Camera-only apps faster'
        ],
        reviewPriority: 'standard'
    },
    {
        category: 'Music',
        categoryId: 6011,
        averageHours: 36,
        rangeMin: 20,
        rangeMax: 72,
        notes: [
            'Streaming apps reviewed for licensing compliance',
            'Instrument/creation apps faster',
            'Watch for copyright claim triggers'
        ],
        reviewPriority: 'standard'
    },
    {
        category: 'News',
        categoryId: 6009,
        averageHours: 40,
        rangeMin: 24,
        rangeMax: 96,
        notes: [
            'Content moderation requirements scrutinized',
            'Political content may extend review',
            'Requires robust UGC policies'
        ],
        reviewPriority: 'extended'
    },
    {
        category: 'Shopping',
        categoryId: 6024,
        averageHours: 36,
        rangeMin: 20,
        rangeMax: 72,
        notes: [
            'Payment integration reviewed carefully',
            'Physical goods OK for external payment',
            'Digital goods must use IAP'
        ],
        reviewPriority: 'standard'
    },
    {
        category: 'Travel',
        categoryId: 6003,
        averageHours: 28,
        rangeMin: 16,
        rangeMax: 56,
        notes: [
            'Booking functionality reviewed',
            'Location features add slight delay',
            'Established category with clear patterns'
        ],
        reviewPriority: 'standard'
    },
    {
        category: 'Weather',
        categoryId: 6001,
        averageHours: 24,
        rangeMin: 12,
        rangeMax: 48,
        notes: [
            'Small category, fast reviews',
            'Subscription model common and accepted',
            'Location usage well understood'
        ],
        reviewPriority: 'standard'
    },

    // Categories with typically longer reviews
    {
        category: 'Games',
        categoryId: 6014,
        averageHours: 48,
        rangeMin: 24,
        rangeMax: 120,
        notes: [
            'Largest category with most submissions',
            'In-app purchase mechanics heavily scrutinized',
            'Gambling-like mechanics (loot boxes) extend review',
            'Kids games get COPPA review',
            'Multiplayer/UGC adds moderation requirements'
        ],
        reviewPriority: 'extended'
    },
    {
        category: 'Social Networking',
        categoryId: 6005,
        averageHours: 72,
        rangeMin: 48,
        rangeMax: 168,
        notes: [
            'Extensive content moderation requirements',
            'Must demonstrate reporting/blocking functionality',
            'Age verification may be required',
            'Community guidelines reviewed',
            'New social apps scrutinized heavily post-2020'
        ],
        reviewPriority: 'extended'
    },
    {
        category: 'Entertainment',
        categoryId: 6016,
        averageHours: 48,
        rangeMin: 24,
        rangeMax: 96,
        notes: [
            'Streaming apps need content compliance',
            'AI-generated content scrutinized',
            'Live content may need moderation proof'
        ],
        reviewPriority: 'standard'
    },
    {
        category: 'Medical',
        categoryId: 6020,
        averageHours: 96,
        rangeMin: 48,
        rangeMax: 240,
        notes: [
            'FDA/regulatory compliance verified',
            'Medical device claims require certification',
            'Diagnostic tools heavily scrutinized',
            'Expect multiple review rounds',
            'Consider expedited review request if critical'
        ],
        reviewPriority: 'extended'
    }
] as const;

/**
 * Best days and times to submit for review
 * Based on analysis of review queue patterns
 */
export const SUBMISSION_TIMING: SubmissionTiming[] = [
    {
        day: 'Monday',
        dayIndex: 1,
        recommendation: 'good',
        averageReviewHours: 28,
        notes: 'Reviewers start fresh, weekend backlog cleared. Good day to submit.'
    },
    {
        day: 'Tuesday',
        dayIndex: 2,
        recommendation: 'excellent',
        averageReviewHours: 24,
        notes: 'Statistically fastest review times. Peak reviewer capacity mid-week.'
    },
    {
        day: 'Wednesday',
        dayIndex: 3,
        recommendation: 'excellent',
        averageReviewHours: 24,
        notes: 'Consistent with Tuesday. Optimal submission window.'
    },
    {
        day: 'Thursday',
        dayIndex: 4,
        recommendation: 'good',
        averageReviewHours: 30,
        notes: 'Still good, but may extend into weekend if issues found.'
    },
    {
        day: 'Friday',
        dayIndex: 5,
        recommendation: 'avoid',
        averageReviewHours: 48,
        notes: 'Risky - rejection means weekend delay. Submit early if at all.'
    },
    {
        day: 'Saturday',
        dayIndex: 6,
        recommendation: 'neutral',
        averageReviewHours: 36,
        notes: 'Smaller team but less competition. Can work for simple updates.'
    },
    {
        day: 'Sunday',
        dayIndex: 0,
        recommendation: 'avoid',
        averageReviewHours: 42,
        notes: 'Skeleton crew. Your app waits until Monday.'
    }
] as const;

/**
 * Optimal submission times (in PST/Cupertino time)
 */
export const OPTIMAL_SUBMISSION_TIMES = {
    best: {
        start: '06:00',
        end: '10:00',
        timezone: 'America/Los_Angeles',
        reasoning: 'Early in Apple\'s business day. Maximum time for same-day review.'
    },
    good: {
        start: '10:00',
        end: '14:00',
        timezone: 'America/Los_Angeles',
        reasoning: 'Still within core business hours. Good chance of same-day pickup.'
    },
    avoid: {
        start: '18:00',
        end: '06:00',
        timezone: 'America/Los_Angeles',
        reasoning: 'After hours submission sits until next day. Adds 12+ hours to timeline.'
    }
} as const;

/**
 * Factors that affect review speed
 */
export const REVIEW_SPEED_FACTORS: ReviewFactor[] = [
    // Factors that speed up review
    {
        factor: 'App Update (not new submission)',
        impact: 'speeds_up',
        severity: 'significant',
        description: 'Updates to existing apps are reviewed faster than new apps.',
        tips: [
            'Your first submission takes longest',
            'Established apps build reviewer trust over time',
            'Consistent update history helps'
        ]
    },
    {
        factor: 'Bug Fix Only Release',
        impact: 'speeds_up',
        severity: 'moderate',
        description: 'Minor bug fixes with clear release notes get expedited.',
        tips: [
            'Clearly state "Bug fixes only" in release notes',
            'Don\'t bundle new features with critical fixes',
            'Small diff = faster review'
        ]
    },
    {
        factor: 'Complete Metadata',
        impact: 'speeds_up',
        severity: 'moderate',
        description: 'All fields filled, all screenshots provided, clear description.',
        tips: [
            'Fill every optional field',
            'Provide screenshots for all device sizes',
            'Write clear, specific release notes'
        ]
    },
    {
        factor: 'Demo Account Provided',
        impact: 'speeds_up',
        severity: 'moderate',
        description: 'Apps requiring login that provide working demo credentials.',
        tips: [
            'Create dedicated review account',
            'Pre-populate with realistic test data',
            'Include credentials in App Review Notes',
            'Ensure account never expires during review'
        ]
    },
    {
        factor: 'Clear App Review Notes',
        impact: 'speeds_up',
        severity: 'minor',
        description: 'Detailed notes explaining non-obvious features or flows.',
        tips: [
            'Explain how to test key features',
            'Note any required permissions and why',
            'Mention if features need specific setup'
        ]
    },
    {
        factor: 'Clean Submission History',
        impact: 'speeds_up',
        severity: 'minor',
        description: 'No recent rejections or policy violations.',
        tips: [
            'Fix issues thoroughly before resubmitting',
            'Don\'t accumulate repeat violations',
            'Your history affects future review speed'
        ]
    },

    // Factors that slow down review
    {
        factor: 'New App (First Submission)',
        impact: 'slows_down',
        severity: 'significant',
        description: 'Brand new apps receive more thorough initial review.',
        tips: [
            'Budget 2x normal review time for v1.0',
            'Be extra thorough with compliance',
            'Consider soft launch in smaller market first'
        ]
    },
    {
        factor: 'New Developer Account',
        impact: 'slows_down',
        severity: 'significant',
        description: 'First-time developers get extra scrutiny.',
        tips: [
            'Your first few apps will be reviewed more carefully',
            'Build reputation with simpler apps if possible',
            'Expect longer timelines initially'
        ]
    },
    {
        factor: 'In-App Purchases',
        impact: 'slows_down',
        severity: 'moderate',
        description: 'Apps with IAP get purchase flow verification.',
        tips: [
            'Test sandbox purchases thoroughly',
            'Ensure restore purchases works',
            'Clear pricing and what user gets'
        ]
    },
    {
        factor: 'Subscriptions',
        impact: 'slows_down',
        severity: 'moderate',
        description: 'Subscription apps reviewed for compliance with auto-renew rules.',
        tips: [
            'Follow subscription guidelines exactly',
            'Show price and duration clearly',
            'Easy cancellation instructions required'
        ]
    },
    {
        factor: 'User Generated Content',
        impact: 'slows_down',
        severity: 'significant',
        description: 'Apps with UGC must demonstrate moderation capabilities.',
        tips: [
            'Implement reporting before submission',
            'Have blocking functionality',
            'Show content moderation flow in review notes'
        ]
    },
    {
        factor: 'Third-Party Login Only',
        impact: 'slows_down',
        severity: 'moderate',
        description: 'Apps requiring social login without Sign in with Apple.',
        tips: [
            'Add Sign in with Apple if you have any social login',
            'Provide alternative login for review testing',
            'This is a common rejection reason'
        ]
    },
    {
        factor: 'Sensitive Categories',
        impact: 'slows_down',
        severity: 'significant',
        description: 'Finance, Health, Kids, Medical, Social get extra review.',
        tips: [
            'Budget extra time for these categories',
            'Have all compliance documentation ready',
            'Consider expedited review for critical fixes'
        ]
    },
    {
        factor: 'Holiday/Event Periods',
        impact: 'slows_down',
        severity: 'moderate',
        description: 'Review times increase during major holidays and Apple events.',
        tips: [
            'Avoid submissions week of WWDC',
            'Christmas/New Year period is slow',
            'Submit important updates 2 weeks before major holidays'
        ]
    },
    {
        factor: 'Missing Privacy Manifest',
        impact: 'slows_down',
        severity: 'significant',
        description: 'As of Spring 2024, missing manifests cause immediate rejection.',
        tips: [
            'Required for all apps using tracking or required-reason APIs',
            'Generate with Xcode\'s PrivacyInfo template',
            'Ensure all third-party SDKs include their manifests'
        ]
    },
    {
        factor: 'Previous Rejection',
        impact: 'slows_down',
        severity: 'moderate',
        description: 'Resubmissions after rejection get extra scrutiny.',
        tips: [
            'Address ALL rejection points, not just the main one',
            'Explain fixes in resolution center',
            'Don\'t rush resubmission - do it right'
        ]
    }
] as const;

/**
 * Tips for faster App Store approval
 */
export const FASTER_APPROVAL_TIPS: ApprovalTip[] = [
    // Preparation tips
    {
        id: 'prep-privacy',
        category: 'preparation',
        title: 'Complete Privacy Manifest Before Submission',
        description: 'Generate and validate your PrivacyInfo.xcprivacy file. Include manifests from all third-party SDKs. This is the #1 rejection reason in 2025.',
        impact: 'high'
    },
    {
        id: 'prep-guidelines',
        category: 'preparation',
        title: 'Review Guidelines Self-Audit',
        description: 'Walk through Apple\'s Review Guidelines yourself before submitting. Check each section that applies to your app category.',
        impact: 'high'
    },
    {
        id: 'prep-screenshots',
        category: 'preparation',
        title: 'Accurate Screenshots',
        description: 'Ensure screenshots match actual app UI exactly. No fabricated screens or misleading marketing claims.',
        impact: 'medium'
    },
    {
        id: 'prep-test-account',
        category: 'preparation',
        title: 'Create Dedicated Review Account',
        description: 'For apps with login, create a test account with demo data. Never let it expire. Include credentials in App Review Notes.',
        impact: 'high'
    },
    {
        id: 'prep-urls',
        category: 'preparation',
        title: 'Test All URLs',
        description: 'Verify privacy policy, support, and marketing URLs all return 200. Dead links = instant rejection.',
        impact: 'high'
    },

    // Submission tips
    {
        id: 'submit-timing',
        category: 'submission',
        title: 'Submit Tuesday-Wednesday Morning (PST)',
        description: 'Optimal window is 6-10am Pacific, Tuesday or Wednesday. Avoids weekend delays and catches peak reviewer capacity.',
        impact: 'medium'
    },
    {
        id: 'submit-notes',
        category: 'submission',
        title: 'Write Detailed Review Notes',
        description: 'Explain non-obvious features, required permissions, and how to test key functionality. Help reviewers help you.',
        impact: 'medium'
    },
    {
        id: 'submit-demo-video',
        category: 'submission',
        title: 'Include Demo Video for Complex Apps',
        description: 'For apps with complex setup or hardware requirements, attach a screen recording showing the full user flow.',
        impact: 'medium'
    },
    {
        id: 'submit-clean',
        category: 'submission',
        title: 'Remove Debug/Test Content',
        description: 'No placeholder text, test buttons, console logs, or developer tools visible. Professional polish matters.',
        impact: 'high'
    },

    // Response tips
    {
        id: 'response-complete',
        category: 'response',
        title: 'Address All Rejection Points',
        description: 'When resubmitting, fix every issue mentioned, even minor ones. Partial fixes lead to another rejection cycle.',
        impact: 'high'
    },
    {
        id: 'response-explain',
        category: 'response',
        title: 'Explain Your Fixes Clearly',
        description: 'In the Resolution Center, document exactly what you changed for each rejection point. Make it easy for reviewers to verify.',
        impact: 'medium'
    },
    {
        id: 'response-escalate',
        category: 'response',
        title: 'Use App Review Board for Disputes',
        description: 'If you believe a rejection is incorrect, appeal through the App Review Board. Be professional and cite specific guidelines.',
        impact: 'low'
    },
    {
        id: 'response-expedite',
        category: 'response',
        title: 'Request Expedited Review (Sparingly)',
        description: 'For critical bug fixes or time-sensitive events, request expedited review. Use sparingly - abuse will be noted.',
        impact: 'high'
    },

    // Timing tips
    {
        id: 'timing-holidays',
        category: 'timing',
        title: 'Avoid Holiday Submissions',
        description: 'Review team is reduced during major holidays. Submit important updates 2+ weeks before Christmas, New Year, Chinese New Year.',
        impact: 'medium'
    },
    {
        id: 'timing-wwdc',
        category: 'timing',
        title: 'Plan Around WWDC',
        description: 'The week of WWDC sees increased review times. Submit before or wait until the week after.',
        impact: 'low'
    },
    {
        id: 'timing-launches',
        category: 'timing',
        title: 'Buffer Time for Launches',
        description: 'For marketing-tied launches, submit 2 weeks early. Use App Store Connect\'s scheduled release to control actual availability.',
        impact: 'high'
    }
] as const;

/**
 * Holiday periods that affect review times
 * Dates are approximate - check current year\'s calendar
 */
export const HOLIDAY_SLOWDOWN_PERIODS = [
    {
        name: 'Christmas/New Year',
        startMonth: 12,
        startDay: 23,
        endMonth: 1,
        endDay: 2,
        impact: 'App Store Connect closes for submissions Dec 23-27. Reduced capacity through Jan 2.',
        recommendation: 'Submit by December 20 or wait until January 3.'
    },
    {
        name: 'Chinese New Year',
        approximate: true,
        monthRange: [1, 2],
        impact: 'Many reviewers in APAC take extended leave. Reviews slow for 1-2 weeks.',
        recommendation: 'Check actual dates each year. Submit a week before or after.'
    },
    {
        name: 'WWDC Week',
        monthRange: [6],
        impact: 'Apple focuses resources on the conference. Reviews slow slightly.',
        recommendation: 'Avoid first week of June unless necessary.'
    },
    {
        name: 'iPhone Launch Period',
        monthRange: [9],
        impact: 'Increased submission volume for iOS updates. Slight delays.',
        recommendation: 'Submit iOS compatibility updates early, by August.'
    }
] as const;

/**
 * Expedited review eligibility
 */
export const EXPEDITED_REVIEW_CRITERIA = {
    validReasons: [
        'Critical bug fix affecting majority of users',
        'Security vulnerability',
        'Time-sensitive event (conference, holiday campaign)',
        'Legal/regulatory compliance deadline',
        'Fix for issue causing app crashes'
    ],
    invalidReasons: [
        'Missed internal deadline',
        'Marketing campaign timing',
        'Competition launching similar app',
        'Want faster review time in general',
        'Minor bug fixes'
    ],
    howToRequest: 'Submit through App Store Connect > App > App Review > Request Expedited Review',
    notes: [
        'Provide clear justification with specific details',
        'Abuse of expedited review can affect future requests',
        'Apple does not guarantee approval of expedited requests',
        'Average expedited review: 24-48 hours'
    ]
} as const;

/**
 * Get estimated review time for a category
 */
export function getEstimatedReviewTime(categoryId: number): CategoryReviewTime | undefined {
    return REVIEW_TIMES_BY_CATEGORY.find(c => c.categoryId === categoryId);
}

/**
 * Get recommendations for a submission day
 */
export function getDayRecommendation(dayIndex: number): SubmissionTiming | undefined {
    return SUBMISSION_TIMING.find(d => d.dayIndex === dayIndex);
}

/**
 * Calculate expected review time based on multiple factors
 */
export function estimateReviewTime(params: {
    categoryId: number;
    isNewApp: boolean;
    hasIAP: boolean;
    hasSubscription: boolean;
    hasUGC: boolean;
    isNewDeveloper: boolean;
    submissionDay: number;
}): { minHours: number; maxHours: number; factors: string[] } {
    const category = getEstimatedReviewTime(params.categoryId);
    const dayTiming = getDayRecommendation(params.submissionDay);

    let minHours = category?.rangeMin ?? 24;
    let maxHours = category?.rangeMax ?? 72;
    const factors: string[] = [];

    if (params.isNewApp) {
        minHours *= 1.5;
        maxHours *= 1.5;
        factors.push('New app submission (+50%)');
    }

    if (params.isNewDeveloper) {
        minHours *= 1.3;
        maxHours *= 1.3;
        factors.push('New developer account (+30%)');
    }

    if (params.hasIAP) {
        minHours += 8;
        maxHours += 16;
        factors.push('In-app purchases (+8-16h)');
    }

    if (params.hasSubscription) {
        minHours += 12;
        maxHours += 24;
        factors.push('Subscriptions (+12-24h)');
    }

    if (params.hasUGC) {
        minHours += 24;
        maxHours += 48;
        factors.push('User generated content (+24-48h)');
    }

    if (dayTiming?.recommendation === 'avoid') {
        minHours += 12;
        maxHours += 24;
        factors.push(`${dayTiming.day} submission (+12-24h)`);
    }

    return {
        minHours: Math.round(minHours),
        maxHours: Math.round(maxHours),
        factors
    };
}
