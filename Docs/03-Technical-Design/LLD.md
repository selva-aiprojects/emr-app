# Low-Level Design (LLD) Document

Last updated: **2026-04-15**

This document provides definitive low-level mapping and design specifications for the Medflow EMR codebase. It covers backend topology (services, middlewares, routes, utilities, scripts), architectural patterns (Prisma, FHIR integration, healthcare compliance, AI Engine), and the frontend component hierarchy.

---

## 1. Backend Architecture & Directory Mapping

The Express.js backend enforces a strong separation of concerns across initialization, routing, pipeline control, business logic, and database access.

### 1.1 `server/services/` (Business Logic & External Integrations)
This directory acts as the core controller layer for complex orchestration, side-effects, and third-party interactions:
- `auth.service.js`: Processes login, token issuance, and password hashing.
- `ai.service.js`: Interfaces with the **Google Gemini-1.5-Flash** AI Engine to analyze clinical summaries, formulate diagnostic suggestions, and normalize patient intake transcripts.
- `mail.service.js`: Handles communication protocols (Resend API & standard Nodemailer SMTP fallbacks) for dispatching onboarding notifications and security credentials.
- `provisioning.service.js`: Contains `provisionNewTenant` for creating new hospitals. It orchestrates control-plane mapping, clinical schema cloning, administrator seeding, and background metric sync integrations.
- `featureFlag.service.js`: Governs tier-based application functionality and global kill switches.
- `fhir.service.js`: Governs the transformation and validation of internal JSON structures to the HL7 FHIR standard (Patient, Observation, Encounter bundles). 
- `superadminMetrics.service.js`: Aggregates cross-shard metrics for the top-level analytical dashboard and enforces background telemetry.

### 1.2 `server/middleware/` (Pipeline Governance)
All incoming API requests are sanitized and verified through these strict interceptors:
- `auth.middleware.js`: Validates the JWT (RS256) identity claim signatures, extracts the core `user` and contextual `tenantId`, and enforces role-based endpoint gating (e.g., locking access to strictly `Superadmin` or `Doctor`).
- `featureFlag.middleware.js`: Integrates with feature flag cache to dynamically reject requests (403 Forbidden) if the tenant operates on a subscription tier that lacks module eligibility.
- `validation.middleware.js`: Ensures incoming payloads adhere to expected properties and standardizes error formatting.
- `error.middleware.js`: Catch-all unhandled exceptions, suppresses stack traces on production, and standardizes error-code JSON formatting.

### 1.3 `server/routes/` (Network Access Control)
Express routers mapping URL pathways directly to Data Repositories or Services:
- `auth.routes.js`: Login and session management.
- `superadmin.routes.js`: High-privilege orchestration (creating tenants, forced metrics sync).
- `tenant.routes.js`: Subscription catalogs, configuration polling, and feature availability mapping.
- `clinical.routes.js` & `laboratory.routes.js`: Endpoints exclusively scoped to `tenantId` resolving standard EMR operations (fetching encounters, recording lab results).

### 1.4 `server/db/` (Data Repositories & Database Operations)
Direct interactions mapping abstract controller definitions into the persistent store:
- **Service Modules**: Composed of logically decoupled query handlers (`appointment.service.js`, `billing.service.js`, `hr.service.js`, `tenant.service.js`, `opd.service.js`, etc.).
- **Audit Mechanics**: All clinical and financial state mutations dynamically trigger a function to embed a parallel audit receipt in the database.

### 1.5 `server/scripts/` & `server/utils/`
- **Scripts**: Standalone provisioning tools executed manually or in CI/CD (e.g., `mega_seeder.js` for executing an end-to-end institutional onboarding simulation, testing tools).
- **Utils**: Helper functions abstracting mundane technicalities (e.g., logging utilities, timestamp formatters, common algorithmic functions).

---

## 2. Database Perspective & Data Governance

### 2.1 Prisma ORM & Database Access
The platform depends entirely on PostgreSQL. Access is structured primarily around modern typed-object relational mapping frameworks for long-term scalability:
- **Data Model Definition**: Complex relations (e.g., linking `Patient` -> `Encounter` -> `Clinical Record`) are defined within Prisma schema, giving developers guaranteed type-safety.
- **Tenant Scope Enforcement**: The repository structure intercepts incoming read/write demands and universally appends `WHERE tenant_id = $1` filters dynamically, preventing cross-tenant data spillage.
- **Pooling**: Implements PgBouncer or connection pooling logic natively, assuring resilience against hundreds of concurrent clinical practitioners firing telemetry.

### 2.2 Healthcare Standards & Security Protocols (FHIR)
Interoperability and medical compliance form critical pillars:
- **FHIR Layer**: Contains normalization transformers (`client/src/services/identity.service.js`, `server/services/fhir.service.js`) mapping database structures strictly into standard HL7 formatted objects (e.g. mapping internal mrn to standard identifiers, mapping biological sexes).
- **Compliance Rules**: Hardened JWT identity payloads paired with the aggressive audit-logging layer ensures all historical data mutations possess trackable attribution (timestamp, ip, modified fields), natively adhering to basic HIPAA tracking provisions.

---

## 3. Generative AI Engine (Google Gemini)

We deeply integrate AI exclusively for analytical augmentation rather than diagnosis substitution:
- utilizes the **Google Gemini-1.5-Flash** API seamlessly interfaced in `ai.service.js`.
- **Primary Scopes of Operations**:
  - Longitudinal summarization of lengthy chronological clinical records to formulate 3-line diagnostic histories.
  - Analyzing complex lab parameters (e.g., elevated RBC & MCV) and presenting formatted text suggestions (e.g., formatted treatment alerts).
  - Unstructured clinical note structuring.

---

## 4. Frontend Component Hierarchy (React SPA)

The interface is constructed in React 18 using a highly responsive, custom-built "Vanilla CSS" schema (without the bloat of external utility frameworks):

### 4.1 Global Skeleton
- `App.jsx`: The absolute source of truth. Possesses the fundamental React State hooks (`views`, `activePatientId`, `user`).
- `AppLayout.jsx`: Houses the universal dashboard chrome framework (Top Header Navigation, Context-Aware Sidebar menus).

### 4.2 Route Interfaces (Pages)
Dynamic conditional components instantiated directly upon State change:
- `DashboardPage.jsx`: The primary landing zone rendering realtime metrics via Apache ECharts.
- `PatientsPage.jsx` & `PatientProfilePage.jsx`: The core EMR workflow nodes enabling deep-dive patient telemetry display.
- `LaboratoryPage.jsx` / `InpatientPage.jsx`: Aggregated workspace consoles dedicated physically to department roles.
- `EnhancedSuperadminPage.jsx`: The "System Zero" control room where root-tier supervisors visualize all hospital shards and manually force synchronized events.

### 4.3 Utilities & Services Layer
- `client/src/api.js`: The monolithic HTTP requester automatically absorbing JWTs from localstorage and appending the `X-Tenant-Id` headers implicitly based on context.
- `client/src/services/`: Specific logic extractors (like `featureFlag.service.js` which polls the backend and caches current tier limits to seamlessly hide UI capabilities).
- `client/src/components/superadmin/`: Includes the granular views (Global Dashboard, Tenant Management, Communication Center) necessary for grid management.
