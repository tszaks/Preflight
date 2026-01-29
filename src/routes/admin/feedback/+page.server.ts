import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
    const { user } = await safeGetSession();
    if (!user) {
        return { status: 401, error: 'Not authenticated' };
    }

    // Fetch all report items with feedback
    const { data: items, error } = await supabase
        .from('report_items')
        .select('category, title, severity, user_feedback')
        .not('user_feedback', 'is', null);

    if (error || !items) {
        return { feedbackData: [], error: error?.message };
    }

    // Aggregate by title
    const titleMap = new Map<string, {
        title: string;
        category: string;
        severity: string;
        helpful: number;
        false_positive: number;
        total: number;
    }>();

    for (const item of items) {
        const key = `${item.category}::${item.title}`;
        const existing = titleMap.get(key) || {
            title: item.title,
            category: item.category,
            severity: item.severity,
            helpful: 0,
            false_positive: 0,
            total: 0,
        };

        existing.total++;
        if (item.user_feedback === 'helpful') existing.helpful++;
        if (item.user_feedback === 'false_positive') existing.false_positive++;

        titleMap.set(key, existing);
    }

    // Convert to sorted array (highest FP rate first)
    const feedbackData = Array.from(titleMap.values())
        .map(d => ({
            ...d,
            fp_rate: d.total > 0 ? Math.round((d.false_positive / d.total) * 100) : 0,
        }))
        .sort((a, b) => b.fp_rate - a.fp_rate);

    return { feedbackData };
};
