/**
 * Extracts verifiable claims from app store descriptions.
 * Identifies statements that can be fact-checked against external sources
 * (e.g., "Featured by Apple", "#1 Finance App", "Used by 1M+ people").
 */

import Anthropic from '@anthropic-ai/sdk';

export interface ExtractedClaim {
    /** The original claim text */
    text: string;
    /** Category of claim */
    type: 'ranking' | 'award' | 'statistic' | 'endorsement' | 'comparison';
    /** How to verify this claim */
    verification_query: string;
    /** Severity if claim is false */
    impact: 'critical' | 'warning';
}

const CLAIM_EXTRACTION_PROMPT = `You are an App Store review compliance specialist. Extract verifiable claims from the following app description.

A "verifiable claim" is any statement that can be fact-checked against external data, including:
- Rankings (#1, Top 10, best-selling)
- Awards (Featured by Apple, Editor's Choice, award wins)
- Statistics (1M+ users, 99.9% uptime, $X saved)
- Endorsements (recommended by X, as seen on Y)
- Comparisons (faster than X, more features than Y)

Return a JSON array of claims. Each claim has:
- "text": the exact claim text from the description
- "type": one of "ranking", "award", "statistic", "endorsement", "comparison"
- "verification_query": a web search query to verify this claim
- "impact": "critical" if the claim could cause rejection if false (Section 2.3 - Accurate Metadata), "warning" otherwise

If no verifiable claims are found, return an empty array.

Return ONLY valid JSON, no markdown or explanation.`;

/**
 * Extract verifiable claims from an app description.
 */
export async function extractClaims(
    client: Anthropic,
    description: string
): Promise<ExtractedClaim[]> {
    if (!description || description.trim().length < 20) {
        return [];
    }

    try {
        const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: `${CLAIM_EXTRACTION_PROMPT}\n\n--- APP DESCRIPTION ---\n${description.slice(0, 4000)}`,
                },
            ],
        });

        const text = response.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map((b) => b.text)
            .join('');

        const claims: ExtractedClaim[] = JSON.parse(text);
        return Array.isArray(claims) ? claims : [];
    } catch {
        console.error('[ClaimExtractor] Failed to extract claims');
        return [];
    }
}
