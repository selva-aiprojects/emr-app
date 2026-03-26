# EMR Scaling & Stabilization Implementation Tracker

This document tracks the execution of the 3-phase architectural upgrades designed to transition the functional EMR MVP into an enterprise-grade SaaS platform. 

**Core Directive:** All updates, especially in Phase 1, must be executed ensuring **zero downtime, zero crashes, and 100% workflow continuity** for existing functionalities.

---

## Phase 1: Zero-Trust Security & RLS (Days 1-3)
**Objective:** Bulletproof multi-tenant data isolation using PostgreSQL Row-Level Security (RLS) gracefully, ensuring current `WHERE tenant_id = $1` queries continue to function without crashing standard workflows.

### 📋 Checklist
- [x] **Step 1.1:** Create a Postgres Migration Script to enable `ROW LEVEL SECURITY` on all schema tables (`patients`, `appointments`, `clinical_records`, etc.).
- [x] **Step 1.2:** Define RLS Policies mathematically guaranteeing a row is only visible if the request's connection sets `current_setting('app.current_tenant')`.
- [x] **Step 1.3:** Modify `server/db/connection.js` to automatically inject `SET LOCAL app.current_tenant = '${req.tenantId}'` inside a transaction wrapper before any query executes.
- [x] **Step 1.4:** Modify `server/middleware/auth.middleware.js` to pass the `req.tenantId` cleanly to the database pool.
- [x] **Step 1.5:** **Regression Testing:** Run the full clinical workflow (Registration -> Consultation -> Prescription -> Billing). Guarantee that old manual `WHERE tenant_id` clauses coexist flawlessly with the new RLS engine.

---

## Phase 2: Enterprise Abstractions (Days 4-10)
**Objective:** Evolve the data models purely additively so that Sub-store Pharmacies and Dynamic Roles are supported without breaking the existing Basic Clinic structures.

### 📋 Checklist
- [x] **Step 2.1 (RBAC Database Engine):** Create `emr.roles` and `emr.role_permissions` tables. 
- [x] **Step 2.2 (Role Middleware Swap):** Update `server/middleware/auth.middleware.js` to query the database cache for the user's role permissions instead of using the hardcoded `PERMISSIONS` object. Fallback to hardcoded permissions if the database read fails.
- [x] **Step 2.3 (Pharmacy Location Support):** Add a nullable `location_id` column to the `emr.inventory` and `emr.pharmacy_sales` tables. If `location_id` is null, it defaults to the clinic's Main Store (backward compatibility).
- [x] **Step 2.4 (Superadmin Template Provisioning):** Update the `createTenant` function to auto-clone Master Drugs and default ICD-10 codes into a new tenant upon creation. 
- [x] **Step 2.5:** **Workflow Validation:** Verify that a doctor can still prescribe drugs globally and that HR can successfully assign a new dynamically created role.

---

## Phase 3: Performance Scaling & Pagination (Days 11-14)
**Objective:** Optimize database fetching for UI tables handling 100,000+ records to eliminate NodeJS memory bottleneck crashes when large hospitals are provisioned.

### 📋 Checklist
- [x] **Step 3.1:** Audit `server/db/repository.js` to identify all unbounded queries (e.g., `getPatients`, `getAppointments`).
- [x] **Step 3.2:** Introduce `limit` and `offset` (cursor-based pagination) to API route handlers and repository functions.
- [x] **Step 3.3:** Refactor `getPatientById` and `getPatients` to optimize `json_agg` fetching for clinical records.
- [x] **Step 3.4:** Update the Frontend (`PatientsPage.jsx`, `AppointmentsPage.jsx`, `LabPage.jsx`) to consume newly paginated metadata (e.g., "Page 1 of 50").
- [x] **Step 3.5:** **Stress Test:** Simulate a payload of 10,000 patients and monitor server RAM to ensure no crash occurs during a standard Front Office patient search.

---

## 🚦 Tracking Log / Status

| Phase | Component | Status | Target Date | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | PostgreSQL RLS Engine | 🟡 Pending | TBD | Prioritizing backward compatibility. |
| **Phase 1** | Transaction Context Injection | 🟡 Pending | TBD | |
| **Phase 2** | Dynamic Roles (RBAC) | 🟡 Pending | TBD | |
| **Phase 2** | Multi-Store Pharmacy | 🟡 Pending | TBD | |
| **Phase 3** | Pagination Optimization | 🟡 Pending | TBD | |

*Document created for tracking End-to-End Enterprise scaling efforts without compromising workflow.*
