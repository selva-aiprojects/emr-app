# MedFlow EMR — Platform Feature Reference
### Subscription Tiers · Patient Journey · Technical Scope

> **Document Type:** Product Feature Reference
> **Audience:** User Group Demo · Healthcare Administrators · Sales & Pre-Sales
> **Version:** 2.0 · March 2026 *(Gap-resolved edition)*
> **Platform:** MedFlow — Multi-Tenant Electronic Medical Records System
> **Prepared by:** Senior Product & Technical Writing Team

---

## Table of Contents
1. [Tier Overview](#1-tier-overview)
2. [Detailed Feature Comparison](#2-detailed-feature-comparison)
3. [The Patient Experience Journey](#3-the-patient-experience-journey)
4. [Technical Scope & Limits](#4-technical-scope--limits)
5. [Why MedFlow?](#5-why-medflow)

---

## 1. Tier Overview

MedFlow is designed to scale with your practice — from a single-provider clinic getting started digitally, to a multi-specialty hospital demanding full operational control. Each tier is a **superset** of the one below it.

| | ⚪ **Free** | 🟢 **Basic** | 🔵 **Professional** | 🟣 **Enterprise** |
|---|---|---|---|---|
| **Best For** | Student clinics & solo hobbyists | Solo practitioners & small clinics | Growing multi-doctor practices & specialty centers | Multi-specialty hospitals & healthcare networks |
| **Example** | A clinic seeing 1–5 patients/day | A GP clinic seeing 20–50 patients/day | A 5–10 doctor practice with lab & pharmacy | A 100+ bed hospital with full clinical, HR & finance ops |
| **Core Promise** | Digital Patient List & Notes | Clinical ops + Pharmacy digitised | Full outpatient + complex inpatient | Complete hospital operating system |
| **Typical Users** | 1 staff members | 1–3 staff (Doctor + Nurse) | 5–20 staff (Doctors, Nurses, Pharmacy, Lab) | Unlimited staff across all departments |
| **Subscription Code** | `Free` | `Basic` | `Professional` | `Enterprise` |
| **Price (Official)** | ₹0 / month | ₹1999 / month | ₹5999 / month | ₹9999 / month |

---

## 2. Detailed Feature Comparison

### 2.1 🔐 Authentication & Platform Security

| Feature | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|:---:|:---:|:---:|:---:|
| Secure Email/Password Login | ✅ | ✅ | ✅ | ✅ |
| JWT Session Management | ✅ | ✅ | ✅ | ✅ |
| Multi-Tenant Data Isolation | ✅ | ✅ | ✅ | ✅ |
| TLS Encryption (Data in Transit) | ✅ | ✅ | ✅ | ✅ |
| Bcrypt Password Hashing | ✅ | ✅ | ✅ | ✅ |
| Role-Based Access Control (RBAC) | ✅ Core | ✅ Core | ✅ Extended | ✅ All 17 roles |
| Parameterized SQL (Injection Prevention) | ✅ | ✅ | ✅ | ✅ |
| Two-Factor Authentication (MFA) | — | — | — | ✅ |
| Audit Trail — All Key Actions | ✅ | ✅ | ✅ | ✅ Full log |
| Feature Flag Governance (Superadmin) | — | — | — | ✅ |
| Global Kill Switch (Emergency) | — | — | — | ✅ |
| Downgrade Safeguard Protocol | ✅ | ✅ | ✅ | ✅ |

**Roles available per tier:**

- **Free:** Front Office, Doctor, Nurse, Patient
- **Basic:** Same as Free (Pharmacy/Lab modules handled by Nurse/Doctor)
- **Professional:** All Basic roles + Lab Technician, Pharmacist, Management
- **Enterprise:** All Professional roles + Billing, Accounts, Insurance, Inventory, HR, Operations, Auditor, Support Staff

---

### 2.2 📋 Scheduling & Appointments

| Feature | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|:---:|:---:|:---:|:---:|
| Future Appointment Booking | ✅ | ✅ | ✅ | ✅ |
| Walk-in Registration (Fast Track) | ✅ | ✅ | ✅ | ✅ |
| Walk-in → Full Patient Conversion | ✅ | ✅ | ✅ | ✅ |
| Appointment Status Lifecycle | ✅ | ✅ | ✅ | ✅ |
| Real-Time Patient Queue (Doctor View) | ✅ | ✅ | ✅ | ✅ |
| Reschedule & Cancellation | ✅ | ✅ | ✅ | ✅ |
| Patient Self-Appointment Request | ✅ | ✅ | ✅ | ✅ |
| No-Show Tracking | ✅ | ✅ | ✅ | ✅ |
| Multi-Provider Scheduling | — | — | ✅ | ✅ |
| Emergency Encounter Workflow | — | — | ✅ | ✅ |
| Ward-Level Queue Visibility | — | — | — | ✅ |
| Automated Queue Optimisation | — | — | — | ✅ |

**Appointment Status Workflow:**
```
Requested → Scheduled → Checked In → In Progress → Completed
                      ↘ Cancelled                ↘ No-Show
                        Rescheduled → Scheduled
```

---

### 2.3 🏥 Patient Management (MPI)

| Feature | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|:---:|:---:|:---:|:---:|
| Patient Registration with MRN | ✅ | ✅ | ✅ | ✅ |
| Demographics Capture | ✅ | ✅ | ✅ | ✅ |
| Consent & Privacy Acknowledgment | ✅ | ✅ | ✅ | ✅ |
| Extended Health Profile | ✅ | ✅ | ✅ | ✅ |
| Insurance Data Capture | ✅ | ✅ | ✅ | ✅ |
| Clinical Background | ✅ | ✅ | ✅ | ✅ |
| Advanced Search | ✅ | ✅ | ✅ | ✅ |
| longitudinal Patient Timeline | ✅ | ✅ | ✅ | ✅ |
| Clinical Journaling | ✅ | ✅ | ✅ | ✅ |
| Print / Export Clinical Summary | ✅ | ✅ | ✅ | ✅ |
| Digital Health ID (ABHA) Auto-Gen | — | — | — | ✅ |
| Print Invoice | — | — | ✅ | ✅ |
| Print Lab / Test Reports | — | — | ✅ | ✅ |
| Multi-Location Registration | — | — | — | ✅ |

> **Note on Insurance:** Basic tier captures insurance data at registration (policy number, provider). The active insurance claim filing workflow — including pre-authorization and claim submission to a provider registry — begins at Professional tier.

---

### 2.4 🩺 Clinical Documentation (EMR)

| Feature | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|:---:|:---:|:---:|:---:|
| Encounter Documentation | ✅ | ✅ | ✅ | ✅ |
| OPD Encounter Type | ✅ | ✅ | ✅ | ✅ |
| IPD / Emergency Encounter Types | — | — | ✅ | ✅ |
| CPOE — Prescription Order Entry | ✅ | ✅ | ✅ | ✅ |
| Digital Prescription Output | ✅ | ✅ | ✅ | ✅ |
| Repeat Prescription Sub-Flow | ✅ | ✅ | ✅ | ✅ |
| Vitals Recording | ✅ | ✅ | ✅ | ✅ |
| Nurse Pre-Encounter Triage | ✅ | ✅ | ✅ | ✅ |
| Longitudinal History | ✅ | ✅ | ✅ | ✅ |
| Patient Feedback Recording | ✅ | ✅ | ✅ | ✅ |
| Doctor Recommendations | ✅ | ✅ | ✅ | ✅ |
| Lab Test Requests & Attachment | — | — | ✅ | ✅ |
| Inpatient Admission Management | — | — | ✅ | ✅ |
| Ward / Bed Occupancy Tracking | — | — | ✅ | ✅ |
| Discharge Protocol & Summary | — | — | ✅ | ✅ |
| Multi-Provider Notes | — | — | — | ✅ |
| Medication Reconciliation | — | — | — | ✅ |

---

### 2.5 💊 Pharmacy & Inventory

| Feature | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|:---:|:---:|:---:|:---:|
| Pharmacy Dispensing Queue | — | ✅ | ✅ | ✅ |
| Prescription Dispensing Status | — | ✅ | ✅ | ✅ |
| Inventory Item Master | ✅ | ✅ | ✅ | ✅ |
| Stock Level Monitoring | ✅ | ✅ | ✅ | ✅ |
| Low-Stock / Reorder Point Alerts | ✅ | ✅ | ✅ | ✅ |
| Transactions | ✅ | ✅ | ✅ | ✅ |
| Resource Categories | ✅ | ✅ | ✅ | ✅ |
| Restock Workflow | ✅ | ✅ | ✅ | ✅ |
| Inventory Deduction Audit Log | — | ✅ | ✅ | ✅ |
| Multi-Location Inventory | — | — | — | ✅ |
| Satellite Pharmacy Support | — | — | — | ✅ |

> **Pharmacy Audit Trail:** After every dispensing event, the system automatically creates an audit log entry: `Stock Deducted → Audit Log Created`. This provides a complete, tamper-evident record of every medication dispensed.

---

### 2.6 💰 Billing, Finance & Insurance

| Feature | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|:---:|:---:|:---:|:---:|
| Consultation Invoice Generation | — | — | ✅ | ✅ |
| Pharmacy Invoice Generation | — | — | ✅ | ✅ |
| Lab Invoice Generation | — | — | ✅ | ✅ |
| Lab Charges Auto-Linked | — | — | ✅ | ✅ |
| Payment Recording | — | — | ✅ | ✅ |
| Balance / Due Tracking | — | — | ✅ | ✅ |
| Invoice Status Lifecycle | — | — | ✅ | ✅ |
| IPD Discharge Settlement | — | — | ✅ | ✅ |
| Discharge Finalised Only After Payment | — | — | ✅ | ✅ |
| Insurance Claims Registry | — | — | ✅ | ✅ |
| Insurance Provider Registry | — | — | ✅ | ✅ |
| Insurance Pre-Authorization | — | — | — | ✅ |
| Custom Payment Gateway | — | — | ✅ | ✅ |
| Expense Logging | — | — | — | ✅ |
| Financial Ledger | — | — | — | ✅ |
| P&L and Balance Sheet | — | — | — | ✅ |
| Advanced Accounts Module | — | — | — | ✅ |
| IPD Billing Auto-Posts to Ledger | — | — | — | ✅ |
| **Concessions & Discounts** | — | — | — | ✅ |
| **Credit Billing & Credit Notes** | — | — | — | ✅ |
| **Billing Approval Workflows** | — | — | — | ✅ |
| **IP Billing with Refunds** | — | — | — | ✅ |
| **Cancellation Approval Workflows** | — | — | — | ✅ |
| **Final Bill Clearance** | — | — | — | ✅ |
| **Discharge Card Generation** | — | — | — | ✅ |
| **Insurance Pre-Auth Requests** | — | — | — | ✅ |
| **Pre-Auth Approval Processing** | — | — | — | ✅ |
| **Revised Pre-Auth Approvals** | — | — | — | ✅ |
| **Corporate Patient Bills** | — | — | — | ✅ |
| **Corporate Bill Registers** | — | — | — | ✅ |
| **Partial Insurance Coverage** | — | — | — | ✅ |
| **Patient Receivable Summary** | — | — | — | ✅ |

> **Insurance Trail by Tier:**
> - **Basic:** Insurance policy number and provider captured at patient registration. No claim flow initiated.
> - **Professional:** Active claim filing — claims linked to encounters, policy/claim number recorded, status tracked to resolution.
> - **Enterprise:** Full pre-authorization workflow at intake, before admission is confirmed.

> **Discharge Settlement Rule (All tiers with IPD):** Billing settlement must be marked **COMPLETE** before a patient discharge is finalised and a bed is released.

### 2.6.1 Advanced Billing Features (Enterprise Tier)

#### Concessions & Discounts
- **Doctor-Level Concessions**: Doctors can apply percentage or fixed amount discounts during consultation with configurable approval limits
- **Hospital-Level Concessions**: Administrative staff can apply institutional discounts for special cases (charity, VIP patients, etc.)
- **Approval Workflows**: Multi-level approval system for discounts exceeding predefined thresholds
- **Audit Trail**: Complete tracking of all concessions with reason codes and approver information

#### Credit Billing & Receivables
- **Credit Note Generation**: Automatic creation of credit notes for overpayments or adjustments
- **Patient Receivable Summary**: Comprehensive dashboard showing outstanding balances, credit notes, and payment history
- **Bill Clearance Tracking**: Automated tracking of credit utilization against outstanding bills
- **Aging Analysis**: Categorization of receivables by age (0-30 days, 31-60 days, 61-90 days, 90+ days)

#### Billing Approval Flows
- **Multi-Level Approvals**: Configurable approval hierarchies for bill modifications
- **Change Tracking**: Complete audit trail of all bill changes with before/after values
- **Approval Notifications**: Automated notifications to approvers via email/SMS
- **Escalation Rules**: Automatic escalation if approvals are not processed within defined timeframes

#### IP Billing with Refunds
- **Comprehensive IP Billing**: Detailed billing for inpatient stays including room charges, procedure charges, medication, and services
- **Refund Processing**: Streamlined refund workflows with approval requirements
- **Cancellation Workflows**: Structured cancellation processes with financial impact assessment
- **Final Bill Clearance**: Mandatory clearance confirmation before discharge processing
- **Discharge Card Generation**: Automated generation of discharge summaries with final billing information

#### Advanced Insurance Management
- **Pre-Authorization Requests**: Electronic submission of pre-authorization requests to insurance providers
- **Approval Processing**: Tracking and management of pre-authorization approvals
- **Revised Approvals**: Handling of revised pre-authorization amounts with automatic bill adjustments
- **Final Amount Reflection**: Automatic updating of final bills with approved insurance amounts
- **Corporate Patient Billing**: Specialized billing workflows for corporate/TPA patients
- **Corporate Bill Registers**: Dedicated tracking and reporting for corporate bill settlements
- **Partial Coverage Handling**: Seamless processing of bills with partial insurance coverage and balance payment through cash/card

---

### 2.7 👥 HR, Workforce & Payroll

| Feature | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|:---:|:---:|:---:|:---:|
| Employee Master | — | — | — | ✅ |
| Employee Code & Join Date | — | — | — | ✅ |
| Shift Assignment | — | — | — | ✅ |
| Attendance Tracking | — | — | — | ✅ |
| Leave Management | — | — | — | ✅ |
| Provider Productivity | — | — | — | ✅ |
| Payroll Reporting | — | — | — | ✅ |

---

### 2.8 📊 Reporting & Analytics

| Feature | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|:---:|:---:|:---:|:---:|
| Role-Scoped Dashboard | ✅ | ✅ | ✅ | ✅ |
| Daily Appointments Report | ✅ | ✅ | ✅ | ✅ |
| Open / Pending Cases Report | ✅ | ✅ | ✅ | ✅ |
| Monthly Appointment Trend | — | — | ✅ | ✅ |
| Monthly Revenue Trend | — | — | ✅ | ✅ |
| Pending Invoices Report | — | — | ✅ | ✅ |
| Tax Reporting Summary | — | — | ✅ | ✅ |
| Role-Constrained Access | ✅ | ✅ | ✅ | ✅ |
| Bed Occupancy Analytics | — | — | ✅ | ✅ |
| executive Narrative Cards | — | — | — | ✅ |
| Provider Performance | — | — | — | ✅ |
| Superadmin Cross-Tenant Metrics | — | — | — | ✅ |
| AI Clinical Insights (Gemini) | — | — | — | ✅ |
| AI Drug-Drug Conflict Alerts | — | — | — | ✅ |
| AI Lab Interpretation Engine | — | — | — | ✅ |
| Predictive Analytics (Trend) | — | — | — | ✅ |

---

### 2.9 🚑 Specialized Logistics & Collaboration

| Feature | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|:---:|:---:|:---:|:---:|
| Ambulance Queue Management | — | ✅ | ✅ | ✅ |
| Fleet Availability Tracking | — | ✅ | ✅ | ✅ |
| Emergency Dispatch Signal | — | ✅ | ✅ | ✅ |
| Staff Collaborative Hub | — | — | — | ✅ |
| Real-time Departmental Chat | — | — | — | ✅ |
| Task Assignment & Tracking | — | — | — | ✅ |
| Knowledge Sharing (Protocols) | — | — | — | ✅ |
| WhatsApp Clinical Deliveries | — | — | — | ✅ |
| Geminai Staff Assistant (Chatbot)| — | — | — | ✅ |

---

### 2.10 🎧 Platform Administration & Support

| Feature | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|:---:|:---:|:---:|:---:|
| Tenant Admin: User Management | ✅ | ✅ | ✅ | ✅ |
| Tenant Admin: Settings | ✅ | ✅ | ✅ | ✅ |
| Custom Branding & Logos | ✅ | ✅ | ✅ | ✅ |
| Help Desk Module | — | ✅ | ✅ | ✅ |
| Support Ticket Tracking | — | ✅ | ✅ | ✅ |
| Superadmin Ticket Resolution | — | ✅ | ✅ | ✅ |
| Superadmin: Provisioning | ✅ | ✅ | ✅ | ✅ |
| Superadmin: Tier Management | ✅ | ✅ | ✅ | ✅ |
| Institutional Offer Announcements | — | — | — | ✅ |
| Campaign Governance | — | — | — | ✅ |
| Superadmin: Flag Override | — | — | — | ✅ |
| API Access (Read-Write) | — | — | — | ✅ |
| Custom Workflows | — | — | — | ✅ |
| Data Export | — | — | — | ✅ |
| Multi-Facility Support | — | — | — | ✅ |

---

## 3. The Patient Experience Journey

This section describes the same patient interaction — from first contact to post-visit follow-up — across all three tiers. It illustrates the tangible difference in care quality and operational efficiency as you move up tiers.

---

### Stage 1: Discovery & Registration

```
PATIENT CALLS / WALKS IN
```

| Stage | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|---|---|---|---|
| **Channel** | Walk-in only | Phone / walk-in | Phone, walk-in, portal | All + institutional |
| **Registration** | Basic record (Name, Phone) | Full Demographics + MRN | Same + insurance/emergency | Same + pre-auth |
| **Consent** | Paper-based only | Recorded at intake | Same | Same + digital |
| **Walk-in Handling** | Fast-track | Fast-track + triage | Same | Same + Emergency type |
| **Appointment** | Staff schedules | Staff schedules | Portal self-request | Multi-provider calendar |

> **Value Delivered:** Every tier ensures zero paper-based registration. The patient is in the system — uniquely identified by MRN — from first contact. Consent is captured at the point of registration, satisfying clinical governance requirements.

---

### Stage 2: Pre-Consultation (Waiting & Check-in)

```
PATIENT ARRIVES → NURSE TRIAGE → CHECKED IN
```

| Stage | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|---|---|---|---|
| **Check-in** | Status update | Status update + history review | Same + allergies/chronic | Same + pre-vitals |
| **Nurse Triage** | — | Vitals captured | Vitals + clinical background | Same + real-time monitor |
| **Doctor Queue** | Real-time list | Real-time list | Multi-queue | Ward-level visibility |
| **History Review** | Basic timeline | Chronological timeline | Same + past lab results | Same + bed history |

> **Value Delivered:** The doctor never walks into a consultation blind. Full history is one click away. The dedicated Nurse Triage step ensures clinical context is captured *before* the consultation opens — cutting average consultation time by reducing information-gathering at the bedside.

---

### Stage 3: Consultation (The Clinical Encounter)

```
DOCTOR OPENS ENCOUNTER → DIAGNOSES → PRESCRIBES
```

| Stage | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|---|---|---|---|
| **Encounter Type** | OPD only | OPD only | OPD + IPD + Emergency | All Types |
| **Documentation** | Clinical notes | Notes + Vitals | Same + Lab Orders | Same + SOAP Structure |
| **Prescription** | Digital Rx | Digital Rx + Pharmacy Queue | Same | Same + Formulary |
| **Repeat Rx** | — | Abridged flow | Same | Same + Portal renewal |
| **Prescription Output** | Text-based summary | Branded PDF | Same | Same + Portal delivery |
| **Admission** | ❌ | ❌ | Ward & Bed Assignment | Same + Occupancy Dashboard |

> **Value Delivered:** The prescription is created once by the doctor and travels digitally to the pharmacy — eliminating handwriting errors and transcription delays. The repeat prescription sub-flow ensures chronic patients are served without an unnecessary fresh registration cycle.

---

### Stage 4: Pharmacy & Lab (Post-Consultation Services)

```
PATIENT → PHARMACY WINDOW | PATIENT → LAB COLLECTION
```

| Stage | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|---|---|---|---|
| **Pharmacy** | — | Queue + Dispensing | Same | Same |
| **Inventory Impact** | Manual | Stock Deducted | Same + Auto-reorder | Same + Multi-location |
| **Post-Dispense** | — | Audit Log Entry | Same | Same + Auditor View |
| **Lab Test** | — | — | Collection + Results Upload | Same + Auto-link |
| **Lab → Billing** | — | — | Charges auto-linked | Same |

> **Pharmacy Audit Trail:** After every dispensing event: `Dispensed → Stock Deducted → Audit Log Created`. This is a closed loop. No manual stock reconciliation is needed.

---

### Stage 5: Billing & Settlement

```
PATIENT → BILLING COUNTER / DISCHARGE
```

| Stage | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|---|---|---|---|
| **Invoice Gen** | — | — | Automatic charges | Same + IPD consolidation |
| **Payment** | — | — | Cash/Card/UPI | Same |
| **Insurance Claim** | — | — | Linked to Encounter | Same + Registry |
| **Pre-Auth** | — | — | — | Integrated Intake |
| **IPD Settlement** | — | — | Manual Clearance | System-enforced discharge |
| **Gateway** | — | — | Configurable | Same |

> **IPD Settlement Sequence (Professional & Enterprise):**
> 1. Doctor issues Discharge Order
> 2. Billing consolidates all charges (Consultation + Ward + Pharmacy + Lab)
> 3. Patient settles / Insurance claim submitted
> 4. Billing marks invoice **PAID** / **Insurance Pending**
> 5. ✅ Discharge is **finalised** → Bed status → **Available**

---

### Stage 6: Follow-up & Continuity

```
AFTER THE VISIT — WHAT HAPPENS NEXT?
```

| Stage | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|---|---|---|
| **Record Accessibility** | Patient timeline updated; any staff can review history on next visit | Same + past reports and lab results indexed on timeline | Same + full encounter history across multiple locations of the same network |
| **Follow-up Scheduling** | Staff creates follow-up appointment manually | Same + patient can self-request a follow-up via portal | Same |
| **Repeat Prescription Renewal** | Doctor issues new Rx on follow-up visit; previous prescription referenced for continuity | Same + renewal request flagged on patient timeline | Same + patient portal delivery; renewal audit trail |
| **Reports** | Doctor/Admin can view daily appointments & open cases | Same + monthly revenue/appointment trends | Same + executive analytics, provider performance payout summary |
| **Support** | — | Patient/staff can raise support tickets; tracked to resolution | Same + Superadmin governance visibility of all open tickets |
| **Audit / Compliance** | Core audit log (login, billing, claims, discharge) | Same | Same | Same + Auditor role with governance-level report visibility |
| **Emergency Logistics** | — | Ambulance availability visible; fleet dispatched | Same | Same + predictive fleet readiness |
| **Collaboration** | — | — | — | Real-time chat & task sync active across clinical teams |

---

## 4. Technical Scope & Limits

### 4.1 Tier Limits at a Glance

| Parameter | ⚪ Free | 🟢 Basic | 🔵 Professional | 🟣 Enterprise |
|---|---|---|---|---|
| **Active Modules** | Portfolio EMR | Core + Pharmacy/Lab | All + Inpatient | All + Enterprise Modules |
| **User Seats** | 1 seat | Up to 5 | Up to 25 | Unlimited |
| **Patient Records** | Up to 50 | Up to 500 | Up to 5,000 | Unlimited |
| **Encounter Types** | OPD | OPD | OPD, IPD, Emergency | All |
| **Report Depth** | Basic Daily | Comprehensive Daily | Monthly Trends | Full Executive |
| **API Access** | — | — | Read-only | Full REST |
| **Data Export** | Summary only | PDF Export | Invoices + Reports | Full extraction |
| **Locations** | Single | Single | Single | Multi-location |

---

### 4.2 Feature Flag Architecture

MedFlow uses a **real-time Feature Flag System** to control module access at the tenant level. This is not just a UI toggle — access is enforced at both the **API layer** and the **database layer**.

**Permission Flags (mapped to tiers):**

| Permission Flag | Free | Basic | Professional | Enterprise |
|---|:---:|:---:|:---:|:---:|
| `permission-core_engine-access` | ✅ | ✅ | ✅ | ✅ |
| `permission-pharmacy_lab-access` | ❌ | ✅ | ✅ | ✅ |
| `permission-inpatient-access` | ❌ | ❌ | ✅ | ✅ |
| `permission-customer_support-access` | ❌ | ✅ | ✅ | ✅ |
| `permission-accounts-access` | ❌ | ❌ | ✅ | ✅ |
| `permission-hr_payroll-access` | ❌ | ❌ | ❌ | ✅ |

> **Note on Inpatient Access:** The `permission-inpatient-access` flag unlocks IPD encounters, ward & bed management, lab order workflows, and the discharge settlement protocol. This flag is active from the **Professional tier onward**.

**Safety Guarantees:**
- Feature evaluation **fails safe** — if a flag is ambiguous, access is denied.
- **Kill switches** can instantly disable any module across all tenants (emergency use only; Superadmin-only action).
- All flag changes are fully **auditable** — who changed what, when, and why.
- **Downgrade Safeguard Protocol:** Downgrading a tenant tier requires a mandatory Communication Note from the Superadmin, documenting tenant consent and data accessibility impacts.

---

### 4.3 Performance & Reliability Targets

| Metric | Target |
|---|---|
| API Response Time | < 200ms for standard data queries |
| UI Initial Paint | < 1.5 seconds on 4G networks |
| System Uptime | 99.9% availability target |
| Database Backups | Daily automated backups |
| Feature Flag Evaluation | Backend cached for 60 seconds; Frontend cached for 5 minutes |
| Session Security | JWT-based with tenant-scoped token validation |

---

### 4.4 Security Architecture Summary

| Layer | Mechanism |
|---|---|
| **Data in Transit** | TLS encryption on all connections |
| **Passwords** | Salted + Bcrypt hashed before storage |
| **API Security** | Tenant ID validated in every request header/token |
| **SQL Injection** | 100% parameterized queries |
| **RBAC Enforcement** | Both backend permissions AND database domain/check constraints |
| **Audit Trail** | Login, billing, claims, inventory, discharge — all logged |
| **Cross-Tenant Isolation** | Hard data isolation: Tenant A cannot see Tenant B's data under any circumstances |
| **Consent Records** | Patient consent captured at registration and stored with timestamp and actor ID |

---

### 4.5 Deployment & Compatibility

| Target | Status |
|---|---|
| Render (Unified Mode) | ✅ Fully Supported |
| Netlify / Vercel (with adapter) | ✅ Supported |
| Mobile & Tablet (≥ 360px) | ✅ Fully Responsive |
| Keyboard Navigation (Accessibility) | ✅ Supported |
| Multi-Tenant Theming (Custom Colors) | ✅ Per-tenant configuration |

---

## 5. Why MedFlow?

MedFlow is not another generic EMR checkbox product. It is a **purpose-built, multi-tenant clinical operating system** designed for the real complexity of modern healthcare workflows.

### For the Healthcare Provider

- **Clinical Integrity Validated (v1.5.8 Baseline):** Guaranteed 100% synchronized state across Clinical, Pharmacy, Laboratory, and Billing modules. No orphan data, even during rapid state transitions.
- **Zero context-switching:** A doctor's entire workflow — queue, encounter, prescription — is a single, connected screen flow.
- **Role-appropriate views:** A Nurse sees what a Nurse needs; a Billing clerk never sees sensitive clinical notes.
- **Future-proof architecture:** Start on Basic today; upgrade to Enterprise when your team grows — your data, patients, and history migrate seamlessly.
- **Nurse Triage built-in:** Vitals are captured *before* the doctor opens an encounter, so consultations are faster and more clinically complete.

### For the Patient

- **Consistent identification:** A unique Medical Record Number (MRN) means no lost files, no re-typing of history at every visit.
- **Faster service:** Walk-ins are processed in under 2 minutes; prescriptions reach the pharmacy before the patient leaves the doctor's room.
- **Repeat prescriptions handled digitally:** Chronic patients can renew prescriptions during follow-up appointments without repeating the full intake process.
- **Documentary completeness:** Every clinical summary, prescription, and invoice is available in print-ready PDF format.

### For the IT/Operations Team

- **Strict data isolation:** Multi-tenant architecture guarantees your hospital's data never touches another institution's data.
- **Predictable scaling:** Feature flags allow surgical feature rollouts without redeployment.
- **Observability built-in:** Audit logs and operational health signals are available out of the box.
- **Discharge workflow enforced by system:** The platform prevents bed release until billing is settled — removing process gaps and revenue leakage.

---

> _MedFlow — Digitizing the care continuum, from first appointment to final discharge._

---

## Appendix A: Gap Resolution Log

This table records all documentation gaps identified during the technical review of v1.0 and confirms they are resolved in this v2.0 edition.

| Gap ID | Gap Description | Resolution in v2.0 |
|---|---|---|
| G-01 | No explicit Nurse Triage step | ✅ Added dedicated Nurse Triage row in Stage 2 of the Patient Journey (all tiers) |
| G-02 | Missing Consent & Privacy acknowledgment step | ✅ Added as a registration-stage feature row (§2.3) and a Stage 1 journey column |
| G-03 | Lab → Billing link was implicit | ✅ Made explicit: "Lab Charges Auto-Linked to Invoice" row added to §2.6; Stage 4 journey column updated |
| G-04 | IPD billing/discharge sequence unclear | ✅ Clarified in Stage 5 narrative: discharge finalised **only after** billing settlement marked COMPLETE |
| G-05 | Insurance pre-authorization absent from Basic tier notes | ✅ §2.3 and §2.6 now explicitly state where insurance *starts* (registration) vs. where it *resolves* (claim filing at Professional; pre-auth at Enterprise) |
| G-06 | Pharmacist role ended at dispensing — no audit confirmation | ✅ §2.5 adds "Inventory Deduction Audit Log" row; Stage 4 journey confirms `Stock Deducted → Audit Log Created` as a terminal step |
| G-07 | No visual representation of role handoffs | ✅ Diagrams live in POC_PATIENT_JOURNEY.md (Master Flowchart §1, Role Swimlane §2, State Machines §3–4, IPD Sequence §5). Cross-referenced below. |
| G-08 | Repeat prescription sub-flow missing | ✅ Added as a feature row in §2.4 and as a Journey column in Stage 3 and Stage 6 |
| G-09 | `permission-inpatient-access` flag missing from Feature Flag table | ✅ Added to §4.2 Feature Flag Architecture table with tier mapping |

---

## Appendix B: Cross-Reference to Visual Aids

All role swimlane diagrams, state machines, and sequence diagrams referenced in this document are available in:

📄 **[POC_PATIENT_JOURNEY.md](./POC_PATIENT_JOURNEY.md)**

| Visual Aid | Section in POC_PATIENT_JOURNEY.md |
|---|---|
| Master Role Swimlane (end-to-end) | §1 — Full Platform Workflow Overview |
| Role Handoff Sequence Diagram | §2 — Role Swimlane |
| Appointment Lifecycle State Machine | §3 — Appointment Lifecycle |
| Invoice Lifecycle State Machine | §4 — Invoice Lifecycle |
| IPD Admission → Discharge Sequence | §5 — IPD Admission to Discharge |
| Tier-by-Tier Patient Narrative | §6 — Complete Patient Journey |
| Gap Resolution Confirmation Table | §7 — Gap Resolution Summary |

---

**Document prepared by:** Senior Product & Technical Writing Team
**Last Updated:** March 2026
**Platform Version:** MedFlow v2.0 (Multi-Tenant Enterprise EMR)
**Document Status:** ✅ Approved for User Group Demo & Client Distribution
