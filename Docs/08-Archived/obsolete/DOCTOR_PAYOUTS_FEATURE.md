# Doctor Profiles & Payouts Feature

## Overview
This feature tracks the financial performance of doctors (Visiting and Permanent) based on the patient flow and revenue generated from their consultations.

## How it Works

### 1. Doctor Profiles
Doctors are managed as **Users** with the role `Doctor`.
- **Identity**: Managed via the `emr.users` table.
- **Access**: They have access to the EMR dashboard to manage their queue.

### 2. Patient Flow & Revenue Attribution
The system automatically links revenue to doctors through the following chain:
1.  **Appointment/Queue**: Patient is assigned to a `provider_id` (Doctor).
2.  **Encounter**: When a doctor completes a consultation, an `Encounter` record is created, tagged with their `provider_id`.
3.  **Invoice**: An invoice is generated for that encounter.
4.  **Payment**: When the invoice is marked `Paid`, the revenue is recognized.

### 3. Payout Calculation (Commission/Fee)
The **Doctor Payouts Report** (available in the Reports module) calculates the following for a given period (default: last 30 days):

| Metric | logic |
|:---|:---|
| **Patient Count** | Distinct count of patients seen (Encounters). |
| **Total Revenue** | Sum of `total` from Invoices linked to the doctor's encounters. |
| **Collected Amount**| Sum of `paid` amount (actual cash flow). |
| **Commission** | Calculated as **30%** of the Collected Amount (Standard Visiting Consultant Rate). |

### 4. Visiting vs. Permanent Doctors
- **Permanent Doctors**: Typically receive a fixed salary (managed in the `Employees` module). The payout report is used for **performance bonuses**.
- **Visiting Doctors**: Paid strictly based on the **Commission** column in the report.

## Future Enhancements
- **Dynamic Commission Rates**: Store specific % per doctor in a `user_details` table (e.g., Senior Consultant = 40%, Junior = 20%).
- **Procedure-based Tracking**: Split revenue by "Consultation" vs "Surgeries" for granular payouts.
