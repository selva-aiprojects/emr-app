# EMR Platform — Superadmin & Tenant Workflow Gap Analysis
**Date:** 2026-04-07 | **Scope:** Full workflow audit across Superadmin console and all Tenant user journeys

---

## 1. Superadmin Workflow — What Exists

### ✅ Implemented & Functional
| Module | Component | What it Does |
|---|---|---|
| **Global Dashboard** | `GlobalDashboard.jsx` | Cross-tenant KPIs: Nodes, Doctors, Patients, Beds, Ambulances, Labs. Manual sync button. Tenant registry table. |
| **Tenant Provisioning** | `TenantControlCenter.jsx` + `provisioning.service.js` | Create new tenant with isolated DB schema, default roles, admin user. Sends welcome email. Full rollback on failure. |
| **Tenant Listing** | `TenantControlCenter.jsx` "Active Shards" tab | Cards show name, tier, code, created date. Searchable by name/code. |
| **Password Reset** | `TenantControlCenter.jsx` "Reset Security" button | Resets `admin@{subdomain}.com` via `globalPasswordReset` API. |
| **Subscription Engine** | `SubscriptionEngine.jsx` | 4 plan tiers (Free/Basic/Professional/Enterprise), pricing editor, feature matrix, per-tenant yield audit, shard ledger. |
| **Infra Operations** | `InfraOpsManager.jsx` | CPU/Memory/Disk/Network gauges, per-tenant load bars, event log panel. |
| **Communication Center** | `CommunicationCenter.jsx` | Select tenant + email template (4 types), dispatch via API. |
| **Metrics Sync** | `superadmin.routes.js /sync-metrics` + `/sync-infra` | Force-syncs legacy tenants and refreshes management-plane metrics. |
| **Audit Logs API** | `superadmin.routes.js /logs` | Returns last 100 `management_system_logs` entries. |
| **Route Guard** | `authenticate + requireRole('Superadmin')` | All superadmin API routes are protected. |

---

## 2. Superadmin Workflow — Missing or Broken

### ❌ Issue 2.1 — `support` and `admin` views are dead-ends for Superadmin
- `allowedViews` (modules.js line 53) includes `'support'` and `'admin'` for Superadmin.
- `EnhancedSuperadminPage.renderContent()` has **no `case` for either** — falls through to GlobalDashboard silently.
- The sidebar has no entries for them either.
- **Impact:** Support ticket visibility and admin panel are inaccessible to Superadmin despite being permitted.

### ❌ Issue 2.2 — Tenant Deletion is a Dead Button
- `TenantControlCenter.jsx` line 150: Trash2 button has **no `onClick` handler**.
- No `DELETE /superadmin/tenants/:id` route or controller exists.
- **Impact:** Superadmin cannot decommission any tenant. Data accumulates indefinitely.

### ❌ Issue 2.3 — Tenant Edit / Update is Completely Missing
- No way to change tenant name, subdomain, subscription tier, contact email, or branding after creation.
- No `PATCH /superadmin/tenants/:id` route exists.
- **Impact:** Any incorrect data at creation time requires direct database intervention.

### ❌ Issue 2.4 — Fiscal Governance is Unreachable from the UI
- `renderContent()` handles `case 'financial_control'` → renders `<FiscalGovernance>`.
- `allowedViews` correctly includes `'financial_control'`.
- **BUT** the sidebar in `EnhancedSuperadminPage.jsx` (lines 33–40) does not include it.
- **Impact:** The entire Fiscal Governance module is invisible despite being built.

### ❌ Issue 2.5 — Identity Nodes Tab Shows Fabricated Data
- The "Identity Nodes" tab always renders `admin.{code}@emr.care` — a hardcoded formula (line 190, TenantControlCenter).
- Actual admin emails from tenant schemas are never fetched.
- **Impact:** Misleading for operators; shows fabricated identity, not real users.

### ❌ Issue 2.6 — Security Tab Buttons are Non-Functional
- "Start Global Audit" and "Revoke All Tokens" buttons exist but have **no `onClick` handlers**.
- No backend routes exist for either action.
- **Impact:** Security management tools are purely decorative.

### ⚠️ Issue 2.7 — InfraOps Entirely Uses Mocked / Random Data
- CPU/Memory/Disk/Network fallback to hardcoded values: `{ cpu: 24, memory: 38, disk: 31, network: 4 }`.
- Per-tenant "Compute" column uses `Math.random()` — re-randomizes on every render (line 105, InfraOpsManager).
- Event logs ("Ingress Peak Pattern", "Encrypted Shard Migration") are **hardcoded strings**.
- **Impact:** Infra panel is cosmetic only; re-renders show different numbers causing confusion in demos.

### ❌ Issue 2.8 — Communication Center is Partially Wired
- `tenants.slice(0, 8)` (line 125, CommunicationCenter) arbitrarily caps recipients at 8 tenants.
- "Global Broadcast" button has no `onClick` handler.
- "Audit Dispatch Logs" button has no handler.
- Backend `sendCommunication` only does `console.log` — no real email/notification sent for targeted dispatch.
- **Impact:** Communication is effectively non-functional; only logs a server-side string.

### ❌ Issue 2.9 — Subscription Engine Changes Don't Propagate to Tenants
- Editing a plan calls `POST /admin/subscription-catalog` — a **tenant-level** route, not a platform-level one.
- Changing plan pricing does not update `subscription_tier` on any actual tenant record.
- **Impact:** Superadmin can't change plan settings and have them reflected on tenants.

### ❌ Issue 2.10 — Support Tickets Architecture is Disconnected
- `getGlobalSupportTickets` queries `management_system_logs WHERE event LIKE '%TICKET%'` — no real tickets table.
- `tickets` state in `App.jsx` is passed as a prop to `EnhancedSuperadminPage` but **never forwarded to any child component**.
- **Impact:** Support ticket management for Superadmin is non-existent at the UI level.

---

## 3. Tenant User Workflow — What Exists

### ✅ Implemented & Functional (All Tiers as Applicable)
| Module | View | Permitted Roles |
|---|---|---|
| Login | `RedesignedLoginPage` | All |
| Dashboard | `DashboardPage` | All (tier-filtered) |
| Patients | `PatientsPage` | Admin, Doctor, Nurse |
| Patient Profile | `PatientProfilePage` | Doctor, Admin |
| Appointments | `AppointmentsPage` | Admin, Front Office, Doctor |
| Doctor Workspace | `DoctorWorkspacePage` | Doctor |
| Find Doctor | `FindDoctorPage` | Front Office, Patient |
| Doctor Availability | `DoctorAvailabilityPage` | Admin, Front Office |
| EMR / Encounters | `EmrPage` | Doctor, Admin |
| Pharmacy | `PharmacyPage` | Pharmacy |
| Lab | `LabPage`, `LabTestsPage`, `LabAvailabilityPage` | Lab, Admin |
| Inpatient | `InpatientPage` | Doctor, Nurse |
| Bed Management | `BedManagementPage` | Admin, Nurse |
| Billing | `BillingPage` | Billing, Admin |
| Accounts | `AccountsPage` | Accounts, Admin |
| Insurance | `InsurancePage` | Billing, Admin |
| Inventory | `InventoryPage` | Inventory |
| Employees / HR | `EmployeesPage`, `EmployeeMasterPage` | HR, Admin |
| Reports | `ReportsPage` | Admin |
| Admin Settings | `AdminPage` | Admin |
| Hospital Settings | `HospitalSettingsPage` | Admin |
| Departments | `DepartmentsPage` | Admin |
| Communication | `CommunicationPage` | Admin, Front Office |
| Document Vault | `DocumentVaultPage` | Admin, Doctor |
| Ambulance | `AmbulancePage` | Admin, Front Office |
| Service Catalog | `ServiceCatalogPage` | Admin, Billing |
| AI Vision | `AIImageAnalysisPage` | Doctor |
| Donor / Blood Bank | `DonorPage` | Lab, Admin |
| Support | `SupportPage` | All |
| Chat | `ChatPage` | All |
| Users / Access Control | `UsersPage` | Admin |
| RBAC / Role Gating | `allowedViews`, `FeatureGate.jsx` | All | Tier + role filtering active |

---

## 4. Tenant Workflow — Missing or Broken

### ❌ Issue 4.1 — Duplicate `<LabPage>` Registration in App.jsx
- Lines 870 and 882 both conditionally render `<LabPage>` for `view === 'lab'`.
- One passes `{ id: session.tenantId, code: session.tenantCode, ...session }`, the other passes `tenant`.
- **Impact:** Double component mount on lab navigation — potential data duplication and API call doubling.

### ❌ Issue 4.2 — User Password Reset is a Browser Alert (Non-Functional)
- `App.jsx` line 878: `onResetPassword={(id) => alert('Password reset initialization sent to personnel email.')}` — just a browser popup.
- No API call is made, no email is dispatched.
- **Impact:** Tenant Admins cannot reset any user's password through the application.

### ❌ Issue 4.3 — `SubscriptionCatalogManager.jsx` is Completely Orphaned
- Full 23KB page file exists but **is never imported or routed** in App.jsx.
- **Impact:** A dedicated tenant-facing subscription management interface is built but invisible.

### ❌ Issue 4.4 — Three Enhanced Pages are Orphaned (Never Routed)
| Page | Size | Status |
|---|---|---|
| `EnhancedEmrPage.jsx` | 35KB | Not imported or routed |
| `EnhancedPharmacyPage.jsx` | 29KB | Not imported or routed |
| `EnhancedInsurancePage.jsx` | 22KB | Not imported or routed |
- **Impact:** ~86KB of improved UI code is unreachable; old versions remain active.

### ❌ Issue 4.5 — Three Login Pages (Two Are Dead Code)
- `LoginPage.jsx` (12KB), `EnhancedLoginPage.jsx` (8KB), `RedesignedLoginPage.jsx` (active).
- **Impact:** Maintenance burden; old login logic may diverge.

### ❌ Issue 4.6 — No Subscription Self-Service for Tenants
- Tenants cannot see their current subscription tier, feature entitlements, or upgrade options.
- `HospitalSettingsPage` shows billing config (gateway, currency) but not the active tier or renewal status.
- **Impact:** Tenants are unaware of plan limits and cannot self-upgrade.

### ❌ Issue 4.7 — Self-Service Password Change is Missing
- Logged-in users (any role) have no way to change their own password from within the app.
- Only the Superadmin can reset passwords via the admin reset flow.
- **Impact:** Users who forget or want to update their password have no self-service path.

### ❌ Issue 4.8 — No Session Expiry / Token Refresh Handling
- `api.getStoredSession()` reads from `localStorage` with no expiry check or refresh token cycle.
- Expired server sessions silently return 401s; the UI continues operating until a hard reload.
- **Impact:** Security risk and poor UX — users see mysterious API failures instead of being redirected to login.

### ⚠️ Issue 4.9 — `Lab` Role Has Very Limited Module Access
- `fallbackPermissions.Lab` only includes: `dashboard, patients, patient-profile, reports, communication, documents`.
- **Missing:** `lab`, `lab_availability`, `lab_tests` — the core Lab modules!
- **Impact:** Lab staff cannot access lab-specific features through default permissions.

### ⚠️ Issue 4.10 — `role_management` Module Has No Route
- `RoleManagementPage.jsx` exists and is completely built but has no view entry in `App.jsx` and is missing from `fallbackPermissions`.
- It would need `'role_management'` added to Admin's permissions and a routing case in App.jsx.

---

## 5. Prioritized Fix Recommendations

### 🔴 High Priority (Broken or Causing Data Issues)

| # | Problem | File to Fix | Action |
|---|---|---|---|
| 1 | Lab role missing lab modules | `client/src/config/modules.js` | Add `'lab', 'lab_availability', 'lab_tests'` to `fallbackPermissions.Lab` |
| 2 | Duplicate LabPage mount | `client/src/App.jsx` | Remove second `view === 'lab'` block at line 882 |
| 3 | Superadmin Support view dead-end | `EnhancedSuperadminPage.jsx` | Add `case 'support':` in `renderContent()` using `tickets` prop |
| 4 | FiscalGovernance unreachable | `EnhancedSuperadminPage.jsx` | Add `financial_control` entry to `sidebarItems` array |
| 5 | User password reset is just `alert()` | `App.jsx` + `UsersPage.jsx` | Replace with a modal calling `api.resetUserPassword(id, tenantId)` |
| 6 | Tenant deletion is dead button | `TenantControlCenter.jsx` + new route | Add `DELETE /superadmin/tenants/:id` route. Wire Trash2 button with confirm dialog. |

### 🟡 Medium Priority (Missing Workflows)

| # | Problem | Action |
|---|---|---|
| 7 | Tenant Edit missing entirely | Add `PATCH /superadmin/tenants/:id` route + inline edit modal in TenantControlCenter shard cards |
| 8 | Superadmin ticket UI non-existent | Build `SupportTicketsPanel.jsx`. Pass `tickets` from `EnhancedSuperadminPage` into it |
| 9 | Global Broadcast non-functional | Implement `POST /superadmin/broadcast`. Remove 8-tenant cap. Wire "Global Broadcast" button |
| 10 | Communication emails not sent | Connect `sendCommunication` to `mail.service.js` — already used for welcome emails |
| 11 | Subscription self-view for tenants | Add current tier display + feature list + upgrade CTA to `HospitalSettingsPage` |
| 12 | Session expiry unhandled | Add Axios 401 interceptor → show "session expired" toast → call `api.logout()` |
| 13 | Self-service password change | Add "Change Password" modal to user profile menu in `AppLayout.jsx` |
| 14 | RoleManagementPage not routed | Add `view === 'role_management'` case in `App.jsx`. Add to Admin permissions in `modules.js` |

### 🟢 Low Priority (Cleanup & Polish)

| # | Problem | Action |
|---|---|---|
| 15 | 6 orphan pages (3 login, 3 enhanced) | Archive/delete: `LoginPage.jsx`, `EnhancedLoginPage.jsx`, `SuperadminPage.jsx`, `EnhancedEmrPage.jsx`, `EnhancedPharmacyPage.jsx`, `EnhancedInsurancePage.jsx` |
| 16 | SubscriptionCatalogManager orphaned | Import and route, or merge logic into SubscriptionEngine |
| 17 | InfraOps uses `Math.random()` | Replace per-tenant compute column with stable values; persist real events to `management_system_logs` |
| 18 | Identity Nodes shows fake emails | Query actual users from tenant schemas via a new `/superadmin/tenants/:id/users` endpoint |
| 19 | Security tab buttons non-functional | Implement `/superadmin/audit` and `/superadmin/revoke-sessions` or display clear "Coming Soon" state |
| 20 | Subscription plan changes don't cascade | Trigger `PATCH` on tenant records when plan pricing is updated in SubscriptionEngine |

---

## 6. Full Summary Matrix

| Domain | ✅ Working | ❌ Broken / Missing | ⚠️ Mock / Cosmetic |
|---|---|---|---|
| **Superadmin** | Dashboard, Provisioning, Password Reset, Subscription Engine, Metrics Sync | Tenant Delete, Tenant Edit, Support View wiring, Global Broadcast, Token Revoke, FiscalGovernance entry | InfraOps (all mocked), Identity Nodes (fake emails), Event logs (hardcoded strings) |
| **Tenant** | 30+ clinical & admin modules fully routed and functional | Duplicate LabPage, Password Reset (alert-only), RoleManagement not routed, Session expiry unhandled | — |
| **RBAC** | Role-based views, tier gating, FeatureGate component | Lab role missing lab module access, role_management unmapped | — |
| **Dead Code** | — | 6 orphan pages (~110KB), SubscriptionCatalogManager unused | — |
