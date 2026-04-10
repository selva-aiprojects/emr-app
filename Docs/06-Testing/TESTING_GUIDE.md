# Testing & Validation Guide (UAT) - MedFlow EMR

This document outlines the User Acceptance Testing (UAT) steps required to validate the system's operational integrity.

## 1. Role-Based Validation Steps

### 1.1 Clinical Workflow (Doctor/Physician)
| Feature | Test Action | Expected Outcome |
|:---|:---|:---|
| **Auth** | Login with `rajesh@sch.local`. | Premium dashboard with emerald theme loads. |
| **MPI** | Search for patient "Meena". | Patient profile with history timeline appears. |
| **EMR** | Fill vitals (120/80 BP) and save. | Encounter saved; success card with "Generate Prescription" appears. |
| **Output** | Click "Generate Prescription". | Official document with patient identity and vitals opens in new tab. |

### 1.2 Pharmacy & Logistics (Pharmacist)
| Feature | Test Action | Expected Outcome |
|:---|:---|:---|
| **Inventory** | View inventory stock meters. | Visual bars show current level vs min-reorder point. |
| **Dispense** | Find patient "Meena" in Pharmacy queue. | Prescription status shows "Pending". |
| **Issuance** | Click "Finalize Dispense". | Status updates to "Dispensed" (Green). Stock level decreases. |

### 1.3 Front Office (Receptionist/Admin)
| Feature | Test Action | Expected Outcome |
|:---|:---|:---|
| **Registration**| Register new patient "Test User". | Unique MRN (e.g., SCH-1002) is generated. |
| **Scheduling** | Book appointment for tomorrow. | Appointment appears in the daily ledger. |
| **Branding** | Change accent color to Blue in Admin settings. | UI elements (buttons, active tabs) update immediately. |

---

## 2. Infrastructure & Safety Checklist

### 2.1 Data Privacy (Multi-Tenancy)
- [ ] **Cross-Tenant Search**: Verify that an Admin from *Selva Care* cannot search for patients registered in *Omega Hospitals*.
- [ ] **Auth Leakage**: Ensure that manually changing the `tenant_id` in URL state does not load unauthorized data (API must block it).

### 2.2 System Robustness
- [ ] **Mobile Responsive**: Verify that the sidebar collapses into a menu and tables stack on screens < 768px.
- [ ] **Empty States**: Verify that modules with no data (e.g., no pending bills) show a professional empty-state illustration rather than a blank white screen.
- [ ] **Validation**: Ensure that "Finalize Dispense" or "Complete Consult" prompts for confirmation to prevent accidental clicks.

### 2.3 Password Security
- [ ] **Hashing**: Confirm that all users in the `users` table have active BCrypt hashes (starts with `$2a$`).
- [ ] **Migration**: Verify that users fixed via `scripts/fix_passwords.js` can successfully authenticate.

---

## 3. Automated Regression (v1.5.8 Baseline)

MedFlow utilizes **Playwright** for deep clinical lifecycle validation. The suite ensures that the cross-module state (Clinical → Pharmacy → Lab → Billing) remains synchronized.

### 3.1 Executing the Clinical Regression Suite
To run the full NHGL stabilization pass (7 phases of clinical care):

```powershell
npx playwright test tests/nhgl_full_lifecycle.spec.js --project=firefox
```

### 3.2 Automated Validation Gates
| Phase | Requirement | Baseline Status (v1.5.8) |
|:---|:---|:---:|
| **Patient Sync** | Persistent identity registry across IPD/OPD. | ✅ Passed |
| **Diag Sync** | Automated Lab Result Authorization bypass. | ✅ Passed |
| **Financial Sync** | Automated Payment Gateway simulation. | ✅ Passed |
| **Egress Sync** | Enforced settlement before discharge summary release. | ✅ Passed |

> [!IMPORTANT]
> All E2E tests target tenant `b01f0cdc-4e8b-4db5-ba71-e657a414695e` and utilize the `Clinical Resilience Shard` (testBypass middleware) for consistent, database-independent results.
