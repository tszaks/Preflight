import { FINANCE_CONTEXT } from './finance';
import { HEALTH_CONTEXT } from './health';
import { SOCIAL_CONTEXT } from './social';
import { GAMES_CONTEXT } from './games';

export interface CategoryContext {
    category: string;
    common_patterns: string[];
    specific_guidelines: string[];
    false_positive_overrides: string[];
}

/**
 * Maps App Store categories to their context objects.
 * Multiple category names can map to the same context
 * (e.g., "Finance" and "Business" both use finance context).
 */
const CATEGORY_MAP: Record<string, CategoryContext> = {
    // Finance
    'finance': FINANCE_CONTEXT,
    'business': FINANCE_CONTEXT,

    // Health
    'health-fitness': HEALTH_CONTEXT,
    'health & fitness': HEALTH_CONTEXT,
    'medical': HEALTH_CONTEXT,

    // Social
    'social-networking': SOCIAL_CONTEXT,
    'social networking': SOCIAL_CONTEXT,

    // Games
    'games': GAMES_CONTEXT,
    'entertainment': GAMES_CONTEXT,
};

/**
 * Get category-specific context for AI prompts.
 * Returns null if no special context exists for this category.
 */
export function getCategoryContext(category: string | null | undefined): CategoryContext | null {
    if (!category) return null;
    const key = category.toLowerCase().trim();
    return CATEGORY_MAP[key] || null;
}

/**
 * Format category context as text for injection into AI prompts.
 */
export function formatCategoryContext(context: CategoryContext): string {
    const lines: string[] = [];

    lines.push(`\n=== CATEGORY-SPECIFIC CONTEXT: ${context.category} ===`);

    lines.push('\nCommon patterns for this category (DO NOT flag these):');
    for (const pattern of context.common_patterns) {
        lines.push(`- ${pattern}`);
    }

    lines.push('\nRelevant guidelines to focus on:');
    for (const guideline of context.specific_guidelines) {
        lines.push(`- ${guideline}`);
    }

    lines.push('\nFalse positive overrides (NEVER flag these):');
    for (const override of context.false_positive_overrides) {
        lines.push(`- ${override}`);
    }

    lines.push('\n=== END CATEGORY CONTEXT ===');

    return lines.join('\n');
}
