/**
 * App Store Review Response Templates
 *
 * Professional templates for responding to user reviews on the App Store.
 * Each template includes placeholders and best practices.
 *
 * Placeholders:
 * - {APP_NAME} - Your app's name
 * - {USER_NAME} - Reviewer's display name (if available)
 * - {ISSUE} - Specific issue mentioned
 * - {FEATURE} - Feature requested or discussed
 * - {VERSION} - App version number
 * - {SUPPORT_EMAIL} - Your support email
 * - {SUPPORT_URL} - Your support/help URL
 */

export interface ReviewTemplate {
    id: string;
    type: 'negative' | 'positive' | 'neutral';
    subType: string;
    title: string;
    template: string;
    bestPractices: string[];
    doNot: string[];
}

/**
 * Templates for responding to 1-star reviews
 * The most critical responses - these can turn detractors into advocates
 */
export const ONE_STAR_TEMPLATES: ReviewTemplate[] = [
    // Bug Report Responses
    {
        id: '1star-bug-technical',
        type: 'negative',
        subType: 'bug_report',
        title: 'Technical Bug Report',
        template: `Thank you for bringing this to our attention. We're sorry {APP_NAME} isn't working as expected.

We've identified the issue you're describing and our team is actively working on a fix. In the meantime, please try:
1. Force-closing and reopening the app
2. Checking for the latest update in the App Store

If the problem persists, please contact us at {SUPPORT_EMAIL} with your device model and iOS version. We'd love to make this right.`,
        bestPractices: [
            'Acknowledge the issue immediately',
            'Show you understand the specific problem',
            'Provide immediate workarounds if available',
            'Give a clear path to resolution (support contact)',
            'Follow up when the fix ships'
        ],
        doNot: [
            'Blame the user or their device',
            'Make excuses about edge cases',
            'Promise a specific fix timeline you cannot guarantee',
            'Ignore the review hoping it goes away'
        ]
    },
    {
        id: '1star-bug-crash',
        type: 'negative',
        subType: 'bug_report',
        title: 'App Crash Report',
        template: `We're truly sorry about the crashes you're experiencing with {APP_NAME}. This is not the experience we want for you.

We take crash reports seriously. Could you please email us at {SUPPORT_EMAIL} with:
- When the crash happens (what screen/action)
- Your device model and iOS version

This helps us reproduce and fix the issue faster. We'll prioritize this and keep you updated.`,
        bestPractices: [
            'Express genuine empathy - crashes are frustrating',
            'Request specific diagnostic info politely',
            'Explain why the info helps (builds trust)',
            'Commit to prioritizing the fix'
        ],
        doNot: [
            'Say "works fine for us" or "cannot reproduce"',
            'Suggest the user is doing something wrong',
            'Provide generic troubleshooting that won\'t help'
        ]
    },
    {
        id: '1star-bug-data',
        type: 'negative',
        subType: 'bug_report',
        title: 'Data Loss or Sync Issue',
        template: `We're deeply sorry about the {ISSUE}. Losing data is incredibly frustrating, and we understand your disappointment.

This is our top priority. Please contact us immediately at {SUPPORT_EMAIL} - we may be able to help recover your data from our servers. Include your account email so we can investigate right away.

We're also implementing additional safeguards to prevent this in future updates.`,
        bestPractices: [
            'Treat data loss as critical - it is',
            'Offer hope of recovery if possible',
            'Act urgently - use words like "immediately"',
            'Mention preventive measures being taken'
        ],
        doNot: [
            'Minimize the impact ("it\'s just...")',
            'Promise data recovery you cannot deliver',
            'Blame cloud sync or third-party services'
        ]
    },

    // Feature Request Responses
    {
        id: '1star-feature-missing',
        type: 'negative',
        subType: 'feature_request',
        title: 'Missing Expected Feature',
        template: `Thank you for your feedback about {FEATURE}. We understand this is important to you.

This feature is on our roadmap, though we don't have a specific release date yet. We prioritize based on user feedback, and reviews like yours help shape our development.

In the meantime, {APP_NAME} offers [alternative approach]. Would you be willing to try that? We'd love to hear if it helps at {SUPPORT_EMAIL}.`,
        bestPractices: [
            'Validate their expectation - the feature makes sense',
            'Be honest about roadmap status',
            'Explain how feedback influences priorities',
            'Offer alternatives where possible'
        ],
        doNot: [
            'Promise features you cannot deliver',
            'Say "we\'ll add it soon" without commitment',
            'Dismiss the feature as unnecessary'
        ]
    },
    {
        id: '1star-feature-comparison',
        type: 'negative',
        subType: 'feature_request',
        title: 'Unfavorable Competitor Comparison',
        template: `Thanks for your honest feedback. We hear you - {FEATURE} is something other apps offer, and we understand why you'd want it in {APP_NAME}.

We're focused on doing a few things exceptionally well rather than everything adequately. That said, your feedback is noted and shared with our product team.

If there are specific use cases we're not supporting, we'd genuinely love to hear them at {SUPPORT_EMAIL}. Understanding your workflow helps us prioritize.`,
        bestPractices: [
            'Don\'t be defensive about competition',
            'Explain your product philosophy briefly',
            'Show genuine interest in their use case',
            'Never disparage competitors'
        ],
        doNot: [
            'Argue that your approach is better',
            'Trash talk competitor apps',
            'Be dismissive of the comparison'
        ]
    },

    // Misunderstanding Responses
    {
        id: '1star-misunderstanding-usage',
        type: 'negative',
        subType: 'misunderstanding',
        title: 'User Doesn\'t Know How to Use Feature',
        template: `We're sorry {APP_NAME} hasn't been intuitive! The feature you're looking for is actually available:

To {FEATURE}:
1. [Step one]
2. [Step two]
3. [Step three]

We also have video tutorials at {SUPPORT_URL} that walk through this.

Your feedback tells us we need to make this clearer. Thank you for helping us improve!`,
        bestPractices: [
            'Never make the user feel dumb',
            'Take responsibility for unclear UX',
            'Provide clear, numbered steps',
            'Offer additional resources',
            'Use this feedback to improve onboarding'
        ],
        doNot: [
            'Say "just do X" as if it\'s obvious',
            'Blame the user for not reading documentation',
            'Be condescending'
        ]
    },
    {
        id: '1star-misunderstanding-expectation',
        type: 'negative',
        subType: 'misunderstanding',
        title: 'App Doesn\'t Do What User Expected',
        template: `Thank you for your feedback. We're sorry {APP_NAME} didn't meet your expectations.

You're right that our app focuses on {ACTUAL_PURPOSE} rather than {EXPECTED_PURPOSE}. We should be clearer about this in our App Store description.

If you're looking for {EXPECTED_PURPOSE}, [suggestion for appropriate app type] might be a better fit. We appreciate you giving us a try!`,
        bestPractices: [
            'Acknowledge the mismatch gracefully',
            'Take responsibility for unclear positioning',
            'Help them find what they actually need',
            'Be genuinely helpful, not defensive'
        ],
        doNot: [
            'Say "you should have read the description"',
            'Argue that their expectation was wrong',
            'Be sarcastic or passive-aggressive'
        ]
    },
    {
        id: '1star-misunderstanding-price',
        type: 'negative',
        subType: 'misunderstanding',
        title: 'Subscription/Pricing Complaint',
        template: `We understand your frustration with our pricing. Building and maintaining {APP_NAME} requires significant ongoing investment in servers, development, and support.

Our subscription includes:
- [Key value proposition 1]
- [Key value proposition 2]
- [Key value proposition 3]

We offer a free tier/trial for you to evaluate before committing. If you have specific feedback about what would make the subscription worthwhile for you, please share at {SUPPORT_EMAIL}.`,
        bestPractices: [
            'Explain value, don\'t justify price',
            'List concrete benefits',
            'Mention free tier or trial',
            'Invite dialogue about value'
        ],
        doNot: [
            'Be defensive about pricing',
            'Compare to coffee/other trivial expenses',
            'Dismiss their concern about money',
            'Offer a discount publicly (creates precedent)'
        ]
    }
];

/**
 * Templates for responding to feature requests (any star rating)
 */
export const FEATURE_REQUEST_TEMPLATES: ReviewTemplate[] = [
    {
        id: 'feature-planned',
        type: 'neutral',
        subType: 'feature_request',
        title: 'Feature Already Planned',
        template: `Great news - {FEATURE} is already on our roadmap! We can't share exact timelines, but feedback like yours helps us prioritize.

Make sure you have automatic updates enabled so you'll get it as soon as it ships. Thanks for taking the time to share your thoughts!`,
        bestPractices: [
            'Be excited to share good news',
            'Don\'t promise specific dates',
            'Encourage update notifications'
        ],
        doNot: [
            'Promise "next update" or specific versions',
            'Over-promise on scope'
        ]
    },
    {
        id: 'feature-considering',
        type: 'neutral',
        subType: 'feature_request',
        title: 'Feature Under Consideration',
        template: `Thank you for suggesting {FEATURE}! We've noted this and shared it with our product team.

We prioritize features based on user demand, so feedback like yours genuinely influences what we build next. Keep the ideas coming!`,
        bestPractices: [
            'Show genuine appreciation',
            'Explain your prioritization process',
            'Encourage continued feedback'
        ],
        doNot: [
            'Make it sound like form-letter response',
            'Promise to add it'
        ]
    },
    {
        id: 'feature-wont-do',
        type: 'neutral',
        subType: 'feature_request',
        title: 'Feature Not Aligned with Vision',
        template: `Thank you for the suggestion! We've thought about {FEATURE}, but it doesn't quite fit with our focus on [core value proposition].

We want to do fewer things exceptionally well. That said, we appreciate you sharing your thoughts - it helps us understand what our users need.`,
        bestPractices: [
            'Be honest but kind',
            'Explain your product philosophy',
            'Still express appreciation'
        ],
        doNot: [
            'Say "never" or be dismissive',
            'Make them feel their idea was bad'
        ]
    }
];

/**
 * Templates for responding to bug reports (any star rating)
 */
export const BUG_REPORT_TEMPLATES: ReviewTemplate[] = [
    {
        id: 'bug-known',
        type: 'neutral',
        subType: 'bug_report',
        title: 'Known Issue Being Fixed',
        template: `Thank you for reporting this! We're aware of {ISSUE} and actively working on a fix.

We expect to ship a solution in our next update. Make sure you have automatic updates enabled. We apologize for the inconvenience and appreciate your patience.`,
        bestPractices: [
            'Acknowledge you know about it',
            'Give realistic timeline expectation',
            'Apologize genuinely'
        ],
        doNot: [
            'Blame it on Apple/iOS/third parties',
            'Minimize the issue'
        ]
    },
    {
        id: 'bug-new',
        type: 'neutral',
        subType: 'bug_report',
        title: 'New Bug Report',
        template: `Thank you for bringing this to our attention! We weren't aware of {ISSUE} and will investigate immediately.

Could you email us at {SUPPORT_EMAIL} with a few more details? Specifically:
- Steps to reproduce the issue
- Your device model and iOS version
- Screenshots if possible

This helps us fix it faster. Thanks for helping make {APP_NAME} better!`,
        bestPractices: [
            'Thank them - they\'re doing you a favor',
            'Ask for specific diagnostic info',
            'Explain why each piece helps'
        ],
        doNot: [
            'Make them feel like QA testers',
            'Require too much information'
        ]
    },
    {
        id: 'bug-fixed',
        type: 'neutral',
        subType: 'bug_report',
        title: 'Bug Already Fixed',
        template: `Great news - we fixed {ISSUE} in version {VERSION}! Please update {APP_NAME} from the App Store and you should be all set.

If you're still experiencing problems after updating, please let us know at {SUPPORT_EMAIL}. Thank you for your feedback!`,
        bestPractices: [
            'Lead with the solution',
            'Specify the version',
            'Offer follow-up path'
        ],
        doNot: [
            'Sound smug about already fixing it',
            'Blame them for not updating'
        ]
    },
    {
        id: 'bug-cannot-reproduce',
        type: 'neutral',
        subType: 'bug_report',
        title: 'Cannot Reproduce Bug',
        template: `We've been trying to reproduce {ISSUE} but haven't been able to yet. This doesn't mean it's not real - some bugs only appear in specific conditions.

Would you be willing to help us troubleshoot? Please email {SUPPORT_EMAIL} with:
- Exactly when/how the issue occurs
- Your device model and iOS version
- Any other apps running at the time

Your help would be invaluable in tracking this down. Thank you!`,
        bestPractices: [
            'Never dismiss unreproducible bugs',
            'Express that you believe them',
            'Ask for help respectfully'
        ],
        doNot: [
            'Say "cannot reproduce" and stop there',
            'Imply user error',
            'Close the issue'
        ]
    }
];

/**
 * Templates for responding to positive reviews
 */
export const POSITIVE_REVIEW_TEMPLATES: ReviewTemplate[] = [
    {
        id: 'positive-simple',
        type: 'positive',
        subType: 'appreciation',
        title: 'Simple Thank You',
        template: `Thank you so much! We're thrilled you're enjoying {APP_NAME}. Your support means the world to our team.`,
        bestPractices: [
            'Be genuine and brief',
            'Show the human behind the app',
            'Don\'t ask for anything'
        ],
        doNot: [
            'Ask them to share/recommend',
            'Promote new features',
            'Sound like a form letter'
        ]
    },
    {
        id: 'positive-specific-praise',
        type: 'positive',
        subType: 'appreciation',
        title: 'Response to Specific Praise',
        template: `Thank you for the kind words about {FEATURE}! Our team worked hard on that, and it's wonderful to hear it's making a difference.

We're always looking to improve. If you ever have suggestions, we're all ears at {SUPPORT_EMAIL}. Thanks for being part of the {APP_NAME} community!`,
        bestPractices: [
            'Acknowledge the specific thing they praised',
            'Share credit with your team',
            'Invite continued dialogue'
        ],
        doNot: [
            'Be overly promotional',
            'Ask for more reviews'
        ]
    },
    {
        id: 'positive-detailed',
        type: 'positive',
        subType: 'appreciation',
        title: 'Response to Detailed Positive Review',
        template: `Wow, thank you for taking the time to write such a thoughtful review! Reading how {APP_NAME} has helped with {SPECIFIC_USE_CASE} genuinely made our day.

Stories like yours are why we build {APP_NAME}. If you're ever interested in sharing more about your experience (for a case study or testimonial), we'd love to connect at {SUPPORT_EMAIL}. No pressure at all - just grateful you're here!`,
        bestPractices: [
            'Match their energy/effort',
            'Reference something specific they said',
            'Optional soft ask for testimonial'
        ],
        doNot: [
            'Give a generic response to detailed feedback',
            'Be pushy about testimonials',
            'Immediately ask for referrals'
        ]
    },
    {
        id: 'positive-convert-advocate',
        type: 'positive',
        subType: 'appreciation',
        title: 'Nurture Potential Advocate',
        template: `Thank you! It's amazing to hear {APP_NAME} has become part of your daily routine.

Fun fact: we're a small team that genuinely reads every review. If you ever want to share ideas or just chat, we'd love to hear from you at {SUPPORT_EMAIL}. Users like you help shape what we build next!`,
        bestPractices: [
            'Make them feel special',
            'Humanize your team',
            'Open door for relationship'
        ],
        doNot: [
            'Ask for social shares directly',
            'Offer incentives (violates guidelines)',
            'Be transactional'
        ]
    }
];

/**
 * All templates combined for easy lookup
 */
export const ALL_REVIEW_TEMPLATES = [
    ...ONE_STAR_TEMPLATES,
    ...FEATURE_REQUEST_TEMPLATES,
    ...BUG_REPORT_TEMPLATES,
    ...POSITIVE_REVIEW_TEMPLATES,
] as const;

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): ReviewTemplate | undefined {
    return ALL_REVIEW_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by type and subtype
 */
export function getTemplatesByType(type: ReviewTemplate['type'], subType?: string): ReviewTemplate[] {
    return ALL_REVIEW_TEMPLATES.filter(t =>
        t.type === type && (!subType || t.subType === subType)
    );
}

/**
 * General best practices for all App Store review responses
 */
export const GENERAL_RESPONSE_BEST_PRACTICES = [
    'Respond within 24-48 hours - shows you care',
    'Keep responses concise - under 200 words is ideal',
    'Never argue or get defensive',
    'Always provide a path to resolution (email, support link)',
    'Personalize when possible - reference specifics from their review',
    'Thank them regardless of rating - feedback is valuable',
    'Follow up on negative reviews after fixing issues',
    'Use "we" not "I" - shows team behind the app',
    'Avoid corporate jargon - write like a human',
    'Never offer refunds publicly - handle in private support'
] as const;

/**
 * Things to never do in review responses
 */
export const RESPONSE_ANTI_PATTERNS = [
    'Never ask users to change their rating',
    'Never offer incentives for positive reviews (violates App Store guidelines)',
    'Never copy-paste identical responses to multiple reviews',
    'Never ignore negative reviews - silence is perceived as not caring',
    'Never get into public arguments',
    'Never share user data or private support conversations',
    'Never blame Apple, iOS, or other apps',
    'Never make promises you cannot keep',
    'Never respond defensively to valid criticism',
    'Never use ALL CAPS or excessive punctuation!!!'
] as const;
