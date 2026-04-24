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
- **Service Engine**: Configure consultation, lab, and bed-stay rates for the hospital.

---

## 6. 👥 HR & Accounts (Enterprise Only)
As an HR or Accounts Manager, you handle the institutional backend operations.

### 6.1 HR Mastery
- **Employee Lifecycle**: Manage the **Employee Master** (Identity, Join Date, Salary).
- **Workforce Attendance**: Log daily check-ins and review leave applications in the **Attendance Hub**.
- **Payroll Pulse**: Review salary-linked attendance data to generate monthly payroll summaries.

### 6.2 Revenue & Accounts
- **Revenue Tracker**: Monitor real-time collection stats (Cash/Card/Insurance) on the **Accounts Dashboard**.
- **Expense Logging**: Capture facility costs (Utility, Rent, Consumables) to maintain the **General Ledger**.
- **Claims Registry**: Manage insurance provider relationships and track claim settlement lifecycles.

---

## 7. 🚑 Emergency & Collaboration
Specialized modules for high-velocity hospital environments.

### 7.1 Ambulance Logistics (EMS)
- Monitor the **Ambulance Fleet** in real-time.
- Track dispatcher logs and vehicle availability (Available/On-Mission).

### 7.2 Staff Collaborative Hub
- Use the **Peer Chat** for real-time departmental coordination.
- Share clinical protocols and task assignments within the clinical team.

---

## 8. 🤖 Clinical AI & Analytics
Interactive tools for data-driven care and navigation.

- **AI Chatbot助理**: Click the floating bubble for instant navigation, patient lookups, and operational stats.
- **Clinical AI Vision**: (Enterprise) Generate automated treatment suggestions and longitudinal snapshots using **Gemini-1.5-Flash**.
- **Predictive Dashboards**: (Management) View revenue trends and provider performance analytics for strategic decision-making.

---

## 9. 🛡️ Platform Governance (Superadmin Only)
Managing the platform ecosystem and scaling institutional growth.

### 9.1 Tenant Provisioning
- **One-Click Scaling**: Create new healthcare workspaces with dedicated subdomains.
- **Credential Dispatch**: The system automatically provisions a default administrator and securely emails the activation token to the institutional contact.

### 9.2 Growth & Offers
- **Offer Announcements**: Broadcast institutional upgrades and promotional tiers directly to tenant dashboards.
- **Feature Overrides**: Granularly enable or disable specific modules for any tenant in the **Feature Management** portal.
