# MedFlow EMR Demo and User Manual

## 1) Purpose
This manual is for product demo, UAT, and onboarding.
It includes:
- Login credentials
- Role and tenant context
- Module-by-module workflows
- Dashboard and Reports demo flow
- End-to-end patient journey (including bed management and settlement)

---

## 2) Environment
- App URL: `http://localhost:5174`
- API URL: `http://localhost:4000/api`
- Tenant codes used in demo:
  - `NAH` (New Age Hospital)
  - `superadmin` (Platform Governance)

---

## 3) Login Instructions
1. Open login page.
2. Select `Organization Context` (tenant code).
3. Enter `Email Address` and `Access Key`.
4. Click `Sign In to Dashboard`.

---

## 4) Credentials

- All Users (Admin, Doctor, etc.): `Admin@123`

### 4.2 Superadmin
| Tenant Context | Email | Password |
|---|---|---|
| `superadmin` | `superadmin@emr.local` | `Admin@123` |

### 4.3 New Age Hospital (NAH) - Primary Demo Tenant
| Role | Email | Password |
|---|---|---|
| **Tenant Admin** | `admin@nah.local` | `Admin@123` |
| **Doctor / CMO** | `cmo@nah.local` | `Admin@123` |
| **Nurse** | `headnurse@nah.local` | `Admin@123` |
| **Pharmacist** | `pharmacy@nah.local` | `Admin@123` |
| **Lab Tech** | `lab@nah.local` | `Admin@123` |
| **Accounts** | `billing@nah.local` | `Admin@123` |

---

## 5) Seeded Demo Data Scope
Per tenant:
- 20 patients (Out-patient, In-patient, Emergency mix)
- 8 walk-ins (4 converted to patient)
- 10 employees with attendance and leave records
- 12 appointments
- 20 encounters
- 20 prescriptions (10 dispensed)
- 15 invoices (+ payments)
- Expenses, insurance providers, and claims
- Bed allocation and occupancy validation
- Discharge + settlement flows

---

## 6) Module-Wise User Workflows

## 6.1 Dashboard
Primary roles: Admin, Doctor, Management

Flow:
1. Login and land on `Dashboard`.
2. Verify top KPI cards (Patients, Visits, Triage, Revenue).
3. Use `Quick Actions`:
   - Register Patient
   - Schedule Appointment
   - Dispense Medicine
   - Issue Invoice
4. Review `Clinical & Financial Analytics` charts.
5. Review `System Intelligence` alerts.

Expected outcome:
- KPIs and chart cards load.
- Quick Action buttons navigate to correct module.

## 6.2 Patients
Primary roles: Front Office, Admin, Nurse, Doctor, Lab

Flow:
1. Open `Patients`.
2. Use search to locate existing patient.
3. Create patient via `Finalize Admission`.
4. Open patient record and add clinical journal note.
5. Print health record from patient detail.

Expected outcome:
- New patient appears in registry.
- Clinical entry is visible in timeline.

## 6.3 Appointments
Primary roles: Front Office, Admin, Doctor, Nurse

Flow:
1. Open `Appointments`.
2. Create scheduled appointment for patient/provider.
3. Add walk-in using reception form.
4. Convert walk-in to patient where required.
5. Update status (scheduled, checked-in, completed).

Expected outcome:
- Appointment and queue entries update in roster and queue widgets.

## 6.4 EMR
Primary roles: Doctor, Nurse

Flow:
1. Open `EMR`, click `New Consultation`.
2. Select patient and provider.
3. Enter complaint, diagnosis, notes.
4. Add prescription lines.
5. Click `Finalize Session & Print Rx`.

Expected outcome:
- Encounter appears in ledger.
- Prescription can be printed/consumed by Pharmacy workflow.

## 6.5 Inpatient (Bed Management)
Primary roles: Doctor, Nurse, Management

Flow:
1. Open `Inpatient`.
2. Review active occupancy list.
3. Validate bed assignments (unique open occupancy).
4. Use `Discharge protocol` after financial clearance.

Expected outcome:
- Bed occupancy reflects active in-patients only.
- Discharge closes active occupancy after settlement.

## 6.6 Pharmacy
Primary roles: Pharmacy, Doctor

Flow:
1. Open `Prescriptions`.
2. Filter by status (`Pending`, `Dispensed`).
3. Dispense pending medication.
4. Verify status updates to dispensed.

Expected outcome:
- Prescription status changes and inventory is consumed.

## 6.7 Billing (Financial Logistics)
Primary roles: Billing, Accounts, Admin

Flow:
1. Open `Financial Logistics`.
2. Create patient invoice (`Finalize Transaction`).
3. Mark invoice paid from ledger.
4. Print receipt.
5. For in-patient, process `IPD Discharge & Settlement`.

Expected outcome:
- Invoice created and status transitions to paid.
- Settlement enables discharge completion.

## 6.8 Insurance Registry
Primary roles: Insurance, Billing, Accounts, Management

Flow:
1. Open `Insurance Registry`.
2. Click `Register New Provider`.
3. Complete provider form and save.
4. Verify provider appears in active provider list.

Expected outcome:
- Provider record is saved and visible.
- Claims workflow can reference provider.

## 6.9 Inventory (Asset Logistics)
Primary roles: Inventory, Pharmacy, Operations

Flow:
1. Open `Asset Logistics`.
2. Add new stock item via `Commit to Registry`.
3. Verify item in `Global Stock Ledger`.
4. Click `Restock` for an item.

Expected outcome:
- Stock and reorder thresholds update correctly.

## 6.10 Employees
Primary roles: HR, Admin, Management

Flow:
1. Open `Employees`.
2. Add employee via `Create Employee`.
3. Mark attendance.
4. Submit leave request.
5. Review payroll intelligence and archive.

Expected outcome:
- Employee appears in directory.
- Attendance and leave records are visible.

## 6.11 Accounts Payable
Primary roles: Accounts, Billing, Management

Flow:
1. Open `Accounts Payable`.
2. Add expense from `Record New Expense`.
3. Review transaction ledger and expense breakdown.
4. Review P&L and balance sheet cards.

Expected outcome:
- Expense is reflected in ledger and summary panels.

## 6.12 Reports
Primary roles: Management, Auditor, Admin, Insurance, Billing, Lab

Flow:
1. Open `Reports`.
2. Review:
   - Strategic Narrative
   - Velocity/Liquidity/Load/Receivables metric cards
   - Revenue velocity chart
   - Physician performance registry
3. Cross-check monthly and periodical trends with dashboard.

Expected outcome:
- Metrics and charts render with current tenant data.
- Role-limited users only see allowed report-level data.

## 6.13 Admin (Tenant Controls)
Primary roles: Admin

Flow:
1. Open `Admin`.
2. Update tenant settings (display name/theme/features).
3. Create tenant user and assign role.

Expected outcome:
- Settings persist.
- New user can login with assigned role.

## 6.14 Superadmin
Primary role: Superadmin only

Flow:
1. Login with `superadmin`.
2. Open `Strategic Intelligence Center`.
3. Review platform metrics across tenants.
4. Onboard a new tenant (`Provision Tenant`).
5. Register tenant admin user.

Expected outcome:
- Cross-tenant health and governance panels load.
- New tenant/user provisioning succeeds.

---

## 7) End-to-End Demo Script (Recommended)
Use this sequence for client demo:

1. `Front Office`: register patient and create appointment.
2. `Doctor`: create consultation and prescription.
3. `Lab`: add diagnostic report.
4. `Pharmacy`: dispense medication.
5. `Billing`: issue invoice and settle payment.
6. `Accounts`: add operational expense.
7. `Insurance`: register provider and create claim.
8. `Doctor/Nurse`: admit/discharge in-patient (with settlement).
9. `Management`: review Dashboard and Reports.
10. `Auditor`: validate report visibility and read-only governance checks.

---

## 8) Dashboard and Reports Demo Talking Points
- Dashboard is operational: real-time day-to-day actions and queue health.
- Reports are strategic: trend, velocity, liquidity, and provider productivity.
- Use both views together:
  - Dashboard to execute
  - Reports to decide

---

## 9) Quick Troubleshooting
- Login fails:
  - Confirm tenant code and email.
  - Verify password (`Test@123` for tenant users).
- Missing menu/module:
  - Role-based permission may not include that module.
- No data shown:
  - Confirm tenant context (`EHS` vs `city_general`).
  - Refresh bootstrap data by re-login.

---

## 10) Reference
- Role permissions source: `server/middleware/auth.middleware.js`
- Module catalog source: `client/src/config/modules.js`
- Demo seed/validation script: `scripts/seed_validate_multi_tenant_e2e.js`
- Role matrix validator: `scripts/verify_role_matrix_multi_tenant.js`

