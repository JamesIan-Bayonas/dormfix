BEGIN;

CREATE TABLE public.app_sessions (
    token_hash char(64) PRIMARY KEY,
    user_id varchar(36) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX app_sessions_user_idx ON public.app_sessions(user_id);
CREATE INDEX app_sessions_expiry_idx ON public.app_sessions(expires_at);

CREATE TABLE public.announcements (
    id varchar(36) PRIMARY KEY,
    landlord_id varchar(36) NOT NULL REFERENCES public.users(id),
    title varchar(160) NOT NULL CHECK (length(trim(title)) > 0),
    body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 10000),
    room_number varchar(50),
    priority varchar(20) NOT NULL DEFAULT 'standard' CHECK (priority IN ('standard', 'important')),
    status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    expires_at timestamptz,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    version integer NOT NULL DEFAULT 1,
    CHECK (status <> 'published' OR published_at IS NOT NULL),
    CHECK (room_number IS NULL OR length(trim(room_number)) > 0)
);
CREATE INDEX announcements_landlord_idx ON public.announcements(landlord_id, published_at DESC);
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_sessions, public.announcements FROM PUBLIC;
DO $$
DECLARE client_role text;
BEGIN
    FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
            EXECUTE format('REVOKE ALL ON public.app_sessions, public.announcements FROM %I', client_role);
        END IF;
    END LOOP;
END $$;
COMMIT;
