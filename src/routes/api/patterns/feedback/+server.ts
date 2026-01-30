/**
 * Pattern Feedback API
 *
 * POST /api/patterns/feedback
 * Submit feedback on whether a pattern prediction was helpful.
 * Recalculates calibrated_confidence after insert.
 *
 * Body: { report_item_id: string, pattern_id: string, was_helpful: boolean, comment?: string }
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recalibrateConfidence } from '$lib/engine/historical-patterns/db-patterns';

export const POST: RequestHandler = async ({ request, locals }) => {
    const supabase = locals.supabase;
    const session = await locals.getSession?.();

    if (!session?.user) {
        throw error(401, 'Authentication required');
    }

    const body = await request.json();
    const { report_item_id, pattern_id, was_helpful, comment } = body;

    if (!pattern_id || typeof was_helpful !== 'boolean') {
        throw error(400, 'Missing required fields: pattern_id, was_helpful');
    }

    // Insert feedback
    const { error: insertError } = await supabase
        .from('pattern_feedback')
        .insert({
            pattern_id,
            report_item_id: report_item_id || null,
            user_id: session.user.id,
            was_helpful,
            comment: comment || null,
        });

    if (insertError) {
        if (insertError.code === '23505') {
            throw error(409, 'You have already submitted feedback for this pattern on this item');
        }
        console.error('[Feedback] Insert failed:', insertError);
        throw error(500, 'Failed to save feedback');
    }

    // Recalculate calibrated_confidence for this pattern
    const { data: allFeedback } = await supabase
        .from('pattern_feedback')
        .select('was_helpful')
        .eq('pattern_id', pattern_id);

    if (allFeedback && allFeedback.length >= 3) {
        const helpfulCount = allFeedback.filter(f => f.was_helpful).length;

        // Get base confidence from the pattern
        const { data: pattern } = await supabase
            .from('rejection_patterns')
            .select('base_confidence')
            .eq('id', pattern_id)
            .single();

        if (pattern) {
            const calibrated = recalibrateConfidence(
                pattern.base_confidence,
                allFeedback.length,
                helpfulCount,
            );

            await supabase
                .from('rejection_patterns')
                .update({
                    calibrated_confidence: calibrated,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', pattern_id);
        }
    }

    return json({
        success: true,
        message: 'Feedback recorded',
    });
};
