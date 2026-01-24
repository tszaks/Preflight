import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
    joinWaitlist: async ({ request, locals }) => {
        const formData = await request.formData();
        const email = formData.get('email')?.toString().trim().toLowerCase();

        if (!email || !email.includes('@')) {
            return fail(400, { message: 'Please enter a valid email address.' });
        }

        const { error } = await locals.supabase
            .from('waitlist')
            .insert({ email });

        if (error) {
            if (error.code === '23505') {
                // Unique constraint violation - email already exists
                return fail(409, { message: 'You\'re already on the list!' });
            }
            console.error('Waitlist insert error:', error);
            return fail(500, { message: 'Something went wrong. Please try again.' });
        }

        return { success: true };
    }
};
