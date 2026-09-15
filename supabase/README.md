# DormFix PostgreSQL schema migration

## Apply the migration

1. Create a fresh **development** Supabase project and save its database password privately.
2. Open **SQL Editor**, create a new query, and paste `202609150001_dormfix_postgresql_schema.sql`. Run it once as the `postgres` role.
3. Run `tests/verify_dormfix_schema.sql` as `postgres`. It checks schema structure and application-style inserts, then rolls back its temporary records.
4. Keep the SQL file in your actual repository at `supabase/migrations/202609150001_dormfix_postgresql_schema.sql`.

The migration is transactional. An error aborts the transaction, so do not continue with a partially failed run. It intentionally fails when tables already exist rather than silently accepting a different schema. This file does not connect to Azure or import records. No remote database has been changed by preparing these files.

## Validation status

Static comparison against the Repomix passed: all 7 tables and 54 original columns are preserved, 2 required columns are added, and the migration contains 9 foreign keys, 7 primary keys, 7 RLS statements, and 11 indexes. The migration, verification SQL, and all seven refactored repositories passed tests against PGlite (embedded PostgreSQL). From `server`, run `npm run test:postgres` to reproduce them. A hosted Supabase connection, frontend end-to-end workflows, and multiple concurrent database clients have not been tested.

## Schema decisions

- Includes all seven tables and every column in the SQL Server export.
- Adds `users.phone_number` and `maintenance_requests.notification_status`, required by the repositories but absent from that export.
- Keeps IDs as `varchar(36)` to accept existing identifiers without assuming every stored ID is a valid UUID. New application-generated UUID strings still work.
- Converts Unicode strings to PostgreSQL UTF-8 `varchar`/`text`, `bit` to `boolean`, and `decimal(10,2)` to `numeric(10,2)`.
- Keeps calendar fields (`date_paid`, `move_in_date`) as `date`. Converts event timestamps to `timestamptz`, with `now()` defaults. SQL Server timestamps have no timezone: a later data import must explicitly interpret their original timezone before conversion. Do not assume historical Azure and local timestamps use the same timezone.
- Preserves source nullability, primary keys, email uniqueness, role constraint, and all nine foreign keys. Deletion does not automatically cascade into financial or chat history.
- Adds indexes for repository lookups and foreign keys.
- Keeps `Unassigned` as an application-supplied room number. Dorm assignments and chat room IDs do not reference `rooms`: pending assignments have no physical room, and chat IDs are separate conversation identifiers.
- Does not add new unique room/tenant/code constraints or capacity checks in this compatibility migration. Audit existing records before tightening them. Current source schema permits duplicate room numbers and multiple assignments; the backend must still enforce its intended rules.
- Preserves exact email uniqueness. PostgreSQL text equality is case-sensitive; check the source SQL Server collation and existing email/dorm-code casing before importing data. Normalize email writes and lookups during the backend refactor if case-insensitive identity is required.

## Supabase access

This phase keeps application authentication in `public.users`; it does not create Supabase Auth accounts or reference `auth.users`. Existing password values must remain bcrypt hashes, never plaintext.

RLS is enabled with no client policies, and table privileges are revoked from `PUBLIC`, `anon`, `authenticated`, and `service_role` where those roles exist. The existing frontend continues calling Express. Connect Express using `pg` and the private database connection string. The SQL Editor / table owner (`postgres`) bypasses RLS. A different database role needs an explicit access design; do not disable RLS merely to make browser access work. Do not expose the connection string or privileged credentials in Vite variables.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Data API grants](https://supabase.com/docs/guides/api/securing-your-api), [database connections](https://supabase.com/docs/guides/database/connecting-to-postgres).

## Backend configuration

The backend now uses `pg` across all seven repositories. CamelCase aliases are quoted; payment amounts and occupancy counts are returned as JavaScript numbers. Calendar-date responses retain UTC-midnight Date semantics. Transactions use one checked-out client and always release it; room assignment locks tenant and room rows before checking capacity. Duplicate room records and duplicate assignments are rejected for manual cleanup.

Run `npm ci` from `server` after applying the refactor. Add `DATABASE_URL` and `DB_SSL=true` to your existing private `server/.env` using `server/.env.example` as a reference. Use the Supabase session-pooler connection string for IPv4. Remove URI parameters `sslmode`, `sslcert`, `sslkey`, `sslrootcert`, and `uselibpqcompat`, because the connection module controls TLS separately. If certificate trust requires a CA, download Supabase's database certificate and set `DB_SSL_CA_PATH` to that file. Certificate verification stays enabled. Local PostgreSQL on localhost can use `DB_SSL=false`.

The old `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_NAME`, and `DB_PORT` variables are no longer used by this backend. Preserve your existing AI/email/SMS variables. No live secrets are included in `.env.example`. `npm start` checks database connectivity before serving traffic; shutdown closes sockets and the pool. Render's service root should be `server`, build command `npm ci && npm run build`, and start command `npm start`.

Schema creation does not migrate uploaded receipts or existing records. Plan that separately, preserving IDs, bcrypt hashes, relationship order, and timezone interpretation. Supabase Storage setup and receipt code changes are also a separate step.
