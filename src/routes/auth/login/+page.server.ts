import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    login: async ({ request, locals: { supabase } }) => {
        const formData = await request.formData();
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return fail(400, { message: error.message });
        }

        // Redirect to next URL if provided (e.g., from pricing page), otherwise dashboard
        const next = formData.get('next')?.toString();
        const plan = formData.get('plan')?.toString();

        if (next) {
            // Append plan param if coming from pricing flow
            const redirectUrl = plan ? `${next}?plan=${plan}` : next;
            throw redirect(303, redirectUrl);
        }

        throw redirect(303, '/dashboard');
    },
};
