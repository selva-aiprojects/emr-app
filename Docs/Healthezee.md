**HEALTHEZEE**

_Healthcare Management System (HMS)_

**Feature-Driven Product Functionality & Technical Document**

| Product | Healthezee - HMS |
| --- | --- |
| Company | Whitekraaft Solutions LLP |
| Document Version | PM Specification v1.0 |
| Status | Draft |
| Document Date | 26-Mar-2026 |
| Scope | Outpatient (OP) with basic AI AnalyticsInpatient & Standard AI AnalyticsEnterprise with Advanced AI Analytics |

# Executive Summary

Healthezee is a cloud-based, multi-tenant Hospital Management System (HMS) designed for doctors, clinics, nursing homes, and large hospitals. This document presents the product roadmap organized by core features, indicating the features available in different features using React.js / Next JS and Node JS with Backend as SQL that will be coded using latest technologies. And features that are yet to be implemented from scratch. The product focuses on Outpatient (OP), In patient (IP) workflows and AI Analytics features with a planned phase wise introduction of the features.

**Version 1** – Outpatient + Basic AI Analytics

**Version 2** – Version 1 + Inpatient with the Outpatient + Standard AI Analytics

**Version 3** – Version 2 + Additional ERP based features + iOT AI Analytics

## Feature Status Overview

| Feature Module | Description | Version Onwards Availability |
| --- | --- | --- |
| OP (VERSION 1) | This is OP module. Available in Version 1 and onwards. | 1 |
| RBAC (Role Based Access Control Management) | Role Based Access Control based on Super Admin, Admin and Doctors, Staff, Patients | 1 |
| Patient Management | Registration, Vitals, Profile, EMR, History | 1 |
| OPD Appointment / Scheduling Management | Booking, Scheduling, Rescheduling, Cancelling and Deleting Appointments, Calendar Management | 1 |
| OPD Consultation | Consultation Flow, Diagnoses (ICD-10) | 1 |
| Prescription Management | Digital Medical & Lab Prescriptions | 1 |
| Electronic Medical Records (EMR) | Patient vitals, initial assessment, medical records management & history of all patientsList view with clickable details | 1 |
| Lab Management | Lab Tests Setup, Lab Results Tracking & Lab reports generationLab Scan report + Manual reportLab device integration?? - TBCs | 1 |
| Billing Only | Billing ModuleDoctor ConsultationLab tests | 1 |
| Access Control | Role Based Access Control. Include from version 1 onwards. Add more roles for higher versions | 1 |
| IP (VERSION 2) | This is IP module. Available in Version 2 and onwards. | 2 |
| Billing with Insurance | Billing ModuleDoctor ConsultationLab testsPharmacyInsurance (API to 3rd party insurance apps) | 2 |
| Pharmacy | Pharmacy, Billing, Integration with Drug inventoryPharmacy with viewable / storable prescription | 2 |
| Pharmacy/ Drug Inventory | Stock Alerts & Stock replenishmentIntegration with PharmacyPharmacy -> Drug Inventory updated | 2 |
| Revenue Management - Institutional Service Catalog | Manage standardized clinical procedures, diagnostic pricing, and facility service shards for New Age Hospital. | 2 |
| Facility Settings | Manage Authentications, Branding Colors, Financial Codes | 2 |
| Bed Management | Addition of BedsAdmission in BedsMap bed to patient and the roomTransfer of BedsRemoval of BedsLink to Billing | 2 |
| Theatres/ Surgery | Inpatient surgery advice in the consultation room or IP consultation.Surgery detailsDoctor’s availabilityPatient’s availability based on pre-admission tests, pre-surgery testsPreparations wrt Stock and Drug InventoryCalendar SchedulingStatus updatesRoom / Surgery room/ICU/ ICCU/Recovery Room/ Room shift | 2 |
| ERP (VERSION 3) | This is Advanced ERP module. Available in Version 3 | 3 |
| General Stores/ Stock Inventory | Inventory, Stock addition, Replenishment, Alerts, for pharmaceuticals, Consumables, Diagnostics, Surgical, General Supply | 3 |
| Emergency Fleet Control (Ambulance) | Pre-Hospital ResponseRegister the fleet/ ambulanceInitiate Response protocolProvide the landmark for pickupTrack the fleet on realtime GPS | 3 |
| Blood Bank Hub | Register DonorTrack active donorsBlood UnitsEmergency RequestsSuccess ratesBlood typeRecent registrations, requirements, donors and flow | 3 |
| Communication Center | Internal Notice BoardStandard messages for internal communication. | 3 |
| Records Library | Document VaultUpload and save documents for each patientInclude documents generated from HMS app itself for particular role/ incident | 3 |
| Staff Communication Hub | Chat Session for different group communication across staff members. Such as Lab Alerts, Fleet response, Emergency Room | 3 |
| Staff Management | Manage the Attendance, Salary, Leaves, Availability including g roaster for the Nurses/ Labs/ technicians/ Outsources facilities like Hospitality, Housekeeping, Ward Boys, Security Guards | 3 |

**To confirm with Selva on the following:**

*   Recheck the Version 1, 2 and 3 features in terms of ease and simplicity of implementation including pricing.
*   For Repeat Patient – Need to Continuously refresh the summary??
*   How long should the data be stored. Archive data time frame (To check on compliance and audit)

# 1\. Authentication & Role Management

## 1.1 Multi-Tenant Cloud Architecture

*   Strict single-schema data isolation using parameterized PostgreSQL queries enforced by `requireTenant` middleware.
*   Frontend completely automates `x-tenant-id` header injection for guaranteed tenant boundary locking.
*   Zero-Trust Superadmin policy: Platform admins cannot natively mutate tenant states without an explicit "break-glass" context shift.
*   Multiple hospitals, clinics, and nursing homes operate with completely isolated logic within the same scalable engine.

| Component | Implementation Status |
| --- | --- |
| Cloud-based Multi-tenant Platform | Yes |
| On-Premise with Cloud Sync | To confirm the technical approach. |

## 1.2 User Authentication & Login

| Feature | Implementation Status |
| --- | --- |
| Basic Secure Login (Admin/Doctor) | Yes |
| Two-Factor Authentication (2FA) | To be confirmed |
| Separate Role-Based Login Interfaces | Tenant-based authentication is the primary login flow implemented.Both Superadmin and Tenant Admin can create usersSupports all roles: Admin, Doctor, Nurse, Front Office, Billing, Inventory, Patient |
|  |  |

## 1.3 Role-Based Access Control (RBAC)

The system supports three primary roles with hierarchical permissions:

| Module | Admin | Dr. | Nurse | Lab | Pharm | F.Office | Acc. | HR | Mgmt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hospital Dash | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| EMR / Records | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Appointments | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Inpatient/Bed | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Billing/Claims | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Pharmacy/Inv | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Lab/Results | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Accounts/Day | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| HR/Payroll | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Ambulance/EMS | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| AI Vision Deck | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Staff Chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
|  |  |  |  |  |  |  |  |  |  |

## 1.4 Super Admin Features

**Super Admin has access to the Platform module.**

*   *   1.  Dashboard showing all tenants
        2.  Metrics: Total Tenants, Users, Patients, Appointments
        3.  Per-tenant breakdown: Users, Patients, Appointments, Revenue

# 2\. Patient Management

## 2.1 Patient Registration

*   New patient registration with comprehensive demographic and medical information collection.
*   Searchable by mobile number, email, or patient name.

| Data Field | Implementation Status |
| --- | --- |
| First Name, Last Name, DOB, Gender, Phone, Email, Address, Blood Group, Emergency Contact, Insurance, Chronic Conditions, Allergies, Past Surgeries, Family History | Comprehensive health profile collection:Personal info: First Name, Last Name, DOB, Gender, Phone, Email, AddressMedical info: Blood Group, Emergency Contact, InsuranceClinical info: Chronic Conditions, Allergies, Past Surgeries, Family HistoryMedical Record Number (MRN) auto-generated |
| Medical Record Number (MRN) auto-generated | This should be linked to ABHA/Government Health ID Integration. |

## 2.2 Patient Profile Management

*   View and edit patient demographics
*   Medical history tracking and updates
*   Vitals recording (Blood Group, etc.)
*   Patient archival (preserve historical records)
*   Approval workflow for CRUD operations

| Feature | Implementation Status |
| --- | --- |
| View/Edit Patient Profile | Implemented |
| Medical History Summary during prescription | Implemented |
| AI based patient history available to doctors during prescription | Implemented |
| Patient Archival Mechanism | Planned |
| Approval workflow for CRUD operations | Planned |
|  |  |

# 3\. Doctor Management

## 3.1 Doctor Registration & Profile, Availability & Scheduling, Performance Analytics

| Feature | Implementation Status |
| --- | --- |
| Add new doctor with complete credentials (Name, Specialty, License/ Registration #, Contact), Years of experience, consultation fees, rating systemProfile image upload (local or URL-based)Doctor availability calendar scheduling | Implemented |
| Unique Doctor ID generation (for future ABHA/Government systems). | Planned |
| Calendar-based availability management allowing admins and doctors to set working hours, consultation slots, and manage time zones. | Implemented |
| Total consultations per doctor | Implemented |
| Graphical trend analytics - Yet to implementFollow-up rates and patient retentionPatient satisfaction ratings | Planned |

# 4\. Appointment Management

## 4.1 Appointment Booking & Scheduling

| Feature | Implementation Status |
| --- | --- |
| Book appointments based on doctor availability | Implemented |
| View appointment calendar | Implemented |
| Appointment status trackingrequestedscheduledchecked_incompletedcancelledno_show | Implemented |
| Automated appointment rescheduling workflow | In Progress |
| Auto-archival of old appointments (>30 days, no follow-up) | Planned |

# 5\. Consultation & Electronic Medical Record (EMR)

## 5.1 Consultation Workflow & Electronic Health Record (EHR)

| Component | Implementation Status |
| --- | --- |
| Doctor initiates consultation from appointment list | Implemented |
| Access to patient demographics, vitals, and medical history | Implemented |
| Patient summary displayed on consultation start | Implemented |
| AI-based summary of patient records (diagnoses, past treatments) | Implemented |
| Automatic ICD-10 diagnosis code suggestion (AI-assisted) | Implemented |
| Patient medical history recording | Implemented |
| Diagnoses with ICD-10 codes | Implemented |
| Structured Clinical Notes Templates | Implemented |
| Digital & Scanned Prescription Integration | Implemented |
| Medication reconciliation system | Planned |

# 6\. Prescription Management

## 6.1 Digital Prescription Creation

| Data Flow Element | Implementation Status |
| --- | --- |
| Add medications during consultation | Implemented |
| Set frequency, dosage, and durationPrescription-to-Pharmacy integration | Implemented |
| View previous prescriptions for patient | Implemented |
| Link prescriptions to lab recommendations | Implemented |
| Prescription printing and PDF export | Implemented |
| Digital prescription signing with doctor credentials | Implemented |
| integration for scanned prescriptions | Planned |

## 6.2 Prescription Data Flow

| Data Flow Element | Implementation Status |
| --- | --- |
| Prescription-to-Pharmacy integration | Implemented |
| Lab test recommendation | Implemented |
| Pharmacy stock sync | Implemented |
| Prescription reminder notifications (SMS/Email/WhatsApp) | Planned |

# 7\. Laboratory Management

## 7.1 Lab Test Setup & Configuration

| Feature | Implementation Status |
| --- | --- |
| Doctor prescribes lab tests during consultation | Implemented |
| Lab order creation and tracking | Implemented |
| Sample collection acknowledgment | Implemented |
| Lab report upload (PDF/Digital format) | Implemented |
| Report status tracking (Pending → Ready → Delivered) | Implemented |
| Patient notification when reports ready (SMS/Email/WhatsApp) | Planned |

## 7.2 Lab Orders & Report Management

| Feature | Implementation Status |
| --- | --- |
| Doctor prescribes lab tests during consultation | Implemented |
| Lab order creation and tracking | Implemented |
| Sample collection acknowledgment | Implemented |
| Lab report upload (PDF/Digital format) | Implemented |
| Report status tracking (Pending → Ready → Delivered) | Implemented |
| Patient notification when reports ready with download link (SMS/Email/WhatsApp) | Planned |

## 7.3 Lab Report Access & Distribution

| Feature | Implementation Status |
| --- | --- |
| Admin access to all the lab reports | Implemented |
| Doctor access to patient lab reports once marked ready | Implemented |
| Patient portal for downloading reports | Planned |
| Print integration for clinic-based report pickup | Implemented |

# 8\. Pharmacy & Drug Inventory Management

## 8.1 Drug Inventory Setup

| Feature | Implementation Status |
| --- | --- |
| Add/edit/delete drugs | Implemented |
| Set price per drug | Implemented |
| Track expiry dates | Implemented |
| Stock level management | Implemented |
| Automated low-stock alert system | Implemented |

# 8.2 Pharmacy Integration

| Feature | Implementation Status |
| --- | --- |
| Prescribed medications auto-populate in pharmacy dispensing list | Implemented |
| Real-time pharmacy stock sync | Implemented |
| Pharmacy billing integration | Implemented |

# 9\. Billing & Insurance Management

## 9.1 Billing Features

| Feature | Implementation Status |
| --- | --- |
| Generate bills for consultations and procedures | Implemented |
| Include lab tests and prescribed medicines in billing | Implemented |
| Track payment status and transaction history | Implemented |
| Currency conversion based on country/region (internationalization) | Planned |
| Insurance claim integration (TPA/Cashless workflows) | Planned |
| Insurance claim tracking and follow-up | Planned |

## 9.2 Billing

| Component | Implementation Status |
| --- | --- |
| Basic billing generation | Implemented |
| Cost Governance & Financial Sharding | Implemented |
| Consultation fee collection | Implemented |
| Lab/Pharmacy charges inclusion | Implemented |
| Multi-payment method support | Implemented |
| Insurance TPA integration | Planned |
| Claim pre-authorization | Planned |
| Claim rejection tracking & appeals | Planned |

# 10\. Admin Dashboard & Analytics

## 10.1 Dashboard Overview

| Component | Implementation Status |
| --- | --- |
| Basic Number statistics for Doctor, Admin | Implemented |
| Visual trend graphs (appointments, doctors, patients, patient flow) | Implemented |
| Quick action buttons (Add Doctor, Book Appointments, View Appointments) | Implemented |
| Time-based view toggle (Daily, Weekly, Monthly, Yearly) | Planned |
| KPI cards (Total Doctors, Patients, Appointments, Completed, Cancelled) | Implemented |
| Recent activity log with doctor-specific actions | Implemented |
| Revenue tracking per doctor | Implemented |
| Revenue Statistics | Implemented |
| Appointment Queue | Implemented |

## 10.2 Admin Analytics Features

| Analytics Component | Implementation Status |
| --- | --- |
| Basic Number statistics for Doctor, Admin | Implemented |
| Doctor performance tracking | Planned |
| Patient disease/treatment analytics | Implemented |
| Billing analytics per doctor | Implemented |
| Lab/Pharmacy income tracking | Implemented |
| No-show rate analysis | Planned |
| Follow-up recommendation tracking | Planned |
| --- To add more ---- | Planned |
|  |  |
|  |  |

# 11\. Doctor Dashboard & Personal Analytics

## 11.1 Doctor Overview

| Doctor Dashboard Feature | Implementation Status |
| --- | --- |
| Doctor-specific patient list and consultation statistics | Implemented |
| Personal schedule and upcoming appointments | Implemented |
| Patient satisfaction ratings | Planned |
| Graphical trend analytics (consultations, revisit rates) | Planned |
| Revenue tracking for own consultations | Implemented |

## 11.2 Doctor Consultation Dashboard

| Doctor Dashboard Feature | Implementation Status |
| --- | --- |
| View today's appointment schedule | Implemented |
| Access patient vitals, demographics and history | Implemented |
| Start consultation and record diagnoses | Implemented |
| AI-based patient summary | Implemented |
| Real-time lab reports display | Implemented |
| Consultation analytics (time, revisits) | Implemented |
| Patient feedback integration | Planned |
| Treatment outcome tracking | Planned |

# 12\. Employee Master & HR Management

## Features:

## Employee Master:

*   Name, Employee Code, Department, Designation
*   Join Date, Shift (Morning/Evening/Night)

## Salary information

## Shift Coverage: Shift assignment per employee

## Salary Details: Salary field in employee record

## Leave Management:

*   Leave application (Casual, Sick, Earned)
*   Leave balance tracking
*   Leave status management

# 12\. User Interface & Branding

## 12.1 UI Design Standards

*   Responsive design (mobile, tablet, laptop)
*   Left sidebar navigation menu (role-based)
*   Pastel green color palette (hospital-aligned)
*   Round-edge dialog boxes and clean typography
*   Logo and branding in header/footer
*   Dark mode support
*   Accessibility compliance

## 12.2 Branding Elements

*   Application logo displayed transparently in header
*   Brand name "Healthezee" prominently displayed
*   Copyright footer: © Whitekraaft Solutions LLP (Proposed Whitekraaft and Cognivectra joint venture in future)

# 13\. Notifications & Messaging System

## 13.1 Notification Channels

*   SMS alerts (Profile changes, Reports ready)
*   Email notifications (Appointment confirmation)
*   WhatsApp alerts (Lab report ready)
*   In-app push notifications
*   Doctor alerts (Lab reports available)
*   Patient notifications (Appointment reminders)
*   Admin alerts (System events)

# 14\. System Settings & Configuration

## 14.1 Organization Settings

*   Clinic or Hospital Organization name and contact details
*   Supported medical specialties (checkboxes)
*   Working hours and holidays configuration
*   Multi-location support
*   Department/ward configuration (for IP module)

## 14.2 System Configuration

*   Appointment archival threshold configuration (default >30 days)
*   Default currency and billing tax settings with internationalization.
*   SMS/Email provider integration settings
*   HIPAA/GDPR/DPDP compliance configuration

# 15\. Compliance & Data Security

## 15.1 Healthcare Data Regulations

*   HIPAA (US Market)
*   GDPR (EU Market)
*   DPDP (India Market)
*   HL7/FHIR API Integration
*   ICD-10 Diagnosis Codes
*   Data Encryption (Rest & Transit)
*   Audit logging & Access controls

## 15.2 Government Health ID Integration

*   ABHA (Ayushman Bharat Health Account) integration
*   Arogya Setu integration for national health records
*   Health record synchronization with government systems
*   Ensure Unique Patient ID linking to government health IDs

# 16\. Other Important Features

# Print Documents

*   *   **Available Print Types:**
        1.  Invoice
        2.  Health Record
        3.  Test Reports
    *   **Implementation:** Print buttons available within patient details section

# Bulk Import/ Export

1.  Importing/Exporting of libraries (Drug, Patient, Doctor, etc.,) as bulk should be a built in feature for each library. This is especially important while configuring the application in new installations and/or upgrades
2.  A mechanism to import the existing data from the existing system to our Healthezee

# Audit capture

All the transactions, actions performed in the system shall be captured as an audit entry with timestamps

# Login Module

Authentication and Authorisation of users through the login page.

(Recommendation: Keycloak can be used for this purpose of authenticating and authorizing the users of Healthezee. )

1.  Authenticate the user against the user name and password
2.  Authorize the user against the assigned role which inturn has the permissions associated

# Billing Module

1.  Provision to record the payments from Patients by indicating the payment amount, cash or digital payment, paid by, PatientType, paid for (consultation or followup), paid for patientID, etc.,
2.  Bill shall be generated and printed copy is given to the patient/caretaker

# Consultation (Doctor login and Patient diagnosis)

1.  Update the vitals of the Patient as part of the consultation by the Nurse or by the doctor
2.  Diagnose the patient by the doctor and enter diagnosis
3.  Prescribe the medicine
    1.  and/or Suggest Lab tests (Blood test, Xray, Scan)
    2.  and/or suggest a followup with/out the lab results
4.  Prescribed medicine should flow down to the Pharmacy module/system

# Reports & Print generation

1.  All the KPIs shall be available in the report format
2.  Patient visit summary (Patient wise or Doctor-Patient wise, Speciality-Patient wise, etc.,)
3.  Patient Prescription
4.  Lab reports
5.  Discharge Summary (Future development applicable for IP)
6.  **Report Types:**
    1.  **Periodical Reports:**
        1.  Daily Appointments
        2.  Open Appointments
        3.  Pending Invoices
    2.  **Monthly Comparison:**
        1.  Appointments by month
        2.  Revenue by month
    3.  **Tax Reporting:** Total tax calculation (if applicable)

# 16\. Product Roadmap - Future Enhancements

## 16.1 Day Care (DC) Module (Futuristic)

*   Day care procedures and treatments
*   Limited bed management for day procedures
*   Pre-operative and post-operative workflows
*   Extended billing for day care services

## 16.2 Home Care Module (Futuristic)

*   Home care patient enrollment and scheduling
*   Field staff (nurse/technician) assignment
*   Vital signs collection at patient home
*   Telehealth capability for remote consultations for Doctor (To discuss and call this out in a separate module)
*   Real-time location tracking for home care staff

## 16.3 Advanced Analytics & AI Features Suggested

*   Patient Medical History Summarization - Automatic patient summary on doctor login
*   Diagnosis Assistance (ICD-10 coding) - AI-assisted diagnoses from symptoms
*   Drug Interaction Checker - Alert on unsafe medication combinations
*   No-Show Prediction - Identify high-risk cancellation patients
*   Readmission Risk Scoring - Predict patients needing close follow-up
*   Prescription Optimization - Suggest cost-effective alternatives
*   Lab Report Interpretation - AI summary of abnormal lab values
*   Treatment Outcome Analytics - Track treatment effectiveness across patients
*   X-Ray/Ultrasound Report Analysis - OCR + AI interpretation of radiology reports
*   Real-time Vitals Anomaly Detection - Alert on critical vital sign changes

# 17\. Patient Portal (Future Enhancement)

## 17.1 Patient Self-Service Features

*   Patient registration and profile management
*   Appointment booking and rescheduling
*   View medical history and past consultations
*   Download prescriptions and lab reports
*   Leave reviews and feedback for doctors
*   View upcoming lab collections/procedures
*   Pay bills online

# 18\. Clinical Workflow Scenarios

## 18.1 Outpatient (OP) Consultation Workflow

Patient Registration → Appointment Booking → Billing Payment Confirmation → Vitals Collection → Doctor Consultation → Prescription/Lab Orders → Lab Billing -> Pharmacy/Lab Execution -> Pharmacy Billing

## 18.2 Follow-up Consultation Workflow

Existing Patient Appointment → Billing → Vitals Collection → Consultation → Prescription/Lab Orders → Follow-up Flag Set

## 18.3 Inpatient (IP) Admission & Billing Workflow

OP Consultation → IP Admission Decision → Bed Allocation → Billing / Insurance (Extended) → Vital Signs Monitoring → Medication Administration → Surgery -> Lab/Imaging Orders → Discharge Procedures.

## 18.4 Outpatient Billing Workflow

OP Patient registers → Appointment booked → Billing generated → Payment confirmation → Consultation enabled

# 19\. Product Quality Metrics & KPIs

## 19.1 System Performance KPIs (To be discussed with the Architect team)

| KPI | Target | Measurement |
| --- | --- | --- |
| System Uptime | 99.5% | Continuous monitoring |
| Page Load Time | <2 seconds | Performance metrics |
| Consultation Workflow Time | <10 minutes | User timing logs |
| Data Sync Latency | <5 seconds | Real-time analytics |
| Mobile Responsiveness | 100% | Responsive design audit |
| User Error Rate | <1% | Error logging |
| Report Generation Time | <1 minute | PDF generation tracking |
| API Response Time | <500ms | API monitoring |

## 19.2 Business KPIs

*   Daily Active Users (DAU) and Monthly Active Users (MAU)
*   Consultation conversion rate (Appointments → Completed)
*   Patient retention rate (Revisit rate)
*   Doctor productivity (Patients/day)
*   Average ticket resolution time
*   System downtime incidents per month

# 20\. Technical Architecture & Deployment

| Component | Technology | implementation Status |
| --- | --- | --- |
| Frontend | React.js (18) / Vite (SPA) | Implemented |
| Backend | Node.js (Express) | Implemented |
| Database | PostgreSQL (Pool-Driven) | Implemented |
| Cloud Infrastructure | Docker Containerization | Implemented |
| AI Intelligence | Google Gemini-1.5-Flash | Implemented |
| API Layer | RESTful APIs (Express Middleware) | Implemented |
| Authentication | Stateless JWT (RS256) | Implemented |
| Messaging / Events | Global Toast Notification System | Implemented |
| Design System | Critical Care Design System (Vanilla CSS + Lucide) | Implemented |
| Analytics & Vis | Apache ECharts | Implemented |

## 20.2 Deployment Architecture

*   Cloud-based SaaS deployment (Multi-tenant)
*   On-premise deployment option with cloud sync
*   Hybrid deployment model support
*   Containerized deployment (Docker/Kubernetes)
*   CI/CD pipeline for automated testing & deployment

# 21\. Approval Workflows & Data Governance

## 21.1 CRUD Operation Approvals

All create, update, and delete operations for critical entities require approval based on role permissions.

| Entity | Operation | Approval Required By |
| --- | --- | --- |
| Patient | Add/Edit/Archive | Admin |
| Doctor | Add/Edit/Archive | Admin |
| Medicines | Add/Edit/Delete | Admin/Pharmacist |
| Lab Tests | Add/Edit/Delete | Admin/Lab Manager |
| Inventory Items | Add/Edit/Delete | Admin/Inventory Manager |
| Prescriptions | Submit | Doctor |
| Billing | Finalize | Billing Admin |
| Lab Reports | Approve for Release | Lab Manager/Doctor |

## 21.2 Data Retention & Archival (To confirm)

*   Patient records: Permanent (unless anonymized for research)
*   Appointment history: 5+ years for audit trail
*   Billing records: 7 years (accounting/tax compliance)
*   Lab reports: Permanent for medical-legal purposes
*   Consultation notes: Permanent for continuity of care
*   GDPR "Right to be Forgotten" workflow (data deletion on request)

# 22\. Testing & Quality Assurance Strategy

## 22.1 Testing Scope

*   Unit Testing: Backend APIs and data models
*   Integration Testing: Individual Workflows
*   End-to-End Testing: Complete end to end workflows
*   Performance Testing: Concurrent users (100+) stress testing
*   Security Testing: vulnerability scanning
*   Accessibility Testing: TBD VPAT?
*   User Acceptance Testing (UAT): With actual doctors/hospitals

## 22.2 Bug Severity & SLA

| Severity | Impact | Fix SLA | Examples |
| --- | --- | --- | --- |
| Critical | System down / Data loss | 1 hour | Login failure, Data corruption |
| High | Feature broken | 24 hours | Prescription not saving, Billing error |
| Medium | Feature degraded | 3 days | Slow page load, UI misalignment |
| Low | Minor cosmetic | 7 days | Typo, Color adjustment |

# 23\. External Integrations & Dependencies

## 23.1 Third-Party APIs & Services (TBD)

| Integration | Purpose | Status |
| --- | --- | --- |
| SMS Provider (Twilio/AWS SNS) | Appointment/Report notifications | Planned |
| Email Service (SendGrid/AWS SES) | Email notifications | Planned |
| Payment Gateway (Razorpay/Stripe) | Online billing | Planned |
| Lab/Radiology Systems | Digital report submission | Implemented |
| Pharmacy Management System | Inventory & billing sync | Implemented |
| ABHA/Health ID APIs | Patient ID integration | Planned |
| HL7/FHIR Standards | Interoperability | Planned |
| IoT Device APIs | Vitals monitoring devices | Planned |
| Video Conferencing (Zoom/Jitsi) | Telemedicine support | Planned |
| Analytics Platform | Business intelligence | Implemented (Gemini) |

# 24\. Support & Maintenance Strategy

## 24.1 Ongoing Support Model

*   Tier-1: Email & Help desk support (24-48hr response)
*   Tier-2: Phone support (Business hours)
*   Tier-3: On-site implementation & custom training
*   Emergency support: Critical production issues

## 24.2 Software Maintenance

*   Monthly security patches and updates
*   Quarterly feature releases
*   Annual major version upgrades
*   Continuous performance optimization
*   Backward compatibility with existing implementations

# 25\. Success Criteria & Launch Gates

## 25.1 Phase 1 (OP) Launch Criteria

*   ✓ All critical features production-ready
*   ✓ 99.5% uptime in UAT environment
*   ✓ 0 critical bugs in regression testing
*   ✓ Doctor & Admin training complete
*   ✓ Documentation finalized
*   ✓ Security penetration testing passed
*   ✓ Data backup & recovery procedures validated

## 25.2 Phase 2 (IP/Analytics) Launch Criteria

*   All Phase 1 maintenance issues resolved
*   IP module fully tested with hospital partner
*   AI analytics models validated for accuracy
*   Compliance certifications (HIPAA/GDPR/DPDP) obtained
*   Government health ID integration tested
*   Scalability testing for 10,000+ concurrent users.