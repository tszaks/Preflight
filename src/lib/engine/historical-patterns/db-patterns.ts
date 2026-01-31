/**
 * Database-backed rejection pattern loader with in-memory cache.
 *
 * Loads patterns from the Supabase `rejection_patterns` table instead of
 * the static TypeScript file. Falls back to the static ENHANCED_PATTERNS
 * if the database is unavailable.
 *
 * Cache TTL: 5 minutes (patterns rarely change, but we want updates
 * within a reasonable window without hammering the DB).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { ENHANCED_PATTERNS, type EnhancedRejectionPattern } from './patterns-enhanced';

/** Shape of a pattern row from the rejection_patterns table */
export interface DBRejectionPattern {
    id: string;
    guideline: string;
    category: string;
    title: string;
    trigger_description: string;
    fix_suggestion: string;
    match_categories: string[];
    match_keywords: string[];
    match_features_required: string[];
    match_features_absent: string[];
    match_min_matches: number;
    base_confidence: number;
    calibrated_confidence: number | null;
    total_matches: number;
    source: string | null;
    is_active: boolean;
}

interface PatternCache {
    patterns: DBRejectionPattern[];
    loadedAt: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache: PatternCache | null = null;

/**
 * Load active patterns from the database with caching.
 * Falls back to static ENHANCED_PATTERNS if DB is unavailable.
 */
export async function loadPatternsFromDB(
    supabase: SupabaseClient<Database>,
): Promise<DBRejectionPattern[]> {
    // Check cache
    if (cache && Date.now() - cache.loadedAt < CACHE_TTL) {
        return cache.patterns;
    }

    try {
        const { data, error } = await supabase
            .from('rejection_patterns')
            .select('*')
            .eq('is_active', true);

        if (error) {
            console.warn('[Patterns] DB load failed, using static fallback:', error.message);
            return convertStaticPatterns();
        }

        if (!data || data.length === 0) {
            console.warn('[Patterns] No patterns in DB, using static fallback');
            return convertStaticPatterns();
        }

        // Update cache
        cache = {
            patterns: data as DBRejectionPattern[],
            loadedAt: Date.now(),
        };

        return cache.patterns;
    } catch (err) {
        console.warn('[Patterns] DB connection failed, using static fallback:', err);
        return convertStaticPatterns();
    }
}

/**
 * Convert static ENHANCED_PATTERNS to the DB pattern shape.
 * Used as a fallback when the database is unavailable.
 */
function convertStaticPatterns(): DBRejectionPattern[] {
    return ENHANCED_PATTERNS.map((p): DBRejectionPattern => ({
        id: p.id,
        guideline: p.guideline,
        category: p.category,
        title: p.title,
        trigger_description: p.trigger,
        fix_suggestion: p.fix,
        match_categories: p.match?.categories || [],
        match_keywords: p.match?.keywords || [],
        match_features_required: p.match?.features_required || [],
        match_features_absent: p.match?.features_absent || [],
        match_min_matches: p.match?.min_matches ?? 1,
        base_confidence: p.match?.base_confidence ?? 50,
        calibrated_confidence: null,
        total_matches: 0,
        source: 'static_fallback',
        is_active: true,
    }));
}

/**
 * Increment the total_matches counter for matched patterns.
 * Fire-and-forget: does not block the analysis pipeline.
 */
export function incrementMatchCounters(
    supabase: SupabaseClient<Database>,
    patternIds: string[],
): void {
    if (patternIds.length === 0) return;

    // Fire-and-forget updates
    for (const id of patternIds) {
        void (async () => {
            try {
                await supabase.rpc('increment_pattern_matches' as never, { pattern_id: id } as never);
            } catch {
                // Fallback: log and continue (counter increment is non-critical)
                console.debug('[Patterns] Failed to increment match counter for pattern:', id);
            }
        })();
    }
}

/**
 * Recalculate calibrated_confidence for a pattern based on feedback.
 *
 * Formula: Blend base_confidence with observed helpful rate.
 * Weight feedback more as count grows (30% at 3 feedbacks -> 90% at 30+).
 */
export function recalibrateConfidence(
    baseConfidence: number,
    feedbackCount: number,
    helpfulCount: number,
): number | null {
    if (feedbackCount < 3) return null; // Not enough data

    const helpfulRate = helpfulCount / feedbackCount;
    // Weight: 10% per feedback, capping at 90%
    const feedbackWeight = Math.min(0.9, 0.1 * feedbackCount);
    const blended = baseConfidence * (1 - feedbackWeight) + (helpfulRate * 100) * feedbackWeight;

    return Math.round(Math.min(79, Math.max(30, blended)));
}

/**
 * Clear the in-memory cache. Useful for testing or after admin edits.
 */
export function clearPatternCache(): void {
    cache = null;
}
