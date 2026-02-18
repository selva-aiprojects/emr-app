# Data Flow Diagrams (DFD)

This document visualizes the **Data Flow** for core business processes within the MedFlow EMR system using Mermaid diagrams.

---

## 1. System Context Diagram (Level 0)

An overview of external entities and the MedFlow system boundary.

```mermaid
graph TD
    User((Hospital Staff)) -->|Logs in, Manages Patients, Bills| MedFlow[MedFlow EMR System]
    Patient((Patient)) -->|Registers, Books Appt| MedFlow
    Admin((Tenant Admin)) -->|Configures Settings, Users| MedFlow
    MedFlow -->|Stores Data| DB[(PostgreSQL Database)]
    MedFlow -->|Sends Notifications| EmailServer(Mail Server)
```

---

## 2. Authentication Flow (Login Process)

The sequence diagram for User Authentication and Session establishment.

```mermaid
sequenceDiagram
    participant User
    participant Frontend as React Client
    participant API as Express API
    participant DB as PostgreSQL

    User->>Frontend: Enter Email, Password, Tenant
    Frontend->>API: POST /api/login {email, password, tenantId}
    API->>DB: SELECT * FROM users WHERE email=? AND tenant_id=?
    DB-->>API: User Record (Hash)
    API->>API: Verify Password (bcrypt)
    alt Valid Credentials
        API->>API: Generate JWT Token
        API-->>Frontend: 200 OK {token, user, tenantId}
        Frontend->>Frontend: Store Token
        Frontend-->>User: Redirect to Dashboard
    else Invalid Credentials
        API-->>Frontend: 401 Unauthorized
        Frontend-->>User: Show Error Message
    end
```

---

## 3. Patient Registration Workflow

The data flow from a new patient arrival to the creation of a digital medical record.

```mermaid
graph LR
    Start(New Patient Arrives) --> Form[Reception fills Registration Form]
    Form --> API_Call{Validate Input?}
    API_Call -- No --> Error[Show Validation Error]
    API_Call -- Yes --> P_API[POST /api/patients]
    P_API --> Repo[Repository Layer]
    Repo --> GenMRN[Generate Unique MRN]
    GenMRN --> DB_Insert[(INSERT INTO patients)]
    DB_Insert --> Success[Return New Patient Object]
    Success --> UI_Update[Redirect to Patient Profile]
```

---

## 4. Clinical Consultation (EMR) Flow

The interaction between a Doctor and the EMR module during a patient visit.

```mermaid
sequenceDiagram
    participant Doctor
    participant UI as EMR Page
    participant API
    participant DB

    Doctor->>UI: Select Patient from Queue
    UI->>API: GET /api/patients/:id/history
    API->>DB: Query Encounters & Clinical Records
    DB-->>UI: Historical Data (Timeline)

    Doctor->>UI: Enter Vitals, Diagnosis, Notes
    Doctor->>UI: Add Prescriptions (CPOE)
    Doctor->>UI: Click "Submit Consultation"

    UI->>API: POST /api/encounters {patient, vitals, dx, rx}
    API->>DB: INSERT INTO encounters
    API->>DB: INSERT INTO prescriptions
    DB-->>API: Success
    API-->>UI: 201 Created
    UI-->>Doctor: Show Success & Print Button
```

---

## 5. Billing & Payment Process

The flow of generating an invoice and recording a payment.

```mermaid
graph TD
    Trigger[Consultation Completed / Lab Test Done] --> GenInvoice[Generate Draft Invoice]
    GenInvoice --> Review[Billing Clerk Review]
    Review --> Finalize[Finalize Invoice]
    Finalize --> API_Inv[POST /api/invoices]
    API_Inv --> DB_Inv[(INSERT INTO invoices)]
    
    Payment[Patient Makes Payment] --> PayUI[Enter Payment Details]
    PayUI --> API_Pay[PATCH /api/invoices/:id/pay]
    API_Pay --> DB_Update[(UPDATE invoices SET status='paid')]
    DB_Update --> Receipt[Generate Receipt PDF]
```

---

## 6. Multi-Tenant Data Access

Conceptual flow of how data privacy is enforced across tenants.

```mermaid
flowchart TD
    Req[Incoming API Request] --> Auth{Valid Token?}
    Auth -- No --> 401[401 Unauthorized]
    Auth -- Yes --> Decode[Extract tenantId from Token]
    Decode --> Query[Construct SQL Query]
    Query --> Filter{Filter by tenant_id?}
    Filter -- Yes --> Exec[Execute: SELECT * FROM table WHERE tenant_id = $1]
    Filter -- No --> Reject[Reject Unsafe Query]
    Exec --> Result[Return Scoped Data]
```
