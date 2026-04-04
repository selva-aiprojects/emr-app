# Multi-Tenancy Transition Plan: Shared to Multi-Schema

To ensure robust data isolation and compliance, we are transitioning from a shared-schema model (where all tenant data resides in a single 'emr' schema filtered by 'tenant_id') to a multi-schema model (where each tenant has its own dedicated schema).

## Current Status: COMPLETED

### 1. Dedicated Schema Creation
We have already created isolated schemas for each tenant in the system.
- **EHS Schema**: `tenant_45cfe2865469457a`
- **NAH Schema**: `tenant_f998a8f595b94fd7`
- *Pattern*: `tenant_<sanitized_16_char_uuid_prefix>`

### 2. Clinical Data Migration
All clinical and operational records have been moved from the shared `emr` schema into their respective dedicated schemas.
- **Tables Migrated**: `patients`, `appointments`, `encounters`, `clinical_records`, `billing`, `invoices`, `inventory`, `services`, `departments`, `employees`, etc.
- **Migration Logic**: A script (`scripts/migrate_to_multi_schema.mjs`) replicates the table structure (including indexes and constraints) and moves the data where `tenant_id` matches.

### 3. Dynamic Database Routing
The application now automatically routes all queries based on the tenant context.
- **Location**: `server/db/connection.js`
- **How it works**: For every database request, we execute `SET search_path TO <tenant_schema>, emr`.
- **Result**: Tables like `patients` are first searched in the tenant's private schema. If not found, it falls back to the `emr` schema (for global management data).

### 4. Service Layer Refactoring
We have refactored the following core services to remove hardcoded `emr.` schema prefixes, making them compatible with the dynamic `search_path`:
- [x] Dashboard Monitoring (`server/index.js`)
- [x] Patient Management (`server/db/patient.service.js`)
- [x] Appointment Scheduling (`server/db/appointment.service.js`)
- [x] Billing & Invoicing (`server/db/billing.service.js`)
- [x] Clinical Encounters (`server/db/encounter.service.js`)
- [x] Pharmacy Management (`server/db/pharmacy.service.js`)

---

## Upcoming Steps: CLEANUP

### 1. Final Service Review
- [ ] Audit remaining modules (OPD, Insurance, Financials) for hardcoded `emr.` prefixes.
- [ ] Update the `generate_invoice_number` PostgreSQL function to be schema-agnostic or ensure it's available in `emr` for all.

### 2. Schema Hardening (Zero-Leakage)
- [ ] After thorough verification, truncate the clinical tables in the shared `emr` schema to ensure no stale data remains.
- [ ] **Crucial**: Once all data is migrated, the `tenant_id` column in the tenant-specific schemas becomes redundant (though it may be kept for legacy reference or cross-tenant reports if needed).

---

## Impact for EHS (Enterprise Hospital Systems)
- **Data Isolation**: EHS data is now physically separated into `tenant_45cfe2865469457a`.
- **Performance**: Queries are now faster as they don't need to filter millions of rows by `tenant_id` at the global level.
- **Reliability**: Dashboard metrics are now accurate and pulled exclusively from the isolated EHS schema.
