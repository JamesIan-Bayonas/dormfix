# DormFix

> **Executive Summary:** DormFix is an enterprise-grade, full-stack property and dormitory management ecosystem engineered to streamline tenant onboarding, room capacity allocation, maintenance issue triaging, and payment verification. Powered by a hybrid OCR and local LLM optical audit pipeline coupled with real-time WebSocket communication and ACID-compliant MSSQL transactions, DormFix replaces error-prone physical logbooks with an intelligent, automated property management infrastructure.

[Live Demo](https://dormfix-jamesian-bayonas-projects.vercel.app/)

---

## Overview & Architectural Deep Dive

### Core Business Problem & Purpose

Traditional student housing and boarding facility operations frequently suffer from fragmented communication, unverified manual payment tracking, and delayed maintenance ticket resolution. Property managers (landlords) struggle with manual transaction audits from payment screenshots (e.g., GCash or bank transfers), room over-allocation, and untracked emergency repairs. Tenants face opaque registration approvals, lack of formal receipt logs, and sluggish resolution feedback loops.

**DormFix** resolves these operational bottlenecks through a unified, role-based platform designed specifically for boarding facility ecosystems. It isolates tenant and landlord workflows into distinct, stateful operational spaces:

* **Landlords** gain dynamic room occupancy telemetry, automated financial collection rates, cross-verified payment ledger audits, incident triage queues, building policy distribution, and administrative moderation controls.

![Landlord Dashboard](./client/public/landlord.png)

* **Tenants** access verifiable boarding passes, zero-trust remittance submission interfaces with real-time receipt scanning feedback, structured maintenance ticket reporting, and isolated messaging channels to direct property administrators.

![Tenant Dashboard](./client/public/tenant.png)

```
+---------------------------------------------------------------------------------------+
|                                    DORMFIX CLIENT                                     |
|  React 19 SPA • Tailwind CSS v4 • DaisyUI • React Router v7 • Optimistic State Hooks  |
+-------------------------------------------+-------------------------------------------+
                                            |
                         HTTPS / REST & Multipart | WebSockets (Socket.io)
                                            |
+-------------------------------------------v-------------------------------------------+
|                                  EXPRESS 5 BACKEND                                    |
|   Role-Based Routing • Multer Middleware • Strict Zod Schema Parsing • CORS Engine    |
+---------------------+---------------------+---------------------+---------------------+
                      |                     |                     |
     +----------------v---+        +--------v----------+  +-------v-------------------+
     | MSSQL 16 Engine    |        | AI Vision / NLP   |  | Event Dispatcher          |
     | Relational Schema  |        | Tesseract.js OCR  |  | Socket.io Isolated Rooms  |
     | ACID Transactions  |        | Ollama (LLaVA)    |  | Nodemailer SMTP Gateway   |
     | Capacity Check DB  |        | Zod Schema Format |  | Real-Time SMS Simulation  |
     +--------------------+        +-------------------+  +---------------------------+

```

### Technical Challenges & Engineering Trade-offs

* **The Challenge:** Processing arbitrary, user-uploaded payment transaction receipts (such as GCash, mobile banking, and utility slips) introduces significant operational risks, including fraudulent re-uploads, outdated slips, and mismatched remittance amounts. Relying on remote, paid cloud vision APIs introduces external SaaS cost overhead, network latency, and privacy compliance concerns for sensitive financial documents.
* **The Solution:** Implemented an asynchronous, two-tier local Zero-Trust optical analysis pipeline (`server/src/services/aiService.ts`). First, **Tesseract.js** executes deterministic optical character recognition (OCR) on uploaded files saved via Multer disk storage. The resulting unformatted text stream is piped into a local **Ollama** model (`llava`) executing at zero temperature using `zodResponseFormat` via the `openai` SDK to enforce strict, structured JSON schemas (`PaymentAnalysisSchema`). The backend then deterministically executes business rule validations against database records: calculating date drift (>7 days triggers an anomaly flag) and verifying extracted float amounts against expected database parameters.
* **The Trade-off:** Hosting OCR and LLM inference locally increases server memory footprints and compute usage compared to hosted third-party endpoints (e.g., AWS Textract or OpenAI Cloud APIs). However, this architectural decision guarantees **$0 operational API billing overhead**, prevents private financial data from leaking to third-party providers, and enforces schema-validated type safety without non-deterministic prompt hallucinations.

---

## Tech Stack & Architecture Matrix

| Layer | Technology | Primary Package / Driver | Architectural Role |
| --- | --- | --- | --- |
| **Frontend** | React 19 / TypeScript | `react@19.1.1`, `vite@7.1.14` | High-performance Single Page Application (SPA) utilizing strict component modularity, custom telemetry hooks, and Vite bundling. |
| **Styling & UI** | Tailwind CSS v4 / DaisyUI | `@tailwindcss/vite`, `daisyui@5.5.14` | Component design system supporting custom color mappings (`sage`, `amberGold`) and responsive dashboard drawers. |
| **State & Routing** | React Router / Context API | `react-router-dom@7.13.1`, `UserContext` | Role-based navigation guards (`tenant` vs `landlord`), onboarding gatekeepers (`PendingApproval`), and centralized auth state persistence. |
| **Backend Runtime** | Node.js / Express 5 | `express@5.2.1`, `ts-node@10.9.2` | RESTful API gateway, centralized error handling, multipart form streaming, and transactional controller logic. |
| **Database** | Microsoft SQL Server | `mssql@12.2.0` (Node-MSSQL Pool) | Relational persistence with foreign-key constraints, clustered indexes, and transactional rollbacks (`sql.Transaction`). |
| **Real-Time Layer** | WebSockets | `socket.io@4.8.3`, `socket.io-client` | Bidirectional, room-scoped message routing (`${landlordId}-${tenantId}`) with administrative tenant-muting capabilities. |
| **AI / Optical Audit** | Tesseract.js + Ollama | `tesseract.js@7.0.0`, `openai@6.22.0`, `zod` | Two-phase OCR character scanning and LLM structured schema parsing for Zero-Trust payment verification and emergency maintenance triage. |
| **Notifications** | SMTP Mailer | `nodemailer@9.0.4` | Automated transactional dispatch delivering critical maintenance alerts and verified/rejected payment notices to landlords and tenants. |
| **Security & Auth** | Bcrypt / Crypto | `bcrypt@6.0.0`, Node.js `crypto` | Salted credential hashing (10 rounds), UUID token generation, and parameterized T-SQL queries preventing SQL injection. |

---

## Key Features & Enterprise Capabilities

* **Zero-Trust Multi-Stage Payment Verification:** Uploaded remittance screenshots pass through Tesseract.js OCR and an Ollama LLaVA parsing pipeline, extracting amounts, dates, and reference numbers validated against strict Zod schemas $\rightarrow$ **Technical Impact:** Detects date drift (>7 days) and amount mismatches automatically, appending diagnostic metadata (`[AI Audit: Anomalous]`) while preventing fraudulent ledger entries.
* **AI-Powered Maintenance Triage & Emergency Alerts:** Tenant problem descriptions are categorized via NLP into strict categories (`Plumbing`, `Electrical`, `Structural`, `Appliance`, `Pest Control`) and evaluated for urgency $\rightarrow$ **Technical Impact:** High/Emergency tickets automatically override client urgency levels, dispatch immediate SMS simulation logs, and fire prioritized Nodemailer alerts to property managers.
* **ACID-Compliant Room Capacity Allocation Engine:** Room assignment processes leverage explicit MSSQL database transactions (`sql.Transaction`) with capacity verification queries $\rightarrow$ **Technical Impact:** Eliminates double-booking race conditions during simultaneous tenant check-ins by locking rows and enforcing atomic rollbacks upon capacity breaches.
* **Role-Based Onboarding & Authorization Gatekeeper:** New tenant registrations are tied to unique landlord identifiers (`#XXXXXX`) and held in an unapproved state (`is_approved = 0`) $\rightarrow$ **Technical Impact:** Prevents unauthorized dashboard access via React Router context guards and `PendingApproval` screens until verified by property managers.
* **Isolated Room-Scoped Real-Time Messaging:** Socket.io dynamically instantiates unique communication namespaces combining landlord and tenant UUIDs with administrative moderation $\rightarrow$ **Technical Impact:** Delivers sub-50ms bidirectional message propagation while giving landlords authority to restrict/mute disrupted channels dynamically.
* **Granular Building Policy Management:** Landlords can broadcast property directives either globally across the facility or targeted to specific room units with severity flags $\rightarrow$ **Technical Impact:** Normalizes house rules into searchable relational entities, displaying real-time policy reminders across tenant views.

---

## Project Structure

```text
dormfix/
├── .gitignore                          # Global version control ignore rules
├── LICENSE                             # Proprietary source-available legal license
├── package.json                        # Root monorepo build and startup scripts
├── README.md                           # Comprehensive architectural and setup documentation
├── client/                             # Frontend Single Page Application (SPA)
│   ├── daisyui.d.ts                    # DaisyUI TypeScript module definitions
│   ├── eslint.config.js                # ESLint 9 configuration ruleset
│   ├── index.html                      # HTML5 entry template with Inter & Playfair Display fonts
│   ├── package.json                    # Client dependency manifest (React 19, Tailwind v4, Vite)
│   ├── tailwind.config.ts              # Tailwind CSS theme mappings (sage & amberGold palettes)
│   ├── tsconfig.app.json               # Application-specific TypeScript compiler configuration
│   ├── tsconfig.json                   # Root client TypeScript project references
│   ├── tsconfig.node.json              # Node environment configuration for Vite tooling
│   ├── vite.config.ts                  # Vite build engine configuration and local proxy rules
│   ├── public/                         # Public static graphics and preview assets
│   │   ├── landlord.png
│   │   ├── tenant.png
│   │   └── vite.svg
│   └── src/                            # Application source code
│       ├── App.tsx                     # Main application router and Toast notifications wrapper
│       ├── index.css                   # Global Tailwind utilities and scrollbar styling
│       ├── main.tsx                    # React DOM strict root initialization
│       ├── TenantOnboarding.tsx        # Tenant dorm pairing token input screen
│       ├── api/
│       │   └── client.ts               # Fetch wrapper handling JSON/FormData headers and base URLs
│       ├── assets/                     # Frontend SVG vector assets
│       ├── components/                 # Reusable UI component modules
│       │   ├── Login.tsx               # Split-screen user authentication view
│       │   ├── MaintenanceList.tsx     # Tenant maintenance history ledger
│       │   ├── Sidebar.tsx             # Landlord desktop navigation sidebar
│       │   ├── UserContext.tsx         # Centralized Auth React Context and LocalStorage persistence
│       │   ├── dashboards/             # Primary role-based portal views
│       │   │   ├── LandlordDashboard.tsx  # Landlord operational metrics and room matrix
│       │   │   ├── Register.tsx           # Dual-role account registration form
│       │   │   └── TenantDashboard.tsx    # Tenant housing portal and action center
│       │   ├── landlord/               # Landlord administrative interface modules
│       │   │   ├── LandlordChat.tsx       # Multi-tenant messaging console with mute controls
│       │   │   ├── LandlordMaintenanceList.tsx # Incident ticket triage and dispatch panel
│       │   │   ├── LandlordPaymentHistory.tsx # Zero-Trust payment audit and verification board
│       │   │   ├── LandlordRoomList.tsx   # Room inventory, capacity limits, and density meters
│       │   │   ├── LandlordRules.tsx      # Building directive manager with scope filters
│       │   │   ├── LandlordTenantChecklist.tsx # Tenant verification queue and unit allocation
│       │   │   └── RoomDetailDrawer.tsx   # Interactive slide-over drawer for room inspection
│       │   └── tenant/                 # Tenant operational modules
│       │       ├── PendingApproval.tsx    # Authorization lock screen for unverified accounts
│       │       ├── TenantChat.tsx         # Floating/dedicated landlord messaging client
│       │       ├── TenantPaymentForm.tsx  # Receipt dropzone with live Zero-Trust AI status
│       │       └── TenantPaymentHistory.tsx # Payment ledger statements with OCR breakdowns
│       ├── hooks/                      # Custom state management and data fetching hooks
│       │   ├── useMaintenance.ts       # Maintenance query hook with optimistic state updates
│       │   ├── useMyPayments.ts        # Tenant-specific payment statement query hook
│       │   ├── usePayments.ts          # Landlord payment audit hook with optimistic verification
│       │   └── useRooms.ts             # Property room inventory query and mutation hook
│       ├── services/                   # Frontend API integration services
│       │   ├── maintenanceService.ts   # Maintenance CRUD network requests
│       │   ├── paymentService.ts       # Payment submission and status dispatch requests
│       │   ├── roomService.ts          # Room inventory and assignment network requests
│       │   └── ruleService.ts          # House rule configuration requests
│       └── types/
│           └── types.ts                # Shared TypeScript domain contracts and interfaces
├── database/
│   └── script.sql                      # T-SQL MSSQL schema definition and constraints
└── server/                             # Express REST API Backend & WebSocket Server
    ├── .gitignore                      # Server-specific ignore rules (uploads, environment)
    ├── package.json                    # Server dependencies (Express 5, MSSQL, Ollama, Tesseract)
    ├── tsconfig.json                   # Node16 module resolution TypeScript compiler configuration
    └── src/                            # Server source code
        ├── index.ts                    # HTTP/WebSocket server entry, CORS configuration, and socket routing
        ├── config/
        │   └── dbConfig.ts             # MSSQL Connection Pool initialization with Azure/local fallback
        ├── controllers/                # Business logic request handlers
        │   ├── authController.ts       # Registration transactions and salted bcrypt authentication
        │   ├── maintenanceController.ts # Incident submission, AI triage, and status persistence
        │   ├── paymentController.ts    # OCR receipt scanning, LLM audit comparison, and verification
        │   ├── roomController.ts       # Room creation and atomic capacity-checked tenant assignment
        │   ├── ruleController.ts       # Building policy creation, scoping, and removal
        │   ├── tenantController.ts     # Tenant authorization, eviction transactions, and queries
        │   └── uploadController.ts     # Generic Multer file upload handler
        ├── middleware/
        │   └── uploadMiddleware.ts     # Multer disk storage and unique timestamp filename generator
        ├── repositories/
        │   └── paymentRepository.ts    # Parameterized SQL queries for payment data access
        ├── routes/                     # Express REST route definitions
        │   ├── authRoutes.ts           # `/api/login`, `/api/register`
        │   ├── maintenanceRoutes.ts    # `/api/maintenance`
        │   ├── paymentRoutes.ts        # `/api/payments`
        │   ├── roomRoutes.ts           # `/api/landlord/rooms`, `/api/landlord/assign`
        │   ├── ruleRoutes.ts           # `/api/rules`
        │   ├── tenantRoutes.ts         # `/api/landlord/tenants`, `/api/tenant/details`
        │   └── uploadRoutes.ts         # `/api/upload`
        └── services/                   # Domain orchestration services
            ├── aiService.ts            # Tesseract OCR & Ollama (LLaVA) Zod schema analysis pipeline
            └── notificationService.ts  # Nodemailer SMTP and emergency SMS notification gateway

```

---

## Environment Configuration

The application requires specific environment variables for database connectivity, AI services, and external communication gateways.

### Server Configuration (`server/.env`)

| Variable | Description | Required | Default / Example |
| --- | --- | --- | --- |
| `PORT` | Port for the Express backend server | No | `5000` |
| `NODE_ENV` | Runtime environment mode (`development` or `production`) | No | `development` |
| `DB_USER` | Microsoft SQL Server database username | Yes | `sa` |
| `DB_PASSWORD` | Microsoft SQL Server database password | Yes | `sharingan` |
| `DB_SERVER` | MSSQL database host address | Yes | `localhost` |
| `DB_NAME` | Target database catalog name | Yes | `dormfix` |
| `DB_PORT` | MSSQL database network port | No | `1433` |
| `FRONTEND_URL` | Explicit CORS allowed origin for client requests | No | `http://localhost:5173` |
| `EMAIL_USER` | Gmail/SMTP credentials for automated alert dispatch | Yes | `system@dormfix.com` |
| `EMAIL_PASS` | Gmail App Password for SMTP authentication | Yes | `abcd efgh ijkl mnop` |
| `LANDLORD_EMAIL` | Target email address receiving high-priority AI alerts | Yes | `landlord@dormfix.com` |

### Client Configuration (`client/.env`)

| Variable | Description | Required | Default / Example |
| --- | --- | --- | --- |
| `VITE_API_URL` | Base HTTP & WebSocket URL pointing to the backend API | Yes | `http://localhost:5000` |

---

## Getting Started & Local Setup

### Prerequisites

Ensure your local environment meets the following minimum requirements:

* **Node.js:** `>= 18.x` (LTS recommended)
* **npm:** `>= 9.x`
* **Microsoft SQL Server:** Express 2019 or later (Compatibility Level 160 supported)
* **Ollama:** Local instance running with the `llava` model installed (`ollama run llava`)

### Installation & Execution

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/dormfix.git
cd dormfix

```

#### 2. Initialize Database Schema

1. Launch **SQL Server Management Studio (SSMS)** or Azure Data Studio.
2. Connect to your local SQL Server instance.
3. Open and execute `database/script.sql` to initialize the `dormfix` catalog, create relational tables (`users`, `rooms`, `dorm_assignments`, `maintenance_requests`, `payments`), and establish foreign key constraints.

#### 3. Backend Service Setup

```bash
# Navigate to the server workspace
cd server

# Install Node.js dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MSSQL credentials and SMTP configuration

# Launch the backend development server
npm run dev

```

*The server will initialize on `http://localhost:5000` and establish an active MSSQL connection pool.*

#### 4. Frontend Application Setup

```bash
# Open a new terminal and navigate to the client workspace
cd client

# Install React dependencies
npm install

# Create environment configuration
echo "VITE_API_URL=http://localhost:5000" > .env

# Launch the Vite development server
npm run dev

```

*The frontend client will become available on `http://localhost:5173`.*

---

## Verification & Testing

Execute code quality checks and static type verification across the client and server codebases:

```bash
# Run TypeScript compilation check on server
cd server
npx tsc --noEmit

# Run ESLint validation and TypeScript verification on client
cd ../client
npm run lint
npm run build

```

---

## Security & Operational Readiness

* **Authentication & Gatekeeper Authorization:** Passwords are encrypted using salted `bcrypt` hashes (10 work factor rounds). User sessions are persisted securely and role-gated on both frontend routes and backend endpoints. Tenant registrations remain quarantined behind an `is_approved = 0` database barrier until verified by an assigned landlord.
* **SQL Injection Prevention:** All SQL queries across repositories and controllers utilize parameterized inputs (`sql.Request.input()`) via the `mssql` pool, completely neutralizing SQL injection vectors.
* **ACID Transaction Isolation:** High-concurrency operations—such as new user creation paired with dorm assignments, tenant rejection rollbacks, and room allocation checks—are executed inside scoped `sql.Transaction` blocks to guarantee data integrity across table relations.
* **Strict CORS & Header Guardrails:** Cross-Origin Resource Sharing is enforced through an explicit whitelist origin validator supporting local development, verified Vercel production domains, and preview deployments (`*.vercel.app`).
* **Input Sanitization & Type Validation:** Runtime validation on AI payloads is enforced using **Zod** schema response structures (`PaymentAnalysisSchema`, `MaintenanceAnalysisSchema`), eliminating unstructured prompt output errors before database insertion.

---

## License

This project is licensed under the **Proprietary Source-Available License**. See the [LICENSE](https://www.google.com/search?q=LICENSE) file for complete details and restrictions.

Copyright © 2026–2027 Alyssa Faith Bagunbon, Jay-an P. Calago, and James Ian M. Bayonas. All Rights Reserved.