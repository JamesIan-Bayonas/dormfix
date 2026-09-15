-- Run after the initial migration as postgres / table owner.
-- Temporary application-style records are always rolled back on success.
BEGIN;

DO $verify$
#variable_conflict use_variable
DECLARE
    table_name text;
    api_role text;
    table_names text[] := ARRAY[
        'users', 'rooms', 'dorm_assignments', 'house_rules',
        'maintenance_requests', 'payments', 'chat_messages'
    ];
    landlord_id text := md5(random()::text || clock_timestamp()::text);
    tenant_id text := md5(random()::text || clock_timestamp()::text);
    assignment_id text := md5(random()::text || clock_timestamp()::text);
    payment_id text := md5(random()::text || clock_timestamp()::text);
    maintenance_id text := md5(random()::text || clock_timestamp()::text);
    rule_id text := md5(random()::text || clock_timestamp()::text);
    fk_count integer;
    actual_count integer;
BEGIN
    FOREACH table_name IN ARRAY table_names LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = table_name
                AND c.relkind = 'r' AND c.relrowsecurity
        ) THEN
            RAISE EXCEPTION 'Missing table or RLS: %', table_name;
        END IF;
        IF EXISTS (
            SELECT 1 FROM pg_policies p
            WHERE p.schemaname = 'public' AND p.tablename = table_name
        ) THEN
            RAISE EXCEPTION 'Unexpected client policy on %', table_name;
        END IF;
        FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
                IF has_table_privilege(api_role, format('public.%I', table_name),
                    'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') THEN
                    RAISE EXCEPTION 'Unexpected Data API privilege: % on %', api_role, table_name;
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    SELECT count(*) INTO fk_count
    FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = ANY(table_names) AND c.contype = 'f';
    IF fk_count <> 9 THEN
        RAISE EXCEPTION 'Expected 9 foreign keys, found %', fk_count;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = 'users'
            AND c.column_name = 'phone_number'
    ) OR NOT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = 'maintenance_requests'
            AND c.column_name = 'notification_status'
    ) THEN
        RAISE EXCEPTION 'Repository-required columns are missing';
    END IF;

    -- Deliberately invalid as real bcrypt hashes: test data only, rolled back.
    INSERT INTO public.users (id, name, email, password, role, is_approved, phone_number)
    VALUES (landlord_id, 'Migration landlord', landlord_id || '@example.invalid',
        'TEST_ONLY_NOT_A_PASSWORD_HASH', 'landlord', true, '09000000000'),
        (tenant_id, 'Migration tenant', tenant_id || '@example.invalid',
        'TEST_ONLY_NOT_A_PASSWORD_HASH', 'tenant', false, NULL);

    INSERT INTO public.rooms (id, landlord_id, room_number)
    VALUES (md5(random()::text), landlord_id, 'Migration room');
    IF NOT EXISTS (SELECT 1 FROM public.rooms r
        WHERE r.landlord_id = landlord_id AND r.capacity = 1) THEN
        RAISE EXCEPTION 'Room default capacity failed';
    END IF;

    INSERT INTO public.dorm_assignments (id, tenant_id, landlord_id, room_number, move_in_date)
    VALUES (assignment_id, tenant_id, landlord_id, 'Unassigned', current_date);
    UPDATE public.dorm_assignments SET room_number = 'Migration room'
    WHERE id = assignment_id;

    INSERT INTO public.house_rules (id, landlord_id, rule_text)
    VALUES (rule_id, landlord_id, 'Keep common areas clean — salamat!');
    IF NOT EXISTS (SELECT 1 FROM public.house_rules
        WHERE id = rule_id AND category = 'General' AND is_priority = false
            AND created_at IS NOT NULL) THEN
        RAISE EXCEPTION 'House rule defaults failed';
    END IF;

    INSERT INTO public.maintenance_requests (id, tenant_id, description)
    VALUES (maintenance_id, tenant_id, 'Migration smoke test');
    IF NOT EXISTS (SELECT 1 FROM public.maintenance_requests
        WHERE id = maintenance_id AND notification_status = 'Not Required'
            AND status = 'Pending' AND date_submitted IS NOT NULL) THEN
        RAISE EXCEPTION 'Maintenance defaults failed';
    END IF;

    INSERT INTO public.payments (id, tenant_id, landlord_id, amount,
        payment_type, proof_image, date_paid)
    VALUES (payment_id, tenant_id, landlord_id, 1234.56,
        'Rent', 'test-only/receipt.png', DATE '2026-09-15');
    IF NOT EXISTS (SELECT 1 FROM public.payments
        WHERE id = payment_id AND amount = 1234.56 AND status = 'Pending'
            AND date_paid = DATE '2026-09-15' AND created_at IS NOT NULL) THEN
        RAISE EXCEPTION 'Payment decimal, date, or default failed';
    END IF;

    INSERT INTO public.chat_messages (id, room_id, sender_id, recipient_id, sender_role, text)
    VALUES (md5(random()::text), 'conversation-' || assignment_id,
        tenant_id, landlord_id, 'tenant', 'Hello — kumusta?');

    -- Constraint failures are caught in nested transaction blocks.
    BEGIN
        INSERT INTO public.users (id, name, email, password)
        VALUES (md5(random()::text), 'Duplicate email', tenant_id || '@example.invalid', 'TEST_ONLY');
        RAISE EXCEPTION 'Duplicate email unexpectedly accepted';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
    BEGIN
        UPDATE public.users SET role = 'invalid-role' WHERE id = tenant_id;
        RAISE EXCEPTION 'Invalid role unexpectedly accepted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    BEGIN
        UPDATE public.payments SET tenant_id = md5(random()::text) WHERE id = payment_id;
        RAISE EXCEPTION 'Missing parent user unexpectedly accepted';
    EXCEPTION WHEN foreign_key_violation THEN NULL;
    END;
    BEGIN
        DELETE FROM public.users WHERE id = tenant_id;
        RAISE EXCEPTION 'Referenced user unexpectedly deleted';
    EXCEPTION WHEN foreign_key_violation THEN NULL;
    END;

    SELECT count(*) INTO actual_count FROM public.dorm_assignments da
    JOIN public.users u ON u.id = da.tenant_id
    WHERE da.id = assignment_id AND u.id = tenant_id
        AND da.room_number = 'Migration room' AND u.is_approved = false;
    IF actual_count <> 1 THEN
        RAISE EXCEPTION 'Assignment join or approval boolean failed';
    END IF;
    RAISE NOTICE 'PASS: schema, RLS/API privileges, relationships, defaults, and application inserts';
END;
$verify$;

ROLLBACK;
