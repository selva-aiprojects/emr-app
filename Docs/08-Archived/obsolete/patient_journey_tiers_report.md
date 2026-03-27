# Multi-Tier Patient Journey Test Report

This report documents the verification of MedFlow's patient journey across **Free**, **Basic**, **Professional**, and **Enterprise** subscription tiers.

## 🛠️ Critical Technical Fixes

| Issue | Resolution | Status |
| :--- | :--- | :---: |
| **Registration Bug** | Fixed MRN generation null-check in `PatientsPage.jsx`. | ✅ |
| **API Deficit** | Added missing `getEmployees` into `api.js` client. | ✅ |
| **Dashboard Errors** | Synchronized `start_time` field to `scheduled_start` in server metrics. | ✅ |
| **Tier Defaults** | Fixed `ACCOUNTS_ACCESS` flag for Professional Tier (server/services). | ✅ |
| **Module Mapping** | Mapped `insurance`, `ticketing`, and `admin` to correct flags. | ✅ |

## 🧬 Feature Visibility Matrix (Verified)

| Module | Free | Basic | Professional | Enterprise |
| :--- | :---: | :---: | :---: | :---: |
| **Clinical Registry** | ✅ | ✅ | ✅ | ✅ |
| **Appointments** | ✅ | ✅ | ✅ | ✅ |
| **Pharmacy / Lab** | 🚫 | ✅ | ✅ | ✅ |
| **Asset Logistics** | 🚫 | ✅ | ✅ | ✅ |
| **Inpatient (IPD)** | 🚫 | 🚫 | ✅ | ✅ |
| **Billing & Insurance**| 🚫 | 🚫 | ✅ | ✅ |
| **HR (Employees)** | 🚫 | 🚫 | 🚫 | ✅ |

---

## 🏗️ Demo Setup Summary

### 1. Free Tier (Health Hub)
- **Tenant ID**: `MedFlow Demo: Free Tier`
- **Admin**: `admin@seedling.local` / `Test@123`
- **Scope**: Core registration & EMR clinical record management.

### 2. Basic Tier (Community Clinic)
- **Tenant ID**: `MedFlow Demo: Basic Tier`
- **Admin**: `admin@greenvalley.local` / `Test@123`
- **Scope**: Pharmacy queue & Drug procurement.

### 3. Professional Tier (Private Hospital)
- **Tenant ID**: `MedFlow Demo: Pro Tier`
- **Admin**: `admin@sunrise.local` / `Test@123`
- **Scope**: Inpatient Ward management, Bed occupancy & Billing settlement.

### 4. Enterprise Tier (Corporate Medical)
- **Tenant ID**: `MedFlow Demo: Enterprise Tier`
- **Admin**: `admin@apollo.local` / `Test@123`
- **Scope**: Institutional HR, Payroll Distribution & Insurance Payer Governance.

## 🧪 Verification Protocol
1.  **Run setup**: `node tests/setup_demo_tiers.js`
2.  **Verify login**: Credentials as listed above.
3.  **Run automation**: `npx playwright test tests/patient_journey_tiers.spec.js`

---
*Report Generated: March 19, 2026*
