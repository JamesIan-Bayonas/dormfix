# Phase 14: authentication and ownership checks

Implemented 17 October 2026. This phase extends the announcement session mechanism across the existing DormFix APIs, receipt files, and Socket.IO chat. It requires the existing `app_sessions` table; no new database migration is introduced.

## Changes users will notice

| Area | New behavior |
| --- | --- |
| Sign-in | Older saved sign-ins without a valid session token return to the sign-in form. An expired/revoked HTTP session clears the current workspace and displays an explicit sign-in message. |
| Payments | Tenants read and submit only their own payment proof. Only the receipt's landlord may verify/reject it. Rejection requires a reason. |
| Receipts | Raw upload links require an authenticated authorized request. The receipt viewer loads the file with the session header and displays a temporary browser blob. Tokens are not added to image URLs. |
| Maintenance | Tenants access their own reports. The server uses the authenticated role, and only the landlord currently responsible for a tenant may update that tenant's reports. |
| Rooms and tenants | Landlords list/manage their own rooms and linked tenants. Assigning another landlord's tenant, forging the landlord ID, self-approval, and approving a landlord account are blocked. |
| Profile | A user can edit only their own profile; profile updates do not accept role/approval changes. |
| House rules | Tenants receive only global rules and rules for their current room from their own landlord. Other rooms' rules are filtered on the server. |
| Messages | A session is required for the socket connection. Conversation membership, sender identity, recipient, moderation rights, and presence access are checked on the server. |

Pending/unlinked tenants can still sign in, read their own housing details, edit their own profile, sign out, and use the supported relink flow. Payment/report submission requires one assigned room and current approval. Relinking is rejected while an assignment exists; a successful new link resets approval to pending.

## HTTP enforcement

Public login, tenant/landlord registration, and health checks remain public. Registration rejects unsupported roles such as admin. The remaining API routes require a database-backed bearer session. The middleware reads the current user role and tenant approval from PostgreSQL instead of trusting browser roles or submitted user IDs.

Landlord resource IDs, tenant IDs, record ownership, and audience room ownership are checked before controller actions. Protected JSON submissions bind identity to the verified actor. Multipart payment identity is checked after parsing but before AI processing, receipt persistence, or notification dispatch; a forged-identity file is removed. Assignment and rejection transactions recheck the linked landlord while locking the tenant. Scoped update predicates reinforce ownership for payment verdicts, maintenance progress, and approval changes.

The legacy rejection flow still removes that tenant's maintenance requests and unlinks the tenant. Payment deletion is restricted to records belonging to the rejecting landlord, preserving receipts associated with another landlord. Maintenance ownership follows the system's current tenant-assignment model; this phase does not add historical tenancy records.

## Upload and receipt handling

The public static upload directory was replaced by an authenticated file route. A receipt is available to its tenant and the landlord recorded on the payment. Generic uploads use a server-generated filename with a deterministic owner prefix and are available to the uploader until associated with a payment. Legacy receipt filenames are authorized through the payment record.

Uploads accept PNG, JPEG, GIF, or WebP images, with an 8 MB file limit and bounded form fields. SVG and unsupported extensions are rejected. Private responses disable caching and MIME sniffing and apply a restrictive content policy. These limits are not a malware-scanning service.

## Chat enforcement

Socket handshakes verify the session; each packet rechecks it. Joining a conversation requires a current, unambiguous landlord–approved-tenant assignment. Sender and recipient are derived/validated against that relationship, and a message is saved before it is broadcast. Recipients are reauthorized before delivery, so a socket cannot keep reading a former conversation after losing access. Session expiry disconnects sockets; revocation is enforced on the next packet or attempted delivery.

Presence updates are limited to authorized peers instead of broadcasting every user's presence globally. Multiple connections for one account are counted separately. Only landlords can toggle communication restrictions for their conversations; the restriction is enforced on tenant sends and remains in memory for the running server process.

## Frontend integration

All existing protected fetch calls and the shared API client now use `sessionFetch`. It attaches credentials only to the configured API origin and protected paths. Rejected old-token responses cannot invalidate a newer account's sign-in. Account changes/sign-out propagate across browser tabs. The tenant uses the authenticated shared socket instead of creating an additional unauthenticated connection.

Restart/redeploy the API and refresh the frontend together when adopting these changes. An already-running older API process does not gain these checks merely because source files were edited. Users with legacy saved sessions must sign in again. Public hosting remains a separate release step.

Local activation: the process listening on port 5000 was verified as this workspace's DormFix server and restarted with the newly built code. Its health check returned 200. Anonymous room, housing, payment, maintenance, chat, upload, and receipt requests returned 401. The running local frontend remains at `http://localhost:5179`; refresh it and sign in again if required. This does not constitute a public deployment.

## Verification

- Client and server production builds passed; the existing DaisyUI radial-progress optimizer warning remains.
- Targeted lint passed for the new session helper, shared API client, receipt viewer, messaging hooks, and changed dashboard request modules.
- 39 frontend tests passed, covering credential-origin boundaries, stale-token expiry events, null receipt remarks, payments, chat presentation, maintenance/rules, announcements, overview data, and recovery.
- `npm run test:authorization --prefix server` uses embedded PostgreSQL and real HTTP/Socket.IO routes to check anonymous denial, cross-account/dorm access, approval gates, profile scope, assignment/relinking, forged multipart identities, private files, SVG rejection, chat spoofing, recipient derivation, moderation, and revoked sockets. AI/email/SMS are fixture stubs; no customer messages are sent.
- With Playwright available, `npm run test:authorization --prefix server -- --browser` also checks actual sign-in, payment history, authorized image loading, and expiry returning to sign-in. `DORMFIX_PREVIEW_URL` selects the running frontend; default localhost:5179. Screenshots use fictional records.
- Existing PostgreSQL repository and announcement integration suites passed.
- The configured-database rollback release check also passed with the actual protected routes and frontend. No fixture records were retained and no remote database changes were committed.

Screenshots: [session expired on mobile](screenshots/phase14-expired-session-mobile.png), [authorized fixture-image viewer](screenshots/phase14-private-receipt.png). The image viewer uses a one-pixel test image, not a customer's receipt.

This is scoped access-control work, not a claim of a complete security audit, penetration test, or publicly deployed release.
