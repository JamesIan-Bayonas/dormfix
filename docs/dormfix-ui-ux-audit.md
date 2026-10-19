# DormFix UI/UX audit and proposed design direction

**Audit presented 3 October 2026; design direction subsequently approved.**

Implementation status: All six approved frontend groups are implemented, including Group 6 (messages and final consistency). See [design-system conventions and validation](dormfix-design-system.md), including the remaining authenticated and accessibility release checks. Backend-dependent proposals remain outside this implementation. The findings and baseline below preserve the original inspection evidence; do not read them as a claim that every issue has been resolved.

DormFix should retain its olive identity and separate landlord and tenant workspaces. The most valuable improvements are clearer task priorities, accurate status language, accessible shared controls, dependable feedback, and layouts that adapt to available space. Its existing purpose and backend contracts provide the constraints for this work.

## 1. Evidence, coverage, and limitations

Reviewed every frontend source module under `client/src`, the HTML entry point, Tailwind/Vite configuration, dependencies, and the frontend service contracts. Traced selected server routes, controllers, repositories, and socket handlers only to establish what the interface can truthfully promise. Inspected relevant sections of the supplied design references, including the added *Usability Inspection Methods*. No instructions inside those documents were treated as user instructions.

Live browser inspection covered login and registration at narrow mobile, mobile, tablet, laptop, and large desktop viewports. The public screens reflow without page-wide horizontal overflow in the sampled layouts. At tablet width, registration inputs measured 12px text and 38px height; role selectors measured 10px text and 31px height. This is evidence of readability and touch-comfort concerns, rather than proof that every control violates the WCAG target-size criterion.

Authenticated landlord and tenant screens were inspected from their source. The bundled landlord and tenant PNGs were reviewed as historical visual context; the tenant PNG differs from the current component and is not evidence of current runtime behavior. No authenticated test session was established, no registration was submitted, and no payment, housing decision, message, or server mutation was performed. Authenticated responsive rendering, assistive-technology behavior, and end-to-end workflows remain verification requirements before release.

Baseline checks: `npm run build` passes, with a DaisyUI CSS `@property --radialprogress` optimizer warning. `npm run lint` reports **23 errors and 5 warnings**, predominantly existing `any` types, hook dependencies, an export rule, and the legacy Tailwind `require`. This audit does not expand into unrelated lint cleanup. Existing modifications to `render.yaml` and untracked `netlify.toml` were present before inspection and remain untouched.

The generated CSS has neither a DormFix custom-theme selector nor the configured sage tokens. The actual frontend uses Tailwind v4 through the Vite plugin and imports DaisyUI in CSS. The legacy `tailwind.config.ts` is not referenced by an `@config` directive. Theme configuration must be made explicit in the active CSS setup before shared semantic classes can be trusted. Tailwind documents that JavaScript configuration is no longer detected automatically in v4: [official upgrade guide](https://tailwindcss.com/docs/upgrade-guide#using-a-javascript-config-file).

### Evaluation method

This is a single-evaluator inspection, combining heuristic evaluation and walkthroughs of the task sequences expressed in code. Severity considers likely frequency, impact, and persistence. Ratings are provisional judgments, not measured user failure rates or a multi-evaluator consensus.

| Severity | Interpretation for this audit |
| --- | --- |
| S4 | A task blocker, inaccessible essential operation, or serious preventable data-loss risk; resolve before release |
| S3 | Significant recurring friction or misleading feedback; high priority |
| S2 | Usability or consistency issue with a practical workaround |
| S1 | Cosmetic preference; defer unless it supports a substantive improvement |

Principles checked: visibility of system state; familiar language; user control; consistency; error prevention; recognition over recall; efficient task completion; focused presentation; understandable recovery; and useful instructions. Findings below identify evidence, user harm, a principle, a bounded improvement, and the expected workflow effect.

## 2. Product and workflow inventory

The frontend is a React/TypeScript SPA. `App.tsx` selects login/registration or a role dashboard, with tenant housing-link and approval gates. Each dashboard defines role-specific routes. URL paths are shared between roles in places; the role determines the workspace. Preserve this arrangement unless a separately reviewed need justifies a change.

| Persona | Primary goals and current sequence |
| --- | --- |
| Landlord | Register/sign in; share the dorm code; review applicants; approve access; assign a room with remaining capacity; review receipts and verify/reject them; progress repair requests; communicate with tenants; manage room inventory and scoped house rules |
| Tenant | Register with a landlord code; await approval and room assignment; see housing/landlord details; upload payment proof; check payment outcomes; report and track repairs; message the landlord; read applicable rules; update profile; reapply with a code after unlinking |

These personas are inferred from implemented functionality. Usage frequency, preferred terminology, and actual landlord/tenant habits still need lightweight user validation.

### Screens and navigation

| Screen/group | Existing route or entry | Presentation and interactions |
| --- | --- | --- |
| Login / registration | Unauthenticated app; toggled view | Split desktop brand/form layout; single form on smaller screens; tenant/landlord role selection; landlord code conditional on tenant role |
| Tenant waiting/relink | `App.tsx` gates | Approval explanation and sign out; unlinked explanation, code form, inline error, submitting state |
| Landlord overview | `/` | Four metrics; unassigned-tenant banner; room matrix; recent activity; room-detail drawer |
| Tenants | `/tenants` | Pending applicants and approved directory; approve, reject/remove, room assignment dialog |
| Rooms | `/rooms` | Occupancy rows/cards, capacity meter, add-room dialog |
| Payments | `/payments` | Receipt review cards; scan diagnostics; verify/reject; image lightbox |
| Maintenance | `/maintenance` | Request cards; urgency/status; accept and resolve actions |
| Messages | `/chat`, landlord | Contact column, conversation, presence, call/SMS links, restriction toggle |
| House rules | `/rules` | Form for category, scope, priority, content; list and delete action |
| Tenant home | `/` and wildcard fallback | Housing/profile panel; four task tiles; maintenance history; profile dialog |
| Receipt submission | `/pay`, tenant | Route-driven modal with amount, date, type, image input, notes, asynchronous scan results |
| Report repair | `/report`, tenant | Route-driven modal with issue category, urgency, description, submitting state |
| Payment history | `/history`, tenant | Separate history view, receipt details, status, lightbox |
| Messages | `/chat`, tenant | Separate conversation view; history, presence, compose, call/SMS links |
| Rules | Tenant home button | Modal filters global and current-room rules, with priority first |

The active frontend uses card/list layouts for these records, rather than semantic data tables. A table is an optional pattern for dense comparison, not an automatic redesign requirement.

Shared infrastructure includes the API wrapper, four data hooks, services, auth context, Lucide icons, toast host, font definitions, and scrollbar utilities. Buttons, fields, page headers, badges, dialogs, and empty/error states are mostly repeated inline rather than governed by shared presentation components.

`Sidebar.tsx`, `TenantOnboarding.tsx`, and the floating `TenantChat.tsx` are present but not imported into the active screen tree. Their behavior is inventory context, not an active-user finding. Do not activate or redesign dormant features accidentally. `main.tsx` and `App.tsx` both wrap auth providers; flag this for a separate frontend review because changing it could affect authentication/socket behavior outside a visual refactor.

### Decisions worth preserving

- Distinct workspaces with a compact tenant task set and a landlord operations sidebar.
- Olive brand, warm neutral canvas, white surfaces, and consistent Lucide icon family.
- Native forms/selects and explicit labels on login/registration; password autocomplete and a named registration visibility toggle.
- Clear separation of pending applicants from approved tenants, and visible explanation of actions locked before room assignment.
- Capacity information in room selection; room context in maintenance and payment records.
- House-rule scope/category and priority-first tenant ordering.
- Existing receipt inspection, rejection-reason API support, loading skeletons, and useful status labels where they already work.
- Direct landlord contact details and call/SMS affordances where available.

## 3. Prioritized findings

### A01 — Add-room form stays busy after completion — S4, frontend defect

**Evidence:** `LandlordRoomList.tsx:24–38` sets `isSubmitting` to `true` both before and after `await addRoom(...)`.

**Harm:** On failure the save button remains disabled; after success the next opened form also remains disabled. A routine inventory task loses its recovery path.

**Principle:** System-state visibility and recovery; Microinteractions' predictable action feedback.

**Improve:** Use a `finally` reset, preserve inputs on failure, show an inline failure/retry message, and reset only after confirmed success. Keep the room-create payload and server capacity rules unchanged.

**Effect:** Landlords can retry a failed creation and add another room without refreshing the application.

### A02 — Essential controls are inaccessible by keyboard — S4, accessibility

**Evidence:** Landlord metric cards, room tiles, and activity rows use clickable `div`s. Payment upload uses an input with `display:none` and a clickable label. These do not provide the corresponding keyboard action by themselves.

**Harm:** Keyboard users cannot open room details or choose proof through the visible upload affordance.

**Principle:** Semantic controls, keyboard operation, and clear affordances; Designing Interfaces and inclusive-design references.

**Improve:** Use links for navigation and buttons for actions. Make the native file input keyboard accessible through an appropriate visually hidden treatment or a named upload button. Expose the chosen filename and a replace action. Avoid nesting interactive controls.

**Effect:** Both roles can complete the same tasks through keyboard and assistive technology.

### A03 — Tenant removal does not communicate its full consequence — S4, error prevention

**Evidence:** `LandlordTenantChecklist.tsx` confirms “reject and remove this tenant”; the active `tenantRepository.rejectTenantTransaction` also deletes that tenant's payments and maintenance requests, deletes the assignment, and resets approval. The user account remains.

**Harm:** A landlord can remove financial and maintenance records without being told that those records will be deleted.

**Principle:** Error prevention, user control, and meaningful confirmation.

**Improve:** A named confirmation identifies the tenant and the exact consequences. Use separate contextual labels for rejecting an application and removing an approved tenant, while retaining the same existing endpoint and behavior. Give a clear cancel action and show pending/result states.

**Effect:** The landlord makes an informed decision. **An archive/undo policy would require backend changes and is separately proposed, not implemented.**

### A04 — Data failures can look like empty records or rejection — S3, reliability of feedback

**Evidence:** Several hooks and list components catch errors only to log them. The room/payment pages ignore exposed errors. Tenant maintenance and rules can render their zero-record state after failure. The landlord overview's loading flag follows only the tenant request. `App.tsx` treats a failed housing lookup as no housing link.

**Harm:** Landlords may believe there are no receipts or issues; tenants may read a network failure as an access rejection. Metrics can display zero while another dataset is still loading.

**Principle:** Visibility of system status and understandable recovery.

**Improve:** Distinguish loading, loaded-empty, filtered-empty, failed, and updating presentation states. Retry the existing read request; do not show zero counts before successful data loading. Preserve access restrictions and backend gate decisions while displaying an unresolved lookup as a lookup failure rather than an administrative verdict.

**Effect:** Users know whether they need to act, wait, retry, or contact their landlord.

### A05 — Receipt scan and landlord approval are conflated — S3, status accuracy

**Evidence:** A successful POST returns `Verified` for the scan, while `paymentController.ts` stores it as `Pending` for landlord review. The toast says payment is verified; the inline text says it awaits confirmation. The form's “Pay Rent”/“Make a Payment” language describes money movement, although this action submits evidence of an existing transfer.

**Harm:** Tenants can believe rent has been approved or paid through DormFix when neither follows from uploading a receipt.

**Principle:** Match language to the task, accurate mental models, and feedback that explains the outcome.

**Improve:** Label the action “Submit payment proof.” Show “Receipt submitted — awaiting landlord review”; provide the scan result as secondary detail. Map the current response to presentation without changing API values. Never infer approval from a missing status. Retain the persisted landlord verdict as the payment status.

**Effect:** Tenants know what they have completed and what still needs landlord action.

### A06 — Exceptions and recovery details disappear across payment views — S3, consistency

**Evidence:** Tenant history renders Pending/Verified/Rejected badges but no Anomalous badge. Its remarks parser takes text before the leading `[AI Audit:` marker, so current server-formatted tenant notes are lost. Rejection reasons are appended in remarks but lack a dedicated tenant recovery treatment. The room drawer checks only Pending payments; the review page includes Pending and Anomalous. The anomaly form suggests another upload although the original record has already been saved.

**Harm:** Tenants cannot tell why a receipt needs attention; landlords see different review queues; a retry may create duplicate submissions.

**Principle:** Consistent status representation and error recovery; Designing Interfaces and Microinteractions.

**Improve:** Centralize a frontend adapter for the existing remarks formats; show notes, warnings, and rejection reasons separately. Map all statuses, including unknown-value fallback. Use an amber “Needs review” presentation for Anomalous and explicitly state that the receipt was submitted. Offer “View payment history.” A new submission remains a new record, not an implied replacement.

**Effect:** Both roles see the same review state and a clear next action.

### A07 — Dialogs, drawers, and lightboxes lack a shared accessible interaction model — S3

**Evidence:** Custom overlays have no dialog name/role, focus entry/containment/restoration, Escape handling, or consistent background inertness. Several close buttons have no accessible name. Lightboxes close on the whole overlay, including image clicks; the drawer has a nested rejection dialog.

**Harm:** Users can lose their place, tab behind an overlay, or accidentally dismiss a review. Screen readers do not receive a consistent dialog context.

**Principle:** Accessible modal behavior and user control. Follow the [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

**Improve:** A shared dialog/drawer primitive governs naming, focus, Escape, safe dismissal, scroll locking, and nested-dialog focus restoration. Native `dialog` is a candidate after compatibility verification. Constrain content to the available viewport and keep close/cancel reachable. Do not claim that dismissal cancels an in-flight server request.

**Effect:** Receipt review, assignment, repair reporting, and profile editing are predictable on keyboard and small screens.

### A08 — Mutation feedback is inconsistent or silent — S3

**Evidence:** Applicant actions and assignment have no per-action busy state. Payment verification returns false on failure, but callers give little feedback; the drawer closes its rejection dialog without awaiting success. Rules errors are console-only. Some other actions use blocking browser alerts, while others use toasts.

**Harm:** Users repeat actions or lose entered explanations without knowing whether a change saved.

**Principle:** Microinteractions' trigger/rules/feedback model and error recovery.

**Improve:** Track pending state per record/action, prevent duplicate submissions, show local errors, and retain dialog inputs until the existing response confirms success. Pair brief success toasts with updated visible records. Preserve optimistic maintenance rollback while marking its update as pending.

**Effect:** Landlords can confidently approve, assign, review, and resolve; tenants can recover without retyping.

### A09 — Muted text is too light and important text too small — S3, visual accessibility

**Evidence:** Many labels and metadata use 9–12px text, all caps, and `text-slate-400`. The sampled color `#94a3b8` has approximately 2.56:1 contrast on white and 2.42:1 on the canvas. Gold `#b97a26` on `#fef9eb` is approximately 3.40:1. These are unsuitable for normal-sized meaningful text. Exact runtime colors must be verified because Tailwind's active palette may differ from legacy hex values.

**Harm:** Names, dates, instructions, statuses, and recovery details are difficult to scan, particularly for low vision or mobile use.

**Principle:** Hierarchy through weight, position, grouping, and contrast; Refactoring UI and Thinking with Type, constrained by current accessibility requirements.

**Improve:** Set controls/body to 14–16px; use 12–14px for secondary metadata with compliant contrast. Use sentence case for routine labels. Keep subtle decorative borders but give controls visible boundaries. Measure active-theme combinations rather than judging from screenshots alone.

**Effect:** Higher information density through better readability rather than enlarged decoration.

### A10 — Focus, accessible names, and field associations are incomplete — S3

**Evidence:** Many buttons use `outline-none` without a replacement. Login's password toggle is unnamed; menu, send, close, and several quick actions are unnamed. Payment, repair, profile, room, assignment, and rule controls frequently have visible labels without programmatic association. Registration role buttons have no selected-state semantics.

**Harm:** Users cannot reliably tell where focus is or what an icon-only action does; field errors are not tied to inputs.

**Principle:** Semantic relationships, focus visibility, name/role/value, and discoverability.

**Improve:** Named icon buttons; IDs and labels; hints/errors through `aria-describedby`; invalid-state attributes; a visible focus ring; radio-group semantics for one-of-two role selection; a skip link and route-change focus/title management. Keep password-manager support.

**Effect:** Forms and navigation become understandable without sight or a pointer.

### A11 — Landlord dashboard priorities do not reflect outstanding work — S3, IA

**Evidence:** The leading actions are Configure Policies and Add Property Room; the dashboard has an assignment banner but no comparable approval/receipt-review summary. Maintenance and payments are farther down the sidebar. The activity list mixes unresolved and historical events.

**Harm:** A landlord must scan multiple sections to discover work that blocks tenants.

**Principle:** Goal-directed interaction, task-oriented IA, and hierarchy.

**Improve:** Lead with an “Needs attention” area for pending applicants, approved unassigned tenants, Pending/Anomalous receipts, and active urgent maintenance, using available data. Link each count to its existing screen. Keep occupancy/revenue and recent activity below. Keep setup actions on their relevant pages and available as secondary dashboard shortcuts.

**Effect:** Daily operational tasks take fewer navigation decisions. Do not invent rent-due or unread-message counts absent from the contract.

### A12 — Some dashboard labels misstate their data — S3, comprehension

**Evidence:** Total Tenants includes pending applicants while its caption says active occupancy. Available Spaces counts rooms with vacancies rather than remaining beds. The verification percentage is verified amount divided by verified plus pending amount; it is not collection against rent owed and excludes anomalous amounts. Payment activity says “paid” even for rejected receipts. “Live Telemetry” is shown for data loaded through reads, without a corresponding live activity subscription.

**Harm:** Landlords can infer incorrect occupancy, vacancy, income, or freshness.

**Principle:** Clear labels, accurate system state, and match to users' mental models.

**Improve:** Describe current calculations precisely, or separately show clearly derived counts from already available data. Use “Rooms with vacancies”; distinguish approved tenants and applicants; explain the verification denominator; say “submitted payment proof”; use “Recent activity” without an unsupported live badge.

**Effect:** The landlord can make decisions from what the interface actually knows.

### A13 — Global-looking search and notifications overpromise — S2

**Evidence:** Header search filters only the dashboard room matrix but appears on all landlord routes and is hidden below `md`. The bell has no action and its orange dot is static. The matrix has no distinct no-results guidance.

**Harm:** Users expect cross-page search and unread notifications, and mobile users lose an available lookup tool.

**Principle:** Affordances, navigation clarity, and honest feedback.

**Improve:** Put a named room/tenant filter with the room view and expose it on mobile; show clear/reset and no-results state. Remove the nonfunctional bell and static unread indicator from the active design. A notification center is a separate feature proposal.

**Effect:** Landlords understand the scope and result of their search.

### A14 — Navigation and labels impose avoidable interpretation — S2

**Evidence:** Active navigation is rendered with action buttons; the mobile sidebar has no explicit close/backdrop interaction model. Page headings vary from navigation labels. Tenant copy uses House Directives, Ledger History, administrative message, and Operational Payment. Several pages add their own padding and back-to-dashboard controls within the persistent landlord shell.

**Harm:** Users translate terminology and lose consistent orientation. Layered padding reduces available space.

**Principle:** Don't Make Me Think and task-based labeling from Information Architecture.

**Improve:** Preserve URLs; use consistent labels, navigation links with current-page state, one page-header/padding owner, and a named mobile menu with close/backdrop/focus behavior. “Rooms,” “Payments,” “Maintenance,” “Messages,” and “House rules” should match titles and task entry points.

**Effect:** Both roles learn a small, predictable vocabulary and navigation model.

### A15 — Responsive layout problems extend beyond column stacking — S3

**Evidence:** Landlord chat keeps a one-third contact column at all widths and uses absolute header/composer areas. Rules use `md:grid-cols-3` but the list's two-column span starts at `lg`, making it unusually narrow between those breakpoints. Payment/repair/rules overlays lack a whole-dialog viewport height constraint. Multiple pages combine large padding, fixed-height feeds, minimum column widths, and nested scrolling.

**Harm:** Conversation text, actions, or long form content can become cramped or unreachable on phones, tablets, short screens, or with the software keyboard open.

**Principle:** Adapt layouts to tasks and content; responsive patterns and spatial grouping.

**Improve:** Mobile chat becomes contact list then conversation with a visible back action. Match rules grid spans at the same breakpoint. Stack form fields/actions where needed, wrap long identifiers, use dynamic viewport sizing and bounded dialog content, and prefer one page scroll outside conversation panes. Keep dense multi-column views only when space supports them.

**Effect:** Tenant reporting/proof upload and landlord messaging remain usable on small screens. These authenticated layout risks require runtime reproduction during implementation verification.

### A16 — Receipt and repair details can be hidden when needed — S3

**Evidence:** The room drawer crops receipts with `object-cover` in an aspect-video frame. Landlord maintenance descriptions are clamped to two lines without an expand control.

**Harm:** Landlords may miss a receipt reference or repair detail when deciding the next action.

**Principle:** Task clarity and progressive disclosure that retains access to information.

**Improve:** Show a contained receipt with a full-view action, local loading/unavailable-image states, and a descriptive accessible name. Expand long issue text or open a named detail view. Preserve original documents and descriptions.

**Effect:** Reviews use the full evidence without navigating unrelated screens.

### A17 — Status visuals imply more than the backend tracks — S2/S3

**Evidence:** Full rooms use error red even without a problem. `In Progress` is shown to tenants as Handyman Dispatched; `Completed` is shown as Archived in the landlord list. Rejected maintenance is accepted by the contract but lacks a rendered status treatment. Tenant rules' “Understood & Acknowledged” only closes the modal.

**Harm:** Users infer a dispatch, archival operation, or persisted acknowledgment that did not occur, or mistake normal occupancy for danger.

**Principle:** Semantic colors and truthful system feedback.

**Improve:** Keep urgency separate from progress; render all existing statuses. Use neutral “Full” occupancy, “In progress,” “Completed,” and “Close house rules.” Acknowledge/dispatch records require explicit backend capabilities.

**Effect:** Users know the actual status and what, if anything, their click records.

### A18 — Realtime message feedback is incomplete — S3, bounded frontend work

**Evidence:** Active tenant chat does not listen for `chat_error`. Compose buttons check message text/socket object rather than actual connection; inputs are cleared on emit. Neither active chat provides loading/error/reconnect status for history. Landlord conversation listeners append received messages without an explicit current-conversation filter. Existing receive payloads do not include roomId; landlord join does not leave earlier rooms.

**Harm:** A user can lose a draft or miss a restriction notice; a later conversation may display unrelated received content. Online presence is not evidence of message persistence.

**Principle:** Visible async state, user control, and accurate feedback.

**Improve:** Surface available socket connection events and `chat_error`, history-load states, compose draft retention, and connection-dependent send availability without changing event names/payloads. Handle permitted client-side scoping carefully, using sender information only where unambiguous. Never show Delivered, Read, or Saved without a corresponding server guarantee.

**Effect:** Users know whether messaging is available. **Reliable per-room message identity and persistence acknowledgments are backend-dependent proposals; keep them separate.**

### A19 — The visual system is repeated rather than governed — S2, maintainability

**Evidence:** Hardcoded colors, custom sizes, mixed square/pill/32px radii, inconsistent field treatment, repeated status mappings, and duplicated page wrappers. The inactive Tailwind theme adds a second apparent source of truth.

**Harm:** Improvements must be patched repeatedly, and future features inherit inconsistency.

**Principle:** Laying the Foundations: a system succeeds when the documented and built components match.

**Improve:** Active semantic tokens and a small reusable presentation layer; migrate components incrementally. Retain existing hooks/services/contracts. Avoid a new general-purpose framework, unrelated package upgrades, or auth/provider rewrites in this visual scope.

**Effect:** New DormFix screens inherit the same hierarchy, accessibility, and state handling.

### A20 — Empty states and filters do not support the next task — S2

**Evidence:** Empty room/payment/tenant lists mostly provide passive text. Payment and maintenance queues show all records without local status filtering. The room matrix can become empty after search without a specific result message.

**Harm:** First-time users do not know how to get started; recurring users must scan historical records to find current work.

**Principle:** Clear entry points, recognition over recall, and simple filtering patterns.

**Improve:** Give true-empty views a contextual action: Add room, Share landlord code, Submit payment proof, or Report an issue. Give filtered-empty views a clear-filter action. Add accessible local status filters using current data; retain history access and disclose filtered counts. Do not fabricate a server total from a filtered subset.

**Effect:** Users can start work and return to outstanding tasks with less scanning.

### A21 — Recovery/help affordances require honest scope — S2

**Evidence:** Forgot password is `href="#"` and no recovery route is present. PendingApproval only offers sign out/check later. The client sends `datePaid` in proof submission, but the current controller stores `new Date()` instead. Tenant date input starts from UTC date, which may differ from local calendar date.

**Harm:** Users follow dead-end help or expect a selected payment date to be saved. Approval may remain stale until a fresh sign-in.

**Principle:** Predictable controls, error recovery, and don't ask for information the task does not use.

**Improve:** Do not expose a working-password-reset affordance without the feature; describe an available support path only if verified. Explain the existing approval/sign-in requirement accurately. Document the ignored date field and agree whether to remove it from the visible form while preserving the submission contract, or defer it until backend support is separately authorized. Do not change authentication refresh behavior or date persistence under a visual redesign.

**Effect:** Users are told what the product actually supports.

### Subjective preferences, kept separate

Reducing 32px card radii, keeping serif type mainly for brand/auth headings, simplifying the auth hero, and replacing the Vite favicon are coherence/polish choices. They do not establish usability failure by themselves. Apply them only after the task, feedback, keyboard, and responsive findings are addressed. Retain the current brand direction rather than introduce decorative gradients, glass effects, or extra motion.

## 4. Proposed DormFix design language

### Typography and layout tokens

| Area | Proposed convention |
| --- | --- |
| Family | Existing Inter/system sans for controls, body, data, and operational headings; existing Playfair may remain for brand/auth titles |
| Page title | 24px mobile / 30px desktop, semibold, compact line height; semantic heading levels independent of visual size |
| Section title | 18–20px, semibold |
| Body / controls | 14px desktop body minimum by default; 16px mobile controls and important explanatory copy; 1.5 line height for paragraphs |
| Metadata / badges | 12–14px; meaningful content keeps compliant contrast; sentence case |
| Metrics | 28–32px, semibold, tabular numerals; currency aligned consistently |
| Spacing | Tailwind steps 1, 2, 3, 4, 6, 8, 10, 12: 4, 8, 12, 16, 24, 32, 40, 48px |
| Field relationships | Label-to-control 8px; hint/error 4–8px; field groups 16–24px; sections 24–32px |
| Padding | Page 16px mobile, 24px tablet, 32px desktop; panel 16–24px |
| Radius | Controls 8px, panels/dialogs 12px, compact badges 6px; pill only for compact chips/avatars |
| Depth | Most surfaces use border and hierarchy; subtle shadow for floating menus; one restrained overlay shadow for dialogs/drawers |
| Content widths | Forms about 28–36rem; reading/history 56–64rem; operational workspace up to 80rem; chat sized around its actual usable viewport |
| Layout owner | App shell owns global padding; page owns its content grid; panel owns internal padding |

These values are DormFix proposals, not measurements mandated by a book. Use Tailwind's existing spacing/type/breakpoint utilities and semantic CSS theme tokens; avoid scattered arbitrary values.

### Palette and semantics

| Token purpose | Proposed value or treatment |
| --- | --- |
| Canvas | Existing `#f8f9f5` |
| Surface / subtle surface | White / existing pale sage or neutral surface |
| Primary action / hover | Existing `#425042` / `#344034`, white text; measured base pairing approximately 8.54:1 |
| Main text | `#1e293b` |
| Secondary text | `#475569`; approximately 7.58:1 on white |
| Decorative separators | Neutral light border; not the sole affordance for controls |
| Control border | Mid neutral, initially `#64748b`; check final backgrounds and states |
| Focus | High-contrast blue or olive ring, 2px with offset; light/dark-surface variants |
| Success / completed | Dark green text, pale green background, check icon + label |
| Pending / warning / needs review | Dark amber text, pale amber background, clock/alert icon + label |
| In progress / informational | Blue `#1d4ed8` on `#eff6ff`, icon + label |
| Error / destructive / rejected | Red `#b91c1c` on `#fef2f2`, icon + explanation |
| Full / vacant / unavailable | Neutral label; occupancy is independent from urgent maintenance |

All final combinations need computed-style verification, including hover, focus, disabled, selected, and alpha-composited backgrounds. Status meaning is always written; color supplements it.

### Small shared component set

Propose `Button`, `IconButton`, `FormField`, `StatusBadge`, `PageHeader`, `Panel`, `EmptyState`, `ErrorState`, `LoadingState`, `Dialog`, `Drawer`, and `ConfirmationDialog`, plus role-configured navigation. Shared payment-status and remarks adapters are frontend presentation utilities. Keep their data contracts intact.

Button hierarchy: one primary action per task area, secondary outlined action, quiet text action, and a clearly named destructive variant. Navigation remains a link. Routine controls target a comfortable 44px height; compact actions retain adequate hit areas and spacing. This is a product comfort target; WCAG AA's minimum target requirement is 24 by 24 CSS pixels with defined exceptions, not a blanket 44px requirement.

Forms: persistent labels; mark optional fields; use browser autocomplete/input purpose where appropriate; preserve values after errors; put a recoverable error beside the relevant control or task. Match server validation and supported upload behavior. The current upload middleware does not document type/size restrictions, so do not invent a maximum file size or promise server enforcement. Add useful selection/preview feedback without changing multipart fields.

### Interaction-state contract

| State | Shared presentation behavior |
| --- | --- |
| Default | Clear label, readable content, visible affordance |
| Hover | Small background/border change; essential actions already discoverable |
| Focus-visible | Visible ring, label retained, focus never concealed by overlay/header |
| Active | Subtle pressed feedback; no task-delaying animation |
| Selected | Text/marker and programmatic selected/current state, not color alone |
| Disabled | Unavailable action and nearby reason; no pointer-only explanation |
| Loading / updating | Stable dimensions, named progress, busy semantics, duplicate-submit prevention |
| Success | Confirm only what the response guarantees; persist the outcome in the record/status |
| Warning | Explain what was saved, what needs attention, and the available next step |
| Error | Local message, retained inputs, retry/recovery; never masquerade as empty data |

Do not simulate OCR stages, progress percentages, message delivery, or a cancel operation without support. Use honest indeterminate progress for a long submission. A lost response may mean the server still completed the operation; offer checking history before blindly resubmitting. Respect reduced-motion preferences; keep any necessary transitions short and avoid continuous decorative pulse effects.

## 5. Information architecture proposal

### Landlord

Keep the existing routes. Suggested order: **Overview → Payments → Maintenance → Tenants → Rooms → Messages → House rules**. Payments, repairs, and tenant approval/assignment are recurring operational work; room/rule setup remains accessible. Validate this order with a landlord before treating frequency assumptions as fact.

The overview's first content is the outstanding-work summary, followed by readable metrics, then room status and recent activity. Pending approvals and unassigned approved tenants remain separate. Payment review distinguishes needs-review records from completed history. Maintenance exposes active requests and urgency without hiding history. Global-looking utilities should have global behavior or a visibly local scope.

### Tenant

Use consistent home/task entry labels: **Submit payment proof; Report an issue; Message landlord; House rules**, with **Payment history** visibly associated with proof submission. Place these before the expanded profile/contact details on home, retain a compact room/landlord summary, and keep active maintenance status close to the action area. Profile editing becomes a secondary account action.

On mobile, use compact full-width task rows or a two-column arrangement only when readable; avoid four large stacked decorative cards pushing history far below the first screen. Keep a compact tenant identity/home link on chat/history, and a consistent return action. Do not add a seven-item administrative sidebar to the tenant workspace.

Suggested plain-language replacements: Property Inventory → Rooms; Operational Room Matrix → Room status; Recent Activity Ledger → Recent activity; House Directives → House rules; Verify Clear → Verify payment; Max Occupancy Threshold → Capacity; Understood & Acknowledged → Close; administrative message → message. Preserve option values sent to APIs even when visible text changes.

## 6. Accessibility and responsive acceptance criteria

Target WCAG 2.2 AA through full processes, not a visual badge. Current [WCAG 2.2](https://www.w3.org/TR/WCAG22/) provides the baseline for keyboard operation, meaningful labels, focus, contrast, reflow, errors, status messages, and target sizes. Older book guidance is supporting evidence; it does not override this target. In particular, normal text needs 4.5:1 contrast; large text 3:1; relevant component/state visuals 3:1. Exceptions must be assessed in context.

Verify keyboard operation, named controls, semantic landmarks/headings, dialogs and return focus; labels/hints/errors; color-independent statuses; 200% text enlargement; 320 CSS-pixel reflow; increased text spacing; focus not obscured; and screen-reader announcements without reading an entire chat history for every new event. Preserve paste/password-manager support and avoid cognitive challenges in authentication. Automated checks supplement manual keyboard and screen-reader testing.

| Width/context | Intended authenticated behavior and checks |
| --- | --- |
| 320 / 390px mobile | One content column; compact tenant tasks; landlord menu drawer; contact-list-to-conversation chat; stacked payment form when needed; long text wraps; dialogs fit and scroll |
| 768px tablet | Content-driven one/two-column layout; rules form/list spans align; controls stay readable; no cramped miniature desktop chat |
| 1024 / 1366px laptop | Persistent landlord sidebar when sufficient space; 2–4 metrics based on remaining width; operational panels align; complete actions remain visible |
| 1920px desktop | Bound content width and readable line length; dense data does not expand into widely separated fields |
| Short screen / zoom / keyboard | Dialog close/cancel and submit remain reachable; compose input remains usable; dynamic viewport handling; no clipped validation errors |

Public registration was sampled at 320×568, 390×844, 768×1024, 1366×768, and 1920×1080; login at 390×844 and the default 1280×720. Authenticated matrix above is the proposed verification plan and source-based risk assessment, not a claim those workflows have passed runtime tests.

## 7. Backend-dependent proposals — document only

| Proposal | Existing limitation and boundary |
| --- | --- |
| Preserve tenant history after unlink / provide undo | Current rejection transaction deletes payments and maintenance. Archive/recovery would change persistence and business behavior. Do not implement it in this refactor. |
| Reliable tenant-to-payment identity | Landlord payment responses expose tenant name and room, but no tenant ID. The dashboard matches names; duplicate names can associate the wrong receipt. A backend identifier is the correct foundation. Meanwhile, avoid presenting ambiguous per-tenant payment attribution; direct review to the authoritative payments list rather than invent an identity heuristic. |
| Persist selected payment date | Current controller ignores submitted `datePaid` and records the current date. Fixing persistence/validation requires a backend decision. Do not make a visual promise that the chosen date is stored. |
| Message persistence/delivery and per-room identity | Server emits `receive_message` even after a persistence failure and does not include roomId or a request acknowledgment. Do not infer saved/delivered state. Changing protocol or persistence is out of scope. |
| Durable moderation / message recall | Restriction currently broadcasts text; durable enforcement/state is not established by this handler. Dormant floating-chat recall has no matching active server handler in the inspected entry point. Do not promise enforcement or activate recall. |
| Recorded rule acknowledgment / repair dispatch | Neither follows from the current close button or In Progress status. Add backend support only under a separate feature request. |
| Password recovery / approval refresh | No reset flow is implemented; approval is part of stored user state. New reset/status-refresh behavior changes authentication/session behavior and needs its own review. |
| Rent-due balances / notification center | Receipts do not establish rent obligations; a static bell does not establish an unread-notification model. No invented balances, counts, or realtime center. |

Backend state enums, request fields, route paths, authorization rules, database operations, validation, emails, and socket protocols remain the source of truth. No migrations, server edits, or behavior changes are part of the proposed visual work.

## 8. Controlled implementation plan after review

| Group | Deliverable | Verification before the next group |
| --- | --- | --- |
| 1. Foundations | Active CSS theme/tokens; readable type/contrast; shared buttons, fields, badges, state components; focus conventions | Build; lint touched scope with baseline recorded; computed contrast; keyboard controls; light/dark OS preference does not silently override the intended theme |
| 2. Task recovery and overlays | Add-room busy-state repair; accessible dialog/drawer/lightbox/confirmation; honest error/empty/loading distinctions; clear deletion consequences | Add room twice; fail and retry; open/close/nest overlays by keyboard; test short/mobile viewport; verify request payloads are unchanged |
| 3. Shells and task hierarchy | Landlord navigation/menu/header; tenant task placement; shared page layout; local search; clear labels and accurate metrics | Navigate all existing routes; refresh/deep-link; browser back; active link/focus; mobile menu; zero/partial/error dataset presentation |
| 4. Approval, assignment, and payments | Per-record mutation feedback; consistent receipt state/remarks; rejection reasons; uncropped proof; review filters; clear proof submission | Pending approval and unassigned states; capacity failure; Pending/Anomalous/Verified/Rejected histories; submit success/warning/error; verification failure keeps reason; no fabricated save/delivery state |
| 5. Maintenance and rules | Readable full request details; all status labels; local filters; shared forms; responsive rules grid; truthful rule-close copy | Submit/progress/complete; rollback on failure; empty/error distinction; scoped/priority rules; failed rule add/delete; desktop/mobile details |
| 6. Messages and final consistency | Responsive active chats; connection/history/error feedback; draft handling; available chat-error events; full UI consistency pass | Two role test sessions; disconnect/reconnect; history failure; conversation switching; observed restriction notice; long content and software keyboard; backend-dependent guarantees remain absent |

For every group, compare actual network requests against the baseline endpoints, method, payload keys, enum values, multipart field `proof`, and socket events. Use meaningful targeted tests for mutation recovery, all-state mapping, remarks parsing, and keyboard/dialog behavior; avoid tests that simply mirror style classes. Do not change server behavior to make a test pass.

Final verification uses representative landlord and tenant test accounts with suitable existing fixtures or an isolated test environment. Exercise registration/sign-in, approval/assignment, proof submission/review/history, repair reporting/progress, rules, messages, profile editing, and logout at the planned widths. Report any unverified workflow explicitly. A few real landlord/tenant task sessions should validate priority/order/copy and refine the provisional severity ratings.

Review decisions are the proposed visual language, persona priorities/navigation order, shared-component plan, and the separation of frontend fixes from backend-dependent proposals. **Implementation starts after this audit/design direction has been reviewed; this document is the deliverable for that checkpoint.**

## 9. Reference synthesis

The reference index below lists the actual local copies inspected, using PDF page numbers so offsets from printed pagination are clear. Only task-relevant principles were applied. WCAG/APG and active Tailwind documentation above resolve current technical requirements; the books supply design reasoning.

Conflicts resolved: de-emphasized text remains readable; compactness yields to touch/keyboard usability; fewer options does not hide a recovery path; whitespace groups tasks without oversized cards; restrained branding yields to semantic status clarity; visual hierarchy never substitutes for semantic document structure. User task clarity → usability → accessibility → consistency → responsiveness → aesthetics → decoration governs each proposal.

The requested *UI Design Fundamentals* was not found in the supplied Core/Supporting directories; no claims are attributed to that missing reference.

| Reference | PDF pages sampled for these principles | Application to DormFix |
| --- | --- | --- |
| [Refactoring UI](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Core/Refactoring UI (Steve Schoger, Adam Wathan) (Z-Library).pdf>) | 36, 38, 42, 54, 68, 94 | Hierarchy through weight and color; readable secondary text; deliberate spacing; responsive sizing. |
| [Designing Interfaces](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Core/Designing Interfaces Patterns for Effective Interaction Design (Jenifer Tidwell, Charles Brewer etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | 55, 395, 492–493 | Choose structures around tasks; conventional actions; visible, associated form labels and understandable fields. |
| [Don't Make Me Think](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Core/Dont Make Me Think, Revisited A Common Sense Approach to Web Usability 3rd Edition (Steve Krug) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | 20–21, 40–41, 66 | Reduce interpretation; support scanning; conventional navigation with clear location and labels. |
| [Information Architecture](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Core/Information Architecture For the Web and Beyond (Louis Rosenfeld, Peter Morville etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | 70, 120, 130 | Organize and label information around how each role finds and uses it. |
| [Microinteractions](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Core/Microinteractions Full Color Edition Designing with Details (Dan Saffer) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | 30–33, 88, 93–95, 105–106 | Triggers/rules/feedback/loops; error prevention; microcopy and feedback that explain actual outcomes. |
| [Laying the Foundations](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Core/Andrew Couldwell, Meagan Fisher Couldwell (editor) - Laying the Foundations_ A book about design systems-Owl Studios (2019).pdf>) | 25–26, 70–71, 110 | Align the designed and implemented system; govern reusable patterns and accessible components. |
| [About Face](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Supporting/About Face The Essentials of Interaction Design 4th Edition (Alan Cooper, Robert Reimann, David Cronin etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | 35–36, 128–129 | Model goals, task sequences, dependencies, and recovery rather than exposing implementation structure. |
| [Thinking with Type](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Supporting/Thinking with Type A Critical Guide for Designers, Writers, Editors, and Students (Third Revised and Expanded Edition) (Ellen Lupton) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | 150–151, 160–161 | Legibility and restrained hierarchy; typography supports reading and scanning. |
| [Design School: Layout](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Supporting/Design School - Layout - A Practical Guide for Students and Designers (Richard Poulin) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | 72, 97, 100–101 | Whitespace, alignment, modular grids, and consistent spatial relationships. |
| [Inclusive Design for a Digital World](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Supporting/Regine M. Gilbert - Inclusive Design for a Digital World_ Designing with Accessibility in Mind (2019, Apress).pdf>) | 44–46, 50–51, 72–73 | Include diverse users; meaningful labels, usable buttons/links, and understandable structure. |
| [Practical Approaches for Designing Accessible Websites](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Practical Approaches For Designing Accessible Websites (Smashing Magazine) (Z-Library).pdf>) | 70–75 | Native controls, keyboard access, labels, and meaningful links; current WCAG resolves dated numeric advice. |
| [Designing for Accessibility](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Designing for Accessibility A Business Guide to Countering Design Exclusion (Simeon Keates (Author)) (Z-Library).pdf>) | 99–101 | Evaluate actual user capabilities and tasks; access through one mode alone is insufficient. |
| [Design for Inclusivity](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Roger Coleman, John Clarkson, Hua Dong, Julia Cassim - Design for Inclusivity_ A Practical Guide to Accessible, Innovative and User-centred Design (Design for Social Responsibility) (2008).pdf>) | 149–150 | Consider user groups, task, context, and participation; avoid treating a persona assumption as validated research. |
| [Usability Inspection Methods](<C:/Users/James Ian/Downloads/Expert--UI--UX-Design/Supporting/Usability Inspection Methods (Jakob Nielsen, Robert L. Mack) (Z-Library).pdf>) | 50–51, 72–75, 133–134 | Heuristic evaluation; frequency/impact/persistence and severity ratings; task walkthrough preparation and limits of one evaluator. |

The page selections are focused evidence, not a claim to have read every page of every book. The source copies of *Thinking with Type*, *Design School: Layout*, *About Face*, and *Inclusive Design for a Digital World* were located in Supporting; the three other accessibility references were located at the library root rather than the originally listed Core paths.


