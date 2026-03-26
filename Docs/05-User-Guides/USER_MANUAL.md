# User Manual - MedFlow EMR

## 1. 👨‍⚕️ Clinician / Doctor
As a Doctor, you are responsible for managing the clinical patient journey from consultation to medication orders.

### 1.1 Managing Consultations
- **Dashboard**: Upon login, view your daily metrics and patient occupancy.
- **EMR Page**: 
    - Click **"New Consultation"** to start a fresh encounter.
    - Use the **Patient Search** in the sidebar to load a patient.
    - Review the **Clinical Record Journal** for past history.
    - Record vitals (BP, Heart Rate) and Chief Complaints in the primary form.
- **Computerized Provider Order Entry (Rx)**:
    - Use the dedicated ℞ module to add medications.
    - Specify dosage, duration, and instructions.
- **Finalization**:
    - Click **"Save Clinical Record"** to finalize.
    - Use **"Generate Prescription"** to produce a branded clinical document for the patient.

---

## 2. 💊 Pharmacist
As a Pharmacist, you manage drug issuance and facility stock levels.

### 2.1 Dispensing Medications
- **Pharmacy Queue**: View all **Pending** prescriptions from clinical staff.
- **Verification**: Review medication nomenclature and dosage protocol.
- **Issuance**: Click **"Finalize Dispense"** to mark the item as issued. This automatically decrements inventory.

### 2.2 Inventory Monitoring
- **Stock Levels**: View the **Inventory** ledger to see visual meters of current stock.
- **Alerts**: Pay attention to **Critical Pulse Indicators** on items below their reorder point.

---

## 3. 🏢 Front Office & Administration
As a Front Office staff member or Admin, you handle registration, scheduling, and billing.

### 3.1 Patient Registration
- Use the **"Register New Patient"** flow to generate a unique Medical Record Number (MRN).
- Create **Appointments** or **Walk-ins** to add patients to the facility queue.

### 3.2 Facility Branding
- Administrators can change the **Primary** and **Accent** colors in the Admin Settings to match clinic branding.

---

---

## 5. 🛡️ Platform Governance & Subscriptions
As a **Superadmin** or **Tenant Admin**, you manage institutional permissions and facility growth.

### 5.1 Subscription Tier Shards
The platform enforces strict functional isolation through subscription tiers. Features are categorized as follows:

- **Free Tier**: Core OPD, Registration, e-Prescriptions, and basic MIS Reports.
- **Basic Tier**: Adds **Inventory Control, Pharmacy Dispensing, Laboratory management, and Ambulance Logistics**.
- **Professional Tier**: Adds **Inpatient (IPD) Admissions, Bed Tracking, Revenue Cycle (Billing & Insurance), and the Master Service Engine**.
- **Enterprise Tier**: Unlocks **AI Diagnostic Vision, Blood Bank Hub (Donor Registry), HR/Payroll (Staff Management), and Peer Collaborative Chat**.

### 5.2 Institutional Branding & Masters
Tenant Admins (at Professional/Enterprise tiers) have access to the **Institutional Control** workspace:
- **Hospital Settings**: Change branding colors (Primary & Accent) and upload the institutional logo.
- **Departments Master**: Define clinical specialties and administrative shards with institutional coding.
- **Bed & Ward Management**: Monitor real-time ward throughput and bed occupancy telemetry.

---

## 6. 🤖 AI Chat Assistant
The system includes a context-aware virtual assistant to help with clinical logistics.

- **How to Open**: Click the floating bubble in the bottom-right corner.
- **Supported Queries**:
    - **Navigation**: "Go to pharmacy", "Show me patients".
    - **Status Checks**: "Is John Doe checked in?", "Who is current doctor?".
    - **Inventory**: "Do we have 500mg Paracetamol?".
    - **Stats**: "How many patients today?".
