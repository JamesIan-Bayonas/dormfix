# DormFix: evidence-based design synthesis and new-chat handoff

Prepared 6 October 2026. Scope: source analysis and handoff preparation only. This document does not authorize implementation, deployment, new data collection, or changes to business logic.

## How to read the evidence

The books and articles are references, not instructions. Their examples demonstrate ideas in particular contexts; they do not establish that the same intervention will improve DormFix.

- **[S] Source-supported:** an argument or example explicitly present in a reviewed passage, followed by a locator.
- **[X] Synthesis:** interpretation connecting sources or adapting a principle to a different context.
- **[V] Verified in source code:** behavior or structure inspected in the current project for this analysis. This is not proof of successful runtime execution.
- **[R] Recorded project evidence:** earlier audit, implementation notes, screenshots, or fixture checks. These are historical observations with stated limits.
- **[P] Proposed application / hypothesis:** a recommendation whose benefit requires inspection or testing; not a confirmed defect.

Book citations use stable IDs R01–R18 from section B. **“PDF p.” means the one-based page displayed by a PDF viewer, including covers and front matter. “Printed p.” means the number on the book page.** Where a printed number was not checked, only the PDF locator is given. Do not apply a presumed offset to an entire book; numbering can change. Article citations use section headings because the supplied text files have no stable page numbers.

## A. Project context and protected requirements

### Product, users, and purpose

DormFix is an existing dormitory-management application for **landlords and tenants**. Its purpose is to coordinate housing applications and room assignments, record and review payment receipts, manage maintenance reports, communicate, and publish house rules. It is a working operational product, not a promotional website. The placeholders in the latest request are resolved from the supplied conversation and project records; no invented business or audience details are needed.

The improvement goal is a professional, recognizable green interface with coherent Light/Dark themes, readable hierarchy, consistent controls, accessible interactions, clear task flows, and layouts that work across screen sizes. Aesthetic quality matters, but housing and record-management tasks remain the organizing purpose.

The roles below are **workflow models inferred from the application**, not research-validated personas. We do not yet know users’ ages, literacy, languages, device distribution, assistive technologies, bandwidth, workload, or actual task frequency.

| Role / situation | Main goals and tasks | Information that must remain clear |
|---|---|---|
| Landlord | Share the dorm code; review applications; approve or reject applicants; assign approved tenants to rooms; manage room capacity; review receipt evidence; update maintenance progress; communicate; maintain house rules | Approval and room assignment are distinct; capacity and occupancy; which receipt is being reviewed; authoritative receipt status; maintenance urgency versus progress; affected person/record before consequential actions |
| Tenant applying or awaiting assignment | Register with the appropriate role and dorm code; understand approval/linking/assignment state; recover from a failed lookup | Pending approval, unavailable lookup, unresolved housing link, and approved-but-unassigned are different states; the interface must not infer rejection from a read failure |
| Assigned tenant | View housing/contact details; submit payment proof; inspect payment history; report and follow maintenance; message the landlord; read applicable rules; edit supported profile fields | Upload/submission versus verification; report acceptance versus repair completion; sending versus confirmed stored history; current room context and rule applicability |

**[V] Current navigation:** landlord workspaces use `/` (Overview), `/payments`, `/maintenance`, `/tenants`, `/rooms`, `/chat` (Messages), and `/rules` (House rules). Tenant flows include `/`, `/pay`, `/report`, `/history`, and `/chat`; house rules and profile editing are dialogs. Authentication switches between sign-in and account creation within the unauthenticated application rather than assuming dedicated `/login` and `/register` routes. The tenant dashboard gates payment/report dialogs on existing room assignment. Evidence: [App.tsx](<C:/Users/James Ian/Projects/Maam Dara/dormfix-main-master/dormfix/client/src/App.tsx>), [LandlordDashboard.tsx](<C:/Users/James Ian/Projects/Maam Dara/dormfix-main-master/dormfix/client/src/components/dashboards/LandlordDashboard.tsx>), and [TenantDashboard.tsx](<C:/Users/James Ian/Projects/Maam Dara/dormfix-main-master/dormfix/client/src/components/dashboards/TenantDashboard.tsx>).

### Protected functional requirements

The backend is the source of truth. Preserve:

1. Authentication, authorization, landlord/tenant roles, approval gates, dorm linking, and room-assignment eligibility.
2. Existing route paths, request methods, API endpoints, JSON/multipart fields, identifier semantics, response handling, and server validation.
3. Database and persistence behavior, capacity rules, maintenance transitions, receipt verification/rejection rules, and realtime protocols.
4. Existing working actions and essential information. Reorganizing presentation must not remove capabilities, obscure required evidence, or introduce unsupported promises.
5. The distinction between payment **receipt records** and an accounting ledger. Verified receipt amounts are not automatically outstanding rent, cash balance, money received by the application, or proof that all obligations are settled.
6. The distinction between a live message/connection and confirmed stored or delivered messages. A socket echo does not establish durable persistence or recipient acknowledgment.
7. Existing validation requirements. Visual simplification is not permission to make required inputs optional, coerce amounts/dates, approve records automatically, or alter security checks.

Items 5–6 are especially important in the project’s recorded refactor notes. Proposed capabilities such as password recovery, durable rule acknowledgment, repair scheduling, reliable message acknowledgments, undo after deletion, stronger room identity in realtime events, or a rent ledger require separate backend/policy scope. Document them separately; never simulate them with styling or optimistic copy. [R: design-system notes, Groups 1–6.]

### Current design direction and decisions to preserve

The original six UI/UX implementation groups are recorded as complete. The appearance refactor also exists. These documents are useful context, but some earlier paragraphs describe superseded behavior:

- [UI/UX audit](<C:/Users/James Ian/Projects/Maam Dara/dormfix-main-master/dormfix/docs/dormfix-ui-ux-audit.md>): historical baseline and implementation grouping.
- [Current design system](<C:/Users/James Ian/Projects/Maam Dara/dormfix-main-master/dormfix/docs/dormfix-design-system.md>): shared components, behavior boundaries, checks, and subsequent corrections.
- [Appearance plan and verification notes](<C:/Users/James Ian/Projects/Maam Dara/dormfix-main-master/dormfix/docs/dormfix-appearance-plan.md>): Forest & Sage palette and implementation history.

**Latest decisions take precedence over earlier screenshots or plan paragraphs:**

- Retain DormFix’s green identity. Light uses olive/forest actions and pale green-neutral surfaces; Dark uses green-charcoal surfaces with lighter sage actions.
- Offer **Light and Dark only** in authentication and both role workspaces. Light is the initial default. An older saved System preference resolves once to an explicit theme; it no longer follows subsequent device changes.
- Keep the **photo on the left and the form on the right** for both desktop sign-in and account creation. Below the desktop breakpoint the photo is hidden and the form becomes a single column.
- Use one shared Appearance chooser. Its current size is 7rem × 2.75rem, approximately 112 × 44 CSS px at the default root size, with aligned label/icon/chevron. Do not create separate landlord, tenant, login, and registration implementations.
- Keep the local dormitory photo available as decorative branding. It does not identify or prove the condition of the user’s actual dormitory.
- Keep operational typography readable and restrained; the serif wordmark provides identity without becoming the typeface for dense records.

**[V]** These choices are represented by [AuthLayout](<C:/Users/James Ian/Projects/Maam Dara/dormfix-main-master/dormfix/client/src/components/ui/AuthLayout.tsx>), [AppearanceControl](<C:/Users/James Ian/Projects/Maam Dara/dormfix-main-master/dormfix/client/src/components/ui/AppearanceControl.tsx>), [appearance.js](<C:/Users/James Ian/Projects/Maam Dara/dormfix-main-master/dormfix/client/public/appearance.js>), and [index.css](<C:/Users/James Ian/Projects/Maam Dara/dormfix-main-master/dormfix/client/src/index.css>). The theme preference uses a dedicated local browser key and changes appearance without an authentication request or application remount. Runtime and cross-device success remain separate verification questions.

## B. Source inventory and coverage

### Access and review method

The original Downloads paths no longer contained the PDFs. All **14 named PDFs** were found in `C:/Users/James Ian/Projects/Expert--UI--UX-Design`, together with **three accessibility article files**. The PDFs total **4,569 viewer pages**.

Full-document text extraction was used to locate material, but **extraction is not full-text review**. No book received a cover-to-cover analytical reading. Each available book received a structural scan of contents/front matter or bookmarks, followed by selected close reading suited to DormFix. Introductions, relevant explanations, qualifications, examples, and selected closing passages were examined; not every chapter conclusion or illustration was reviewed. This is a completed, bounded synthesis pass, with a continuation reading plan in section I.

Six pages were also rendered and visually inspected: R01 PDF 37 and 97; R08 PDF 151; R09 PDF 53; R10 PDF 137; R13 PDF 171. These checks verified visual relationships and selected OCR/page-number evidence. Other illustrations were not comprehensively inspected. R10 is scanned/OCR material; some text and typography contain recognition errors. R13 also has extraction/OCR artifacts. Citations below rely on intelligible passages, with visual checks where particularly useful.

### Supplied books

| ID | Source / accessible file | Author(s) | Edition/date | Format and coverage |
|---|---|---|---|---|
| R01 | [Refactoring UI](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Core/Refactoring UI (Steve Schoger, Adam Wathan) (Z-Library).pdf>) | Adam Wathan and Steve Schoger | Edition/date not established in accessed copy | PDF, 252 viewer pages; structured scan + selected close reading, not full-text review |
| R02 | [Designing Interfaces: Patterns for Effective Interaction Design](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Core/Designing Interfaces Patterns for Effective Interaction Design (Jenifer Tidwell, Charles Brewer etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | Jenifer Tidwell, Charles Brewer, Aynne Valencia | 3rd edition, 2020 | PDF, 602 viewer pages; structured scan + selected close reading, not full-text review |
| R03 | [Don’t Make Me Think, Revisited: A Common Sense Approach to Web Usability](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Core/Dont Make Me Think, Revisited A Common Sense Approach to Web Usability 3rd Edition (Steve Krug) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | Steve Krug | 3rd edition, 2014 | PDF, 214 viewer pages; structured scan + selected close reading, not full-text review |
| R04 | [Information Architecture: For the Web and Beyond](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Core/Information Architecture For the Web and Beyond (Louis Rosenfeld, Peter Morville etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | Louis Rosenfeld, Peter Morville, Jorge Arango | 4th edition, 2015 | PDF, 485 viewer pages; structured scan + selected close reading, not full-text review |
| R05 | [Microinteractions: Designing with Details](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Core/Microinteractions Full Color Edition Designing with Details (Dan Saffer) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | Dan Saffer | 2013; supplied full-color edition | PDF, 171 viewer pages; structured scan + selected close reading, not full-text review |
| R06 | [Laying the Foundations: A book about design systems](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Core/Andrew Couldwell, Meagan Fisher Couldwell (editor) - Laying the Foundations_ A book about design systems-Owl Studios (2019).pdf>) | Andrew Couldwell; editor Meagan Fisher Couldwell | 2019 | PDF, 293 viewer pages; structured scan + selected close reading, not full-text review |
| R07 | [About Face: The Essentials of Interaction Design](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Supporting/About Face The Essentials of Interaction Design 4th Edition (Alan Cooper, Robert Reimann, David Cronin etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | Alan Cooper, Robert Reimann, David Cronin, Christopher Noessel | 4th edition, 2014 | PDF, 722 viewer pages; structured scan + selected close reading, not full-text review |
| R08 | [Thinking with Type: A Critical Guide for Designers, Writers, Editors, and Students](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Supporting/Thinking with Type A Critical Guide for Designers, Writers, Editors, and Students (Third Revised and Expanded Edition) (Ellen Lupton) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | Ellen Lupton | 3rd revised/expanded edition, 2024 | PDF, 259 viewer pages; structured scan + selected close reading, not full-text review |
| R09 | [Design School: Layout—A Practical Guide for Students and Designers](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Supporting/Design School - Layout - A Practical Guide for Students and Designers (Richard Poulin) (z-library.sk, 1lib.sk, z-lib.sk).pdf>) | Richard Poulin | 2018 | PDF, 235 viewer pages; structured scan + selected close reading, not full-text review |
| R10 | [Usability Inspection Methods](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Supporting/Usability Inspection Methods (Jakob Nielsen, Robert L. Mack) (Z-Library).pdf>) | Editors Jakob Nielsen and Robert L. Mack; chapter authors identified in C | 1994 | PDF, 439 viewer pages; structured scan + selected close reading, not full-text review |
| R11 | [Inclusive Design for a Digital World: Designing with Accessibility in Mind](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Supporting/Regine M. Gilbert - Inclusive Design for a Digital World_ Designing with Accessibility in Mind (2019, Apress).pdf>) | Regine M. Gilbert | 2019, Apress | PDF, 291 viewer pages; structured scan + selected close reading, not full-text review |
| R12 | [Design for Inclusivity: A Practical Guide to Accessible, Innovative and User-Centred Design](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Roger Coleman, John Clarkson, Hua Dong, Julia Cassim - Design for Inclusivity_ A Practical Guide to Accessible, Innovative and User-centred Design (Design for Social Responsibility) (2008).pdf>) | Roger Coleman, John Clarkson, Hua Dong, Julia Cassim; additional chapter contributors | Copyright December 2007; filename says 2008 | PDF, 267 viewer pages; structured scan + selected close reading, not full-text review |
| R13 | [Designing for Accessibility: A Business Guide to Countering Design Exclusion](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Designing for Accessibility A Business Guide to Countering Design Exclusion (Simeon Keates (Author)) (Z-Library).pdf>) | Simeon Keates | First publication 2007; accessed CRC Press republication 2018 | PDF, 184 viewer pages; structured scan + selected close reading, not full-text review |
| R14 | [Practical Approaches for Designing Accessible Websites](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Practical Approaches For Designing Accessible Websites (Smashing Magazine) (Z-Library).pdf>) | Smashing Magazine; Léonie Watson & Chaals McCathie Nevile; Henny Swan; TJ VanToll; Scott O’Hara; Marcy Sutton; Cathy O’Connor; Ollie Campbell; strategy/editor Vitaly Friedman, technical editor Cosima Mielke | 2015 | PDF, 155 viewer pages; structured scan + selected close reading, not full-text review |

The dates/editions above come from readable title/copyright/colophon pages rather than assumptions from filenames. Important qualifications: R01’s accessed copy does not establish a publication date; R12’s filename says 2008, while its copyright page says December 2007; R13 is first published in 2007, with a 2018 CRC Press republication, not a demonstrated new revised edition. R08’s colophon explicitly establishes the third edition as 2024 (PDF p.258).

### Selected analytical coverage and remaining material

This table identifies the strongest close-reading anchors. It is not a claim that every page between widely separated anchors was reviewed.

| ID | Structural scope and selected close-reading anchors, PDF viewer pages | Important material not closely reviewed |
|---|---|---|
| R01 | Contents pp.3–5; feature-first pp.8–9; scales pp.28–30, 70–72; hierarchy pp.36–39, 48–49, 54–55, 60–61; layouts pp.84–85, 96–98; typography pp.114–115, 118–119; palette/contrast pp.142–144, 162–168; images pp.202–205; empty states pp.234–236; borders pp.238–239; closing learning advice pp.249–250 | Much illustration detail, shadows/depth and other polish examples beyond the selected passages |
| R02 | Contents/preface; user goals p.26 and chapter conclusion p.46; Clear Entry Points pp.163–164; Two-Panel Selector / Split View pp.361–363; forms pp.492–494; Good Defaults pp.539–540; error patterns pp.544–546; form conclusion p.551 | Many individual navigation, social, chart, mobile, and data-exploration patterns; no complete pattern-catalog review |
| R03 | Contents/introduction; core usability pp.22–24; scanning pp.31–34; conventions pp.40–41; search pp.82–83; testing pp.122–125, 148–151; goodwill pp.175–177; final chapter opening pp.193–195 | Much home-page detail, mobile chapter, accessibility chapter, and final chapter remainder |
| R04 | Contents/preface; information ecology pp.54–55; information seeking pp.64–67; labels pp.175–177; embedded navigation pp.205–206; search need pp.234–235; Coda opening pp.463–464 | Full research/strategy/deliverables chapters, taxonomy/search engineering, analytics, and Coda remainder |
| R05 | Contents/preface; four-part model pp.33–37; feedback pp.106–108, 112–113; selected haptics p.124; testing appendix pp.161–163 | Most detailed trigger/rule/loop patterns, hardware cases, and feedback illustrations |
| R06 | Contents/intro; system model pp.90–94; audit pp.128–130; foundations/states pp.170–174, 179–180; responsive patterns/tokens pp.181–183; cooperation p.281 and closing pp.284–285 | Complete organizational/ROI case studies, gallery, team and brand exercises |
| R07 | Contents/introduction; goals and represented models pp.43–48; navigation excise p.303; error handling pp.671–673 | Detailed research/persona construction, scenarios, platform/control catalog, and appendix; no validated DormFix personas produced from this book |
| R08 | Contents/introduction p.9; line length p.126; legibility/readability pp.150–151; visual/semantic hierarchy and inclusion pp.168–170; responsive typography pp.244–245; colophon p.258 | Full type history, font taxonomy, global-script examples, exercises, and many grid demonstrations |
| R09 | Contents/introduction p.9; margins/columns pp.52–54; alignment/hierarchy pp.169–173; grid illustration p.53 visually checked | Most proportional-system studies, print projects, exercises/answers; no claim that a particular ratio is universally optimal |
| R10 | Contents/preface; executive conclusion p.48; heuristic method pp.50–52, 55–57; severity pp.72–74; walkthrough pp.133, 137–139; problem reports pp.308–310 | Most empirical comparisons, formal/pluralistic inspections, standards inspections, and chapter-level results; no numerical method ranking inferred |
| R11 | Contents/introduction; inclusive recruitment/exclusion pp.123–125; research conclusion opening p.141; design systems/process pp.175–177; participant/testing planning pp.180–181 | Full assistive-technology catalog, legal cases, early HTML examples, XR/AI chapter, appendix, most case-study details |
| R12 | Contents/preface; capability-demand model pp.186–187; evaluation guidance pp.205–206; simulation rationale/limits pp.218–221 and summary p.230; final chapter pp.250–252 | Most industry/education cases, recruitment methods, demographic data, exclusion calculations, final chapter remainder |
| R13 | Contents/preface; user data/process pp.104–105, 118; user involvement/recruitment pp.132–133, 137, 139; digital-TV case conclusions pp.171–172 | Most management/business frameworks, entire study methods/data, session facilitation chapter, commercial case detail |
| R14 | Contents/introduction; accessibility-tree roles/names/states pp.13–15; modal semantics/focus pp.77–81; client-rendered focus/announcements/conclusion pp.96–100 | Full mobile, elderly-user and contrast chapters; remaining modal code and platform-specific examples |

### Supplied article files and named but unavailable reference

| ID | Source / accessible file | Author/date | Format and coverage |
|---|---|---|---|
| R15 | [How to build an accessible design system](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Ariticles/how-to-build-accessible-design-system.txt>) | Eric Chung, LogRocket, 14 March 2023 | TXT article body; full available-text review; linked images/resources excluded |
| R16 | [What is Accessible Design?](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Ariticles/what-is-accessible-design.md>) | Vincent Brathwaite, Adobe XD Ideas, 11 May 2021 | Markdown/text article body; full available-text review; linked images/resources excluded |
| R17 | [Accessibility excerpt: accessibility/usability and practical guidance](<C:/Users/James Ian/Projects/Expert--UI--UX-Design/Ariticles/New Text Document.txt>) | Interaction Design Foundation attribution in file; individual author and publication date unknown | TXT excerpt; full available-excerpt review; original whole article unidentified |
| R18 | UI Design Fundamentals (named supporting reference) | Author, edition and date unknown | No identifiable file supplied/found; unavailable and unreviewed |

R15 and R16 received **full review of the available text bodies**, including their conclusions; linked resources and image-only content were not reviewed through those files. R17 received **full review of the available excerpt**, not of an identifiable complete original article. Their claims are secondary guidance and do not replace W3C requirements. R18 remains entirely unreviewed.

### Other supplied/project resources

- Four user-supplied screenshots: the absent login photo; an earlier landlord Overview; registration with photo left/form right; sign-in with the opposite placement. They are historical visual evidence from the conversation, not a current authenticated screen audit. Original temporary attachment paths may expire.
- The three project Markdown documents linked in A were consulted for decisions, protected contracts, implementation groups, and verification limits. They are project records, not independent proof of user outcomes.
- [Appearance contrast record](<C:/Users/James Ian/Projects/Maam Dara/dormfix-main-master/dormfix/docs/dormfix-appearance-contrast.json>) and [appearance verification record](<C:/Users/James Ian/Projects/Maam Dara/dormfix-main-master/dormfix/docs/dormfix-appearance-verification.json>): recorded palette checks and 156 fixture layout observations. The fixtures use fictional records and simulated callbacks.
- [Forest & Sage HTML preview](<C:/Users/James Ian/.codex/visualizations/2026/10/02/01a0fd5c-bf23-7913-b562-087a7e7bbbac/dormfix-forest-sage.html>): earlier design-preview artifact, not a connected production dashboard; not treated as behavioral verification in this synthesis.
- Current code inspection sampled application gates, role dashboards, shared authentication/appearance, theme tokens, dialogs, and status badges. This request did **not** repeat the earlier complete frontend audit, inspect every backend module, or execute authenticated workflows.

### Supplemental authoritative references

Current technical requirements were checked against [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) and relevant W3C Understanding/APG pages on 6 October 2026. These are **supplemental** to the supplied library. WCAG is normative; Understanding documents explain criteria; APG provides widget guidance and is not itself a WCAG conformance certificate. Specific links accompany the guidance in E.

## C. Resource-by-resource analytical summaries

### R01 — Refactoring UI

**Argument and evidence [S].** Visual hierarchy depends on deliberately differentiating important and supporting information, rather than making everything prominent. Weight, color, grouping, and position can improve scanning without increasing every font size. Its evidence is primarily practical reasoning and illustrated before/after examples, including the dashboard comparison on PDF p.37; it is not a controlled usability study of DormFix. The feature-first opening asks designers to solve a concrete task before committing to the application shell (PDF pp.8–9). Restricted scales reduce arbitrary decisions (pp.28–30, 70–72).

**Distinctive practical contribution.** Ambiguous spacing makes a label appear equally related to two fields. Its illustrated correction separates groups more than label/control pairs (PDF pp.96–98, especially p.97). This gives a concrete way to diagnose alignment and grouping, rather than merely requesting “more whitespace.” Fixed-purpose sidebars need not expand as a percentage of every viewport (pp.84–85). Readable paragraph measures and baseline alignment address different problems (pp.114–115, 118–119).

**Qualifications [X].** “Labels are a last resort” concerns self-explanatory display data and explicitly excludes forms (PDF pp.48–49). It cannot justify removing field labels, room/receipt meanings, or accessible names. “Semantics are secondary” concerns primary versus secondary action emphasis (pp.60–61); the separate heading advice says to retain meaningful HTML structure (pp.54–55). Do not conflate action color semantics with document semantics.

**DormFix use [P].** Keep actionable work more prominent than passive summaries; use the existing scale and semantic tokens; retain labels for operational records. Photo overlays can stabilize text contrast but reduce image visibility (PDF pp.202–205). Empty-state guidance can support a first room or report (pp.234–236), but filtering to zero matches and failing to load data require different recovery messages. These latter distinctions combine this book with R02/R05 and current project requirements.

### R02 — Designing Interfaces

**Argument and evidence [S].** Patterns connect recurring interaction problems to context, implementation rationale, and examples. The third edition concentrates on screen-based web/mobile work, with patterns rather than a claim to cover every channel (preface, PDF pp.13–14). Understanding a user’s desired outcome requires asking why a feature/task is needed (PDF p.26; printed p.6).

Clear Entry Points help occasional or first-time users choose a task, but an extra entry screen can frustrate experienced users (PDF pp.163–164; printed pp.143–144). Two-Panel Selector / Split View keeps an overview and selected item together, reducing memory and navigation effort, provided sufficient space and a clear selected state are available; smaller screens require another arrangement (PDF pp.361–363; printed pp.341–343).

**Forms [S].** Respecting attention means explaining purpose, organizing fields, labeling inputs, providing useful hints, accepting supported variation, and showing outcomes and recovery. Top-aligned labels suit responsive forms (PDF pp.492–494; printed pp.472–474). Defaults reduce work when likely correct, but can pass unnoticed and become dangerous assumptions (pp.539–540; printed pp.519–520). Error explanations should remain near the problem; premature validation of incomplete input can be unhelpful (pp.544–546; printed pp.524–526).

**DormFix use and limits [X/P].** Role homes can expose a few principal tasks while existing sidebar routes remain directly reachable. Landlord receipt/contact review is a plausible Two-Panel Selector / Split View use; tenant mobile tasks should not inherit a squeezed desktop split view. Native controls are a strong starting point, but a familiar component alone cannot determine what “verified” means. A default room, payment amount, urgency, or role must follow existing rules and explicit user intent. The catalog supplies options and tradeoffs, not a mandate to apply every pattern.

### R03 — Don’t Make Me Think, Revisited

**Argument and evidence [S].** A usable screen minimizes avoidable uncertainty about what it is, what can be done, and where to proceed. Krug’s central principle is practical self-evidence, not a universal two-click law (PDF pp.22–24; printed pp.11–13). Users often scan and act on satisfactory-looking choices rather than study everything, with exceptions such as documents intended for close reading (pp.31–34; printed pp.20–23). Familiar conventions make important locations and controls easier to recognize (pp.40–41; printed pp.29–30).

**Evaluation contribution.** The testing chapters emphasize observing people attempting tasks rather than treating preference discussions as equivalent evidence. Small rounds expose important qualitative problems and support iterative correction (PDF pp.122–125, 148–151). The goodwill discussion makes honest information and user consideration part of usability (pp.175–177), rather than reducing trust to attractive branding.

**Conditions and limits [X].** Scannability should not remove necessary receipt reasons, repair descriptions, housing consequences, or rule content. The broad advice for persistent search has an explicit small/well-organized-site qualification (PDF pp.82–83; printed pp.71–72); R04 offers a more detailed decision framework. Small tests are useful for discovering breakdowns but cannot prove population-wide speed gains, accessibility coverage, or rare failure rates.

**DormFix use [P].** Prefer labels such as “Submit payment proof” to language suggesting an online payment pipeline. Explain what happens after a report or application. Confirm that users can find the relevant next action without needing the author’s explanation. Brand polish should accompany, not conceal, operational truth.

### R04 — Information Architecture: For the Web and Beyond

**Argument and evidence [S].** Information organization depends on the interaction of users, content, and context—the information ecology—not on a universal menu template (PDF pp.54–55; printed pp.32–33). Finding a known record, exploring possibilities, performing exhaustive research, and returning to previously seen information are different needs (pp.64–67; printed pp.42–45).

**Distinctive contribution.** Consistent label systems give categories meaning through their relationships; vocabulary must suit the relevant context and audience (PDF pp.175–177; printed pp.153–155). Global, local, and contextual navigation serve different purposes. Adding cross-links increases flexibility but can also obscure hierarchy and create clutter (pp.205–206; printed pp.183–184). The search chapter explicitly rejects a fixed item-count threshold and asks whether content, user needs, maintenance capability, and better navigation justify search (pp.234–235; printed pp.212–213).

**DormFix use [X/P].** Preserve stable global destinations, then use local status filters and record-specific actions within them. A landlord looking for an applicant’s name has a known-item need; a tenant checking what to do next has an orientation need. These should not be solved with the same generic dashboard. Consistency can share “Messages” across roles while the actual content differs by permission and purpose.

**Limits.** Many examples concern large information environments, taxonomies, and public sites. DormFix does not need a mega-menu or global search because those appear in the book. Backend-wide search, pagination, or new indexing is separate scope. Source structure must also respect what the existing responses can reliably associate; display names are not safe identifiers. The Coda’s opening places IA in an evolving, collaborative field rather than a self-sufficient discipline (PDF pp.463–464).

### R05 — Microinteractions

**Argument and evidence [S].** A small interaction has four connected parts: trigger, rules, feedback, and loops/modes (PDF p.33; printed p.14, continuing pp.34–37). The trigger starts an action; rules govern it; feedback makes otherwise invisible behavior understandable; loops/modes describe repetition, persistence, interruption, and change over time.

Feedback should match the action and convey the relevant state. The book distinguishes manual actions needing acknowledgment, significant system activity, unavailable actions, and long-running work from background activity that need not demand constant attention (PDF pp.106–108; printed pp.87–89). Its examples and anatomy are design reasoning; they do not establish that more animation produces better outcomes.

**DormFix application [X/P].** A receipt upload can be analyzed as choose file → submit existing fields → show local pending → show returned submission outcome → later display authoritative review status. A theme change is choose Light/Dark → update local appearance → reflect selected value and accessible feedback → retain the choice when supported. A disconnected message composer should preserve its draft and communicate availability, without automatic resubmission or invented delivery acknowledgment.

**Qualifications.** Personality/humor can provide character but can also irritate (PDF pp.112–113). Housing, payment rejection, and urgent repair feedback call for respectful precision. A spinner is appropriate when only an indeterminate wait is known; a percentage requires actual progress evidence. The testing appendix explains that qualitative observations and small quantitative differences call for different study designs, and artificial interruption can change whether feedback is noticed (PDF pp.161–163). Do not adopt a sample-size sentence as a universal statistical rule.

### R06 — Laying the Foundations

**Argument and evidence [S].** A design system connects foundations, reusable components, patterns, templates, and pages through a shared language. Accessibility, user experience, content, and brand are part of the system rather than separate decoration (PDF pp.90–94). An audit should investigate why visual variants exist before eliminating them (pp.128–130).

**Practical contribution.** Foundations include deliberate color/type decisions and documented component states; responsive patterns should be reusable rather than recreated slightly differently for each page (PDF pp.170–183). Tokens centralize repeated decisions. The execution examples use Sass, but the underlying principle is central control of reusable values (pp.181–183). Cooperation, teaching, and continued adaptation matter more than treating the system as an enforcement mechanism (p.281; closing pp.284–285).

**DormFix use [X/P].** Keep existing Tailwind/DaisyUI semantic mappings as the implementation of that principle; introducing Sass, a new framework, or an elaborate design-system platform would not be justified. Document component contracts: a Button exposes pending/disabled state, but its parent remains responsible for awaiting the existing request; a StatusBadge presents a truthful caller-supplied label, not a new domain-state machine.

**Limits.** A shared component can spread a mistake widely. Tokens do not guarantee contrast in every combination, and a variant inventory cannot substitute for task testing. Teams with a small product should scale governance to practical ownership: a compact state matrix, examples, exception reasons, and review criteria are sufficient. Organizational return-on-investment cases do not establish a commercial payoff for DormFix.

### R07 — About Face

**Argument and evidence [S].** Goals explain why people undertake tasks; an interface’s represented model should help users understand and act without exposing all implementation complexity. The text contrasts contexts in which expert throughput matters with those in which a novice’s understanding matters (PDF pp.43–48; printed pp.13–18). Its navigation discussion treats unnecessary movement and management work as excise—effort that does not advance the user’s goal (PDF p.303; printed p.273).

**DormFix use [X/P].** Organize landlord work around applicants needing decisions, assignment, receipt review, and maintenance rather than a button for every API operation. Organize tenant work around submitting proof, reporting a problem, reviewing records, and communicating. Do not remove identity, status, dates, or consequences merely to reduce clicks. A receipt review needs enough context to make the correct decision.

**Qualification.** The error chapter questions intrusive error dialogs and advocates preventing or accommodating avoidable mistakes (PDF pp.671–673; printed pp.641–643). Some examples recommend interpreting input helpfully. For DormFix, such advice is bounded by authoritative validation: do not silently change payment values, dates, room eligibility, roles, or security-sensitive input. Clear frontend explanation and recovery are available without changing those rules.

**Distinctive contribution and limit.** This is the strongest supplied resource for goal-oriented interaction models, complementing R02’s reusable patterns. Its detailed research/persona methodology was not closely reviewed here; names and demographic stories invented from it would not count as DormFix research. Desktop/platform examples should not dictate mobile structure or require interaction changes outside the authorized frontend scope.

### R08 — Thinking with Type

**Argument and evidence [S].** Typography organizes meaning and supports reading, not just identity. Legibility concerns recognizing characters; readability concerns sustained comprehension and reading experience. The book compares glyph distinction and discusses familiarity without establishing a universal serif/sans-serif winner (PDF pp.150–151; printed pp.148–149). Its illustrated comparison on PDF p.151 makes the B/8, 1/l/I, O/0, and p/q issue concrete.

Visual hierarchy and semantic hierarchy serve different access channels and should work together. Styling a heading does not require changing its logical tag (PDF pp.168–170; printed pp.166–168). Responsive text/layout adjustments should respond to available space rather than merely shrink a print composition (PDF pp.244–245; printed pp.242–243). The third-edition introduction broadens cultural/script inclusion (PDF p.9; printed p.7).

**DormFix use [X/P].** Keep operational text in the existing sans-serif stack and brand expression in the wordmark. Inspect room codes, pesos, dates, names, and receipt identifiers at actual sizes. Numeric alignment and wrapping may matter more than a typeface substitution. Keep structural headings and table labels accessible; use specific link/action text.

**Limits.** The line-length discussion offers approximately 35–75 characters for ordinary text (PDF p.126; printed p.124), while R01 and R09 offer different ranges. These are contextual reading heuristics, not hard limits for every cell, message, or control. Do not assume font novelty improves comprehension or replace essential text with images. A visual font comparison is not a user study of DormFix’s chosen font.

### R09 — Design School: Layout

**Argument and evidence [S].** Layout creates order and relationships through composition. Margins frame content and offer visual respite; columns depend on text size, leading, and intended measure (PDF pp.52–54; printed pp.50–52). The grid illustration on PDF p.53 shows how a system establishes recurring boundaries rather than merely aligning isolated boxes.

Alignment has reading consequences: flush-left text generally supports continuous left-to-right reading; centered or right-aligned blocks serve different expressive purposes; justification can create disruptive spacing (PDF pp.169–173; printed pp.167–171). Size, location, weight, color, and spacing work together to establish hierarchy.

**DormFix use [X/P].** Align card headings, amounts, action rows, field starts, and table columns across repeated components. Use consistent outer gutters and panel padding. Align icon-plus-label controls by their visual center while aligning mixed-size text by baseline where appropriate—these are different relationships. Give repair descriptions and house rules readable measures; do not center long operational paragraphs.

**Limits and relationship to R01.** Much of this resource concerns fixed-page print composition. Book-spine margins, bleed, modular page ratios, or the golden section should not become browser requirements. R01’s warning against indiscriminate grids does not invalidate a grid: it limits rigid proportional layout when a content-driven width is better. Grid structure is useful for repeated data; responsive breakpoints should follow task/content failure, not a desire to reproduce an illustrated page. Exercises and most case layouts remain unreviewed.

### R10 — Usability Inspection Methods

**Argument and evidence [S].** Inspection is systematic expert examination of an interface. It complements, rather than replaces, user testing (executive conclusion, PDF p.48; printed p.23). Nielsen’s heuristic chapter explains independent reviews followed by aggregation and identifies the variability between evaluators (PDF pp.50–52, 55–57). Table 2.2 lists the revised ten heuristics derived from analysis of 249 usability problems (PDF p.55; printed p.30). This is methodological evidence, not a forecast of DormFix’s problem distribution.

Severity considers frequency, impact, and persistence; agreement and ratings are not automatic (PDF pp.72–74; printed pp.47–49). A proposed “3–5 evaluators” is an efficiency recommendation in the chapter, not a prerequisite that prevents a useful first review or proves completeness.

**Distinctive complementary method.** Wharton, Rieman, Lewis, and Polson’s cognitive walkthrough focuses on learning through exploration. At each step ask whether the user will pursue the needed effect, notice the action, associate it with the intended effect, and recognize progress (PDF pp.133, 137–139; printed pp.108, 112–114). A credible explanation depends on explicit assumptions about user knowledge; the questions are not absolute requirements divorced from context.

Robin Jeffries’ problem-report chapter distinguishes the problem, why it harms use, a possible solution, and why that solution may help (PDF pp.308–310; printed pp.283–285). “Needs a nicer button” is not an adequate problem description.

**DormFix use [X/P].** Walk through applying, waiting for assignment, submitting proof, reviewing a receipt, and recovering from a failed report. Record the screen/state, evidence, affected task, severity rationale, uncertainty, and evaluation method. Check sound decisions as well as problems. The dated platforms and monetary benefit examples should not become current claims; the empirical-comparison chapters were not fully reviewed.

### R11 — Inclusive Design for a Digital World

**Argument and evidence [S].** Inclusive design requires considering who an environment excludes and involving people with relevant access needs. Recruitment should align participants with the actual product and research goal, not include disability as a detached demographic exercise (PDF pp.123–125; printed pp.101–103). The introduction expressly rejects a one-size-fits-all solution and encourages contextual expertise and participatory design (PDF pp.21–22).

**Practical contribution.** Accessibility belongs in requirements, user stories, wireframes, role responsibilities, navigation documentation, colors, forms, focus behavior, and maintenance of the design system (PDF pp.175–177; printed pp.153–155). Testing plans consider product tasks and visual, auditory, motor, cognitive, and speech-related access needs; sampling varies with the medium (PDF pp.180–181; printed pp.159–160).

**DormFix use [X/P].** Recruit people who actually perform landlord/tenant work, including those using keyboard, magnification, or screen readers where feasible. Ask whether approval state, pending upload, maintenance urgency, and messages are understandable through their access methods. Assign component-level accessibility responsibility so every new dialog or field does not rediscover the same rules.

**Limits.** Inclusion is broader than passing automated checks, while standards remain useful testable requirements. Legal cases, 2019 tool/platform lists, XR/AI possibilities, and population statistics are contextual rather than requirements for this product. No current Philippine legal conclusion is drawn from them. The selected conclusion explicitly does not guarantee success merely from planning accessibility (PDF p.177); the handoff consequently frames benefits as expectations and calls for user evaluation.

### R12 — Design for Inclusivity

**Argument and evidence [S].** John Clarkson’s chapter models exclusion as a mismatch: task/product demands in an environment exceed a person’s capabilities. Capability includes sensory, physical, cognitive, and experiential aspects; changing context can change exclusion (chapter 11, PDF pp.186–187; printed pp.165–166). This explains why a working interface can still exclude users without a software failure.

Evaluation should be integrated through requirements, concept, prototype, and finished product, with methods appropriate to each stage (chapter 12, PDF pp.205–206; printed pp.184–185). Cardoso and Clarkson explain that simulation can raise awareness of sensory/motor difficulty but cannot reproduce living with an impairment or the strategies experienced users develop. It supplements rather than replaces real users (chapter 13, PDF pp.218–221; printed pp.197–200; summary p.230/printed p.209).

**DormFix interpretation [X/P].** Tiny controls raise motor demand; subtle status colors raise perceptual demand; remembering a housing code or inferring a workflow raises cognitive demand; bad connectivity changes the environment. Reducing one demand can help multiple users, but there is no basis for estimating an exclusion percentage for DormFix from old population datasets.

**Limits and distinctive contribution.** Many cases involve physical products, automotive access, and industrial processes. Browser equivalents require careful translation. Color-vision simulation and narrow-viewport previews are diagnostic aids, not substitutes for assistive-technology or participant testing. The final chapter discusses maintaining gains and the practical limits of universal inclusion (PDF pp.250–252; printed pp.229–231); do not promise that one redesign serves every possible person or circumstance.

### R13 — Designing for Accessibility

**Argument and evidence [S].** Accessibility is a user-centered design and organizational problem, broader than compliance. Designers need sufficient, relevant user information rather than guesses or an overwhelming dump of population data (chapter 8, PDF pp.104–105; printed pp.87–88). Simulation can reveal potential physical difficulty but does not establish what a user wants or how a product fits life (PDF p.118; printed p.101).

Users ideally participate through development; testing only at the beginning and end leaves important decisions unexamined (chapter 10, PDF pp.132–133; printed pp.115–116). Different recruitment strategies provide different coverage, and small, difficult-to-recruit samples constrain statistics (pp.137, 139; printed pp.120, 122).

**Evidence and distinctive lesson.** The older-adult digital-TV case reports substantial difficulty from unfamiliar mental models and inconsistent labels, not just physical impairment (chapter 12 conclusions, PDF pp.171–172; printed pp.154–155). That is evidence in its own sample and device context, not evidence that DormFix’s tenants or landlords have the same distribution of problems. It supports investigating experience and terminology alongside contrast and control size.

**Critical qualification [X].** The recruitment passage values enthusiasm and clear communication (PDF p.139). Applied rigidly, that could exclude people whose cognitive, speech, language, or confidence differences are precisely relevant. DormFix research should support multiple ways to participate rather than select only articulate testers. The old business/legislation examples and 2018 republication do not establish updated legal or technical advice. Use this resource for process and evidence management; current web requirements come from W3C.

### R14 — Practical Approaches for Designing Accessible Websites

**Argument and evidence [S].** This is a multi-author 2015 collection, not a single uniform standard. Watson and McCathie Nevile explain how the accessibility tree exposes roles, names, states, and relationships to assistive technology (PDF pp.13–15). Meaningful HTML supplies information that visual styling alone cannot.

Scott O’Hara’s modal discussion starts from the difference between a mouse-visible overlay and a usable keyboard interaction. A real button, useful accessible name, visible focus, moving focus into the dialog, and remembering the invoking element all matter (PDF pp.77–81). Marcy Sutton’s client-rendered discussion shows how DOM replacement and routing can lose focus, and how curated announcements make asynchronous updates available without requiring sight (PDF pp.96–100).

**DormFix use [X/P].** Receipt lightboxes, room drawers, confirmations, and tenant report dialogs need an interaction contract, not only a backdrop. Routes and record switches should maintain orientation. Feedback outside focus needs appropriate announcements; routine updates should not continually interrupt a message draft. Native `<dialog>` and shared components are useful existing foundations, but inspect the whole flow and current browser/assistive-technology behavior.

**Limits.** The accessibility-API browser matrix, Internet Explorer references, Spine/CoffeeScript and old Angular snippets are historical. Do not paste them into React or adopt `role="alert"` for every routine message. The underlying semantics/focus lessons survive; current APG/WCAG guidance supplies the technical baseline. The complete mobile/elderly/contrast articles were not closely reviewed, so no detailed claims from those chapters are attributed here.

### R15–R17 — Accessibility article files

**R15, Eric Chung [S].** The LogRocket article connects accessible design systems with contrast, typography, icons, spacing, component behavior, keyboard/screen-reader tests, and ongoing responsibility (sections “Incorporating accessibility into the design process,” “Building accessibility into your design system,” “Testing your design system for accessibility”). This is useful practical support for R06/R11. Its evidence is explanatory advice and examples, not a DormFix evaluation. Promotional analytics copy is not a recommendation to add tracking. Its brief media-alternative advice is too compressed to substitute for the distinct WCAG media criteria.

**R16, Vincent Brathwaite [S].** Adobe’s article frames accessibility around varied users and relates usability assessment to learning, efficiency, errors, and satisfaction (sections “How to design for accessibility,” especially “Measure usability”). It supports testing actual comprehension and task completion. A suggested 16px text size is a design starting point, not a universal WCAG minimum. AI, voice interfaces, and XR examples are possibilities, not solutions DormFix needs. Unverified numerical accessibility prevalence claims and jurisdiction-specific legal statements are not carried forward as project facts.

**R17, unidentified Interaction Design Foundation excerpt [S/X].** The supplied excerpt distinguishes usability from accessibility and explains broad benefits of removing barriers. Its available practical checklist is useful only after technical scrutiny. Instructions based solely on shape or location can themselves exclude people; a required input is not an ARIA “required role”; use correct native semantics/properties. Its CMS examples do not apply directly to the existing React application. Statistics and the excerpt’s embedded 2026 reference do not establish an author, publication date, or verified current prevalence estimate.

**R18.** No identifiable copy of “UI Design Fundamentals” was found. No author, arguments, citations, or implied review are invented. The synthesis stands on accessible sources; this reference can be added in a later reading pass if the exact document becomes available.

## D. Cross-source synthesis

### Which source contributes most to each decision?

| Decision area | Strongest supplied treatment | Complementary contribution | DormFix interpretation |
|---|---|---|---|
| Visual hierarchy, spacing, surfaces, component polish | R01 | R08 reading; R09 composition | Use small, coherent decisions to make the task structure visible; do not equate decoration with quality |
| Controls, forms, page patterns | R02 | R03 discoverability; R14 implementation access | Choose a pattern for the actual context and states, retaining native behavior where suitable |
| Simplicity and navigation comprehension | R03 | R04 labels/grouping; R07 goals | Reduce unnecessary uncertainty and movement without removing essential operational information |
| IA, vocabulary, findability | R04 | R02 entry points/Two-Panel Selector / Split View; R10 walkthrough | Stable routes, role-appropriate task emphasis, scoped local tools |
| Feedback and asynchronous transitions | R05 | R10 system-status heuristic; R14 announcements | Explain the actual evidence stage, including pending, failure, and unconfirmed persistence |
| Design-system structure | R06 | R11 ownership; R15 testing | Shared tokens and components plus state contracts and maintenance |
| Goal models and workflow behavior | R07 | R04 information needs; R02 patterns | Treat roles as different work contexts; validate assumptions with users |
| Typography | R08 | R01 hierarchy; R09 alignment | Readability, character distinction, semantic structure, and responsive measure |
| Inclusive evaluation | R11–R13 | R10 inspection; R14 web mechanics | Assess demand, context, assistive access, and actual participant tasks |
| Systematic usability audit | R10 | R03 lightweight iteration; R11 inclusive recruitment | Record specific problems and uncertainty; combine inspection with observation |

This follows the user’s source priorities without promoting a visual-design book to authority over authentication or accessibility standards. Resolve conflicts in the requested order: **user task clarity → usability → accessibility → consistency → responsiveness → visual aesthetics → decorative novelty**. This is a design decision order, not permission to waive an applicable accessibility requirement or protected business rule.

### Shared principles, complementary mechanisms, and conditions

1. **Tasks precede composition [X].** R07 distinguishes goals from tasks; R02 asks why; R01 starts with a feature. Together they support deciding what a landlord must review before sizing cards. This should improve focus when priorities are accurate. If priorities are guessed, a prominent dashboard can make the wrong activity easier instead.
2. **Reduce uncertainty through structure and evidence [X].** R03 makes next actions self-evident; R04 makes labels/navigation coherent; R05 makes hidden activity understandable. A tenant must know both where to submit proof and whether submission succeeded. These are different design problems, needing both IA and feedback.
3. **Group related information, distinguish unlike states [X].** R01 proximity, R09 alignment, and R02 form organization support predictable grouping. A consistent panel should still distinguish read failure from zero results and receipt submission from verification. Visual uniformity that erases these differences is counterproductive.
4. **Visible and programmatic meaning must agree [X].** R08 semantic hierarchy and R14 roles/names/states complement R01 visual hierarchy. A beautiful selected role card is insufficient if assistive technology cannot determine the selected value. Conversely, correct markup does not make faint text readable.
5. **Reuse behavior as well as appearance [X].** R06/R11 support repeatable states, responsibility, and documentation. Reusing color/radius alone leaves inconsistent busy, error, focus, and recovery behavior. Shared mistakes also propagate, so reuse needs inspection and task checks.
6. **Evidence must match the claim [X].** R10 methods find possible breakdowns; R03 small tests expose major problems; R05 distinguishes qualitative discovery from small performance differences; R11–R13 require contextual recruitment. Repeated advice increases confidence that an idea is worth investigating, not proof that a particular DormFix change worked.

### Meaningful disagreements and how to resolve them

| Apparent conflict | What the sources actually contribute | Resolution for DormFix |
|---|---|---|
| R01 discourages excess labels; R02/R14 require meaningful labels | R01’s display-data advice excludes forms; native field names and meaningful records have different needs | Keep persistent field labels and accessible names. Simplify redundant display phrasing only when identity/meaning stays unambiguous |
| R01 says semantics are secondary; R08/R14 emphasize semantics | Action emphasis is different from HTML/document semantics | Set button prominence by task importance while retaining native roles, heading order, names, and states |
| R09 favors grids; R01 warns that grids are overrated | A grid creates alignment; forcing all widths into fixed percentages can harm content | Use repeatable gutters/columns, bounded reading widths and useful sidebars; break the grid when task/content needs it |
| Reading measures differ: R01 about 45–75 characters, R08 about 35–75, R09 about 60–72 | Different typography/composition contexts, not competing laws | Test actual paragraphs and screens. Start within a readable range; do not force receipt cells or short controls to meet it |
| R03 broadly favors visible search; R04 asks whether search is needed | Familiar search aids known-item needs, but scope/content/maintenance matter | Keep existing useful local search/filtering. Investigate missing findability before proposing global search or new API capabilities |
| Simplicity/minimalism versus information density | R03/R10 oppose irrelevant competition; R07 recognizes expert throughput and context | Offer concise summaries plus accessible detail. Preserve decision evidence and direct actions; avoid both giant empty cards and compressed illegible tables |
| Flexible error handling versus controlled validation | R07’s helpful interpretation reduces avoidable friction; project rules protect financial/housing accuracy | Explain acceptable inputs and retain drafts; do not reinterpret authoritative values or bypass constraints |
| Expressive microinteractions versus quiet operation | R05 allows personality but also identifies annoyance and timing issues | Use restrained causality/feedback motion; precise copy for financial/housing failures; respect reduced-motion preferences |
| Uniform brand colors versus accessibility | R01 palette advice serves polish; R11/R14 and current W3C guidance address access | Preserve green identity through roles and relationships, with theme-specific foregrounds. Do not require the same green hex for every mode/state |

### Advice that should not transfer directly

Do not import old platform/browser support matrices, obsolete JavaScript examples, industrial measurements, print-only margin rules, fixed device assumptions, dated statistics, speculative technology promises, or commercial conversion objectives. Do not equate fewer clicks, more whitespace, a dark theme, a trendy font, or an automated score with successful task completion. The sources contribute reasoning frameworks; DormFix supplies the task and contract constraints.

### Signifiers, mappings, constraints, and feedback in practical terms

These concepts describe different mechanisms, rather than interchangeable synonyms for “intuitive.” **[X]** The terminology below is a synthesis of R02’s control/form patterns, R05’s trigger/rule/feedback model, R07’s represented models, and R10’s recognition/error-prevention heuristics; it is not a verbatim taxonomy attributed to one source.

| Mechanism | Practical meaning and user problem | DormFix example and limit |
|---|---|---|
| Affordance and signifier | What the control enables, and what tells a person it can be used. Something merely resembling a button may have no keyboard behavior | A native button enables activation; its label, boundary and states communicate the action. A green card with no clear label/behavior can still be ambiguous; an icon alone may be unfamiliar |
| Mapping | The relationship between an action and its effect. Poor mapping encourages wrong choices | “Submit payment proof” maps to uploading evidence; “Pay now” could imply money transfer that does not exist. A room action must visibly refer to the selected room |
| Constraint | What limits the available action and prevents an invalid choice. Hidden constraints make disabled controls feel broken | Existing assignment eligibility can disable a task with a nearby reason. Keep authoritative permission/capacity rules; do not loosen them because they inconvenience a layout |
| Feedback | Evidence of what happened after an action. Without it, users repeat actions or assume the wrong result | Pending upload, failed submission and returned review status need distinct messages. A click animation demonstrates input response, not server completion |

Useful controls combine these mechanisms. A clear signifier cannot compensate for an incorrect mapping, and a good constraint cannot compensate for unexplained failure. Evaluate them by asking what users expect before activation and what they believe afterward. [R02 PDF pp.492–494; R05 PDF pp.33–37; R07 PDF pp.43–48; R10 PDF p.55.]

## E. Practical design guidance

These are reusable **[X/P] rules** grounded in reviewed passages and the existing system. They do not instruct a new assistant to implement without the next user’s requested scope.

### E1. Hierarchy, layout, and density

Lead each screen with its task context, relevant count/state, and next action. Keep passive totals quieter than work requiring a decision. Use a bounded content area, predictable gutters, and aligned repeated components. Keep labels closer to their inputs than to the previous field; distinguish sections with spacing and surfaces before adding borders everywhere. [R01 PDF pp.36–39, 70–72, 96–98; R09 PDF pp.52–54, 169–173.]

Retain present spacing conventions: Tailwind steps 1, 2, 3, 4, 6, 8, 10, 12; roughly 8px label-to-control separation and 16–24px between field groups; outer padding 16/24/32px as space permits. Controls use 8px radii, panels 12px, badges 6px. Shadows belong primarily to overlays; calm surface differences and boundaries organize normal content. These are **DormFix system choices**, not values dictated by the books. [V: index.css; R: design-system record.]

A wide desktop can support comparison across records. A phone should present identity, current status, essential values, and next action in a useful reading order, with accessible detail rather than accidental clipping. Do not shorten repair descriptions or rejection reasons solely to make cards the same height. For long lists, validate scannability and review speed before choosing either spacious cards or denser rows. [R02 Two-Panel Selector / Split View, PDF pp.361–363; R07 PDF pp.43–48.]

### E2. Typography and content

Use semantic page/section headings with visual styles independent of tag choice. Retain Inter/system sans-serif for operations and the existing serif brand wordmark. Current titles use `text-2xl sm:text-3xl`; section titles use `text-lg sm:text-xl`; operational text is generally 14–16px with readable line heights. Do not shrink critical status or recovery messages into barely legible metadata. [V: index.css; R01 PDF pp.54–55; R08 PDF pp.150–151, 168–170.]

Constrain long reading content, allow names/reasons/messages to wrap, and align amounts for comparison. If truncation is useful in a dense list, make the full value available without requiring an inaccessible hover. Check codes/identifiers for confusable glyphs. Familiar wording matters more than labeling internal technical operations. Keep “Payments” as an established destination if useful, but describe the concrete action as submitting/reviewing **payment proof**. [R04 labels, PDF pp.175–177; R08 PDF p.151.]

### E3. Color roles and the existing palette

**[V] Snapshot of current theme tokens; index.css remains the live authority:**

| Role | Light | Dark | Purpose |
|---|---|---|---|
| Canvas | `#F5F7F2` | `#101713` | Overall page background |
| Surface | `#FFFFFF` | `#18221B` | Panels and controls |
| Raised surface | `#FFFFFF` | `#202C23` | Contextual elevation without heavy effects |
| Muted surface | `#ECF1E8` | `#263329` | Secondary grouping |
| Sidebar | `#F0F4ED` | `#131D16` | Persistent navigation |
| Main text | `#1F2C24` | `#E7EEE3` | Primary reading |
| Supporting text | `#536457` | `#ADBAAA` | Secondary explanation, still readable |
| Divider | `#D8E0D4` | `#34483B` | Decorative/content separation |
| Control border | `#73816F` | `#718A75` | Clear input/outlined-action boundary |
| Primary action / text | `#425042` / `#FFFFFF` | `#A9C6A4` / `#122017` | Signature action treatment |
| Primary hover/pressed | `#344034` | `#BDD4B8` | Action feedback |
| Focus | `#2F6B4F` | `#C8DEAC` | Keyboard orientation |
| Selected surface / text | `#E4EDE0` / `#425042` | `#293C2E` / `#C1D8B9` | Selection, distinct from success |

Semantic status pairs also exist for info, success, warning, and error. Use those roles, not arbitrary page colors. Persisted status remains authoritative; a badge never invents a transition. Pair color with a written label and appropriate icon. Selected navigation is not “success,” full room occupancy is not automatically an error, maintenance urgency is separate from progress, and a scan warning is not a fraud verdict. [V: StatusBadge; R: appearance/receipt/maintenance records; S: R01 PDF pp.142–144, 162–168.]

Check actual foreground/background pairs, including hover, pending, selected, and soft-status backgrounds. A palette pair that passes in a badge may fail in a filled button. Opacity and images alter the rendered background. Keep the stable auth overlay separately from theme-dependent primary colors; do not recolor receipt photographs. [R01 PDF pp.202–205; X: operational evidence must remain inspectable.]

### E4. Components, controls, and consistency

Reuse existing Button/IconButton, FormField/controls, Feedback, Panel/PageHeader, StatusBadge, Dialog/Drawer, WorkspaceShell, AuthLayout, AppearanceControl, and Brand. Shared ownership means one correction should reach all appropriate screens. Preserve role-specific content and eligibility rather than forcing identical dashboards. [R06 PDF pp.90–94, 179–183; R11 PDF pp.175–177.]

Use a filled primary action for the principal operation, outlined secondary actions for alternatives, and quiet actions for low-priority utilities. Use destructive treatment for consequential deletion/rejection/removal according to context, not for ordinary navigation. A group need not make every action equally prominent. Retain native selects when their options/behavior fit. Align a control’s box, label/icon center, and chevron consistently; do not “fix” alignment with a different component on each page. [R01 PDF pp.60–61, 118–119; R02 forms PDF pp.492–494.]

**State contract for every shared component:**

| State | Visual / accessible treatment | Behavior to check |
|---|---|---|
| Default | Clear name, purpose, boundary or signifier | Correct native interaction and route/action |
| Hover | Modest emphasis without obscuring text | No essential information available only on hover |
| Focus-visible | Distinct visible indicator on the actual surface | Logical order; focus stays visible and reachable |
| Active | Immediate restrained response | Does not double-submit or imply completed persistence |
| Selected | Marker plus correct current/checked/pressed semantics | Selection is not conveyed by hue alone |
| Disabled/unavailable | Still understandable with a nearby reason | Eligibility preserved; no misleading dead action |
| Loading/pending | Specific action label and busy feedback | Existing request awaited; repeat activation controlled; outcome not fabricated |
| Success | Explain the completed stage and next step | Only claims supported by response/record |
| Warning/error | Plain explanation and recovery action | Values/context retained; no false empty state |
| Refresh/stale uncertainty | Explain that content is loaded history or a failed refresh | Do not claim real-time freshness or erase useful records without reason |

The selected/pressed semantics depend on the control type: use `aria-current` for navigation, checked values for native radios, and appropriate button state only where applicable. Do not add ARIA indiscriminately. [R14 PDF pp.13–15; R10 Table 2.2, PDF p.55.]

### E5. Forms, validation, prevention, and recovery

Keep persistent labels, explicit optional fields, helpful format examples, and grouping that matches the task. Hints supplement labels. Explain tenant dorm-code requirements at the point of use. Keep password paste/autofill available and the visibility toggle clearly named. Do not add a password-recovery link unless the workflow exists. [R02 PDF pp.492–494; R03 PDF pp.22–24; R: authentication notes.]

Validate at a helpful point rather than treating a partly typed valid value as an immediate failure. Server validation remains authoritative. Errors should identify the affected field or operation, explain a supported correction, and preserve entered information. For a file upload, retain the filename/preview and explain any existing type/size constraint before submission; do not change accepted formats or upload fields. A useful error summary can complement inline messages on longer forms. [R02 PDF pp.544–546; R10 PDF p.55.]

Prevent consequential mistakes by showing the correct record/person, available capacity, selected role, and expected action. Confirm deletion/removal with meaningful target and consequences. Initial focus can favor Cancel for an irreversible operation. Do not promise undo or cancel a server action without support. [R10 error prevention, PDF p.55; R14 modals PDF pp.77–81; supplemental APG guidance below.]

### E6. Feedback, asynchronous work, and record freshness

Describe each operation with its trigger, existing rules, feedback, and interruption/repetition behavior. Keep loading, true empty, filtered no-match, read failure, mutation failure, success, and unconfirmed/stale content distinct. Use feedback near the affected operation, with an accessible announcement where appropriate. Reserve an interruptive dialog for a task needing one, not every error. [R05 PDF pp.33–37, 106–108; R02 PDF pp.544–546.]

Do not show a fabricated completion percentage when the API only exposes pending/completed. Do not infer dispatch from “report submitted,” approval from “receipt uploaded,” or saving from a live echo. During refresh, explain unavailable updates without describing existing records as current to the second. Offer existing retry/refresh recovery where safe. Do not auto-replay mutations after reconnection; keep persistence and duplicate handling within supported behavior. [X: R05 + protected DormFix contracts; R: Groups 4–6.]

### E7. Accessibility baseline: supplemental current guidance

Target **WCAG 2.2 AA across complete supported flows**, not merely a component or screenshot. Relevant checks include semantics/relationships, keyboard operation, visible unobscured focus, meaningful names, error identification, status communication, contrast, resize/reflow, target size, and accessible authentication. This is a target and evaluation framework, not a current conformance claim. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)

- Normal text requires at least **4.5:1** contrast; qualifying large text requires **3:1**. Large means at least 18pt (24 CSS px) or 14pt bold (approximately 18.67 CSS px), subject to equivalent-size definitions. Do not substitute an older book’s approximate 18px threshold for this definition or round a failing ratio into a pass. [W3C Understanding Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- Meaningful visual information needed to identify controls, states, or graphics requires **3:1** against adjacent colors, with criterion exceptions. This does not mean every decorative divider must meet that ratio. [W3C Understanding Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- AA target-size minimum is **24 × 24 CSS px**, with specified exceptions including spacing. DormFix’s usual **44px minimum control height** is a stronger product convention; it is not the blanket WCAG AA threshold. Inspect target width, surrounding spacing, and actual hit area as well. [W3C Understanding Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- Test reflow at **320 CSS px** for horizontally written content, including the equivalent zoom condition. Content genuinely requiring a two-dimensional layout can have a scoped exception; its surrounding controls and reading content still need usable reflow. Mobile emulation alone is insufficient. [W3C Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- Authentication should permit assisting mechanisms such as password managers and paste; accessibility does not require replacing the existing authentication pipeline. [W3C Understanding Accessible Authentication Minimum](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)
- Status messages that do not change focus/context must be programmatically available to assistive technology. Use appropriately restrained announcements rather than repeatedly interrupting ongoing work. [W3C Understanding Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- Modal dialogs need a name, appropriate initial focus, contained Tab/Shift+Tab sequence, Escape dismissal, and sensible focus restoration. APG also discusses initial focus for long content and irreversible actions. Marking a dialog modal must match actual inert-background behavior. [W3C APG Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

Prefer semantic HTML, associated labels, correct table headers, and native controls. Treat ARIA as an enhancement for semantics the native element does not adequately express. Test with keyboard and representative screen-reader/browser combinations, including dynamic transitions. Automated checks are useful detectors, not proof of full compliance or usability. [R14 PDF pp.13–15, 77–81, 96–100; R11 PDF pp.180–181.]

### E8. Responsiveness and motion

Choose changes by available space and task needs. Keep desktop auth photo/form order fixed; hide the decorative photo on narrower layouts. Collapse side navigation into an accessible drawer, adapt record details and action rows, and keep essential actions available. For dense tables, use an intentional locally scrollable comparison region or an equivalent labeled mobile representation without dropping fields/actions. [R02 PDF pp.361–363; R04 PDF pp.205–206; R08 PDF pp.244–245.]

Test long labels, numbers, URLs, translated-length strings, software keyboards, and larger text. Use motion only to explain a transition/state, and preserve the same information with reduced motion. Never make a slow animation the prerequisite to completing a routine task. [R05 PDF pp.36–37; X: task clarity and inclusive access.]

### E9. Prototyping and iterative improvement

Use the least expensive representation that can answer the next uncertainty. **[X/P]** A labeled sketch or simple flow can test whether “approved” and “assigned” are understood before polishing every component. A realistic component fixture is better for focus, wrapping, theme contrast, and pending/error feedback. An authorized connected session is necessary to examine actual requests, notifications and persistence. The levels answer different questions; they are not a ladder in which a prettier prototype automatically becomes stronger evidence. [R10 early paper-interface inspection, PDF pp.55–57; R12 staged evaluation, PDF pp.205–206; R05 testing, PDF pp.161–163.]

Keep realistic identity, amounts, long content and adverse states in a prototype rather than testing only empty/ideal screens. Clearly mark fictional records and simulated success. Observe the task, identify a specific breakdown, adjust the smallest plausible cause, and repeat the relevant task/regression checks. Capture changes to assumptions, not merely screenshots of successive styles. Small observed improvements support the tested context; broad speed, satisfaction or accessibility claims require appropriate evidence and coverage. [R03 PDF pp.122–125, 148–151; R11 PDF pp.123–125, 180–181.]

## F. Project-specific applications

The entries below are a recommendation register, not a new defect list. Preserve sound existing choices. Prior checks are distinguished from fresh source-code observations. Each expected benefit is a hypothesis until evaluated.

### F1. Authentication and Appearance consistency

**Problem/risk:** Historical screenshots showed photo/form sides reversing and an Appearance chooser that felt misaligned. Repeated positional shifts can weaken orientation; separate chooser implementations would invite further drift. These issues have recorded fixes, so do not reopen them as current defects without reproduction.

**Support:** R03 conventions, PDF pp.40–41; R01 grouping/alignment, pp.96–98, 118–119; R06 responsive patterns, pp.181–183. **[V]** Shared AuthLayout fixes order, the photo is decorative, and AppearanceControl has exactly two native options and aligned dimensions. **[R]** Actual unauthenticated checks and screenshots document the changes; no credentials were submitted.

**Application [P]:** Keep both screens on the same layout and chooser; verify the selected role remains clearly distinguished and programmatically understood. Preserve the latest Light/Dark-only policy. Check blocked storage and a migrated old System preference without changing account preferences or authentication.

**Expected benefit:** More stable orientation and a consistent visual signature through entry and role workspaces. **Tradeoff/boundary:** Native option popups vary by browser; replacing the select just to imitate a screenshot can add keyboard complexity. The desktop photo contributes identity but occupies space; hiding it on mobile is appropriate. **Evaluation:** At 320, 768, 1024, and 1366px check both screens/themes, focus, long errors, role changes, visibility toggle, paste/autofill, and matching control alignment. Use authorized test accounts separately for submission/regression testing.

### F2. Role homes: priority and appropriate density

**Problem/risk:** A dashboard can look polished yet distribute equal emphasis across tasks with different consequences. With all attention counts at zero, a large “Needs attention” region may consume space; whether that harms DormFix has not been established.

**Support:** R01 hierarchy, PDF pp.36–39; R02 Clear Entry Points, pp.163–164; R07 goals/context, pp.43–48. **[R]** The refactor already separates actionable work from quieter summaries and provides tenant task entry points. The supplied earlier Overview screenshot is not the final appearance implementation.

**Application [P]:** First observe landlord prioritization and tenant first-use comprehension. If useful, make a concise all-clear treatment while retaining routes and visibility of important work. Keep application approval distinct from assignment and receipt review. Tenant home should reflect housing eligibility and direct task access.

**Expected benefit:** Faster recognition of the next relevant task and less scanning of passive totals. **Tradeoff/boundary:** Do not hide a zero count if it provides important reassurance; do not invent overdue balances, emergency dispatch, or activity freshness. **Evaluation:** Ask landlords to identify the next unresolved task in mixed-state records and an all-clear case; ask tenants to submit proof or find repair status. Record wrong first choices, hesitation, essential information missed, and completion without coaching.

### F3. Tenants and rooms: clear housing stages

**Problem/risk:** Application approval, room assignment, and data availability can be visually collapsed into one “ready” or “rejected” state, causing wrong expectations or actions.

**Support:** R04 labels/context, PDF pp.175–177; R05 feedback model, pp.33–37; R10 recognition/error prevention, p.55. **[V]** App/dashboard code contains distinct gates and room-assignment checks. **[R]** Earlier work separates failed lookup from unresolved linking and names occupied/available places based on assignments.

**Application [P]:** Retain explicit stage text and a relevant next action or waiting explanation. In room views, keep capacity/occupancy labels and enough tenant identity to assign correctly. Preserve action eligibility and authoritative room identifiers.

**Expected benefit:** Fewer mistaken assumptions that approval guarantees a room or that a failed request means rejection. **Tradeoff/boundary:** No new approval refresh protocol, capacity rule, permission, or automatic assignment; any desired live approval refresh belongs in a separate proposal. **Evaluation:** Test pending, approved/unassigned, assigned, unresolved link, and failed lookup. Ask users to explain their current stage and what they can do next; verify the original requests and resulting persisted assignments in authorized regression sessions.

### F4. Payment proof and landlord review

**Problem/risk:** Monetary labels, scan warnings, and progress styling can imply payment collection, fraud certainty, or verification that the system has not established. A visually simplified review can omit the very evidence needed for a sound decision.

**Support:** R03 self-evidence/goodwill, PDF pp.22–24, 175–177; R02 forms/errors, pp.492–494, 544–546; R05 progress feedback, pp.106–108. **[R]** Group 4 retains authoritative payment status, original upload fields, scan metadata/notes distinctions, and a proof-review flow.

**Application [P]:** Keep “submitted,” “pending review,” “verified,” and “rejected” distinguishable according to returned status. Show receipt image, amount/date/context, and supported warning/reason information together. Use an accessible image lightbox with the original evidence visible; keep rejection recovery clear to tenants.

**Expected benefit:** Better understanding of the review stage and fewer unsupported conclusions from colors or totals. **Tradeoff/boundary:** Keep backend verification/rejection requirements; never match tenants to receipt records solely by name or infer dues without a ledger. Keep upload formats, multipart contracts, and server validation. **Evaluation:** Submit supported/unsupported files under existing rules, recover after failure without losing input, review/reject a specific receipt, read a long reason, reload to verify recorded outcome, and ask both roles what each state proves. Test near-midnight/local-date cases already represented in regression notes.

### F5. Maintenance: separate urgency, progress, and confirmation

**Problem/risk:** Optimistic progress can be mistaken for a confirmed server update; a high-urgency report can be confused with a workflow status; truncated descriptions can impair assessment.

**Support:** R05 feedback/loops, PDF pp.33–37, 106–108; R02 error recovery, pp.544–546; R10 system status, p.55. **[R]** Group 5 records local pending updates, record-specific rollback, retained context, and full descriptions; this was checked with simulated callbacks rather than live authenticated mutations.

**Application [P]:** Preserve separate urgency/status labels and explicit saving state until the existing response settles. Keep the affected item visible while pending even if a status filter would otherwise remove it. Surface failure beside that item and retain other records’ valid changes.

**Expected benefit:** More trustworthy progress and recovery, particularly with slow or failed requests. **Tradeoff/boundary:** No new urgency triage, repair scheduling, dispatch, transition rules, or server notes fields. Do not make an in-flight action cancellable unless its actual semantics support it. **Evaluation:** Use two records with concurrent updates; fail one and succeed the other; refresh during pending; retry; inspect stored results. Ask tenants whether “reported” means someone has been dispatched. Test full long descriptions and touch/keyboard controls.

### F6. Messages: orientation and honest delivery evidence

**Problem/risk:** Connection, local submission, echo, and stored history can all look like “sent.” Switching conversations can lose drafts or show ambiguous records if context is not reliable.

**Support:** R02 Two-Panel Selector / Split View, PDF pp.361–363; R05 feedback, pp.106–108; R14 client-rendered focus/announcements, pp.96–100. **[R]** Group 6 documents per-contact drafts, stale-request protection, history/live merging, room/sender filtering, and “saving unconfirmed” treatment. These are recorded implementation/fixture results, not a new realtime audit in this request.

**Application [P]:** Preserve visible contact context, selected-state semantics, connection availability, retained drafts, and separate stored-history evidence. Keep announcements restrained so new messages do not seize focus from typing. On mobile, support usable list-to-conversation orientation rather than forcing a narrow split pane.

**Expected benefit:** Fewer mistaken delivery assumptions, wrong-contact actions, or lost composition effort. **Tradeoff/boundary:** Do not introduce acknowledgments, leave-room protocols, durable mute state, reliable multi-session presence, or enforcement not supplied by the server. A broadcast-only “communication notice” must not become an authorization control through UI wording. **Evaluation:** Disconnect/reconnect, failed history, rapid contact switching, a slow read with live arrivals, ambiguous own echoes, multiline drafts, unavailable timestamps, and real reload persistence. Compare both roles using authorized sessions; no automatic resending after reconnect.

### F7. House rules and consequential dialogs

**Problem/risk:** Unclear room scope or an ambiguous deletion target can cause consequential mistakes. A visually correct modal can still lose focus or trap a keyboard user indefinitely.

**Support:** R04 labels/context, PDF pp.175–177; R10 prevention/control, p.55; R14 modal semantics, pp.77–81. **[V]** Current Dialog uses native modal behavior, focus restoration, a close control, and a busy state; Escape/close are blocked while busy. ConfirmationDialog initially favors Cancel. **[R]** Rule applicability and failure/retry focus have fixture checks.

**Application [P]:** Keep applicable global/room rules explicit, the full target text available, and deletion consequences clear. Review the busy-state escape/recovery path against the current APG pattern. This is a **verified implementation difference requiring evaluation**, not proof that every existing dialog currently fails: busy operations can be brief, but an unresolved request can leave all dismissal controls unavailable.

**Expected benefit:** Fewer wrong-target actions and more reliable keyboard recovery. **Tradeoff/boundary:** The APG expects Escape dismissal; visual refactoring must not pretend that closing a dialog cancels a submitted mutation. Document the pending-close/draft/outcome semantics before proposing any frontend change, and keep API/persistence behavior intact. No invented rule acknowledgment or undo. **Evaluation:** Open, read long content, traverse both Tab directions, cancel, begin a slow action, encounter a failure, recover, and return focus. Test removed-trigger fallback and nested lightbox/drawer cases. Investigate unresolved-request recovery with safe fixtures before authorized integration testing.

### F8. Design-system coverage and two-theme resilience

**Problem/risk:** Foundations may be coherent while uncommon states, browser-native controls, overlays, or long content retain one-off styling. Passing palette calculations cannot establish complete rendered access.

**Support:** R06 state governance, PDF pp.179–183; R11 embedded responsibility, pp.175–177; R01 color roles, pp.142–144, 162–168. **[V]** Shared semantic tokens, explicit themes, status labels/icons, and shared controls exist. **[R]** The appearance record contains 156 fixture observations across both themes and six widths with no recorded document overflow in those cases.

**Application [P]:** Build on the existing components with an inventory of active usages and applicable states. Inspect authentication, both role homes, filters, upload, dialogs/drawers, receipts, rules, messages, disabled eligibility, and recovery in both themes. Fix a shared cause once only after reproducing it.

**Expected benefit:** Less drift and a more intentional product as features evolve. **Tradeoff/boundary:** Keep product-specific exceptions documented; do not build an elaborate component platform or change domain hooks for cosmetic consistency. **Evaluation:** Compare the component state matrix in E4 with actual usage, contrast pairs and rendered surfaces. Include real device/browser controls, magnification, screen-reader feedback, long content, and backend regression checks.

## G. Prioritized roadmap

The original foundations should **not** be rebuilt simply because a new assistant starts a new chat. This roadmap begins with current-state verification. It does not authorize work beyond analysis; the next requested scope determines execution.

| Priority | Work and rationale | Dependencies and scope | Completion criteria |
|---|---|---|---|
| 0 — Evidence baseline | Read current docs/code and distinguish fixed historical issues from reproducible defects; establish authorized test accounts or safe fixtures | No data mutation without a relevant task/authorization; preserve existing dirty work | Current screen/state inventory; reproducible findings with evidence class, user impact, protected contract and uncertainty; sound decisions recorded |
| 1 — Essential access/recovery | Inspect keyboard/focus, busy-dialog recovery, names, contrast, text enlargement/reflow, unavailable controls and failed async work | Reproduce first; current W3C criteria; frontend-only corrections if later authorized | Core tasks operable with keyboard and tested access methods; no unresolved critical traps; errors retain context and offer supported recovery; each remaining failure documented |
| 1 — Functional truth/regression | Verify receipt-stage meanings, housing gates, maintenance confirmation, chat evidence/isolation with authorized role sessions | Existing backend/contracts remain authoritative | Original working flows still function; no fabricated success/delivery/ledger meaning; reload verifies expected persisted outcomes; uncertainty is visible |
| 2 — Task/IA validation | Observe role-home task choices, terminology, filters, record context, and mobile navigation | Representative users; do not guess frequency or rename routes blindly | Users can find and explain principal tasks/states without coaching; wrong first choices and misunderstandings addressed or consciously accepted |
| 2 — Component completeness | Check all active forms, panels, filters, statuses, overlays, loading/empty/error states in both themes | Existing token/component architecture; state inventory from priority 0 | Applicable E4 states covered; justified role differences retained; duplicated cosmetic treatments removed only within requested scope |
| 3 — Measured visual refinement | Adjust density, reading measure, alignment, restrained depth and typography only where current evidence supports a change | Preserve green identity and approved layout/theme policy; baseline task evidence | Before/after comparison improves clarity or judged visual coherence without losing information, access, or actions; no unmeasured speed claim |
| Separate backlog — Backend/policy proposals | Reliable acknowledgments/room identity, password recovery, scheduling, ledger, durable rule acknowledgment, undo | Explicit separate authorization, domain policy, API/data design | Proposal states problem, required server capability and UX consequences; no cosmetic simulation or implementation under frontend-only scope |

Severity should reflect **frequency, impact, and persistence**, with uncertainty stated. Consequential wrong-record actions or blocked access outrank radius preferences. A consistent but harmful interaction does not earn priority merely because it can be reused. Small batches should inherit foundation decisions, then verify relevant existing flows before widening scope. [R10 PDF pp.72–74, 308–310; R06 PDF pp.128–130.]

## H. Evaluation checklist

This is a future evaluation protocol, **not a list of checks completed by this document**.

### H1. Role tasks

- [ ] Sign in with supported credentials; create each supported account role using existing requirements; show/hide password; paste/autofill; handle validation and server failure.
- [ ] Explain pending approval, unresolved linking, lookup failure, approved/unassigned, and assigned state without coaching.
- [ ] Landlord: find an applicant, review the correct identity, approve/reject under existing rules, assign an eligible tenant, and inspect capacity/occupancy.
- [ ] Landlord: locate and inspect payment evidence, verify/reject the intended record, and understand warnings versus authoritative status.
- [ ] Tenant: choose/upload proof, correct a supported validation error, recover from request failure, inspect returned submission state and later history.
- [ ] Tenant: report an issue, retain category/urgency/description after failure, and understand report acceptance versus repair progress.
- [ ] Landlord: update maintenance, handle concurrent records and a failed update, refresh and verify the expected stored outcome.
- [ ] Both roles: identify the selected conversation, compose multiline content, switch/recover drafts, refresh failed history, disconnect/reconnect, and distinguish live messages from recorded persistence.
- [ ] Tenant: read applicable house rules and supported profile fields; landlord: review rule scope and cancel/confirm a precise deletion target.
- [ ] Switch Light/Dark on authentication and both workspaces; preserve current page, focus, draft, role, modal, and selection.

For a cognitive walkthrough, at each step record the intended effect, the visible action, whether its label maps to the goal, and whether feedback shows progress. State assumptions about experience rather than treating the evaluator’s familiarity as the user’s. [R10 PDF pp.137–139.]

### H2. Responsive, zoom, and long-content cases

- [ ] Widths **320, 390, 768, 1024, 1366, 1920 CSS px**, plus content-driven intermediate widths; both themes and roles.
- [ ] **200% text enlargement** and an appropriate **400% browser zoom/reflow** condition; essential information/actions remain available. Consult [W3C Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) and the Reflow reference in E7.
- [ ] Mobile software keyboard: focused input, error, submit action, and conversation composer remain reachable; portrait/landscape and reduced viewport height.
- [ ] Long names, emails, room labels, URLs, unbroken identifiers, large currency values, many records, long rejection reasons, rule text, multiline messages, and maintenance descriptions.
- [ ] Table overflow stays local and intentional where comparison requires it; headers/context/actions remain usable. No page-wide accidental horizontal overflow.
- [ ] Auth order remains photo-left/form-right at desktop widths; narrow layouts prioritize the form; photo loading/failure does not obscure inputs.
- [ ] Browser-native select options, date/file controls, autofill, and scrollbars remain legible in each theme; actual devices supplement emulation.

### H3. Keyboard and assistive access

- [ ] Logical Tab/Shift+Tab order, visible focus, no keyboard-only dead ends, no sticky chrome covering focused actions. Check [W3C Focus Not Obscured Minimum](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).
- [ ] Native radio/select interactions; selected role and current route correctly conveyed; collapsed navigation announces state and remains operable.
- [ ] Dialog open/close/Escape, initial focus, focus containment, Cancel choice, long content, pending behavior, failure focus and restoration; removed triggers have a sensible fallback.
- [ ] Labels, hints and errors associated with their controls; heading/landmark order meaningful; icon-only actions named; decorative icons/photos ignored appropriately.
- [ ] Loading, submitted, failed, result-count and history-refresh changes announced when relevant without excessive repetition or moving focus away from a draft.
- [ ] Screen-reader/browser combinations relevant to actual users; keyboard, magnification, contrast, and pointer access tested independently. Report combinations and failures precisely.
- [ ] Color-independent status meaning and distinguishable character shapes; text/control/focus contrast measured on actual surfaces and states.
- [ ] Touch target hit areas and spacing, not just visible icon dimensions; reduced motion retains feedback and orientation.

### H4. State and regression matrix

For each applicable component/task, check default, hover, focus-visible, active, selected, unavailable/disabled, pending, success, warning, error, true empty, no-match, refresh failure, stale/unconfirmed content, retry and interruption. Use realistic fictional fixtures for destructive/failed states before live tests.

- [ ] API method/path/payload/identifier and multipart-field compatibility remain unchanged.
- [ ] Roles, auth/provider behavior, eligibility, capacity, permissions and server validation remain unchanged.
- [ ] Slow reads cannot replace a newer selected record or erase messages received meanwhile; record identity remains explicit.
- [ ] Mutation retries and pending controls do not generate unintended duplicate operations; reconnection does not silently replay submissions.
- [ ] Persistence is checked after real reload where relevant; simulated callback success is never recorded as server persistence.
- [ ] Build/scoped checks appropriate to an authorized change; known unrelated lint/build warnings distinguished from regressions.
- [ ] Previous local changes preserved; no unrequested backend edits, migrations, commits, deployments or collection of private user data.

### H5. User evaluation and reporting

Recruit participants from the actual landlord/tenant audience with relevant access needs and experience variation. Supply safe scenarios and consent; do not require participants to make irreversible housing/financial changes. Accommodate communication differences and their usual assistive tools. [R11 PDF pp.123–125, 180–181; R13 PDF pp.132–139.]

Record task success, misunderstanding, wrong-record actions, recovery, requests for help, navigation choices, and important hesitation. Time is useful when measured consistently, but faster completion is not success if the user misunderstands verification or consequences. Separate visual-preference feedback from task observations. Small qualitative rounds can guide iteration; small comparative performance claims need a suitable study rather than a universal participant count. [R03 PDF pp.122–125, 148–151; R05 PDF pp.161–163.]

Each finding should contain: role/task; exact screen/state; evidence; impact; source principle; proposed frontend change; protected boundaries; expected benefit; tradeoff; severity/uncertainty; and evaluation/acceptance criteria. Preserve positive findings as well. [R10 PDF pp.56–57, 308–310.]

## I. Open questions and limitations

### What is still unknown about DormFix?

1. Actual task frequency, session length, record volume, device/browser mix, language and accessibility needs. Current role models are code-derived, not field research.
2. Whether landlords benefit from denser comparison views or tenants need different wording/order. These are hypotheses to observe, not aesthetic facts.
3. Authenticated end-to-end behavior with real test accounts, role-to-role notifications, realtime membership/presence, server persistence and software keyboards. Recorded fixtures do not establish these outcomes.
4. Complete keyboard/screen-reader experience, 200% text enlargement, reduced-motion/device testing, and unresolved busy-dialog recovery. No WCAG conformance certification is claimed.
5. Source/date/author and contents of R18, and the identity/full original article behind R17. The old source paths and temporary screenshots may not exist in the next environment.
6. Product policy for financially consequential decisions, rejection/removal explanations, and emergencies. A frontend cannot invent those policies or capabilities; clarify only when the next scope requires them.

### Coverage limits and systematic continuation

This pass examined source structures and selected relevant passages from every accessible book, reviewed the available article bodies/excerpt, and mapped the evidence to the known project. It **did not review all 4,569 PDF pages**, all figures, every chapter conclusion, every external source cited by the books, or the entire current frontend/backend. It did not measure user improvement, rerun the application’s test suite, sign in, submit records, or inspect every active screen in a fresh browser session.

If the next task requires greater depth, extend the reading deliberately:

| Stage | Next reading | Why / evidence to add |
|---|---|---|
| 1 — Workflow research | R07 research/persona/scenario chapters; R04 research and organization-system chapters; R12 chapters 8–10; R13 chapter 11 | Better research/recruitment/session protocols and role-specific vocabulary, without inventing personas |
| 2 — Specific interface patterns | R02 relevant navigation/mobile/table patterns; R05 full rules and loops/modes; R03 mobile/accessibility chapters | Resolve a reproduced task/state problem with its full pattern qualifications |
| 3 — Accessibility mechanics | Remaining R14 modal/mobile/contrast material; R11 semantic/assistive-tech sections; current W3C guidance for the actual widget | Review historical code critically and confirm contemporary behavior/access requirements |
| 4 — Visual/typographic detail | R01 unreviewed illustration sets; R08 applicable numeral/script/type examples; R09 responsive adaptation of selected grid exercises | Support an identified visual issue, rather than import stylistic systems indiscriminately |
| 5 — Evaluation evidence | R10 empirical comparison/formal/pluralistic inspection chapters and relevant study conclusions | Refine the evaluation method; keep old platforms, samples and costs distinct from DormFix evidence |

For each extension record exact pages/sections, whether examples were visually inspected, the claim being investigated, qualifications, and any changed recommendation. Re-extracting an entire book does not increase intellectual coverage by itself. When a current technical claim matters, use authoritative primary documentation and label it supplemental.

### Interpreting prior implementation records

The baseline audit’s old component, theme, and lint findings must not be repeated as current defects. Follow-up notes override earlier login-photo placement and System-option descriptions. Earlier fixture coverage—including the 156 Light/Dark layout observations—supports only those recorded layouts/states with simulated records/callbacks. Previous successful builds and tests are historical, not newly executed checks for this analysis. This document protects their scope rather than upgrading them into production-readiness claims.

Only this handoff document was created in the project for the present request. Source review intermediates stayed outside the application. A before/after SHA-256 comparison of 109 existing files under `client/src`, `client/public`, and `server/src` found no content changes. No application edits, authenticated actions, commits or deployments were performed for this request.

## J. New-chat handoff prompt

Copy the following opening message and provide the Markdown file in the new chat. If that chat cannot access local paths, attach or paste the document; attach the exact PDFs only when deeper reading is required.

> We are continuing DormFix, a dormitory-management application for landlords and tenants. Read `docs/dormfix-resource-synthesis-handoff.md` first, then the current `docs/dormfix-design-system.md` and `docs/dormfix-appearance-plan.md`. Treat the original UI/UX audit as a historical baseline; six groups and the appearance refactor are recorded as implemented. The synthesis distinguishes reviewed source arguments, interpretations, code findings, recorded checks and untested proposals. Its book coverage is selected close reading, not cover-to-cover review.
>
> Preserve all business logic, authentication/authorization, API and data contracts, validation, persistence and realtime protocols. Retain the green identity, Light/Dark-only shared chooser with Light default, consistent desktop photo-left/form-right authentication layouts, mobile form priority, existing routes and working actions. Do not imply a rent ledger, receipt approval, repair dispatch, message persistence/delivery, rule acknowledgment or undo unless supported by the existing backend.
>
> My next requested scope is: **[state the exact screen, issue, analysis or implementation task]**. Inspect its current behavior before identifying defects. Use the cited sources in their relevant domains, distinguish historical fixes from current findings, and preserve sound decisions. For design changes, present concrete reasoning, tradeoffs and evaluation criteria; implement only what this next request authorizes. Keep backend-dependent proposals separate. Report checks honestly and do not claim fixture success proves authenticated persistence, user improvement or WCAG conformance.

---

**Handoff quality review:** all fourteen supplied PDFs and the three discovered article files are inventoried; the named unavailable supporting reference is explicit. Substantive book claims have viewer-page/section locators; printed locators are included only where checked. The recommendation register provides applications, expected benefits, tradeoffs, boundaries and evaluation methods. Current technical references are separately labeled. Coverage limits, unresolved questions, superseded decisions and protected workflows are retained.
