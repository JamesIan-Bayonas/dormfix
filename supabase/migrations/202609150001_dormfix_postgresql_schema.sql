-- DormFix initial PostgreSQL / Supabase schema migration.
-- Apply once to a fresh development database as postgres (SQL Editor).
-- Schema only: does not import SQL Server records, files, or credentials.
-- Intended repository location: supabase/migrations/202609150001_dormfix_postgresql_schema.sql
-- Existing application authentication remains in public.users, not auth.users.
BEGIN;

CREATE TABLE public.users (
    id varchar(36) PRIMARY KEY,
    name varchar(100) NOT NULL,
    email varchar(100) NOT NULL,
    password varchar(255) NOT NULL,
    role varchar(20),
    dorm_fix_id varchar(50),
    is_approved boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    profile_image varchar(255),
    last_seen timestamptz DEFAULT now(),
    phone_number varchar(20),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_check CHECK (role IN ('admin', 'tenant', 'landlord'))
);

CREATE TABLE public.rooms (
    id varchar(36) PRIMARY KEY,
    landlord_id varchar(36) NOT NULL REFERENCES public.users(id),
    room_number varchar(50) NOT NULL,
    capacity integer DEFAULT 1
);

CREATE TABLE public.dorm_assignments (
    id varchar(36) PRIMARY KEY,
    tenant_id varchar(36) NOT NULL REFERENCES public.users(id),
    landlord_id varchar(36) NOT NULL REFERENCES public.users(id),
    room_number varchar(50),
    move_in_date date,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.house_rules (
    id varchar(36) PRIMARY KEY,
    landlord_id varchar(36) NOT NULL REFERENCES public.users(id),
    rule_text text NOT NULL,
    created_at timestamptz DEFAULT now(),
    target_room_number varchar(50),
    category varchar(50) DEFAULT 'General',
    is_priority boolean DEFAULT false
);

CREATE TABLE public.maintenance_requests (
    id varchar(36) PRIMARY KEY,
    tenant_id varchar(36) NOT NULL REFERENCES public.users(id),
    issue_type varchar(50),
    description text,
    urgency varchar(20),
    status varchar(20) DEFAULT 'Pending',
    date_submitted timestamptz DEFAULT now(),
    admin_remarks text,
    notification_status varchar(50) DEFAULT 'Not Required'
);

CREATE TABLE public.payments (
    id varchar(36) PRIMARY KEY,
    tenant_id varchar(36) NOT NULL REFERENCES public.users(id),
    landlord_id varchar(36) NOT NULL REFERENCES public.users(id),
    amount numeric(10, 2) NOT NULL,
    payment_type varchar(50) NOT NULL,
    proof_image varchar(255) NOT NULL,
    status varchar(20) DEFAULT 'Pending',
    date_paid date NOT NULL,
    created_at timestamptz DEFAULT now(),
    remarks text,
    rejection_reason text,
    reference_number varchar(50)
);

CREATE TABLE public.chat_messages (
    id varchar(36) PRIMARY KEY,
    room_id varchar(100) NOT NULL,
    sender_id varchar(36) NOT NULL REFERENCES public.users(id),
    recipient_id varchar(36) NOT NULL REFERENCES public.users(id),
    sender_role varchar(20) NOT NULL,
    text text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Query and foreign-key indexes (PostgreSQL does not create FK indexes).
CREATE INDEX users_dorm_fix_id_idx ON public.users (dorm_fix_id);
CREATE INDEX rooms_landlord_room_idx ON public.rooms (landlord_id, room_number);
CREATE INDEX dorm_assignments_tenant_idx ON public.dorm_assignments (tenant_id);
CREATE INDEX dorm_assignments_landlord_room_idx ON public.dorm_assignments (landlord_id, room_number);
CREATE INDEX house_rules_landlord_created_idx ON public.house_rules (landlord_id, created_at DESC);
CREATE INDEX maintenance_requests_tenant_date_idx ON public.maintenance_requests (tenant_id, date_submitted DESC);
CREATE INDEX payments_tenant_date_idx ON public.payments (tenant_id, date_paid DESC);
CREATE INDEX payments_landlord_date_idx ON public.payments (landlord_id, date_paid DESC);
CREATE INDEX chat_messages_room_created_idx ON public.chat_messages (room_id, created_at);
CREATE INDEX chat_messages_sender_idx ON public.chat_messages (sender_id);
CREATE INDEX chat_messages_recipient_idx ON public.chat_messages (recipient_id);

-- Backend-only database access. No browser policies are created because the
-- existing application does not use Supabase Auth. Table owner / postgres
-- connections bypass RLS; ordinary roles with no policy cannot access rows.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dorm_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
    public.users, public.rooms, public.dorm_assignments, public.house_rules,
    public.maintenance_requests, public.payments, public.chat_messages
FROM PUBLIC;

-- Supabase-specific roles may not exist on a standalone PostgreSQL test DB.
-- Revoke service_role as well: this phase uses pg, not the Supabase Data API.
DO $migration$
DECLARE
    api_role text;
BEGIN
    FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role']
    LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
            EXECUTE format(
                'REVOKE ALL PRIVILEGES ON TABLE public.users, public.rooms, public.dorm_assignments, public.house_rules, public.maintenance_requests, public.payments, public.chat_messages FROM %I',
                api_role
            );
        END IF;
    END LOOP;
END;
$migration$;

COMMIT;
