# Project Context: EMR-Application (Production-Ready Healthcare)

## Core Mission
A high-compliance, multi-tenant EMR system. The platform is **LIVE**; all code must be production-grade, adhering to strict medical data standards. No mock/hardcoded data.

## Multi-Tenant & Database Provisioning
- **Schema-per-Tenant:** Every tenant is isolated in its own PostgreSQL schema (named by `Tenant Short Code`).
- **Provisioning Workflow:** 
  1. Source of Truth: `/database/tenant_template.sql`.
  2. The script must include all Tables, Constraints, and optimized **Indexes**.
  3. **Triggers:** Automated triggers must sync metadata (IDs, counts, timestamps) back to the `emr` (Superadmin) schema. **Strictly no PHI in triggers.**
- **Confirmation:** Tenant creation is "confirmed" only after a successful SQL dump execution.

## Scalability & Migration Strategy
- **Connection Management:** Use a connection pooler (e.g., PgBouncer) to manage high-volume schema-switching without exhausting DB connections.
- **Asynchronous Migrations:** Updates to tenant schemas must be handled via a Background Worker (e.g., Inngest/BullMQ) to ensure zero downtime across all tenants.
- **Schema Drift Prevention:** The `tenant_template.sql` must stay in sync with the Prisma schema via CI/CD checks.

## Superadmin & AI/ML Management
- **Privacy Wall:** Superadmin has **Zero Visibility** into raw health data.
- **AI/ML Training:** Models are managed centrally but trained only on **De-identified/Anonymized** data exported via a scrubbing pipeline.
- **Focus:** Tenant Lifecycle, Subscription/Billing, Infrastructure Health, and Model Orchestration.

## Tech Stack
- **Framework:** Next.js 14 (App Router).
- **ORM:** Prisma (Dynamic client factory for `search_path` switching).
- **Styling:** Tailwind CSS + Shadcn UI (Design tokens only; no hardcoded hex).

## Coding Standards & Rules
- **TypeScript:** `strict: true`. Use of `any` is forbidden. 
- **Medical Accuracy:** Data structures must reflect real-world medical entities (Patients, Encounters, ICD-10/LOINC).
- **Security:** Every PHI access must trigger an **Audit Log** entry (User, Action, Timestamp).
- **Error Handling:** Use `CustomError` to mask sensitive system metadata from production logs.

## Project Structure
- `/src/app`: Tenant-aware routing and Superadmin dashboard.
- `/src/lib/prisma`: Client factory for dynamic tenant schema switching.
- `/database`: Contains `tenant_template.sql` and migration worker scripts.
- `/src/services/ai`: AI/ML model management and data scrubbing logic.

## Multi-Tenant Shard Lifecycle & Migration Plan
### 1. Registry-Driven Orchestration
Every institutional shard is registered in `emr.management_tenants`. This registry is the **Source of Truth** for the "Shard Router" and the "Migration Coordinator."

### 2. Cross-Shard Schema Upgrades (The Shard-Pivot)
When adding new columns, tables, or triggers:
- **Migration Logic:** A global script scans the Registry to find all active shards.
- **Atomic Execution:** It runs the necessary `ALTER TABLE` or `CREATE TABLE` commands across each schema in a transaction, ensuring no hospital is left behind.
- **Schema Versioning:** Every tenant schema maintains its own `_meta.schema_version` to track synchronization status.

### 3. Function & Trigger Inheritance
To minimize maintenance, core functions (e.g., PHR sync, telemetry aggregation) are defined in the `emr` or `public` schema. Individual shards "Call" these master functions, allowing you to update system logic once and have **all 100+ hospitals inherit the fix instantly**.

### 4. Backup & Disaster Recovery
Every shard is backed up into a compressed SQL dump. Restoration is institutional—you can restore "New Age Hospitals" without affecting any other tenant on the platform.

## Common Commands
- `npm run dev`: Start dev server.
- `npm run build`: Production build.
- `npm run test`: Run Vitest and Playwright suites.
- `node server/scripts/migrate-shards.js`: (Planned) Run migrations across all institutional schemas.
