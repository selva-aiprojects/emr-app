# Scope and FRD - Tenant-Based Workflow

Last updated: 2026-02-19
Owner: Product + Engineering
Status: Draft (Implementation-ready baseline)

## 1. Scope

### 1.1 In Scope
- Multi-tenant authentication and session handling.
- Tenant-scoped data access for all operational modules.
- Role and permission-based module access.
- Tenant bootstrap data loading after login.
- Tenant administration (settings, users, feature visibility).
- Superadmin platform operations (tenant lifecycle, global controls).
- Audit logging for critical state changes.

### 1.2 Out of Scope
- Cross-tenant data sharing.
- External billing gateway integration.
- Advanced BI warehouse pipelines.
- Full SSO/SAML enterprise identity integration.

## 2. Business Objective
- Ensure strict tenant isolation in a shared platform.
- Enable fast onboarding and daily operations for each tenant.
- Provide safe administration and controlled superadmin oversight.

## 3. Actors
- Superadmin: manages platform and tenant-level provisioning.
- Tenant Admin: manages tenant settings and users.
- Clinical User: doctor/nurse/lab/pharmacy/front office.
- Financial User: billing/accounts/insurance.
- Support Roles: management/hr/operations/auditor.
- Patient role (restricted self-access).

## 4. Functional Requirements (FRD)

### FR-01 Tenant Authentication
- User must login with `tenantId` (or tenant code), email, password.
- System validates credentials and returns JWT with user context.
- Invalid credentials return `401`; missing required fields return `400`.

### FR-02 Tenant Context Enforcement
- All tenant-scoped APIs must require resolved tenant context.
- System must reject requests where user tenant and requested tenant mismatch.
- Superadmin tenant access requires explicit break-glass headers.

### FR-03 Role and Permission Access
- Backend permission map is source of truth for API authorization.
- Frontend uses permissions payload/fallback map for module visibility.
- Unauthorized module/API access must return `403`.

### FR-04 Post-Login Bootstrap
- After login, system loads tenant-scoped bootstrap data:
  - patients, appointments, walk-ins, encounters
  - invoices, inventory, employees, leaves
  - insurance providers and claims
  - effective permissions for the logged-in role

### FR-05 Tenant Administration
- Tenant admin can:
  - update tenant display/theme/features
  - create/manage tenant users
  - view tenant operational modules per permission

### FR-06 Superadmin Operations
- Superadmin can:
  - create tenants
  - create tenant users
  - view platform overview and tenant rollups
  - manage global kill-switch and subscription controls

### FR-07 Audit and Traceability
- System logs audit records for critical create/update/pay/permission events.
- Audit entries include actor, tenant, action, entity, timestamp.

### FR-08 Resilience and Safe UI Handling
- Client handles non-JSON/empty API responses safely.
- Session expiry clears auth state and routes user to login.

## 5. Tenant Workflow (End-to-End)

## 5.1 Tenant Onboarding Workflow
1. Superadmin creates tenant with base settings.
2. Superadmin creates initial tenant admin user.
3. Tenant admin logs in and configures tenant settings.
4. Tenant admin creates operational users by role.
5. Tenant begins module usage based on enabled features and permissions.

## 5.2 Daily Tenant User Workflow
1. User logs in with tenant context.
2. System loads bootstrap data and permissions.
3. User accesses allowed modules only.
4. User performs operational actions (clinical/financial/ops).
5. System enforces tenant scope and records audits.

## 5.3 Superadmin Break-Glass Workflow
1. Superadmin invokes tenant-scoped action with break-glass headers.
2. System validates reason and allows controlled access.
3. System logs security/audit trail for break-glass access.

## 6. Non-Functional Requirements
- Security: tenant isolation, JWT auth, role-based authorization.
- Performance: bootstrap response should support near-real-time module load.
- Reliability: errors should be standardized and user-safe.
- Maintainability: permissions and module mapping must remain aligned.

## 7. Acceptance Criteria
- Tenant user cannot access data from another tenant.
- Unauthorized role cannot access restricted module/API.
- Successful login loads correct tenant data set.
- Superadmin cannot access tenant context without break-glass.
- Critical writes produce audit entries.
- Frontend navigation shows only permitted modules.

## 8. API/Module Coverage Matrix (High-Level)
- Auth: login, token validation, logout/session clear.
- Tenant: get/update tenant settings, list tenants (role-based).
- Users: list/create users with tenant rules.
- Clinical: patients, appointments, encounters, prescriptions.
- Financial: invoices, payments, expenses, financial reports.
- Operations: inventory, employees, attendance, leaves.
- Insurance: providers, claims.
- Analytics: summary and payout reports.

## 9. Risks and Controls
- Risk: frontend/backend permission drift.
  - Control: keep backend as authority; validate via bootstrap contract tests.
- Risk: accidental tenant leakage in SQL.
  - Control: mandatory tenant filters and code review checklist.
- Risk: superadmin misuse.
  - Control: break-glass enforcement + audit trail.
