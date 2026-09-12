import { describe, expect, it } from 'vitest';
import { matchCategoryHeuristics } from './category-heuristics';

describe('category heuristic keyword matching', () => {
    it('does not treat ordinary words containing subscription keywords as subscription metadata', () => {
        const results = matchCategoryHeuristics({
            app_name: 'Payday: Tip & Pay Tracker',
            screenshot_paths: [],
            category: 'Finance',
            description: 'A projection of next week built from the nights you actually work. Plan the week with confidence.',
            keywords: 'server,paycheck,earnings,shifts',
        });

        const warnings = results.filter((result) => result.severity === 'warning');
        expect(warnings).toEqual([]);
    });

    it('still detects explicit subscription terminology', () => {
        const results = matchCategoryHeuristics({
            app_name: 'Budget Pro',
            screenshot_paths: [],
            category: 'Finance',
            description: 'Upgrade to a monthly subscription plan.',
            keywords: 'premium,subscription',
        });

        expect(results.some((result) => result.severity === 'warning')).toBe(true);
    });
});
