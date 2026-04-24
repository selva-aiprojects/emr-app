# User Manual & Testing Guide by Role

This document serves as both a **User Manual** for training and a **Testing Guide** (UAT) for validating workflows.

---

## 1. 👨‍⚕️ Doctor / Physician
**Objective**: Manage patient consultations, diagnosis, and prescriptions using the Premium Clinical Workspace.

### Workflow & Test Cases
| Feature | Action / Step | Expected Outcome |
|:---|:---|:---|
| **Login (Refined)** | Log in with Doctor credentials. | Dashboard loads with **Premium Glass Metrics** and refined navigation. |
| **New Consult** | Click **"New Consultation"** in EMR. | **Dual-Pane Workspace** opens. Patient selection on left, Form on right. |
| **Longitudinal Record** | Select a patient. Click **"Global History"**. | **Clinical Record Journal** displays chronological timeline with premium icons. |
| **EMR Intake** | Enter Chief Complaint, Vitals, and Diagnosis. | Premium glass panels provide high-contrast input area. |
| **Prescribe (CPOE)** | Use the Rx Micro-module to add meds. | Specialized line-items added to prescription list. |
| **Finalize & Print** | Click **"Save Clinical Record"**. | Success card appears. **Generate Prescription** button opens official clinical doc. |

---

## 4. 💊 Pharmacist
**Objective**: Dispense medications and manage facility pharmacy operations.

### Workflow & Test Cases
| Feature | Action / Step | Expected Outcome |
|:---|:---|:---|
| **Dispensing Queue** | Navigate to **Pharmacy**. | Professional ledger shows **Pending** prescriptions for clinical subjects. |
| **Filing Status** | Toggle between "Pending" and "Dispensed". | Registry filters in real-time with smooth fade transitions. |
| **Logistics** | Click **"Finalize Dispense"** on a pending drug. | Alert confirms stock adjustment. Chip updates to **Dispensed** (Green). |

---

## 5. 🏢 Front Office / Logistics
**Objective**: Patient registration and Facility Stock Management.

### Workflow & Test Cases
| Feature | Action / Step | Expected Outcome |
|:---|:---|:---|
| **Inventory Ledger** | Navigate to **Inventory**. | Global Stock Ledger displays and visual **Stock Level Meters**. |
| **Asset Registry** | Click **"Commit to Registry"** after entering item. | Item added to facility inventory with assigned category (e.g., Pharmaceuticals). |
| **Stock Alerts** | Observe "Low Stock Alerts" card on sidebar. | Items below reorder point show **Critical Blink** indicator. |
| **Quick Restock** | Click **"+ Quick Restock"** on low item. | Stock level increments. Meter fill color updates from Red to Green. |

---

## 6. 💼 Administrator (Hospital Admin)
**Objective**: Manage users, shifts, and facility settings.

### Workflow & Test Cases
| Feature | Action / Step | Expected Outcome |
|:---|:---|:---|
| **User Mgmt** | Go to **Admin** -> **Users**. Click **"Add User"**. | Create new "Doctor" or "Nurse" account. |
| **Settings** | Go to **Admin** -> **Settings**. Change "Accent Color". | Theme updates for all facility users. |
| **Reports** | Go to **Reports**. View "Revenue Report". | Graphs display financial data for the selected period. |

---

## 7. 🛠️ Support Team (IT / Technical)
**Objective**: System maintenance, troubleshooting, and configuration.

### Workflow & Test Cases
| Feature | Action / Step | Expected Outcome |
|:---|:---|:---|
| **Audit Logs** | Access Database / Superadmin view. | Check `audit_logs` table for login/action history. |
| **Tenant Config** | API: `PATCH /api/tenants/:id/settings`. | Update feature flags (e.g., toggle `telehealth: true`). |
| **Integrations** | Check API Health `GET /api/health`. | Response `200 OK`. Database connection active. |

---

## 8. 📊 Management / Auditor
**Objective**: Oversight, compliance, and financial auditing.

### Workflow & Test Cases
| Feature | Action / Step | Expected Outcome |
|:---|:---|:---|
| **Audit Views** | Go to **Reports**. Check "Patient Demographics" & "Revenue". | Accurate aggregate data displayed. |
| **Compliance** | Pick random Patient ID. Review "Clinical Journal". | Verify chart completeness (Vitals, Rx, Notes present). |
| **Staff Performance** | Go to **Employees**. Check "Leaves" and "Shifts". | Verify staffing levels and payroll inputs. |
