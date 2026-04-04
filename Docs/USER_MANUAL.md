# User Manual & Access Guide - MedFlow EMR

## 1. 🔑 Access Credentials (DEMO)

### 🛡️ Superadmin Access (Platform Governance)
- **Tenant**: Platform Superadmin
- **Email**: `superadmin@emr.local`
- **Password**: `Admin@123`
- **Role**: Superadmin (Manage tenants, features, and platform reports)

### 🏥 Enterprise Hospital (Full Features)
- **Tenant**: Enterprise Hospital Systems
- **Email**: `admin@ehs.local` (Admin)
- **Password**: `Test@123`
- **Role**: Admin (All hospital modules enabled)

### 🎭 Specialized Role Logins (Enterprise)
- **Doctor**: `doctor@ehs.local` / `Test@123`
- **Nurse**: `nurse@ehs.local` / `Test@123`
- **Pharmacist**: `pharmacy@ehs.local` / `Test@123`
- **Reception**: `frontdesk@ehs.local` / `Test@123`
- **Billing**: `accounts@ehs.local` / `Test@123`

---

## 2. 🚀 Quick Start Guide

1. **Access the App**: Navigate to `http://localhost:5174`.
2. **Select Tenant**: Choose the appropriate tenant from the login dropdown.
3. **Sign In**: Enter your email and password.
4. **Dashboard**: View your role-specific metrics upon entering the workspace.

---

## 3. 👨‍⚕️ Clinician & Doctor Workflows

### 3.1 Consultation & EMR
- **Patient Lookup**: Use the sidebar to search by Name or MRN.
- **New Recording**: Click "New Consultation" to start an encounter.
- **Vitals & Diagnosis**: Record Chief Complaints, BP, and HR in the glassmorphic form.
- **Rx Module**: Add medications specifying dosage, duration, and instructions.
- **Branded Rx**: Use the "Generate Prescription" button for a professional printout.

### 3.2 AI Assistance
- **Clinical Chatbot**: Use the floating Gemini bubble for queries.
- **Longitudinal Snapshot**: (Enterprise only) Generate clinical data summaries.

---

## 4. 💊 Pharmacy & Inventory Workflows

### 4.1 Prescription Dispensing
- **Dispense Queue**: View "Pending" prescriptions from clinical staff.
- **Finalize Dispense**: Clicking this marks the order as issued and decrements stock.

### 4.2 Stock Management
- **Visual Meters**: View real-time inventory levels in the "Inventory" module.
- **Restocking**: Controlled addition of resource units with an integrated audit trail.

---

## 5. 💰 Billing & Insurance Workflows

### 5.1 Invoicing
- **Generate Invoice**: Create financial records for consultations or diagnostics.
- **Payment Settlement**: Record payments via Cash, Card, or UPI with due balance tracking.

### 5.2 Insurance Claims
- **Registry**: Locate insurance providers by tenant settings.
- **Claim Processing**: Create and track claims linked to specific patient encounters.

---

## 6. 👥 HR & Operations Workflows

### 6.1 Employee Lifecycle
- **Employee Master**: Manage staff identities, departments, and salaries.
- **Attendance**: Log daily check-in/out and review leave applications.

### 6.2 Hospital Setup
- **Department Master**: Define specialties and administrative units.
- **Bed Stewardship**: Monitor real-time ward throughput and bed occupancy.

---

## 7. 🛡️ Platform Management (Superadmin)

### 7.1 Tenant Provisioning
- **One-Click Hospital Creation**: Add new tenants with dedicated schemas.
- **Feature Management**: Granularly toggle modules (Labs, Billing, AI) per tenant.

### 7.2 Growth & Monitoring
- **Offer Announcements**: Broadcast institutional upgrades to tenant dashboards.
- **Platform Analytics**: Global revenue and patient volume tracking.
