# Comprehensive Requirement Specification Document (SRS)
## Project: Multi-Tenant Enterprise EMR System (MedFlow)

Last updated: 2026-03-31

---

## 1. Introduction
### 1.1 Purpose
The purpose of this document is to define the functional and non-functional requirements for the MedFlow implementation. The system is designed as a **Multi-Tenant Electronic Medical Records (EMR)** platform to serve multiple healthcare facilities (hospitals, clinics) from a single deployment instance.

### 1.2 Scope
The system encompasses the full patient journey from registration and appointment scheduling to clinical consultation, medication dispensing, inpatient bed tracking, billing/settlement, insurance, accounts payable, and analytics. It supports role-based access for hospital, operations, governance, and platform users. The system is built with **Prisma ORM** for type-safe database operations and **Render cloud deployment** for scalability.

---

## 2. Functional Requirements

### 2.1 Multi-Tenancy & Authentication
- **REQ-AUTH-01**: **Tenant Isolation**. Data for each tenant (hospital) must be strictly isolated using Prisma's automatic tenant scoping. Users from Tenant A must never access Tenant B's data.
- **REQ-AUTH-02**: **Identity Management**. The system must support secure login using Email/Password with JWT-based session management and Redis session storage.
- **REQ-AUTH-04**: **Multi-Factor Authentication (MFA)**. The system must support a two-step verification handshake (2FA) for high-privilege roles or enabled accounts to prevent unauthorized access.
- **REQ-AUTH-03**: **Role-Based Access Control (RBAC)**.
  - **Superadmin**: Platform-wide oversight, tenant creation, platform reports.
  - **Admin**: Full control over tenant operations, users, and settings.
  - **Doctor**: Encounter documentation, clinical decisions, discharge authority.
  - **Nurse**: Clinical support, inpatient operations, patient/appointment workflows.
  - **Lab**: Diagnostic record updates and report-facing analytics.
  - **Pharmacy**: Prescription dispensation and stock interaction.
  - **Front Office**: Registration, appointments, walk-ins.
  - **Billing**: Invoicing, payment collection, settlement.
  - **Accounts**: Expenses, payable operations, financial registry.
  - **Insurance**: Provider and claims registry.
  - **Inventory**: Logistics and stock control.
  - **HR**: Employee lifecycle, attendance, leaves.
  - **Operations**: Operational oversight for inventory and finance modules.
  - **Management**: Executive dashboards/reports and oversight modules.
  - **Auditor**: Governance-level report visibility and compliance review.
  - **Support Staff**: Support workflows under constrained scope.
  - **Patient**: Restricted personal appointment and profile scope.

### 2.2 Patient Management (MPI)
- **REQ-PAT-01**: **Registration**. Capture demographics (Name, DOB, Gender, Contact, Address) and generate a unique Medical Record Number (MRN) using Prisma's auto-generation capabilities.
- **REQ-PAT-02**: **Search**. Advanced search by Name, MRN, Phone, Visit Date, and Status with Prisma's optimized queries.
- **REQ-PAT-03**: **Longitudinal Record**. Display a consolidated view of a patient's entire clinical history (visits, diagnoses, medications) in a chronological timeline using Prisma relations.
- **REQ-PAT-04**: **Clinical Journaling**. Allow authorized roles to append notes and diagnostics to patient records with type-safe operations.
- **REQ-PAT-05**: **Record Output**. Enable printing/export of patient clinical summaries.
- **REQ-PAT-06**: **Digital Health ID (ABHA)**. Automatically generate and manage unique, mock Government Health IDs (ABHA) for clinical compliance in relevant regions.

### 2.3 Appointments & Scheduling
- **REQ-APT-01**: **Booking**. Support scheduling for future dates and time slots with Prisma's transaction support.
- **REQ-APT-02**: **Walk-ins**. Fast-track registration for immediate consultations.
- **REQ-APT-03**: **Status Workflow**. Track appointment lifecycles: `Requested` -> `Scheduled` -> `Checked In` -> `Completed` / `Cancelled` / `No Show`.
- **REQ-APT-04**: **Queue Management**. Real-time visibility of waiting patients for doctors.
- **REQ-APT-05**: **Walk-in Conversion**. Convert eligible walk-ins into full patient records.

### 2.4 Clinical Operations (EMR)
- **REQ-EMR-01**: **Encounter Documentation**. Digital forms to record Chief Complaints, Vitals (BP, HR), Diagnosis, and Clinical Notes.
- **REQ-EMR-02**: **CPOE (Prescriptions)**. Computerized provider order entry for medications (Name, Dosage, Duration, Frequency) with usage protocol tracking.
- **REQ-EMR-03**: **History Tracking**. Integrated longitudinal clinical record journal showing visits, diagnoses, and medications in a single view.
- **REQ-EMR-04**: **Inpatient Management**. Manage admissions, ward/bed occupancy, and streamlined discharge protocol summaries.
- **REQ-EMR-05**: **Clinical Output**. Generation of premium, professional digital prescriptions (PDF/Print) with clinic branding.

### 2.5 Pharmacy & Inventory
- **REQ-PHM-01**: **Dispensing Queue**. Unified queue for pharmacists to monitor and finalize medication issuance with real-time status tracking (`Pending` -> `Dispensed`).
- **REQ-INV-01**: **Stock Intelligence**. Monitor inventory units with visual meters indicating stock vs. reorder points.
- **REQ-INV-02**: **Logistics Registry**. Track resource categories (Pharmaceuticals, Consumables, etc.) and automate low-stock flagging.
- **REQ-INV-03**: **Restock Workflow**. Permit controlled stock increments and auditability.
- **REQ-LOG-01**: **Ambulance Service**. Enable real-time tracking of ambulance fleet status (Available/On Mission/Maintenance) and emergency dispatch logs.
- **REQ-LOG-02**: **Automated Archive**. Implement a background task engine to automatically archive stale patient records and old appointments (>30 days) to optimize operational data flow.

### 2.6 Billing & Finance
- **REQ-BIL-01**: **Invoicing**. Generate distinct invoices for Consultations, Pharmacy, and Lab services.
- **REQ-BIL-02**: **Payment Processing**. Record payments (Cash, Card, UPI, Insurance) and track due balances.
- **REQ-BIL-03**: **Discharge Settlement**. Support IPD discharge settlement workflow prior to discharge completion.
- **REQ-BIL-04**: **Insurance Claims**. Capture policy numbers, claim numbers, and claim amounts.
- **REQ-BIL-05**: **Tenant Payment Gateway**. Tenants must be able to configure their own institutional payment gateways (Stripe, Razorpay, etc.) for patient/insurance settlements, independent of the platform's billing.


### 2.7 Insurance Registry
- **REQ-INS-01**: **Provider Registry**. Create and maintain insurance providers by tenant.
- **REQ-INS-02**: **Claim Lifecycle**. Create and track claims linked to patient encounter/invoice context.

### 2.8 Accounts Payable
- **REQ-ACC-01**: **Expense Logging**. Capture operational expenses by category, date, payment method, and reference.
- **REQ-ACC-02**: **Financial Ledger**. Display consolidated payable-oriented financial ledger.
- **REQ-ACC-03**: **P&L and Balance Views**. Provide simplified financial statement views for authorized roles.

### 2.9 Employees and Workforce
- **REQ-EMP-01**: **Employee Master**. Manage employee identity, department, designation, shift, salary, and join date.
- **REQ-EMP-02**: **Attendance**. Record day-wise attendance including check-in/check-out.
- **REQ-EMP-03**: **Leave Management**. Submit and track leave records.

### 2.10 Reporting, Dashboard, and Analytics
- **REQ-RPT-01**: **Operational Dashboards**. Real-time metrics for daily patients, revenue, and active staff.
- **REQ-RPT-02**: **Administrative Reports**. Aggregate data for monthly revenue and patient demographics.
- **REQ-RPT-03**: **Executive Narrative**. Provide strategic narrative cards for decision support.
- **REQ-RPT-04**: **Provider Performance**. Show provider-level productivity and payout-style summaries.
- **REQ-RPT-05**: **Role-Constrained Access**. Reports access must align strictly with role permissions.

### 2.11 Admin and Superadmin
- **REQ-ADM-01**: **Tenant Settings**. Admin can modify tenant display settings and feature toggles.
- **REQ-ADM-02**: **Tenant User Creation**. Admin can create users under tenant scope.
- **REQ-SUP-01**: **Platform Oversight**. Superadmin can view global metrics and tenant summaries.
- **REQ-SUP-02**: **Tenant Provisioning**. Superadmin can create tenant entries, provision default admin credentials, and trigger automated welcome emails via Resend SMTP.
- **REQ-SUP-03**: **Feature Governance**. Superadmin can manage subscription tiers (Basic, Professional, Enterprise) and granular feature flag overrides for any tenant through a centralized governance interface.
- **REQ-SUP-04**: **Institutional Growth Tools**. Superadmin can create and broadcast "Offer Announcements" (e.g., Professional Tier discounts) to targeted tenant dashboards.

### 2.12 Subscription Tiers & Feature Gating
- **REQ-FEATURE-01**: **Tier-Based Modules**. The system must automatically enable/disable modules based on the tenant's tier:
  - **Free**: Core OPD, Registration, e-Prescriptions, and basic MIS Reports.
  - **Basic**: Core OPD + **Pharmacy & Lab**, **Inventory**, and **Ambulance Logistics**.
  - **Professional**: Core OPD + Pharmacy/Lab + **Inpatient Management**, **Billing/Insurance**, and **Service Engine**.
  - **Enterprise**: All modules including **HR/Payroll**, **AI Diagnostic Vision**, and **Staff Collaborative Hub**.
- **REQ-COLLAB-01**: **Staff Collaboration**. Enterprise-tier tenants gain access to the **Staff Hub** for real-time departmental messaging, shared tasks, and clinical protocol sharing.
- **REQ-FEATURE-02**: **Downgrade Safeguard Protocol**. Any attempt to move a tenant to a lower subscription tier must trigger a formal confirmation warning and require a mandatory "Communication Note" from the Superadmin documenting the tenant's consent and awareness of possible data accessibility trade-offs.

### 2.13 Clinical AI Intelligence
- **REQ-AI-01**: **Generative Clinical Insights**. The system must use **Gemini-1.5-Flash** (Google Generative AI) to synthesize longitudinal patient data into concise clinical snapshots.
- **REQ-AI-02**: **Treatment Decision Support**. Provide AI-driven treatment suggestions based on current diagnosis and historical metadata (Doctor role only).
- **REQ-AI-03**: **Automated Reporting**. Assist in generating formal Inpatient Discharge Summaries using admission course notes and vitals telemetry.
- **REQ-AI-04**: **Contextual Assistance**. Provide a staff-facing chatbot (Geminai) for navigational and operational queries within the tenant workspace.
- **REQ-AI-05**: **Clinical Safety Engine**. Implement AI-driven safety checks for drug-drug interactions and laboratory result interpretations to prevent adverse clinical outcomes.
- **REQ-NOT-01**: **Multi-Channel Notifications**. Enable automated clinical alerts and security notifications via SMS, Email, and WhatsApp (e.g., Lab Results Ready, Authentication Challenges).

### 2.14 Database Resilience & Engineering
- **REQ-DB-01**: **Consolidated Installation Script**. The system must maintain a single, authoritative `CONSOLIDATED_EMR_INSTALL.sql` file that contains the complete schema, all feature migrations, and a base validation dataset (Superadmin & Demo Tenant) to ensure idempotent environment setup.
- **REQ-DB-02**: **Self-Healing Schema**. The backend server must implement a startup "Bridge Verification" task that automatically detects and repairs missing database columns or tables required by the application code, preventing 500 errors during environmental synchronization.

### 2.12 End-to-End Validation Dataset
- **REQ-DATA-01**: System must support seeded validation datasets for at least two tenants.
- **REQ-DATA-02**: Validation dataset should include patient mix (Out-patient, In-patient, Emergency), staff, clinical, billing, insurance, inventory, and HR records.
- **REQ-DATA-03**: Validation dataset should include bed occupancy and discharge settlement scenarios.

---

## 3. Non-Functional Requirements

### 3.1 Performance
- **NFR-PERF-01**: API response time should be under 200ms for standard queries.
- **NFR-PERF-02**: React UI must render initial paint within 1.5 seconds on 4G networks.
- **NFR-PERF-03**: Bootstrap payload retrieval should be optimized for role-scoped data loading.

### 3.2 Security
- **NFR-SEC-01**: All data in transit must be encrypted via TLS.
- **NFR-SEC-02**: Passwords must be salted and hashed (e.g., bcrypt) before storage.
- **NFR-SEC-03**: API endpoints must validate Tenant ID key in headers or tokens to prevent cross-tenant leakage.
- **NFR-SEC-04**: All SQL calls must be parameterized to prevent injection.
- **NFR-SEC-05**: Role constraints must be enforced in both backend permissions and database role domain/check constraints.

### 3.3 Reliability & Availability
- **NFR-REL-01**: System Availability target is 99.9% uptime.
- **NFR-REL-02**: Database backups must be performed daily.
- **NFR-REL-03**: Production deployments must support automated rollback/redeploy strategy.

### 3.4 Interface & Usability
- **NFR-UI-01**: **Mobile Responsiveness**. The application must be fully functional on tablet and mobile devices (screens down to 360px width).
- **NFR-UI-02**: **Accessibility**. Forms must support keyboard navigation.
- **NFR-UI-03**: Module navigation must reflect role-based access and tenant feature flags.

### 3.5 Observability and Auditability
- **NFR-OBS-01**: Key operational actions (login, billing, claims, inventory, discharge) must be auditable.
- **NFR-OBS-02**: Deployment/runtime logs must expose startup health and static bundle path selection.

---

## 4. Deployment and Runtime Requirements

### 4.1 Deployment Targets
- **NFR-DEP-01**: System must support deployment on Render (unified service mode).
- **NFR-DEP-02**: System should also remain compatible with Netlify/Vercel paths where adapters exist.

### 4.2 Environment Variables
- **NFR-ENV-01**: `DATABASE_URL` must be mandatory in production.
- **NFR-ENV-02**: `JWT_SECRET` must be mandatory in production.
- **NFR-ENV-03**: `PORT` should default to `4000` when not provided.

### 4.3 Frontend Static Serving
- **NFR-DEP-03**: Backend must serve frontend bundles from deployment-compatible output paths.
- **NFR-DEP-04**: Runtime should support both `client/dist` and root `dist` bundle structures to prevent deployment-specific 500 errors on `/`.
