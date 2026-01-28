import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { safeGetSession, supabase } }) => {
    const { user } = await safeGetSession();
    if (!user) {
        throw error(401, 'Unauthorized');
    }

    const body = await request.json();
    const { item_id, feedback } = body;

    if (!item_id || !['helpful', 'false_positive'].includes(feedback)) {
        throw error(400, 'Invalid request: item_id and feedback (helpful|false_positive) required');
    }

    // Verify the item belongs to a report owned by this user
    const { data: item } = await supabase
        .from('report_items')
        .select(`
            id,
            reports!inner(
                submissions!inner(user_id)
            )
        `)
        .eq('id', item_id)
        .single();

    if (!item) {
        throw error(404, 'Report item not found');
    }

    // Type assertion for nested join
    const ownerUserId = (item as any).reports?.submissions?.user_id;
    if (ownerUserId !== user.id) {
        throw error(403, 'Access denied');
    }

    // Update the feedback column
    const { error: updateError } = await supabase
        .from('report_items')
        .update({ user_feedback: feedback })
        .eq('id', item_id);

    if (updateError) {
        console.error('[Feedback] Update failed:', updateError);
        throw error(500, 'Failed to save feedback');
    }

    return json({ success: true });
};
