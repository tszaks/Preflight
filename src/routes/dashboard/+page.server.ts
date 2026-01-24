import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }) => {
    const session = await getSession();

    if (!session) {
        throw redirect(303, '/login');
    }

    // TODO: Fetch user's submissions from database
    // For now, return mock data
    const submissions = [
        // Empty for new users
    ];

    return { submissions };
};
