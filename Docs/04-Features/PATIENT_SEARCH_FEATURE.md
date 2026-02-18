# Patient Search & Discharge Management

## Overview
We have implemented a robust Patient Search feature to handle large volumes of patient data, replacing the previous simple dropdowns which were not scalable. We also added a basic Discharge Management workflow for Inpatient (IPD) encounters.

## Features

### 1. Advanced Patient Search
Located in Billing, Appointments, EMR, and Patient records, the new search component allows filtering by:
- **Text**: Name, MRN, Phone number (partial match supported).
- **Date**: Visit Date or Date of Birth.
- **Health Type**: Filter by latest encounter type (OPD, IPD, Emergency).
- **Status**: Filter by "Admitted" (Active IPD) or "Discharged".

### 2. Discharge Management
- In the EMR view, active IPD encounters now show a **Discharge** button.
- Clicking "Discharge" prompts for:
  - Discharge Diagnosis
  - Discharge Notes
- This updates the encounter status to `closed` and records the discharge details.

### 3. Facilities Entries & Clinical Journal
To provide a complete longitudinal health record, the patient record view now includes a "Facility History" or "Clinical Record Journal."
- **Federated Timeline**: Maps individual clinical findings, medications, and diagnostics into a single chronological journal.
- **Blank Handling**: To prevent confusion from missing data, the system implements mandatory fallbacks. Blanks will show as "N/A", "Not Checked", or "NKDA" (No Known Drug Allergies) instead of empty space.
- **Direct Navigation**: Clicking a patient in Billing or Appointments now deep-links directly to this comprehensive clinical journal.

## Technical Implementation

### Frontend (`client/src`)
- **`components/PatientSearch.jsx`**: A reusable component that manages search state, calls the API, and renders a dropdown list of results. It integrates with existing forms using a hidden input.
- **`api.js`**: Added `searchPatients` and `dischargePatient` methods.
- **Pages**: Updated `BillingPage`, `AppointmentsPage`, `PatientsPage`, and `EmrPage` to use the new component.

### Backend (`server`)
- **`index.js`**:
  - `GET /api/patients/search`: New endpoint accepting query parameters.
  - `POST /api/encounters/:id/discharge`: New endpoint to close IPD encounters.
- **`db/repository.js`**:
  - `searchPatients`: Efficient SQL query with dynamic filters and LIMIT clause.
  - `dischargePatient`: Updates encounter status and logs the action.

## Future Improvements
- Add dedicated `Admission` vs `Discharge` dates as separate columns for more granular tracking (currently relying on `created_at` and `updated_at` of encounters).
- dedicated Bed Management module.
