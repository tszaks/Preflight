/**
 * Maps analysis check types + app categories to relevant Apple guideline sections.
 * Used to inject REAL guideline text into AI prompts so Claude doesn't hallucinate section numbers.
 */

export type CheckTopic =
    | 'screenshots'
    | 'description'
    | 'privacy'
    | 'privacy_manifest'
    | 'content_policy'
    | 'metadata'
    | 'subscriptions'
    | 'iap'
    | 'user_generated_content'
    | 'age_rating';

/**
 * Maps check topics to their most relevant guideline sections.
 */
export const GUIDELINES_BY_TOPIC: Record<CheckTopic, string[]> = {
    screenshots: [
        '2.3',    // Accurate Metadata
        '2.3.7',  // Accurate Screenshots
        '2.1',    // App Completeness
    ],
    description: [
        '2.3',    // Accurate Metadata
        '2.1',    // App Completeness
        '4.0',    // Design General
    ],
    privacy: [
        '5.1',    // Privacy
        '5.1.1',  // Data Collection and Storage
        '5.1.2',  // Data Use and Sharing
    ],
    privacy_manifest: [
        '5.1',    // Privacy
        '5.1.1',  // Data Collection and Storage
        '2.5',    // Software Requirements (required API declarations)
    ],
    content_policy: [
        '1.1',    // Objectionable Content
        '1.2',    // User-Generated Content
        '1.4',    // Physical Harm
    ],
    metadata: [
        '2.3',    // Accurate Metadata
        '4.3',    // Spam
        '2.1',    // App Completeness
    ],
    subscriptions: [
        '3.1.1',  // In-App Purchase
        '3.1',    // Payments
        '3.2',    // Other Business Model Issues
    ],
    iap: [
        '3.1.1',  // In-App Purchase
        '3.1',    // Payments
    ],
    user_generated_content: [
        '1.2',    // User-Generated Content
        '1.1',    // Objectionable Content
        '5.1',    // Privacy
    ],
    age_rating: [
        '1.1',    // Objectionable Content
        '1.3',    // Kids Category
        '5.3',    // Gaming, Gambling, and Lotteries
    ],
};

/**
 * Get relevant guideline sections for a given check topic.
 */
export function getRelevantSections(topic: CheckTopic): string[] {
    return GUIDELINES_BY_TOPIC[topic] || [];
}

/**
 * Get relevant guideline sections for multiple topics.
 * Deduplicates section numbers.
 */
export function getRelevantSectionsForTopics(topics: CheckTopic[]): string[] {
    const sections = new Set<string>();
    for (const topic of topics) {
        for (const section of getRelevantSections(topic)) {
            sections.add(section);
        }
    }
    return Array.from(sections);
}
