# Technical Design (Current State)

Last updated: 2026-02-19

This document is the canonical technical design reference for the EMR application. It reflects the current implementation in `client/src` and `server/`.

## 1. Architecture Summary
- Application type: Multi-tenant SPA + REST API.
- Frontend: React (Vite), centralized application state in `client/src/App.jsx`.
- Backend: Express API in `server/index.js` with middleware-driven auth, tenant checks, permissions, and feature gates.
- Data layer: PostgreSQL, shared schema (`emr.*`), tenant isolation through `tenant_id` scoping.

## 2. Source of Truth by Layer

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

## 4. Security Model
- Auth: bcrypt password verification + JWT claims (`userId`, `tenantId`, `role`, optional `patientId`).
- Tenant isolation: enforced in middleware and repository-level query patterns.
- Superadmin policy: tenant-context access is blocked by default; break-glass headers are required by middleware.
- Role permissions:
  - Backend authority: `PERMISSIONS` in `server/middleware/auth.middleware.js`
  - Frontend fallback visibility: `fallbackPermissions` in `client/src/config/modules.js`
- Auditing: write operations create audit records in `emr.audit_logs` via `createAuditLog`.

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
- `TECHNICAL_HANDBOOK.md`: implementation and change workflows for developers.
- `DATA_FLOW_DIAGRAMS.md`: diagrams and sequence/flow visuals aligned to current API.
