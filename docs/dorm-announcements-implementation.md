# Dorm announcements

Implemented 17 October 2026. This feature adds landlord notice management, tenant home previews, and announcement history.

Follow-up: [local release verification](local-release-verification.md) confirmed that the required tables are already present in the configured database. Database-backed API and local browser checks passed using rolled-back fixture records. No public deployment was performed.

## Using the feature

Landlords open **Announcements** in the sidebar, then **New announcement**. Enter a title and details, choose all tenants or a room belonging to the landlord, select standard or important, and optionally set an expiry. Save a draft privately or publish it. Published notices can be edited. Archive removes them from current notices while retaining previously published notices in tenant history. Archived drafts are never exposed to tenants.

Tenants see up to three current notices on Home, with important notices first. **View all announcements** and the Announcements navigation item open a full current/history view. A notice is visible only when the signed-in tenant is approved and currently linked to its landlord and, for a room notice, assigned to that room. Unassigned tenants receive all-tenant notices only. Moving rooms or changing dormitories updates which notices are available.

Expiry uses the browser's named device timezone in the editor and is sent as an ISO timestamp with timezone. Current lists reevaluate expiry every 30 seconds while open; history retains expired notices. Records refresh on navigation, browser focus, and explicit Refresh. There are no email alerts, push notifications, read receipts, or acknowledgments.

## Database deployment prerequisite

Apply `supabase/migrations/202610170001_announcements_and_sessions.sql` **after** the initial PostgreSQL migration and **before** deploying this server version. Apply it through the existing database migration process or the Supabase SQL Editor as the database owner. It creates only the `announcements` and `app_sessions` tables and their indexes/access restrictions. It does not modify existing dormitory records. It is transactional and intended to run once.

The migration was initially tested against temporary embedded PostgreSQL. Follow-up inspection found its tables already present in the configured database; they were verified without rerunning the migration. No remote deployment was performed. Other environments must apply this migration before deploying the updated login endpoint.

After deployment, users with older saved sign-ins must sign out and sign in again to obtain a session token. Other dashboard tasks remain available to older saved sessions, but announcements require a verified session.

## Authentication and scope

Successful password login issues a cryptographically random 256-bit bearer token. Only its SHA-256 hash is stored in PostgreSQL, with a 12-hour expiry. Tokens survive server restarts. The frontend retains the token in its existing saved-user record and sends it only to announcements and session logout. Logout attempts server revocation and clears the local sign-in; a failed revocation does not prevent local sign-out, and the server token still expires after 12 hours.

Each announcement request validates the token against the database and reads the user's current role and approval. Landlords cannot modify another landlord's notices; tenants cannot create, edit, or archive. Audience selection is validated server-side. Queries derive identity from the session, not a submitted landlord/tenant ID. Version checks reject stale edits/archives. Published notices cannot be converted back into private drafts. Text is rendered as plain React text, not HTML.

The initial implementation protected announcements and logout. [Phase 14](phase-14-access-control.md) subsequently extended session and ownership checks to the existing APIs, private files, and Socket.IO chat.

Both tables use the repository's backend-only database access pattern: RLS is enabled and direct client grants are revoked. Express must use its existing privileged backend connection, never a browser database credential.

## Verification

- Client and server production builds pass; the existing DaisyUI radial-progress optimization warning remains.
- Targeted lint passes for the new announcement modules and changed dashboard/navigation components.
- `npm run test:announcements --prefix server` applies both migrations to PGlite and exercises real Express routes and SQL. It covers session hashing/expiry, login/logout, roles and approval, foreign-room targeting, cross-landlord writes, draft privacy, publish/edit/archive, optimistic versions, expired history, reassignment, validation, and revoked direct client access.
- `node --test client/tests/announcements.test.mjs` checks expiry boundaries, important-first order, history preservation, and timezone conversion.
- `server/tests/announcements.browser.cjs` drives the actual frontend and new API against the temporary PostgreSQL fixture. It covers sign-in, private drafts, publishing, room/dorm isolation, retained entries after save failure, editing, archive confirmation, tenant history, read retry, dark appearance, and reflow at 1440, 768, 390, and 320px. It does not mutate the configured database or send notifications.
- To reproduce browser checks, run `node server/tests/announcements.integration.cjs --serve` after building the server, start Vite on port 5179, and run the browser script with Playwright available (`DORMFIX_PLAYWRIGHT_MODULE` may point to an installed module). The fixture binds only to 127.0.0.1:5018 and uses disposable records. Stop it after checking.

Screenshots use fictional test data: [landlord desktop](screenshots/announcements-landlord-desktop.png), [tenant dark mobile](screenshots/announcements-tenant-dark-mobile.png).

Configured PostgreSQL and local frontend workflows have since passed rollback-based verification. Public deployment, real multi-user traffic, and screen-reader testing remain unverified.
