# Data Flow Diagrams

Last updated: 2026-02-19

Diagrams in this file align to active routes and middleware in `server/index.js` and `server/middleware`.

## 1. System Context
```mermaid
graph TD
    Staff((Tenant Staff User)) -->|Web App| FE[React SPA]
    Superadmin((Superadmin)) -->|Web App| FE
    FE -->|HTTPS /api/* + JWT| API[Express API]
    API -->|SQL| DB[(PostgreSQL emr schema)]
```

## 2. Login and Session Bootstrap
```mermaid
sequenceDiagram
    participant U as User
    participant FE as React Client
    participant API as Express API
    participant Repo as Repository
    participant DB as PostgreSQL

    U->>FE: Enter tenant/email/password
    FE->>API: POST /api/login
    API->>Repo: getTenantByCode (if tenant code)
    Repo->>DB: SELECT tenant
    API->>Repo: getUserByEmail
    Repo->>DB: SELECT user
    API->>API: compare bcrypt + create JWT
    API-->>FE: token + user + tenantId
    FE->>API: GET /api/bootstrap?tenantId&userId
    API->>Repo: getBootstrapData
    Repo->>DB: aggregate module datasets
    API-->>FE: patients/appointments/encounters/etc + permissions
```

## 3. Tenant-Scoped Request Flow
```mermaid
flowchart TD
    A[Incoming /api request] --> B[authenticate]
    B --> C{Tenant route?}
    C -- Yes --> D[requireTenant]
    D --> E[requirePermission/moduleGate]
    E --> F[Route Handler]
    F --> G[Repository SQL with tenant_id filter]
    G --> H[JSON response]
    C -- No --> F
```

## 4. Patient Registration and Clinical Updates
```mermaid
sequenceDiagram
    participant FE as PatientsPage/EmrPage
    participant API as Express API
    participant Repo as repository.js
    participant DB as PostgreSQL

    FE->>API: POST /api/patients
    API->>Repo: createPatient
    Repo->>DB: INSERT emr.patients + MRN generation
    API-->>FE: patient object

    FE->>API: PATCH /api/patients/:id/clinical
    API->>Repo: addClinicalRecord
    Repo->>DB: INSERT emr.clinical_records
    API-->>FE: record object
```

## 5. Financial Flow (Invoice to Payment)
```mermaid
flowchart LR
    A[Billing UI] --> B[POST /api/invoices]
    B --> C[createInvoice]
    C --> D[(emr.invoices)]
    D --> E[Pending/Partial State]
    E --> F[PATCH /api/invoices/:id/pay]
    F --> G[payInvoice]
    G --> H[(emr.invoices status and paid)]
```

## 6. Reports and Analytics Flow
```mermaid
sequenceDiagram
    participant FE as Dashboard/Reports
    participant API as Express API
    participant Repo as repository.js
    participant DB as PostgreSQL

    FE->>API: GET /api/reports/summary?tenantId=...
    API->>Repo: getReportSummary
    Repo->>DB: aggregate appointments/invoices/hr/lab metrics
    API-->>FE: KPI payload

    FE->>API: GET /api/reports/payouts?tenantId=...
    API->>Repo: getDoctorPayouts
    Repo->>DB: doctor encounter + invoice aggregates
    API-->>FE: payout payload
```

## 7. Superadmin Governance & Platform Economics
```mermaid
sequenceDiagram
    participant SA as Superadmin UI
    participant API as Express API
    participant Inf as Infra Service
    participant Repo as repository.js
    participant DB as PostgreSQL

    SA->>API: GET /api/superadmin/overview
    API->>Repo: getSuperadminOverview
    Repo->>DB: aggregation of cross-tenant metrics
    API-->>SA: Platform KPIs (Tenants/Users/Tickets)

    SA->>API: PATCH /api/admin/tenants/:id/tier
    API->>Repo: updateTenantTier
    Repo->>DB: UPDATE emr.tenants set tier
    API-->>SA: Tier Update Confirmation

    SA->>API: GET /api/infra/usage (Simulated)
    API->>Inf: Calculate Node Compute & Vendor Costs
    Inf-->>API: Cloud Cost Matrix
    API-->>SA: Fiscal Control Data (AWS/S3/DB)
```
