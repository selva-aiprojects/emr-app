# MedFlow EMR - User Manual & Access Guide

## 1. 🔑 Access & Authentication
To access the MedFlow platform, navigate to the provided application URL and select your institutional node from the tenant registry.

### 1.1 Verified Demo Credentials
The following identities are pre-provisioned for system validation:

| Tier | Role | Tenant | Email | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Platform** | **Superadmin** | `Platform Superadmin` | `superadmin@emr.local` | `Admin@123` |
| **Enterprise** | **Admin** | `Enterprise Hospital Systems` | `david@enterprise.hos` | `Test@123` |
| **Enterprise** | **Doctor** | `Enterprise Hospital Systems` | `michael@enterprise.hos` | `Test@123` |
| **Professional**| **Doctor** | `Professional Medical Center` | `robert@professional.med` | `Test@123` |
| **Basic** | **Doctor** | `Basic Health Clinic` | `sarah@basic.health` | `Test@123` |

---

## 2. 👨‍⚕️ Clinical Operations (Doctors/Nurses)
Manage the vertical patient lifecycle from consultation to longitudinal history.

### 2.1 Consultations & EMR
- **New Encounter**: Click "New Consultation" in the EMR workspace.
- **Vitals Telemetry**: Record real-time metrics (BP, Pulse, Temperature).
- **Clinical Journal**: View the longitudinal clinical record timeline in the sidebar.
- **℞ Prescriptions**: Add medications with dosage and frequency protocols.
- **Branded Rx**: Click "Generate Prescription" to produce a professional clinical summary.

---

## 3. 💊 Operational Workflows (Pharmacy/Lab)
Department-specific modules for fulfillment and diagnostics.

### 3.1 Pharmacy Dispensation
- **Workstation Queue**: Monitor pending prescription shards from clinical staff.
- **Finalize Dispense**: Issuing medications automatically synchronizes inventory levels.

### 3.2 Inventory Control
- **Pulse Indicators**: Visual meters show real-time stock vs. reorder points.
- **Stock Audit**: Use the "Restock" action to increment units with audit trail support.

---

## 4. 🏢 Revenue & Fiscal Governance (Admin)
Manage institutional branding, settings, and finance.

### 4.1 Master Governance
- **Institutional Branding**: Customize Primary/Accent colors and upload hospital logos in Admin Settings.
- **Revenue Dashboard**: Monitor collections (Cash/UPI/Card) and pending settlements.
- **Insurance Nexus**: Register providers and track the settlement lifecycle of claims.

### 4.2 Resource Management
- **Departments & Beds**: Configure specialties and monitor live bed occupancy telemetry.
- **HR & Workforce**: (Enterprise) Manage employee records, daily attendance, and payroll summaries.

---

## 5. 🛡️ Platform Control Plane (Superadmin Only)
Global oversight and ecosystem management.

### 5.1 Shard Provisioning
- **Tenant Onboarding**: Create new hospital workspaces with automated admin provisioning.
- **Global Broadcasts**: Dispatch "Strategic Offers" or system alerts to all active tenant nodes.
- **Feature Management**: Granularly override subscription modules for any specific tenant.

---

## 6. 🤖 Clinical AI & Collaboration
- **Geminai Chatbot助理**: Use the interactive bubble for instant navigation and data lookups.
- **AI Diagnostics**: (Enterprise) Generate automated longitudinal summaries and treatment snapshots.
- **Staff Hub**: Real-time departmental messaging for rapid clinical coordination.
