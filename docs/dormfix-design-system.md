# DormFix frontend foundations

Groups 1–6 of the approved [UI/UX audit](dormfix-ui-ux-audit.md) are implemented. This document governs new frontend presentation work and records the migrations. It does not redefine backend behavior.

## Active configuration

`client/src/index.css` is the single source of design tokens. Tailwind v4 consumes semantic `@theme inline` mappings to theme-scoped `--df-*` variables; DaisyUI v5 consumes the explicit `dormfix-light` and `dormfix-dark` themes. The HTML initially declares Light. `client/public/appearance.js` resolves a saved Light/Dark choice synchronously before paint. Default DaisyUI themes and automatic OS overrides are disabled. Older saved System preferences migrate once to the device's current Light/Dark appearance and become explicit choices. See the approved [appearance plan](dormfix-appearance-plan.md).

Removed the unused legacy `client/tailwind.config.ts` and its TypeScript include. No dependencies, build commands, API services, auth context/provider behavior, database code, or socket protocols were changed. Technical configuration follows the [DaisyUI custom-theme documentation](https://daisyui.com/docs/themes/#how-to-add-a-new-custom-theme) and [Tailwind theme-variable documentation](https://tailwindcss.com/docs/theme).

## Tokens and layout

| Purpose | Convention |
| --- | --- |
| Canvas / surface | `bg-canvas` / `bg-surface`: Light #F5F7F2 / #FFFFFF; Dark #101713 / #18221B |
| Subtle surface / separator | `bg-surface-muted` / `border-divider`; separators are not control affordances |
| Primary action | `bg-primary` with `text-primary-content`: Light #425042 / #FFFFFF; Dark #A9C6A4 / #122017. Hover/pressed uses `primary-hover` |
| Main / supporting text | `text-ink` / `text-muted`: Light #1F2C24 / #536457; Dark #E7EEE3 / #ADBAAA |
| Control border / keyboard ring | `control-border` / `focus`: Light #73816F / #2F6B4F; Dark #718A75 / #C8DEAC. Offset follows the current surface |
| Navigation / selection | `bg-sidebar`, `bg-selected`, `text-selected-content`; keep a visible selection marker and existing current/pressed semantics |
| Raised surfaces | `bg-surface-raised`; dialogs/drawers use the raised token, a decorative divider and reserved overlay shadow |
| Semantic feedback | `info`, `success`, `warning`, `error` plus corresponding `*-soft` backgrounds; always include a label |
| Type | Inter/system sans for operations; Playfair for the brand. Page title 24px/30px; section title 18px/20px; body 14–16px |
| Native controls | 44px minimum height; 16px input text below `sm`, 14px from `sm`; associated 14px labels and hints |
| Spacing | Existing Tailwind steps: 1, 2, 3, 4, 6, 8, 10, 12. Field label/control gap 2; field groups 4–6 |
| Radius | `rounded-control` = 8px; `rounded-panel` = 12px; `rounded-status` = 6px |
| Content widths | `max-w-form` = 28rem; `max-w-reading` = 64rem; `max-w-workspace` = 80rem |
| Page/panel | `df-page` owns 16px/24px/32px responsive outer padding; `Panel` owns 16px/24px inner padding. Do not stack duplicate page padding |
| Elevation | Borders for routine panels; `shadow-overlay` reserved for overlays. No routine decorative card shadows |
| Motion | State-related color transitions and loading indicators; reduced-motion preference suppresses unnecessary transitions/spinning |

Compatibility sage utility tokens use the existing olive palette. Prefer semantic names for new work. The unused amberGold palette was not carried forward: new warning text uses the darker semantic warning color.

Never pair a primary fill with fixed white text: the on-primary pairing changes in Dark. Keep raw sage tokens out of active interaction states. The auth photograph deliberately uses stable `auth-overlay` / `auth-ink` tokens, while receipt images retain their original colors against a theme-aware mat.

## Shared components

Components live in `client/src/components/ui/` and use native elements without a new UI framework.

| Component | Usage and behavior |
| --- | --- |
| `Button` | Primary, secondary, quiet, danger. Defaults to `type="button"` to prevent accidental submission. Explicitly use `type="submit"` in forms. `loading` disables repeated activation and exposes `aria-busy`; `loadingText` describes the operation |
| `AppearanceControl` / `AppearanceHeader` / `Brand` | Native named Light/Dark chooser in shared workspace/auth chrome. Chooser uses `df-appearance-select`: 7rem width, 2.75rem height, 16px text, 12px left / 36px right padding and a centered decorative chevron. Label/icon stay centered without wrapping; the visible label hides below `sm` while its accessible name remains. Custom dormitory/D monogram and serif wordmark; header combines the brand and chooser for auth/gate screens |
| `IconButton` | Requires a `label`; 44×44px hit area; decorative icon hidden from assistive technology. Use for actions, not route navigation |
| `FormField` | Persistent label; optional marker; stable ID; associated hint and field-error IDs; `aria-invalid` on an actual field error. Its render function passes the association props to the control |
| `Input` | Native input props; optional decorative leading icon and named trailing action. Keeps autocomplete, browser validation, password-manager and keyboard support |
| `Select` / `Textarea` | Native semantics and props with the same control styling. Textarea can be resized vertically |
| `StatusBadge` | Label plus icon. Tone is a presentation choice; this component does not translate API enums or assert a business outcome |
| `Panel` / `PageHeader` | Shared surface/padding and responsive title/action grouping. PageHeader owns the page H1; do not add another page H1 beside it |
| `LoadingState` | Named, indeterminate `role="status"`. No fabricated stages or completion percentage |
| `ErrorMessage` / `ErrorState` | Visible, readable alert; caller supplies the exact error and an appropriate recovery action. Do not show an empty state on a failed request |
| `EmptyState` | Distinguish true-empty from filtered-empty at the call site; supply the correct next action or clear-filter action |
| `AuthLayout` | Shared responsive authentication shell. At `lg`, dorm photo/brand stays left and every auth form stays right. On smaller screens the photo is hidden; forms scroll naturally |

Example field:

```tsx
<FormField id="room-name" label="Room name" hint="Use the name tenants recognize." error={fieldError}>
    {(field) => (
        <Input {...field} name="roomNumber" required value={roomName}
            onChange={(event) => setRoomName(event.target.value)} />
    )}
</FormField>
```

Pass these association props to exactly one corresponding control. Do not apply `FormField` to an unlabeled clickable container. Unknown request failures should use a form/task error, not mark every field invalid. Retain values after failure.

## State and accessibility rules

Native controls provide keyboard activation and browser validation. Registration roles are one native radio group: selected state has a check marker and color, and arrow keys change roles. Password reveal buttons have changing Show/Hide accessible names, control associations, and 44px targets.

All keyboard-focusable controls receive a blue 2px outline with a white offset. This fallback is deliberately outside CSS layers so existing `outline-none` utilities cannot hide it. The registration radio's visible label also shows the focus ring. Focus styling on legacy controls does not repair missing semantics; overview navigation and room/activity controls now use links or buttons; legacy controls remain scheduled for later groups.

Loading buttons show the operation and prevent repeat activation. Task-level loading has a live status label. Callers must await the existing operation and reset local pending state in `finally`; a shared Button cannot repair an incorrect parent state lifecycle. Add-room now resets pending state in finally, retains values after failure, and clears values only after success.

For navigation use router links with current-page semantics, not Button. For unavailable controls give a nearby reason; do not rely on hover tooltips. Use destructive styling only for consequential destructive actions, and add contextual confirmation in the overlay group. Do not claim receipt approval, saved/delivered messages, dispatch, archival, or acknowledgment without support from the existing response/record.

## First migration and boundaries

Migrated login, registration, pending approval, dormitory relinking, and the existing App loading presentation. Request methods, endpoints, payloads, role values, required fields, success handlers, and auth gates are retained. The optional phone field is now explicitly marked. The password-recovery `#` link was removed because no reset workflow exists. Pending approval explains the existing fresh-sign-in requirement. Relink copy no longer claims that every unresolved link is an administrative rejection; Group 2 distinguishes lookup failure from the existing explicit unlinked response; authentication and approval rules remain unchanged.

Auth branding is simplified to the existing olive and type identity without gradients, glass, or an external decorative image. The same form layout, widths, fields, feedback, and buttons now govern both auth screens.

No production accounts were created or altered; no registration, payment, relink, approval, maintenance, or message mutation was submitted during validation. Existing `render.yaml` and `netlify.toml` edits remain untouched.

## Validation record

- Production TypeScript/Vite build passes. The existing DaisyUI radial-progress `@property` optimizer warning remains.
- Migrated components and all new UI modules pass targeted ESLint. App retains its existing effect-dependency warning. Full lint now reports 20 errors and 5 warnings, down from the audit's 23/5 through removing the dormant config and replacing `any` catches in touched forms. Remaining errors are outside this migration.
- Browser checked registration at 320×568, 390×844, 768×1024, 1366×768, and 1920×1080. Document/section/form widths did not overflow. Narrow viewports scroll vertically to retain all fields/actions. Desktop form width is bounded at 448px.
- Measured mobile inputs: 16px text and 44px height; desktop/tablet inputs: 14px text and 44px height. Password and submit actions are 44px high.
- Mobile sign-in also has 16px/44px inputs and no page-wide overflow; its password remains concealed by default.
- Native radio arrow-key switching changes role and the code field's presence. Selected state and visible focus were inspected. The dorm-code hint is linked through `aria-describedby`.
- An empty registration submission stayed on the form and focused Full name through native required-field validation. No registration request was submitted.
- Computed browser colors match the active CSS theme. Automatic dark-theme replacement is disabled in generated configuration; an OS theme-toggle session was not performed.
- Authenticated gate views and new components not yet used by public screens were checked through type/lint/source review, not authenticated end-to-end testing. Manual screen-reader testing, software-keyboard testing, and authenticated workflows remain required as subsequent groups migrate.

| Pair | Calculated contrast |
| --- | --- |
| Primary white / olive | 8.54:1 |
| Main text / white | 14.63:1 |
| Supporting text / canvas | 7.17:1 |
| Control border / white | 4.76:1 |
| Info text / info-soft | 6.16:1 |
| Success text / success-soft | 6.81:1 |
| Warning text / warning-soft | 6.51:1 |
| Error text / error-soft | 5.91:1 |

These calculations cover the listed opaque pairs; they do not certify every legacy screen or alpha-composited state. Recheck new pairings as pages migrate.

Verified previews: [desktop registration](screenshots/foundations-registration-desktop.jpg) and [mobile registration](screenshots/foundations-registration-mobile.jpg).

## Group 2: recovery and overlays

`Dialog`, `Drawer`, and `ConfirmationDialog` use native modal dialogs. Provide a meaningful title, associated field labels, and an explicit close action. Opening captures the triggering focus; closing returns it, with `data-focus-fallback` for a removed trigger. Use `data-autofocus` for the first appropriate control; consequential confirmations initially focus Cancel. Tab and Shift+Tab wrap among enabled controls. Escape and dismissal are blocked while a mutation is pending. Backdrop dismissal is opt-in and excludes clicks within the content.

Dialogs fit the viewport and scroll internally. Drawers use the same semantics and occupy the right edge, expanding to the available width on narrow screens. Receipt images use `object-contain`, loading feedback, failure feedback, and retry; image clicks do not dismiss the lightbox. Never substitute a stock image for failed proof.

Mutation errors stay beside the task and preserve entered values. Pending state resets in `finally`. Successful room creation closes and resets the form, so another room can be added. Confirmation copy identifies the affected tenant or rule and describes the actual existing deletion consequences. Room-drawer payment rejection retains the reason after failure. Approval/assignment/rule/profile/repair failures now have inline recovery feedback. Registration success uses a nonblocking toast.

Room, tenant, maintenance, rules, payment history, and overview reads distinguish unavailable data from a true empty result. Retry uses the existing request. The housing lookup shows recovery for failed/invalid responses; only the server's explicit `404` with `isUnlinked: true` enters the existing relink flow. Stale housing lookups cannot overwrite the current tenant's presentation. No server routes, request methods, payload fields, enum values, multipart fields, authentication rules, or realtime events were changed. The database deletion behavior was inspected to write accurate confirmation copy.

### Group 2 validation

- Production TypeScript/Vite build passes. The existing DaisyUI radial-progress CSS optimizer warning remains.
- Four Node tests pass for valid housing data, explicit unlinking, server failure, and invalid responses: run `node --test tests/ui-recovery.test.mjs` from `client`.
- Full lint now reports 12 existing errors and 2 existing warnings, down from 20 errors and 5 warnings after Group 1. Remaining errors concern legacy `any` types and auth-context exports; no new component or fixture lint issues remain.
- The development-only [overlay fixture](../client/tests/fixtures/overlays.html) imports the real shared components and add-room form. Its callbacks simulate outcomes without accounts, API calls, or database mutations. It is separate from the production entry point.
- Browser verification: initial room-field focus; native required fields; failed save retaining room `108` and capacity `3`; focused inline error; successful retry; second room `109`/capacity `2` successfully saved; focus returned to Add room. Escape did not dismiss a pending save.
- Nested confirmation initially focused Cancel. Pending Escape remained blocked; simulated failure retained the confirmation. Cancel returned focus to the drawer trigger, then Escape returned focus to the page trigger. Tab and Shift+Tab wrapped through enabled controls.
- Receipt click kept the viewer open; computed `object-fit` was `contain`; Escape returned focus. No image-load failure was injected in the browser.
- Responsive overlay checks covered 320×568, 390×844, 768×1024, and the default desktop viewport. At 320px the long dialog remained within 16px margins, with 534px client height and 2841px scroll content; its final action was reachable. No page-wide overflow appeared in the checked fixture views. These checks cover shared overlays, not every remaining legacy page layout.
- Authenticated landlord/tenant mutations and realtime workflows were not exercised against live records. Request compatibility was reviewed in source; authenticated end-to-end and screen-reader verification remain outstanding. The fixture proves frontend recovery and focus behavior, not server success.

Verified fixture previews: [retained room entries after failure](screenshots/recovery-add-room-error.jpg) and [mobile nested confirmation](screenshots/recovery-confirmation-mobile.jpg).

## Group 3: role shells and task hierarchy

`WorkspaceShell` owns the page canvas, padding, content width, landmarks, skip link, and role header. Landlord navigation follows Overview → Payments → Maintenance → Tenants → Rooms → Messages → House rules. Existing route paths remain unchanged. Native route links support browser history and `aria-current="page"`; a visible border supplements the selected background. Desktop navigation appears from 1024px and uses its own vertical scrolling on short screens. Smaller viewports use the shared modal drawer, with Close, Escape, backdrop dismissal, focus containment, and return focus. Switching to desktop closes an open mobile menu. Route changes focus the main content after the menu closes. The document scrolls naturally; a fixed-height application container no longer traps the whole page.

Follow-up, 6 October 2026: the shared workspace top bar is sticky at the top of the viewport. Landlord section labels remain visible across all seven routes; tenant workspace controls share this behavior. The opaque theme surface and divider keep scrolled content separate, while native dialogs/drawers remain above the bar. A ResizeObserver measures the bar's actual height and sets document scroll padding with 16px clearance, including when controls wrap on mobile. The observer and height property are cleaned up when the workspace unmounts.

Validation for this follow-up: production build and scoped WorkspaceShell lint pass, with the existing DaisyUI CSS optimizer warning. In the isolated fictional-data workspace preview, the landlord bar stayed at viewport top after scrolling at 1366×768 and 320×568, with no horizontal overflow; section links updated the bar label. The mobile Dark navigation drawer opened above the bar. Skip-to-main focused the main region below the bar. The tenant bar also stayed at viewport top at 320×568, and scroll clearance adjusted to its taller wrapped controls. These are presentation checks; authenticated workflows and backend persistence were not exercised.

Landlord page wrappers no longer add a second full-screen canvas/padding layer. Their main headings match navigation labels and use the shared heading class. Detailed payment, maintenance, tenant, and rule components still await their scheduled Groups 4–6 refinements.

`LandlordOverview` is a presentation component supplied with the existing read results. Needs attention leads with separate applications, room assignments, Pending/Anomalous receipts, and active maintenance counts. Each data source retains its own loading/error/retry state; a payment failure does not hide healthy room/maintenance information. Occupancy uses room counts, available places sum remaining capacity, assigned tenants exclude pending and unassigned applicants, and the financial metric says exactly what it measures: current-month verified receipt amount. Unsupported collection rates, revenue trends, unread bell, and live-telemetry labels were removed. Activity preserves actual statuses, skips missing/invalid dates, and links to the corresponding task route.

Room lookup is an associated, mobile-visible local filter. It matches room names and assigned tenant names, states its scope, reports result counts, and provides distinct empty/no-match recovery. Available/Full/Vacant occupancy stays separate from maintenance urgency. Overview grids use one column on narrow screens, two where readable, and four summary columns only at sufficiently wide desktop widths. Content is bounded at 1280px.

Room detail no longer matches receipts to occupants by name. Because the existing payment response lacks a tenant identifier, a room-view shortcut directs landlords to Payments. No synthetic per-person payment status is displayed there. This implements the approved frontend mitigation; adding reliable tenant IDs remains a backend proposal. The existing payment list and verification contracts remain available.

`TenantHome` places compact payment/report/message/rules tasks before expanded account details. Payment history sits beside proof submission. Room/landlord information remains compact; maintenance remains close to the tasks; native `details` exposes secondary contact/account information on demand. Loading and housing failures have explicit recovery, and assignment restrictions retain their existing behavior. Tenant home, chat, and history share the home identity and account header. Profile editing is available across those routes. Tenant content is bounded at 1024px.

### Group 3 validation

- Production build passes with the existing DaisyUI CSS optimizer warning. Nine Node tests pass (`node --test tests/*.test.mjs` from `client`), including five new regressions for occupancy separation, anomalous receipt review, urgent work, local search, and truthful dated activity.
- Targeted lint passes for the new shell, home, overview, utility, tests, fixture, and landlord dashboard. Full lint retains 11 existing errors and 2 existing warnings; the removed dashboard `any` reduced the prior 12-error baseline.
- The standalone [workspace fixture](../client/tests/fixtures/workspace.html) renders the actual shared shell, overview, and tenant home with fictional data. It uses HashRouter to keep its secondary preview placeholders isolated from product routes. It contains no auth provider, fetches, sockets, or backend mutations, and is outside the production entry point.
- Browser checked all seven landlord navigation destinations, `aria-current`, route focus, browser back, and fixture refresh. Mobile menu focus wrapped, Escape returned focus to Open navigation, choosing Payments closed the drawer and focused main, switching an open menu from tablet to desktop closed it and focused main, and the skip link focused main without changing the route. Existing production BrowserRouter routes were reviewed in source; authenticated production deep-link/refresh remains unverified.
- Filtering by `alex` returned one room; an unknown query showed No matching rooms; Clear filter restored both. Empty data showed zero counts and a create-room path. Loading hid numerical results. Simulated payment failure left room and maintenance counts available and suppressed unavailable payment counts/activity; retry restored them.
- Tenant unassigned state disabled proof/report actions and explained the restriction while keeping messaging/rules available. Housing failure supplied retry and disabled dependent task entry. Retry restored assigned actions. History retained the shared header; its fixture profile action opened/closed correctly. Enter opened and closed the native account disclosure. Complete production profile submission remains unverified.
- Both shared role views were measured at 320×568, 390×844, 768×1024, 1024×768, 1366×768, and 1920×1080. Checked document widths did not exceed the viewport; landlord desktop navigation appeared from 1024px; tenant tasks used one mobile/two wider columns. This does not certify the remaining legacy page tables, rules grid, or conversation layout.
- Authenticated network/mutation workflows, real production deep links, screen-reader operation, 200% text enlargement, and software-keyboard behavior remain unverified. No backend/auth/provider/service/socket contract changes were made. The fixture validates shared frontend navigation/layout/state behavior, not live workflow success.

Verified fixture previews: [landlord desktop](screenshots/workspace-landlord-desktop.jpg) and [tenant mobile](screenshots/workspace-tenant-mobile.jpg).

## Group 4: approvals, assignments, and payments

`TenantDirectory` groups pending applications, approved tenants needing rooms, and assigned tenants. Local search covers name/email/room and combines with a group filter. Counts describe the visible group, rather than implying that pending applicants occupy beds. The list scrolls with the document. Approve/assign/remove keep feedback and pending state on the affected tenant; other records remain usable. A confirmed action updates that record. Older reads cannot overwrite a subsequent confirmed tenant update; room availability is refreshed after assignment/removal. Read failures remain distinct from empty results.

Assignment uses the shared dialog and native select. Only rooms with remaining capacity can be submitted. The server remains authoritative: a capacity failure retains the selected room and supplies a room-availability refresh. A previously selected room that is now full stays visible as unavailable, with submission disabled until another available room is selected. Room-read failures prevent assignment without hiding healthy tenant information. Removal/rejection confirmations continue to explain the existing permanent deletion of assignment/payment/maintenance records, retained account, and ability to apply again. Cancel receives initial focus. No undo or notification-delivery promise was added.

`PaymentLedger` serves both histories. Landlord view defaults to Pending/Anomalous review; tenant view defaults to all receipts. Native status filtering includes all four existing statuses and distinct filtered-empty recovery. Cards show amount, type, recorded date, status, notes, scan metadata, and proof without an internal fixed-height list. Scans and landlord verdicts are separate: Pending means awaiting landlord review; Anomalous means recorded with scan warnings; Verified/Rejected describe the landlord's verdict. Missing metadata never implies a background scan. Missing/unexpected status never implies approval. The shared remarks adapter handles current tagged remarks, legacy tags, plain notes, multiline warnings/notes, and appended rejection reasons. Tagged scan text in tenant notes does not overwrite leading scan metadata. Persisted `payment.status` remains authoritative; a verdict tag is never used to approve a record.

Reject opens a reason form and requires a nonblank explanation. A failed save retains the reason and dialog; refresh does not discard the draft. Duplicate submissions and dismissal are blocked while pending. Verify/reject report success only after the existing service resolves; failures suggest refreshing before retrying because a server error can occur after persistence. Successful verdicts update visible status/remarks and focus the confirmation notice. Tenant rejection shows the landlord's reason and a link to Messages. It explains that new proof creates a separate record. Receipt viewing reuses the uncropped image lightbox and existing image loading/error/retry treatment.

`PaymentProofForm` owns submission presentation; `TenantPaymentForm` remains the existing auth/fetch adapter. Native associated controls and image attachment preview use shared tokens. Payment-type values remain Rent/Water/Electric/Maintenance/Deposit. Multipart keys remain tenantId/landlordId/amount/paymentType/datePaid/remarks/proof, with the original file. The initial date follows the user's local calendar. Pending feedback describes waiting for the server without invented scan stages or progress percentages. Failure retains entries/attachment and directs the tenant to check history before retrying. Saved results remain until an explicit Done/history/new-receipt action. Verified scan results say awaiting landlord review; Anomalous results say the receipt is already saved and needs review; missing/unexpected scan results direct the tenant to history. No automatic timed dismissal or duplicate-upload recommendation remains.

Backend proposals remain separate: the server still records the submission date instead of the selected paid date, so the control explains that limitation and history says Recorded on. Reliable tenant IDs in payment responses, structured scan/rejection metadata, reversibility of tenant removal, and notification delivery evidence would require backend work. The tagged remarks format cannot unambiguously separate deliberately delimiter-like user text from appended metadata; no frontend parser can change that storage contract. No server, API service, auth/provider, database, realtime, persistence, or server-validation changes were made.

### Group 4 validation

- Production TypeScript/Vite build passes. The existing DaisyUI `@property --radialprogress` CSS optimizer warning remains. Targeted Group 4 lint passes; full lint retains the existing 11 errors and 2 warnings in onboarding, API client, auth context, and chat code.
- Sixteen Node tests pass (`node --test tests/*.test.mjs` from `client`): nine existing checks plus seven for current/legacy/plain receipt remarks, warnings/reasons, authoritative status meaning, multipart compatibility, and local dates near midnight.
- The [approvals/payments fixture](../client/tests/fixtures/payments.html) imports the real presentation components with fictional records and simulated callbacks. It has no authentication, fetch, sockets, or server mutations and is outside the production entry point. Upload tests selected the local synthetic receipt SVG; no personal receipt was uploaded or payment executed.
- Rejection initially focused the reason; pending Escape was blocked; failure focused its error and retained the text. Tab/Shift+Tab wrapped through enabled controls. Refresh retained the draft, retry closed the dialog, and tenant history showed the appended reason and notes. Verification failure/retry was checked independently; another receipt's actions stayed enabled while one saved. Confirmed verification focused its notice and appeared in the Verified filter.
- Approval failure appeared on its tenant; another tenant's actions remained enabled. Successful retry moved the tenant to approved/unassigned and focused the notice. Assignment failure retained room 108; refreshing made 108 unavailable and disabled submission; selecting 109 and retrying moved the tenant into the assigned group. Removal initially focused Cancel, retained its confirmation after a simulated failure, and removed only the selected fictional tenant after retry. Search/no-match/clear and true-empty/loading states were checked. Room-read failure disabled assignment; refresh restored the select.
- Submission failure retained amount 2500.50, Electric allocation, notes, and receipt.svg. The retry callback received all seven original multipart fields. Two deliberate submits produced two simulated calls. The saved anomaly remained open, explained that it was recorded, and displayed the warning. Separate missing-status and Verified-scan responses displayed Recorded/check history and Awaiting landlord review respectively. Pending submission disabled fields and blocked Escape. Saved results received focus and stayed visible across later checks; no automatic dismiss occurred.
- Receipt viewer used `object-fit: contain` and meaningful image text. Directory, landlord receipts, tenant receipts, and the proof form were measured at 320×568, 390×844, 768×1024, 1024×768, 1366×768, and 1920×1080. Checked pages had no horizontal overflow; checked form controls/buttons were at least 44px tall. Proof dialogs fit with 16px viewport margins on narrow/short screens and scrolled internally. The attachment form at 320px also had no horizontal overflow. Browser viewport override was reset.
- Source review confirms existing read/mutation endpoints, methods, verification status/reason body, assignment body, and upload fields. Authenticated server mutations, role-to-role notification delivery, persistence after a real reload, screen-reader use, 200% text enlargement, and software-keyboard behavior remain unverified. The fixture demonstrates frontend behavior, not live backend success or WCAG certification.

Verified previews: [mobile assignment recovery](screenshots/payments-assignment-recovery-mobile.jpg), [mobile saved scan warning](screenshots/payments-submitted-warning-mobile.jpg), and [landlord review queue](screenshots/payments-landlord-review-desktop.jpg).

## Group 5: maintenance and house rules

`MaintenanceRequests` is shared by the landlord queue and tenant home history. It renders the full, multiline description, submitted date, every existing progress status, and landlord notes when returned. Awaiting review / In progress / Completed / Rejected remain separate from Low / Medium / High / Emergency urgency. In progress does not imply a worker was dispatched; Completed does not imply archival. Missing status is unavailable, not a completed request. Rejected records without notes offer clarification guidance rather than inventing a reason. The room drawer now uses the same status/urgency conventions.

Landlord default view is active work; tenant default is the complete history. Status and urgency filters stay local, with landlord search across tenant/room/type/description. No-match recovery differs from true empty, loading, and read failure. Descriptions are not clamped and lists scroll with the document. Only the existing Pending → In Progress → Completed quick actions are presented; no new rejection/reopening workflow or server behavior was introduced.

The maintenance hook preserves optimistic feedback with record-specific rollback. A failed request restores only that record's former status, preserving concurrent changes and refreshed notes on other requests. Pending updates remain visible even when their optimistic status stops matching the selected filter. The affected action is disabled and explicitly awaits confirmation; other records remain usable. Duplicate operations on the same ID are guarded. Reads retain pending status overlays and cannot overwrite a subsequent settled update. Success focuses a clear notice; failure stays beside the request and offers refresh before retrying.

`MaintenanceRequestForm` uses associated shared controls and preserves issue/urgency enums. Its tenant adapter retains the existing POST, JSON headers, tenantId/issueType/urgency/description body, and room-assignment gate. Failure keeps the chosen type, urgency, and full description. Pending state disables controls and dialog dismissal without invented triage stages or notification delivery claims. A confirmed POST shows Issue reported / Awaiting review until the tenant closes it explicitly. Tenant home history refreshes upon confirmation, so closing with the footer, X, or Escape does not leave the new report missing from the list. The server may adjust recorded urgency; the UI explains this without changing triage, notification, or persistence behavior.

`RulesWorkspace` combines `RuleForm` and `RulesCollection`. Form/list stack until the `xl` breakpoint; column definitions and the list's two-column span start together. There is no fixed-height published feed, absolute overlay metadata, or tiny labels. Rule text and line breaks stay fully readable. Scope, category, and explicit Priority rule badges are separate. Priorities sort first while preserving original order within each priority group. Search, scope, category, and priority-only filters are local, combinable, and recoverable. Landlord filters stay visible; tenant filters use a native optional disclosure so applicable instructions lead the reading task.

Publishing preserves General/Safety/Noise/Guests/Cleanliness, the isPriority boolean, and the existing service conversion of Global to null. A room-choice failure blocks a room-specific draft and retains its selection, while All rooms remains available. Failed publication retains all fields; confirmed publication resets them and announces success even if its follow-up list read fails. The list then independently presents its error/retry. Delete confirmation names the scope and displays the complete rule; Cancel receives focus. A failed delete keeps the confirmation, target, and local recovery. Only a confirmed delete removes the visible rule and focuses its notice. The tenant view includes null/empty/legacy Global scopes plus only the tenant's matching room, sorts priorities first, and says Close house rules. Closing does not record acknowledgment.

Backend-dependent proposals remain separate: recorded rule acknowledgment, repair dispatch/visit scheduling, editable rejection notes, reliable notification delivery evidence, and reversal of deleted rules require backend capabilities or policy. No server files, route paths, HTTP methods, service contracts, payload fields, auth/provider behavior, database operations, urgency triage, or notification/socket pipelines changed.

### Group 5 validation

- Production TypeScript/Vite build passes with the existing DaisyUI radial-progress CSS optimizer warning. Targeted new components, adapters, utilities, hook, and fixture lint passes. Full lint retains the same 11 existing errors and 2 warnings; the legacy chat `any` in the touched tenant dashboard remains outside this group's scope.
- Twenty-two Node tests pass (`node --test tests/*.test.mjs` from `client`). Six new regressions cover all progress labels and existing transitions, active/urgency/search filtering, per-record rollback preserving another completed update and notes, unchanged report fields/enums/multiline content, room applicability including legacy globals, and stable priority/filter ordering.
- The [maintenance/rules fixture](../client/tests/fixtures/maintenance-rules.html) imports the real presentation components with fictional data, simulated optimistic callbacks, and no auth, fetch, notifications, or persistent writes. It is separate from the production entry point. Hook/server integration is source-reviewed; fixture success is not proof of real server persistence.
- Maintenance verification: the full final sentence of a long description remained visible. A pending completion stayed in the active view with an explicit saving state. After priming one failure, a concurrent retry completed request m2 while request m1 failed and returned to Pending; m2 remained Completed. Retrying m1 progressed then completed it and focused its notice. Rejected status and returned landlord notes rendered. Search/no-match/clear and loading/error/retry/true-empty states were checked.
- Rule verification: a failed publish retained multiline text, room 108, Safety, and priority. Busy controls were disabled. Retry displayed the new scoped priority rule. A simulated confirmed publication with unavailable list refresh retained success, cleared the draft, and separately offered list retry. Room-choice failure disabled a room-specific publication; changing to All rooms enabled it; room retry recovered choices. Combined scope/category/priority/search and filtered-empty recovery were checked.
- Delete initially focused Cancel. Pending Escape was blocked. Failure focused the error and retained the complete target text; Tab/Shift+Tab wrapped, refresh retained the confirmation, and retry removed the selected fictional rule and focused the success notice. Tenant rules omitted room 109 and included room 108 plus current/legacy globals. Enter opened/closed optional filters, filtering to 108 left only its rule, no-match/clear recovered, and Escape returned to the House rules trigger.
- Report initially focused description. Failed submission retained Electrical, High, and the multiline description, with focused recovery. Pending controls were disabled and Escape was blocked. Retry showed Issue reported / Awaiting review with explicit confirmation focus. The fixture callback used the original four JSON fields. No notification read, dispatch, acknowledgment, or guaranteed repair visit was inferred. The production history refresh trigger was reviewed in source; authenticated refresh remains unverified.
- Landlord maintenance, landlord rules, tenant history, rules dialog, and report dialog were checked at 320×568, 390×844, 768×1024, 1024×768, 1366×768, and 1920×1080. Measured pages/dialogs had no horizontal overflow; report controls and page buttons were at least 44px tall. Checkbox labels and the native disclosure provide 44px interaction rows. Rules stayed stacked at tablet/laptop widths and used the matching form/list spans on wider screens. Long dialogs fit the viewport and scroll internally. After the tenant disclosure change, its 390px view and keyboard filtering were rechecked. Browser viewport overrides were reset.
- Existing server controller/repository/routes and frontend request calls were compared for contract compatibility. Authenticated report/status/rule mutations, actual notification behavior, persistence across a real reload, production history refresh, screen-reader behavior, 200% text enlargement, and software-keyboard use remain unverified. Existing auth, messages, deployment files, and unrelated local changes were preserved. No commits or deployment were performed.

Verified fixture previews: [landlord rules desktop](screenshots/maintenance-rules-landlord-desktop.jpg) and [tenant rules mobile](screenshots/maintenance-rules-tenant-mobile.jpg).

## Group 6 — Messages and final consistency

The active landlord `/chat` and tenant `/chat` routes now share `Conversation` and `useConversation`. Tenant dashboard no longer owns duplicated chat presentation/effects. The dormant floating `TenantChat`, dormant onboarding/sidebar, auth context/provider composition, and server source remain unchanged and inactive. This does not activate unsupported message recall.

Landlord contacts distinguish loading, read failure/retry, true empty and search no-match. Only approved tenants from the existing response enter the list. Local search covers name, room and phone. Selected contacts have a written label, pressed state, primary border and existing sage surface token. Desktop uses a fixed-width contact column plus a flexible conversation; below `lg`, choose a tenant, read/write the conversation, and use All tenants to return with focus restored to the contact. Contact search survives this navigation. Names, phone numbers, dates and multiline messages wrap without truncation.

The conversation uses shared type, controls, buttons, surfaces, status badges and error treatment. Call/SMS retain their existing links, with readable labels and 44px controls. The message composer is a labeled textarea; Enter adds a line and Send message is explicit. The document scrolls naturally, with a separately named keyboard-scrollable history region capped by viewport height. Header/composer are no longer absolute overlays. Incoming messages scroll to the end only when the reader was near it; otherwise Show latest messages preserves their position and moves focus into the history when activated. A concise status announces the message count; the history log itself is not a live region that would announce a complete historical read. Screen-reader behavior still needs manual verification.

Connected / Connecting / Disconnected follow socket events. Send checks the live `socket.connected` value immediately before emitting; a socket object alone is insufficient. Disconnect/connect-error preserves text and does not queue or automatically resend messages. Reconnect re-joins the existing room and refreshes history; tenant registration retains its existing event. Landlord registration remains in the unchanged auth provider. Existing `check_presence` / `presence_status` events plus presence reads/updates provide contact status; a missing status is unavailable and an account-creation date is never substituted for last seen. Listener cleanup removes only the specific callbacks this view registered, preserving other users of the shared socket.

History checks HTTP success and array shape, exposes progress/error/retry separately from true empty, aborts superseded requests, and ignores stale completion. Refresh merges with messages already received and deduplicates by server ID, so a slow read cannot remove a live message. Recorded history is evidence of persistence; an echo alone is labeled Live message / saving unconfirmed. Missing/invalid timestamps remain unavailable. A failed read retains visible content and the draft. Retry restores focus to the persistent history control after it becomes enabled.

Conversation scoping accepts matching sender IDs and roles, and checks roomId when supplied. The current landlord socket can still belong to earlier rooms, and receive payloads lack roomId. Tenant messages from a different contact are dropped. An own landlord echo without room identity triggers a read of the selected room instead of being appended or attributed by matching text. No new leave-room, acknowledgment or realtime protocol was introduced. The current shared socket membership and server presence model are preserved; reliable room identity and multi-session presence remain separate backend proposals.

Drafts and the last submitted text are retained in memory, scoped by account/conversation, across conversation switches and route visits while the app document stays open. Reloading/closing the document clears them; no persistent draft storage was added. Emitting keeps the text and gives an explicit saving/delivery-unconfirmed notice. The same unchanged draft cannot immediately be sent again, including after leaving and reopening the conversation. Write another message explicitly clears the retained submitted text and focuses the composer. Editing it enables a new submission and identifies the earlier submission separately; it does not claim the newly edited text was sent. A synchronous submission failure retains all text and shows local recovery. There is no delivered/read/saved tick, invented request correlation, automatic retry or optimistic saved-message bubble.

Available `chat_error` notices are shown to both roles. Because the current server only broadcasts restriction/restoration text, the landlord actions are Communication notices, with confirmation explaining that they do not enforce permissions. A received landlord notice explicitly says its conversation was not identified by the event. No local durable muted state or tenant sending block is inferred. Emitting a notice does not generate a fabricated success acknowledgment.

The final active-screen pass migrated the remaining room-list header, buttons, occupancy rows, type, spacing and surfaces. Full occupancy is neutral Full; available capacity is Space available. Counts come from the existing room response, not live telemetry. Removed fixed-height room-list scrolling and decorative progress/color treatments. `RoomOccupancy` is reusable presentation; the existing room hook/add dialog/service and occupancy calculations remain intact. The unassigned tenant payment-history route now distinguishes loading, housing-read failure with retry, and room assignment needed, using the same shared feedback. The payment dialog's missing-landlord fallback gives understandable recovery.

### Group 6 validation

- Final production TypeScript/Vite build passes with the existing DaisyUI radial-progress CSS optimizer warning. New/touched Group 6 components, hook, utilities and fixture pass targeted ESLint. The fixture also passes a separate TypeScript check. Full lint now has 6 existing errors and 2 existing warnings (onboarding/API `any`, auth export/dependency, dormant chat dependency), down from 11/2; active chat `any` errors were removed. No unrelated auth/API cleanup was attempted.
- All 28 Node regressions pass. Six new tests cover sender/room isolation and ambiguous landlord echoes, tenant sender/role filtering, history/live merge and persistence evidence, malformed messages/unavailable dates, unchanged role-specific send fields, and honest unavailable presence.
- The [messaging fixture](../client/tests/fixtures/messages.html) runs the real hook and presentation against fictional contacts and a simulated transport/history/presence loader. It performs no authentication, API requests, real socket connections or persistent writes. It deliberately ignores read cancellation to exercise stale-response protection and can broadcast without saving. It is outside the production entry point.
- Both role previews retained multiline drafts through disconnect/reconnect. Connection-disabled sending, local submission failure/retry, history failure/retry, true empty, slow history with concurrent live messages, history de-duplication and recorded-versus-live treatment were verified. Reconnect did not automatically submit a draft. Other-tenant messages did not appear. Rapid conversation switching with slow history showed only the final selected tenant's records. Each tenant's draft returned separately. A submitted draft and its duplicate-send guard survived switching away/back; broadcast-only landlord submission was not represented as a saved history record.
- Contact loading/error/retry/empty/search recovery was checked. Clear search and Retry contacts focused search; selected conversation focused its heading; mobile All tenants returned focus to the previous contact. History retry focused Refresh history. Submission focused its unconfirmed notice, and Write another message focused the composer. Notice confirmation initially focused Cancel, Tab/Shift+Tab wrapped, Escape returned to its trigger, and an observed restriction notice included the enforcement/scope limits. Show latest messages left older-history reading undisturbed and focused the log when activated.
- Landlord and tenant conversations, including long names, multiline text and long unbroken references, were measured at 320×568, 390×844, 768×1024, 1024×768, 1366×768 and 1920×1080. Documents and message logs had no horizontal overflow; visible buttons/links and compose controls were at least 44px tall. The narrow contact-list view also fit at 320px. Room occupancy fit at 320/768/1366 widths with neutral Full and readable long room names. Viewport overrides were reset.
- Final source review preserves existing HTTP routes, room IDs, send-message field sets, notice payload, presence events, backend source, auth/provider behavior and persistence. Existing regression tests for housing, overview counts, payments, maintenance and rules still pass. No real messages or other record mutations were sent; no commit or deployment was performed. Prior groups' local work and unrelated deployment/certificate changes were preserved.

Verified fictional previews: [landlord messages desktop](screenshots/messages-landlord-desktop.jpg) and [tenant messages mobile](screenshots/messages-tenant-mobile.jpg).

## Auth photo restoration

At the user's request, restored the original dorm-room photo that the foundation layout had replaced with a solid brand panel. The source URL was recovered from `ef12177^:client/src/components/Login.tsx`: `https://images.unsplash.com/photo-1555854877-bab0e564b8d5`. The same image is now stored in `client/public/dormitory.jpg`, so rendering does not depend on an external image request. This is the existing stock image, not a claim to depict a DormFix-managed property.

At the original restoration, login put the image/brand panel on the right using optional brandPosition, while registration kept the photo on the left. That differing placement was superseded by the user's 6 October consistency request below. The image remains decorative with an empty alternative; functional form controls retain their labels and behavior. The desktop photo panel remains hidden below 1024px so mobile sign-in stays compact.

Production build and targeted Login/AuthLayout lint pass. Browser checks verified that the local image decoded, that the login photo sits to the right of the form, that registration retains the left panel, and that login has no horizontal overflow at 320/390/768/1024/1366 widths. No credentials were submitted or authentication logic changed. [Verified restored login preview](screenshots/login-photo-restored.jpg).

## Authentication layout consistency — 6 October 2026

Both sign-in and account creation now keep the **form on the right and dorm photo on the left** at desktop widths. Removed the per-page `brandPosition` override from shared AuthLayout and its login/preview callers, so switching between the two screens cannot reverse the columns. Registration controls, role choices, validation, submissions, callbacks and authentication/backend logic were not changed. Below 1024px the decorative photo stays hidden and the form remains a single full-width column.

Production build and scoped Login/AuthLayout/appearance-fixture ESLint pass. Browser checks of the actual unauthenticated app confirm both screens in Light and Dark at 320/1024/1366px: desktop forms stay right, mobile photo stays hidden, and no horizontal overflow occurs. Switched between screens without entering credentials, signing in or creating an account. The existing DaisyUI CSS optimizer warning remains.

Verified current layouts: [sign-in form on the right](screenshots/auth-consistent-login-right.png) and [account creation form on the right](screenshots/auth-consistent-registration-right.png).

## Appearance selector alignment — 6 October 2026

The shared Appearance chooser now keeps consistent dimensions, text padding and centered label/arrow alignment on sign-in, account creation and both role workspaces. The native select retains its keyboard/menu behavior, accessible label and visible keyboard focus. Only presentation markup and CSS changed; theme preference storage, authentication, role selection and backend behavior remain untouched.

Production build and scoped AppearanceControl ESLint pass, with the existing DaisyUI CSS optimizer warning. Actual unauthenticated sign-in/registration were checked in Light and Dark at 320/768/1366px; isolated real-component landlord/tenant previews were checked at those widths for Light/Dark/System. Each chooser measured 112×44px, label/arrow centers aligned, and pages had no horizontal overflow. Tenant header actions share the chooser's height and center. Keyboard Home changed System to Light and retained visible focus. No credentials or application records were submitted; viewport overrides were reset. [Updated sign-in preview](screenshots/appearance-selector-aligned.png).

## Light/Dark choices only — 6 October 2026

At the user's request, removed System from the shared chooser on sign-in, registration and both role workspaces. Light remains the default; an older saved System preference resolves once to the current device appearance, saves that explicit choice when storage permits, and no longer follows device changes. Legacy cross-tab System events resolve without writing back; blocked storage still permits theme switching within the document. No authentication, role selection, server or backend pipeline changed.

Production build, scoped selector/bootstrap/test lint and all 10 appearance regressions pass. Browser checks confirm exactly Light/Dark options and successful switching on actual unauthenticated sign-in/registration and isolated landlord/tenant previews, retaining 112×44px alignment. No credentials or records were submitted. Earlier System verification above describes the superseded behavior.

## Release verification still required

All six frontend implementation groups are complete. This is not a WCAG certification or proof of authenticated end-to-end workflows. Before release, use two authorized real test sessions to verify sign-in/approval/room assignment, payment/report/rule mutations and refresh, profile changes, messaging in both directions, disconnect/reconnect and history against the real server. Also verify screen-reader announcements, 200% text enlargement, mobile software keyboard and device browser behavior. These have not been established by isolated fixtures. Persistence acknowledgments, reliable room identity, durable moderation, recall and multi-session presence need separately authorized backend work if required; the UI makes no guarantees about them.

## Custom DormFix logo — 6 October 2026

Replaced the Lucide house used as branding with an original vector dormitory/D monogram: a curved D silhouette, three room windows, an open doorway, and a check-shaped cutout suggesting organized housing and care. This is a brand symbol, not a payment/maintenance status indicator. The existing serif DormFix wordmark remains.

`client/public/dormfix-mark.svg` supplies the geometry for shared `BrandMark`. A CSS mask renders the vector in inherited currentColor: forest in Light, sage in Dark, and white on the auth photo. It is decorative beside the readable wordmark and existing accessible link names. Header marks are 40px; the auth-photo mark is 80px. Brand/AppearanceHeader/WorkspaceShell therefore share it across both roles, authentication, and gate screens. The onboarding header uses it too. The browser icon (`dormfix.svg`) uses matching geometry on a forest tile; `dormfix-logo.svg` is a reusable standalone forest wordmark lockup with a Georgia/system-serif fallback.

Production build and scoped Brand/BrandMark/AuthLayout lint pass; the existing DaisyUI CSS optimizer warning remains. Actual sign-in in Light and account creation in Dark were visually checked. At 320×568, account creation had no horizontal overflow and retained the 40px header mark. The fictional landlord workspace preview at 1366×768 displayed the new sidebar logo without horizontal overflow. No credentials or records were submitted. Onboarding was build-checked, not exercised as an authenticated workflow.

Assets: [vector logo](../client/public/dormfix-logo.svg), [mark](../client/public/dormfix-mark.svg), [logo preview](screenshots/dormfix-custom-logo.png), [Dark authentication preview](screenshots/dormfix-custom-logo-auth-dark.png). When editing the mark geometry, keep the favicon and standalone lockup in sync.
