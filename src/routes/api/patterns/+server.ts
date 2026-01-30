/**
 * Pattern CRUD API (admin-only, service role)
 *
 * GET  /api/patterns - List all patterns with match stats
 * POST /api/patterns - Create a new pattern
 * PATCH /api/patterns - Update a pattern (body must include id)
 * DELETE /api/patterns - Soft-delete a pattern (set is_active = false)
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearPatternCache } from '$lib/engine/historical-patterns/db-patterns';

export const GET: RequestHandler = async ({ locals }) => {
    const supabase = locals.supabase;

    const { data, error: queryError } = await supabase
        .from('rejection_patterns')
        .select('*')
        .order('category')
        .order('id');

    if (queryError) {
        console.error('[Patterns API] List failed:', queryError);
        throw error(500, 'Failed to fetch patterns');
    }

    return json({ patterns: data });
};

export const POST: RequestHandler = async ({ request, locals }) => {
    const supabase = locals.supabase;
    const session = await locals.getSession?.();

    if (!session?.user) {
        throw error(401, 'Authentication required');
    }

    const body = await request.json();
    const {
        id, guideline, category, title, trigger_description, fix_suggestion,
        match_categories, match_keywords, match_features_required,
        match_features_absent, match_min_matches, base_confidence,
        source, source_url,
    } = body;

    if (!id || !guideline || !category || !title || !trigger_description || !fix_suggestion) {
        throw error(400, 'Missing required fields');
    }

    const { data, error: insertError } = await supabase
        .from('rejection_patterns')
        .insert({
            id,
            guideline,
            category,
            title,
            trigger_description,
            fix_suggestion,
            match_categories: match_categories || [],
            match_keywords: match_keywords || [],
            match_features_required: match_features_required || [],
            match_features_absent: match_features_absent || [],
            match_min_matches: match_min_matches ?? 1,
            base_confidence: base_confidence ?? 50,
            source: source || 'manual',
            source_url: source_url || null,
        })
        .select()
        .single();

    if (insertError) {
        if (insertError.code === '23505') {
            throw error(409, `Pattern with id "${id}" already exists`);
        }
        console.error('[Patterns API] Create failed:', insertError);
        throw error(500, 'Failed to create pattern');
    }

    clearPatternCache();
    return json({ pattern: data }, { status: 201 });
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
    const supabase = locals.supabase;
    const session = await locals.getSession?.();

    if (!session?.user) {
        throw error(401, 'Authentication required');
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
        throw error(400, 'Missing required field: id');
    }

    // Add updated timestamp
    updates.updated_at = new Date().toISOString();

    const { data, error: updateError } = await supabase
        .from('rejection_patterns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        console.error('[Patterns API] Update failed:', updateError);
        throw error(500, 'Failed to update pattern');
    }

    clearPatternCache();
    return json({ pattern: data });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
    const supabase = locals.supabase;
    const session = await locals.getSession?.();

    if (!session?.user) {
        throw error(401, 'Authentication required');
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
        throw error(400, 'Missing required field: id');
    }

    // Soft delete: set is_active = false
    const { error: deleteError } = await supabase
        .from('rejection_patterns')
        .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (deleteError) {
        console.error('[Patterns API] Delete failed:', deleteError);
        throw error(500, 'Failed to delete pattern');
    }

    clearPatternCache();
    return json({ success: true, message: `Pattern "${id}" deactivated` });
};
