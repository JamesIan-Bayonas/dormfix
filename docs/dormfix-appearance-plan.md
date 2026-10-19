# DormFix appearance refactoring proposal

Status: approved 5 October and implemented in the frontend 6 October 2026. Groups A–D are implemented; Group E's automated and isolated browser checks are complete, with authenticated/device/accessibility release checks still outstanding. This extends the completed usability foundations and preserves their backend scope. The original conversational overview remains a design preview with example records, not a connected dashboard.

## Direction: Forest & Sage

Keep DormFix's signature olive green **#425042** as the brand anchor. Build a fuller visual identity around it: warm green-tinted neutrals, forest-toned text, restrained sage selections, a recognizable house-mark treatment, and consistent type and surface hierarchy. Do not replace the identity with neon emerald, generic blue, or decorative gradients.

The screenshot is clear and usable, but nearly every section has the same white-card treatment, supporting text is blue-gray, and outlined actions occupy much of the review cards. These are opportunities for stronger visual hierarchy, not evidence that the existing workflows are broken. Preserve readable type, ordinary route labels, 44px controls, full content, accessible states and the task-first overview.

The desired signature is a coordinated treatment of the existing DormFix wordmark/house icon, navigation selection, green primary actions, section spacing and sage surfaces. It does not mean adding a footer slogan or signature to every page.

## Approved palettes

The brand anchor stays #425042 in both identities. Its **interactive use adapts**: dark green with white text in light mode; lighter sage with dark text in dark mode. White text on a light sage action is deliberately avoided.

| Semantic role | Enhanced light | Dark | Use |
| --- | --- | --- | --- |
| Brand anchor | #425042 | #425042 | Existing identity; not a universal readable text color |
| Canvas | #F5F7F2 | #101713 | Page background |
| Surface | #FFFFFF | #18221B | Routine panels, form controls |
| Raised surface | #FFFFFF | #202C23 | Menus, dialogs, drawers; light mode adds restrained elevation |
| Muted surface | #ECF1E8 | #263329 | Secondary areas, hover backgrounds |
| Sidebar | #F0F4ED | #131D16 | Quiet shell separation |
| Main text | #1F2C24 | #E7EEE3 | Headings, labels, values, body |
| Secondary text | #536457 | #ADBAAA | Descriptions, dates, metadata |
| Decorative divider | #D8E0D4 | #34483B | Grouping; never the only control boundary |
| Control border | #73816F | #718A75 | Inputs and outlined actions |
| Primary action | #425042 | #A9C6A4 | Important action fill and readable brand emphasis |
| On-primary text | #FFFFFF | #122017 | Text/icons on primary fills |
| Primary hover/pressed | #344034 | #BDD4B8 | Stateful action feedback |
| Selected surface | #E4EDE0 | #293C2E | Current navigation, selected contact/option |
| Selected text | #425042 | #C1D8B9 | Selected label/icon; retain marker and semantics |
| Keyboard focus | #2F6B4F | #C8DEAC | 2px outline with a surface-colored offset |

Light mode retains the existing primary action and hover colors. Its refinement is in the surrounding canvas, greener neutral text and clearer surface relationships. Dark mode uses green-charcoal rather than pure black. Increase surface lightness for elevation; do not simulate depth with heavy black shadows.

### Status colors remain separate from branding

| Status role | Light foreground / soft background | Dark foreground / soft background |
| --- | --- | --- |
| Informational / in progress | #285E86 / #EEF5FC | #A8CDEA / #1C3040 |
| Success / completed | #24633D / #ECF6EF | #A8D5AF / #203629 |
| Warning / awaiting review | #805717 / #FFF5DF | #E8C27A / #3A2E18 |
| Error / rejected / destructive | #A43132 / #FCEEEF | #F1AAAB / #3D2326 |

Always pair a status with its written label and existing icon. A selected green navigation item is not a success state. Full occupancy is neutral. Pending receipts are not verified income. Urgency stays independent from maintenance progress. Different dark destructive-button foregrounds, hover and pressed pairs must be checked when that component is migrated; badge pairs are not automatically valid for every button.

## Contrast evidence

Thirty explicit sRGB foreground/background pairs were calculated using relative luminance. All tested normal-text pairs exceed 4.5:1, and all tested control-border/focus pairs exceed 3:1. See [complete calculated pairs](dormfix-appearance-contrast.json). These calculations apply to the opaque proposed pairs, not every existing UI state or composite image overlay.

| Pair | Light | Dark |
| --- | --- | --- |
| Main text / routine surface | 14.54:1 | 13.82:1 |
| Secondary text / routine surface | 6.31:1 | 8.09:1 |
| Secondary text / muted surface | 5.50:1 | 6.54:1 |
| Primary action text / fill | 8.54:1 | 9.08:1 |
| Selected text / selected surface | 7.12:1 | 7.75:1 |
| Control border / routine surface | 4.12:1 | 4.36:1 |
| Focus / raised surface | 6.29:1 | 10.03:1 |

Requirements follow the W3C explanations of [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Decorative panel dividers need not have the contrast of control affordances. This is palette evidence, not WCAG certification. Validate final computed colors, all interactive states, image overlays, native controls and keyboard focus in both themes. Avoid rounded ratios when deciding whether a pair passes.

## Approved visual refinements

1. **Shell:** preserve routes/order and recognizable home icon. Give the mark a small sage/forest tile, keep the existing wordmark, use a quieter tinted sidebar and one consistent selected treatment. Keep the current-page indicator. Place Appearance in shared chrome, accessible to both roles and authentication screens.
2. **Overview hierarchy:** keep Needs attention before summaries. Keep its four work categories and exact counts. Use compact icon/title/count/action relationships rather than enlarging each card. Zero counts stay neutral; highlight actionable work only when confirmed data supports it. Never replace failures or partial data with a reassuring all-clear statement.
3. **Summary density:** propose one clearly grouped, compact summary strip with Rooms, Room occupancy, Assigned tenants and Verified receipts this month. At narrow widths it becomes stacked groups. Retain exact definitions and availability/loading/error behavior. This is a reviewable composition change, not new metrics or hidden workflows.
4. **Typography:** continue Inter/system sans for operational UI and the existing serif for brand only. Use a 28–32px desktop page title, 20px section titles, 14–16px body, 12–14px metadata and tabular figures for counts/money. Improve weight, alignment and spacing before adding another font. Never shrink controls or essential text to make cards fit.
5. **Components:** keep 8px control and 12px panel radii. Separate panels through surface contrast, alignment and grouping, not a shadow on every card. Primary actions remain filled green; secondary actions remain clearly interactive but visually quieter. Forms, tables, cards, badges and overlays must inherit the same palette.
6. **Authentication and media:** retain the restored local dorm photo. Following the user's 6 October alignment request, keep the photo on the left and both sign-in/account-creation forms on the right at desktop widths. Treat the photo overlay and white brand copy as a separate theme pair; do not substitute dark-mode on-primary text onto the photograph. Retain mobile form-first behavior. Receipt images should preserve their original colors against a neutral theme-aware mat.

These are proposed refinements. Do not reorganize routes, hide capabilities, add charts, infer payment obligations, or alter backend states for aesthetic reasons.

## How the references guide the proposal

| Reference from the approved audit | Applied principle |
| --- | --- |
| Refactoring UI | Contrast in visual emphasis, controlled spacing, fewer equally prominent surfaces, colors chosen by their use |
| Designing Interfaces | Familiar controls, theme chooser in shared chrome, consistent list/card/navigation patterns |
| Don't Make Me Think | Clear labels; keep the high-priority queues visible; visual polish must not obscure actions |
| Information Architecture | Preserve the role-specific grouping and route structure already established |
| Microinteractions | Predictable theme changes, visible focus/selection, no lost inputs or interrupted actions |
| Laying the Foundations | Semantic theme pairs and shared components; no page-by-page color patching |
| Thinking with Type / Design School: Layout | Type hierarchy, aligned columns, restrained density and whitespace |
| Inclusive-design and accessibility references | Readability, keyboard access, written state labels, reduced motion, user control |

This is an application of the previously inspected evidence, not a literal copy of a book example or a new claim to have re-read every PDF. Task clarity → usability → accessibility → consistency → responsiveness → aesthetics remains the conflict rule.

## Implemented theme behavior

- Offer **Light / Dark**, with **Light as the initial product default** to preserve the current appearance. The user's 6 October follow-up removes System; older saved System preferences migrate once to an explicit choice matching their current device appearance.
- Store only a local appearance preference under a dedicated key such as `dormfix-appearance`. It is independent of auth/user records; no API or database change. If storage is unavailable, changing appearance still works for the current page.
- Resolve the saved preference before first paint to avoid flashing the wrong theme. Use matching `color-scheme` so native controls participate. Keep choices explicit rather than following device changes, and synchronize another tab's preference if supported.
- Switching must keep routes, selections, typed drafts, dialog state and ongoing actions. It must not remount the application, reset forms or reload data. Theme choice can be announced briefly; never announce the whole page.
- Use explicit `dormfix-light` / `dormfix-dark` DaisyUI themes and theme-scoped CSS variables. Production and fixture entry points use the new names; the appearance bootstrap must load before React in any new standalone entry point. Continue using Tailwind utilities referencing semantic tokens. No UI framework or package upgrades were added. Technical references: [Tailwind theme variables](https://tailwindcss.com/docs/theme) and [DaisyUI theme configuration](https://daisyui.com/docs/themes/).

## Pre-refactor source findings

At approval, the active CSS fixed `color-scheme: light` and defined one named `dormfix` theme. Many custom tokens were global `@theme` values, so adding a dark DaisyUI theme alone would leave pages light. Both layers have now been migrated to theme-aware values.

Concrete migration hazards found in active source:

- `Conversation.tsx` uses `bg-primary text-white` for own bubbles. Replace this with a purpose-specific message pairing or on-primary token; white on dark-mode sage fails the intended pairing.
- `Contacts.tsx` uses `bg-sage-100` for selection, and selection/scrollbar rules reference the compatibility sage scale. Replace interaction usage with semantic selection/scrollbar pairs rather than redefining every raw sage shade as its opposite.
- `.df-button--danger` hover/pressed uses fixed `red-800`; introduce paired semantic destructive hover/pressed values.
- `.df-button:disabled` uses broad opacity. Review composite colors in both modes and prefer explicit unavailable foreground/fill where needed.
- Auth branding uses primary fill/overlay and primary-content. In dark mode those tokens are a light sage/dark-ink pair; the photo brand treatment needs separate stable readable foreground/overlay tokens.
- Focus already has a surface-based offset. Retain that relationship and test the ring against all adjacent surfaces, including primary buttons.

## Controlled implementation after review

| Group | Work | Review/checkpoint |
| --- | --- | --- |
| A. Palette and theme foundations | Finalize these pairs; add light/dark tokens, native color-scheme, first-paint preference resolution and shared Appearance control | Palette/state gallery in both modes; legacy preference migration, storage failure, first-paint and keyboard checks |
| B. Shared visual signature | Refine shell/brand, PageHeader, Panel, buttons, controls, badges, menus/dialogs/drawers and media mats | Landlord/tenant shell, auth and component previews; foreground/background and focus checks |
| C. Overview and role hierarchy | Review compact summary treatment, task-card rhythm, room/activity composition and tenant home | Full populated/zero/loading/partial-error data; correct counts/actions; narrow and wide review |
| D. Feature migration | Payments/receipts, approval/assignment, rooms, maintenance/rules, messages | Each role's existing workflows, all statuses/overlays/forms, retained inputs and realtime states in both modes |
| E. Final validation | Theme leakage audit, keyboard/reflow/device checks, existing regressions/build and scoped lint | 320/390/768/1024/1366/1920 widths; 200% text/reflow; reduced motion; screen readers; authorized real role sessions |

Make foundation changes first, then migrate shared components, then individual feature presentation. Capture both themes after each group. Existing backend contracts, auth/provider composition, persistence, validation, realtime protocols and record semantics remain untouched.

## Implementation and verification

- A: added the two semantic themes, native color-scheme, shared named chooser, synchronous saved-preference resolution, System updates and cross-tab synchronization. Appearance uses only the dedicated `dormfix-appearance` browser key and remains usable when storage fails. It neither reloads nor remounts the application.
- B: refined the sidebar, existing house mark/wordmark, matching favicon, page heading accent, buttons, unavailable states, controls, status colors and raised overlays. Photo branding keeps its stable white foreground and green overlay. Receipts have a neutral mat and no color filter.
- C: attention cards retain existing resource states, exact counts and route actions in a compact icon/title/count layout. The four summary definitions now share a responsive strip. Tenant tasks retain their original availability checks and routes, with a quieter housing summary and consistent surfaces.
- D: payments, approvals/assignments, room occupancy, maintenance, rules and messages inherit the shared theme. Contact selection is semantic; own-message bubbles use on-primary text. Toasts use theme pairs. Pending/relink/connection-error screens expose the shared appearance header. No dormant screen or unsupported feature was activated.
- E: production TypeScript/Vite build passes. All **36 Node tests** pass (28 existing regressions plus eight appearance checks). Changed TSX and fixtures pass scoped ESLint; the appearance fixture passes a separate TypeScript check. Full lint retains the existing six errors/two warnings in onboarding/API/auth/dormant chat. The existing DaisyUI radial-progress CSS optimizer warning remains.

The [browser verification record](dormfix-appearance-verification.json) contains 156 layout observations: both role homes, landlord receipts/directory, maintenance/rules/tenant history, both message roles, room occupancy, shared controls and both auth layouts. Each was measured in Light and Dark at 320/390/768/1024/1366/1920 CSS-pixel widths; none had document horizontal overflow. Checked role-home controls/actions were at least 44px tall. Fixtures use real presentation components with fictional records and simulated callbacks, never real account/record mutations.

Observed theme changes retained an overview search, an unsent message draft and a controlled textarea. A cross-tab theme change kept an open native dialog and its text, and updated its raised surface. Closing restored trigger focus. Keyboard focus was visible; mobile navigation closed with Escape and returned to Open navigation. Partial payment failure withheld unavailable counts and retained retry actions. Dark outgoing message bubbles rendered #A9C6A4 with #122017. Receipt images decoded with object-fit contain and no filter. The restored login photo decoded on the right and stayed hidden below 1024px; registration keeps its left photo.

Calculated destructive text/fill ratios are Light 6.85:1 (hover 9.03:1) and Dark 9.09:1 (hover 10.59:1). The stable 80% #28352B photo overlay yields approximately 6.85:1 for white text even over a white image pixel. These supplement the original 30 palette checks; they do not replace rendered/accessibility validation.

SHA-256 comparison confirms all **47 pre-existing hooks, services, utilities and server source files** are unchanged. Source diffs also confirm that API clients, auth context/provider entry composition and backend files were not edited. Existing routes, callbacks, request fields, business-state calculations, validation, persistence and socket behavior remain intact. No package, deployment, database or server configuration changes were made in this refactor. Prior unrelated dirty files were preserved.

The production localhost entry point was also inspected without signing in: Light/Dark chooser and matching native schemes rendered correctly, the local dorm image decoded, and the new DormFix favicon was declared. No credentials were entered or authentication submitted. Login screenshots below show the actual unauthenticated application; overview/tenant screenshots show the isolated fictional fixtures.

Verified screenshots: [light overview](screenshots/appearance-overview-light.png), [dark overview](screenshots/appearance-overview-dark.png), [dark tenant home](screenshots/appearance-tenant-dark-mobile.png), [light login](screenshots/appearance-login-light.png), [dark login](screenshots/appearance-login-dark.png).

Preview verification: light/dark switching updates the surfaces, swatches and contrast labels; the sample dialog opens, closes and returns focus to its trigger. At 1024px desktop and 320px mobile viewports, the preview root has no horizontal overflow. The mockup uses example records and does not connect to the application backend. These checks cover the proposal preview, not production accessibility or workflow certification.

Recommended direction: **Forest & Sage**, existing brand #425042 preserved, refined light palette plus sage-accented green-charcoal dark mode. The interactive preview lets reviewers inspect the proposed color relationships and compact summary treatment. It is not a finished specification for every page.

The palette, compact summary and Light-default / System-opt-in behavior were approved for execution. Implementation is complete for active frontend presentation. Authenticated end-to-end sessions, screen-reader behavior, 200% text enlargement, reduced-motion/device browser use and mobile software keyboards still need release verification. Isolated previews and unchanged-source evidence do not establish those results or certify WCAG compliance. See the foundation document's release checklist. No commit or deployment was performed.

Follow-up, 6 October: the login photo placement described in the initial appearance verification above has been superseded. Shared AuthLayout now fixes the photo left/form right for both authentication screens, with no per-page placement override. Actual app checks in both themes at 320/1024/1366px and the production build/scoped lint pass. Current evidence: [sign-in](screenshots/auth-consistent-login-right.png), [account creation](screenshots/auth-consistent-registration-right.png). Authentication submissions and backend behavior remain unchanged.
