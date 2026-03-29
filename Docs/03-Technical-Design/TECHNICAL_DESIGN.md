# Technical Design (Current State)

Last updated: 2026-02-19

This document is the canonical technical design reference for the EMR application. It reflects the current implementation in `client/src` and `server/`.

## 1. Architecture Summary
```mermaid
graph TD
    subgraph "Platform Layer (Superadmin)"
        SA[Superadmin Dashboard] -->|Manage| TM[Tenant Management]
        TM -->|Provision| UP[User Provisioning]
        SA -->|Configure| OM[Offer Management]
    }

    subgraph "Tenant Layer (Hospital Admin)"
        TA[Admin Master Hub] -->|Config| DS[Departments & Beds]
        TA -->|Ops| HS[Hospital Settings]
        TA -->|Financial| CG[Cost Governance]
    }

    subgraph "Clinical Workspace (Staff)"
        CW[Doctor/Nurse Desk] -->|EMR| PT[Patients & Clinical]
        CW -->|Workflow| AP[Appointments & Inpatient]
    }

    SA -.->|Subscription Tier| TA
    TM -.->|Auth Node| CW
    PT -->|Revenue Shard| CG
```

- **Application Model**: Multi-tenant SaaS SPA + RESTful API.
- **Frontend**: React (Vite) with a centralized state machine in `App.jsx`. Uses a proprietary **Critical Care Design System** (Vanilla CSS) for ultra-low latency and cognitive clarity.
- **Backend**: Express.js with a modular middleware-driven pipeline (Auth -> Tenant -> Permission -> Feature Gate).
- **Data Layer**: PostgreSQL with a single-schema, tenant-isolated architecture.
- **Intelligence**: Integrated **Google Gemini-1.5-Flash** for context-aware clinical decision support.
- **Observability**: Real-time KPI aggregation via `getRealtimeTick` and Apache ECharts.

## 2. Tech Stack & Integration Matrix

| Layer | Component | Technology | Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend** | Framework | ReactJS (React 18, Vite) | High-speed HMR and component reactivity. |
| | Architecture | SPA Pattern | Single Page Application design for seamless UX without page reloads. |
| | State Mgmt | Centralized Hooks | Simplified data flow for complex clinical states. |
| | Design System | Vanilla CSS | Zero-runtime CSS overhead with custom design tokens. |
| | Icons | Lucide-React | Premium, consistent iconography. |
| | Visualizations | Apache ECharts | Enterprise-grade performance for high-density datasets. |
| **Backend** | Runtime | Node.js (Express) | Asynchronous I/O for high-concurrency patient loads. |
| | Architecture | REST API | RESTful architectural pattern for predictable client-server interaction. |
| | Routing | Express Middleware | Pipeline pattern for modular Auth, Tenant, and Feature gating checks. |
| | Identity | JWT (RS256) | Stateless authentication with tenant-scoped claims. |
| | AI Engine | Google Gemini | State-of-the-art LLM for clinical summarization. |
| **Database** | Core Engine | PostgreSQL | Relational database schema with strict ACID compliance for financial records. |
| | Connection | Pool-driven PG | Optimized resource utilization for multi-tenant queries. |
| **Infra** | Deployment | Docker / ESG | Containerized scalability across regions. |

## 3. Source of Truth by Layer

### Frontend
- App orchestration/state: `client/src/App.jsx`
- API adapter and auth storage: `client/src/api.js`
- Shell/navigation: `client/src/components/AppLayout.jsx`
- Module metadata and fallback view permissions: `client/src/config/modules.js`

### Backend
- Route composition: `server/index.js`
- Auth, role checks, tenant scope, permission checks: `server/middleware/auth.middleware.js`
- Feature/module access checks: `server/middleware/featureFlag.middleware.js`
- Data access and audit utilities: `server/db/repository.js`

### Legacy/transition files (not primary)
- `server/index_old.js`, `server/index_v2.js`
- `client/src/api_old.js`, `client/src/api_v2.js`

## 3. Runtime Request Model
1. Client sends request with JWT in `Authorization: Bearer <token>`.
2. `authenticate` resolves and validates user context.
3. `requireTenant` resolves tenant context (`x-tenant-id`, query/body, or route params).
4. `requirePermission` and/or `moduleGate` enforce access policy.
5. Route handler calls repository functions.
6. Repository uses parameterized SQL and returns transformed DTOs.
7. API serializes JSON response.

## 4. Security & Authentication Model
- **Auth Engine**: Stateless JSON Web Token (JWT) authentication using RS256/HS256 signatures. Sessions are persistent on the client securely via storage APIs.
- **Identity Claims**: JWT payloads securely encode `userId`, `tenantId`, `role`, and optional `patientId` for low-latency boundary verification.
- **Tenant Isolation Pipeline**: 
  - Strictly enforced in HTTP middleware via the `requireTenant` interceptor.
  - The frontend `api.js` adapter automatically injects the `x-tenant-id` header into all network requests directly from the authenticated user's session context.
  - Repository-level query patterns unconditionally scope all queries using parameterization (`WHERE tenant_id = $1`).
- **Role-Based Access Control (RBAC)**:
  - **Backend Authority**: Strict validation against the `PERMISSIONS` matrix in `server/middleware/auth.middleware.js`.
  - **Frontend UX Gates**: Progressive visibility enforced by `fallbackPermissions` in `client/src/config/modules.js`.
- **Superadmin Zero-Trust Policy**: `SYS` level access is inherently isolated. Tenant-context operations are completely blocked by default for superadmins; explicit break-glass headers are dynamically required when managing tenant instances.
- **Cryptographic Auditing**: All system state mutations create immutable ledger records in `emr.audit_logs`.

## 5. State and Data Loading
- Login flow:
  - `api.login(...)` stores session in local storage.
  - `App.jsx` sets view and triggers data hydration.
- Tenant hydration:
  - `GET /api/bootstrap`
  - `GET /api/users`
  - `GET /api/reports/summary` only for roles with report permission
- Top-level state in `App.jsx` stores patients, appointments, walk-ins, encounters, billing, inventory, employees, insurance, and reports.

## 6. Core Domain Modules
- Platform: superadmin, tenant/user management, feature flags, subscription controls.
- Clinical: patients, appointments, encounters, clinical records, prescriptions, inpatient.
- Financial: invoices/payments, expenses, financial summaries, doctor payouts.
- Operations: inventory, employees, attendance/leaves, insurance claims/providers.
- Analytics: summary reports and payout reporting.

## 7. Data Model (Primary Tables)
- `emr.tenants`
- `emr.users`
- `emr.patients`
- `emr.clinical_records`
- `emr.walkins`
- `emr.appointments`
- `emr.encounters`
- `emr.prescriptions`
- `emr.inventory_items`
- `emr.invoices`
- `emr.expenses`
- `emr.employees`
- `emr.attendance`
- `emr.employee_leaves`
- `emr.insurance_providers`
- `emr.claims`
- `emr.audit_logs`
- `emr.tenant_features`
- `emr.global_kill_switches`

## 8. Multi-Tier Governance Architecture
Access to high-level modules is controlled through a cumulative tiering system:
- **Pricing Shards**: 
  - Free: ₹0/month
  - Basic: ₹2,500/month
  - Professional: ₹7,500/month
  - Enterprise: ₹15,000/month
- **Feature Computation**: Determined by `Subscription Tier` + `Manual Overrides` - `Global Killswitches`.
- **Infrastructure Implementation**:
  - `server/services/featureFlag.service.js`: Backend evaluation and default tier mappings.
  - `client/src/services/featureFlag.service.js`: Frontend gatekeeping and cache management.
  - `emr.tenant_feature_status`: A SQL view providing real-time evaluation of a tenant's effective permissions.

## 9. Institutional Financial Sharding
The system isolates Platform-level and Tenant-level payments:
- **Platform Layer**: Managed by Superadmin; controls tenant subscription lifecycle.
- **Tenant Layer**: Configured by Tenant Admins; routes patient payments directly to the hospital's gateway.
- **Implementation**:
  - `billing_config` (JSONB) in `emr.tenants` stores provider, currency, and gateway keys per tenant.
  - `AdminPage.jsx`: Secured interface for Tenant Admins to provision their specific gateway nodes.

## 11. Clinical AI Intelligence Engine
The platform integrates **Google Gemini-1.5-Flash** for generative clinical intelligence:
- **Architecture**: `server/services/ai.service.js` consumes the `@google/generative-ai` SDK.
- **Data Flow**: Patient metadata (encounters, medications, history) is sanitized and used as context for prompt engineering.
- **Capabilities**: Longitudinal patient summaries, diagnostic treatment suggestions, and automated discharge report formatting.
- **Frontend Integration**: `client/src/components/Chatbot.jsx` provides a persistent, context-aware interface for staff.

## 12. Institutional Master Governance
New administrative layers for tenant-level control:
- **Administrative Masters**: Managed via `DepartmentsPage.jsx` and `BedManagementPage.jsx`.
- **Service Catalog**: Refactored to a database-driven `emr.services` registry for dynamic pricing.
- **Branding Engine**: `emr.tenants` utilizes `logo_url` and theme attributes for institutional identity persistence across the login and workspace layers.

## 10. Documentation Boundaries
- `TECHNICAL_DESIGN.md` (this file): canonical architecture and design decisions.
- `ARCHITECTURE_DESIGN.md`: Detailed system architecture and tech stack specifics.
- `TECHNICAL_HANDBOOK.md`: implementation and change workflows for developers.
- `DATA_FLOW_DIAGRAMS.md`: diagrams and sequence/flow visuals aligned to current API.
