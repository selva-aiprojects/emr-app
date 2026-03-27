# Scope & Requirements Specification (SRS) - MedFlow EMR

## 1. Project Overview & Scope
The MedFlow EMR is a **Premium Multi-Tenant Enterprise Healthcare Platform** designed to manage clinical operations for multiple hospitals and clinics from a single deployment instance.

### 1.1 Aesthetic & Visual Identity
- **Premium Medical Experience**: Utilization of **Glassmorphism Design System** globally.
- **Dynamic Tenant Branding**: Real-time facility branding via CSS-variable driven theme injection (Primary/Accent colors).
- **AI-Driven Assistance**: Integrated context-aware virtual assistant (Chatbot) for clinical queries and navigation.

### 1.2 Core Clinical Scope
- **Longitudinal Record Journal**: Unified chronological view of vitals, notes, and prescriptions.
- **Dual-Pane Consultation Workspace**: Enabling simultaneous history review and documentation.
- **Professional Clinical Outputs**: Print-ready, branded digital prescriptions and bills.
- **Pharmacy & Inventory Intelligence**: Visual stock meters and focused dispensation queues.

---

## 2. Functional Requirements

### 2.1 Multi-Tenancy & Authentication
- **REQ-AUTH-01: Tenant Isolation**. Strict data separation at API and DB layers.
- **REQ-AUTH-02: Identity Management**. Secure login with BCrypt hashing and JWT session management.
- **REQ-AUTH-03: RBAC (Role-Based Access Control)**.
  - **Superadmin**: Global oversight and tenant lifecycle management.
  - **Admin**: Facility-level settings and user management.
  - **Doctor/Nurse**: Clinical records, EMR, and patient management.
  - **Pharmacist**: Prescription dispensation and inventory control.
  - **Patient**: Personal records and scheduling.

### 2.2 Patient Management (MPI)
- **REQ-PAT-01: Registration**. Capture demographics and generate unique Medical Record Numbers (MRN).
- **REQ-PAT-02: Unified Search**. Debounced search by Name, MRN, Phone, or Visit Date.
- **REQ-PAT-03: Clinical Timeline**. Consolidated view of the patient's entire clinical journey.

### 2.3 Appointments & Scheduling
- **REQ-APT-01: Slot Booking**. Schedule-based capacity management.
- **REQ-APT-02: Walk-in Workflow**. Rapid registration with "Convert to Patient" capability.
- **REQ-APT-03: Queue Management**. Real-time visibility of patient occupancy in facility wards and waiting rooms.

### 2.4 Clinical Operations (EMR)
- **REQ-EMR-01: Encounter Documentation**. Recording Chief Complaints, Diagnosis, and SOAP notes.
- **REQ-EMR-02: CPOE (Prescriptions)**. Specialized line-item entry with usage protocol tracking.
- **REQ-EMR-04: Inpatient Management**. Bed occupancy tracking and discharge protocol summaries.

### 2.5 Pharmacy & Inventory
- **REQ-PHM-01: Dispensing Queue**. high-contrast status tracking (`Pending` -> `Dispensed`).
- **REQ-INV-01: Stock Visual Intelligence**. Horizontal meters showing current stock vs. reorder points.

---

## 3. Non-Functional Requirements

### 3.1 Design & Experience
- **NFR-UX-01: High-End Aesthetics**. Glassmorphism and smooth Cubic Bezier transitions.
- **NFR-UX-02: Mobile Responsiveness**. Tablet-first design optimized for clinical mobility.

### 3.2 Security & Performance
- **NFR-SEC-01: Encryption**. TLS data-in-transit and salted BCrypt password hashing.
- **NFR-SEC-02: Tenant Safety**. Middleware-enforced scoping on every database transaction.
- **NFR-PERF-01: Latency**. API response target < 200ms; Initial UI paint < 1.5s on 4G.
