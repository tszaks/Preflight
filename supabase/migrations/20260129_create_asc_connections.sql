-- ASC Connections: Stores encrypted App Store Connect API credentials per user
-- Used by the optional ASC integration feature for auto-filling submission forms

CREATE TABLE IF NOT EXISTS public.asc_connections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    key_id text NOT NULL,
    issuer_id text NOT NULL,
    encrypted_private_key text NOT NULL,
    encryption_iv text NOT NULL,
    selected_app_id text,
    selected_app_name text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.asc_connections ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own ASC connection
CREATE POLICY "Users manage own ASC connection"
    ON public.asc_connections
    FOR ALL
    USING (auth.uid() = user_id);
