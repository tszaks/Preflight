import type { SupabaseClient, Session, User } from '@supabase/supabase-js';

declare global {
    namespace App {
        interface Locals {
            supabase: SupabaseClient;
            safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
        }
        // PageData is auto-inferred from load functions.
        // session, user come from +layout.server.ts
        // supabase comes from +layout.ts (universal)
        interface PageData {
            session: Session | null;
            user: User | null;
        }
    }
}

export {};
