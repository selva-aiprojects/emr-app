# Multi-Tenant Feature — Implementation Reference

> **Document:** Technical Implementation Guide  
> **Area:** Multi-Tenant Architecture (MedFlow EMR)  
> **Status:** ✅ Production-Ready  
> **Last Updated:** April 2026

---

## 1. Architecture Overview

MedFlow uses a **Schema-Per-Tenant** multi-tenancy model on top of a single PostgreSQL database.

```
PostgreSQL Database
├── emr.*          ← Global/shared schema (auth, management, config)
│   ├── management_tenants    ← Control plane registry
│   ├── users                 ← All users across all tenants (filtered by tenant_id)
│   ├── tenants               ← Legacy tenant table (backward compat)
│   └── feature_flags, audit_logs, system_logs ...
│
├── nhgl.*         ← Tenant: National Hospital Group Ltd
│   ├── patients, appointments, encounters, invoices
│   ├── employees, attendance, payroll_runs, payroll_items
│   ├── wards, beds, departments, frontdesk_visits
│   ├── inventory_items, service_requests
│   ├── insurance_providers, insurance_claims
│   ├── ambulances, blood_units, donors
│   ├── expenses, audit_logs, notices, documents
│   └── ...all tables from tenant_base_schema.sql
│
├── magnum.*       ← Tenant: Magnum Healthcare Pvt Ltd
│   └── (same structure as nhgl.*)
│
└── nah.*          ← Tenant: NAH (North American Hospital)
    └── (same structure as nhgl.*)
```

**Key Rule:**
- `emr.*` = Schema **templates** + global auth + management
- `<tenant_schema>.*` = All **operational data** isolated per hospital

---

## 2. Database Routing (How It Works)

### `server/db/connection.js` — The Core Router

Every SQL call goes through a single `query()` function that automatically sets `search_path`:

```js
// For any tenant request:
SET search_path TO "nhgl", emr, public

// For superadmin:
SET search_path TO emr, public
```

This means application code writes **bare table names** (`FROM patients`, `FROM employees`) and PostgreSQL resolves them to the correct tenant schema automatically.

```js
// ✅ Correct — resolves to nhgl.patients or magnum.patients based on context
query('SELECT * FROM patients WHERE tenant_id = $1', [tenantId])

// ❌ Wrong — hardcodes schema, breaks multi-tenancy
query('SELECT * FROM emr.patients WHERE tenant_id = $1', [tenantId])
```

### Tenant Context Resolution

The `tenantId` is stored in `AsyncLocalStorage` (Node.js request context):

```
Incoming HTTP Request
    ↓
Auth Middleware (validates JWT, extracts tenant_id)
    ↓
tenantContext.run(tenantId, handler)
    ↓
query() reads tenantContext.getStore()
    ↓
Looks up schema_name from emr.management_tenants
    ↓
SET search_path TO "<schema_name>", emr, public
    ↓
SQL executes in tenant-isolated context
```

---

## 3. Tenant Registry (`emr.management_tenants`)

```sql
CREATE TABLE emr.management_tenants (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  code varchar(32) NOT NULL UNIQUE,
  schema_name varchar(64) NOT NULL UNIQUE,  -- e.g., "nhgl"
  subdomain varchar(128) UNIQUE,             -- e.g., "nhgl"
  status varchar(16) DEFAULT 'active',
  contact_email text,
  subscription_tier varchar(32) DEFAULT 'Professional',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

| Field | Purpose |
|---|---|
| `schema_name` | Maps to the PostgreSQL schema where tenant data lives |
| `code` | Short identifier (e.g., `NHGL`, `MAGNUM`) |
| `subdomain` | Used for URL-based tenant resolution |
| `subscription_tier` | Controls feature flag access |

---

## 4. Tenant Creation Flow (`provisioning.service.js`)

When a Superadmin creates a new tenant, this sequence runs:

```
Superadmin creates tenant via UI
    ↓
POST /api/admin/tenants
    ↓
provisionNewTenant(tenantData, adminData)
    ↓
[1] INSERT INTO emr.management_tenants (registers in control plane)
    ↓
[2] CREATE SCHEMA IF NOT EXISTS "<schema_name>"
    ↓
[3] executeTenantBaseSchema(schemaName)
    │   Reads: database/tenant_base_schema.sql
    │   Creates ALL operational tables inside the tenant schema:
    │   - patients, appointments, encounters, invoices, prescriptions
    │   - wards, beds, admissions
    │   - departments, frontdesk_visits
    │   - employees, attendance, payroll_runs, payroll_items, salary_structures
    │   - employee_leaves
    │   - inventory_items, inventory_transactions, service_requests
    │   - insurance_providers, insurance_claims
    │   - ambulances, ambulance_dispatch
    │   - donors, blood_units, blood_requests
    │   - expenses, notices, documents, audit_logs
    │   - All indexes
    ↓
[4] Seed initial Admin user in emr.users (with tenant_id)
    ↓
[5] installTenantMetricsSync() — sets up metrics aggregation
    ↓
[6] Send welcome email to contact address
    ↓
[7] Return tenant record + default credentials
```

---

## 5. The Tenant Base Schema (`database/tenant_base_schema.sql`)

This is the **canonical DDL** for every new tenant's schema. It covers all features across all tiers:

| Module | Tables |
|---|---|
| **Patient Management** | `patients`, `walkins`, `clinical_records` |
| **Scheduling** | `appointments`, `frontdesk_visits` |
| **Clinical** | `encounters`, `prescriptions`, `documents` |
| **Inpatient** | `wards`, `beds`, `admissions` |
| **Departments** | `departments` |
| **Billing** | `invoices`, `invoice_items`, `expenses` |
| **Insurance** | `insurance_providers`, `insurance_claims` |
| **Pharmacy/Lab** | `inventory_items`, `inventory_transactions`, `service_requests` |
| **Blood Bank** | `donors`, `blood_units`, `blood_requests` |
| **Fleet** | `ambulances`, `ambulance_dispatch` |
| **HR** | `employees`, `employee_leaves`, `salary_structures` |
| **Attendance** | `attendance` |
| **Payroll** | `payroll_runs`, `payroll_items` |
| **Comms** | `notices`, `audit_logs` |

> **Note:** Tables have no `emr.` prefix — they are created directly in the tenant's schema.  
> All `tenant_id` columns are present for RLS and data validation even though schema isolation already provides separation.

---

## 6. Users — Special Case

`emr.users` is **shared** across all tenants. User records are identified by `tenant_id`:

```sql
-- Doctor at NHGL
INSERT INTO emr.users (id, tenant_id, email, role ...)
VALUES (uuid, 'nhgl-tenant-id', 'dr@nhgl.local', 'Doctor');

-- Doctor at Magnum — same table, different tenant_id
INSERT INTO emr.users (id, tenant_id, email, role ...)
VALUES (uuid, 'magnum-tenant-id', 'dr@magnum.local', 'Doctor');
```

This is necessary because `provider_id` in `appointments` and `encounters` is a FK to `emr.users.id`.

However, **`employees` lives in the tenant schema** — this is the HR record with salary, shift, leave balance etc. The `emr.users.id` and `employees.id` share the same UUID for the same person.

---

## 7. Feature Flags Per Tenant

Feature access is controlled at runtime via `emr.feature_flags`:

```js
// Checked in middleware before any module endpoint
const hasAccess = await checkFeatureFlag(tenantId, 'permission-hr_payroll-access');
if (!hasAccess) return res.status(403).json({ error: 'Module not available on your tier' });
```

| Flag | Tier Required |
|---|---|
| `permission-core_engine-access` | All tiers |
| `permission-pharmacy_lab-access` | Basic+ |
| `permission-inpatient-access` | Professional+ |
| `permission-accounts-access` | Professional+ |
| `permission-hr_payroll-access` | Enterprise only |

---

## 8. Row Level Security (RLS)

Every table has `tenant_id` as a filter. The `query()` function also sets:

```sql
SELECT set_config('app.current_tenant', '<tenant_id>', false);
```

This allows PostgreSQL RLS policies to enforce isolation at the database layer as a second line of defense:

```sql
-- Example RLS policy on patients
CREATE POLICY tenant_isolation ON patients
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

---

## 9. Seeding a New Tenant

To seed demo data for a tenant:

```bash
node database/seed_nhgl_comprehensive.js
```

The seeder:
1. Calls `tenant_base_schema.sql` to provision all tables
2. Creates employees in **both** `emr.users` (for auth) and `nhgl.employees` (for HR)
3. Populates 3-4 months of historical patient journeys, HR, payroll, attendance, blood bank, etc.
4. Uses bare table names (no `emr.` prefix) — routes via `search_path`

---

## 10. Files Reference

| File | Purpose |
|---|---|
| `database/tenant_base_schema.sql` | **Canonical DDL** — all tenant tables. Run on every new tenant creation. |
| `server/services/provisioning.service.js` | Tenant creation orchestrator — calls `executeTenantBaseSchema()` |
| `server/db/connection.js` | Query router — sets `search_path` per request context |
| `server/lib/tenantContext.js` | AsyncLocalStorage wrapper for per-request tenant ID |
| `database/provision_tenant_schema.js` | Standalone utility to re-provision existing tenants |
| `database/seed_nhgl_comprehensive.js` | NHGL demo seeder (100 patients, 4-month HR, full clinical data) |
| `server/services/superadminMetrics.service.js` | Cross-tenant metrics aggregation for Superadmin dashboard |
| `server/controllers/superadmin.controller.js` | Tenant CRUD and status management APIs |

---

## 11. Common Pitfalls & Fixes

| Issue | Cause | Fix |
|---|---|---|
| `column "status" of relation "employees" does not exist` | Wrong schema — emr.employees has different columns than nhgl.employees | Always check actual table structure; never assume shared schema matches tenant schema |
| `foreign key violation on encounters.provider_id` | Provider UUID not in `emr.users` yet | Always insert user into `emr.users` **before** using their ID as `provider_id` |
| `duplicate key on management_tenants_subdomain_key` | Tenant already exists | Use `ON CONFLICT DO UPDATE` in seeder |
| Dashboard shows zeros | Data inserted into `emr.*` instead of tenant schema | Remove `emr.` prefix; data must live in `nhgl.*` (resolved by `search_path`) |
| `relation "employees" does not exist` | Tenant schema was never provisioned | Run `node database/provision_tenant_schema.js` or re-run provisioning |
