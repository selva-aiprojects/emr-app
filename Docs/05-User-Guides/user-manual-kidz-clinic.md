# MedFlow EMR - User Manual
## Tenant: Kidz Clinic

Welcome to **MedFlow EMR**, the dedicated platform for **Kidz Clinic**. This manual guides you through the daily operations, from logging in to managing patient encounters and billing.

---

## 1. Access & Login

### 1.1 Launching the Application
1.  Open your web browser.
2.  Navigate to the application URL (e.g., `http://localhost:4000` or production URL).

### 1.2 Sign In
You will see the **MedFlow EMR** login screen with the Shield logo.

1.  **Select Organization**: Choose **Kidz Clinic** from the dropdown.
2.  **Email Address**: Enter your registered ID (e.g., `anita@sch.local`).
3.  **Password**: Enter your secure password.
4.  Click **Sign In**.

> **Note**: Upon successful login, the sidebar branding will switch to the **Kidz Clinic** logo (Colorful Hearts).

---

## 2. Dashboard Interface
The **Dashboard** provides a real-time operational overview.

- **KPI Cards**:
    - **Total Patients**: Number of registered children.
    - **Today's Appointments**: Visits scheduled for the current date.
    - **Pending Bills**: Unpaid invoices requiring attention.
    - **Revenue**: Total income for the month (in ₹ INR).
- **Quick Actions**: Use the sidebar to navigate between modules (Patients, Appointments, Billing, etc.).
- **Live Status**: The "Live" badge in the header indicates the system is connected.

---

## 3. Patient Management
Manage child health records and demographics.

1.  Click **Patients** in the sidebar.
2.  **List View**: Search for a child by name or phone number.
3.  **New Patient**: Click **+ Register Patient**.
    - Enter Name, Age/DOB, Guardian Name, and Contact Info.
    - Click **Save**.
4.  **Patient Profile**: Click on a patient's name to view their full history (Encounters, Prescriptions, billing).

---

## 4. Appointments Scheduling
Manage the doctor's calendar.

1.  Click **Appointments**.
2.  **Book Appointment**:
    - Select Patient.
    - Choose Doctor (e.g., Dr. Anita).
    - Pick Date & Time.
    - Select Type (General Visit, Vaccination, Follow-up).
3.  **Status Updates**:
    - Mark as **Confirmed** upon booking.
    - Change to **Completed** after the visit.
    - Change to **Cancelled** if no-show.

---

## 5. Clinical Encounters (EMR)
The core doctor's workflow for documenting visits.

1.  Click **EMR (Encounters)**.
2.  **Start Encounter**:
    - Select a Patient and Appointment.
    - **Vitals**: Record Weight, Temperature, BP (if applicable for child).
    - **Assessment**:
        - **Chief Complaint**: e.g., "Fever for 2 days".
        - **Diagnosis**: e.g., "Viral Fever".
        - **Plan**: e.g., "Rest and hydration".
    - **Prescription**: Add medicines (e.g., Paracetamol syrup).
3.  **Print Summary**: Click the **Print** icon to generate a clinical summary for the parent.

---

## 6. Billing & Invoices
Manage finances and payments.

1.  Click **Billing**.
2.  **Create Invoice**:
    - Select Patient.
    - Add Items (Consultation Fee, Vaccination Charge).
    - System calculates Subtotal, Tax (if any), and Total.
3.  **Record Payment**:
    - Click **Pay** on an invoice.
    - Enter Amount Received (Partial or Full).
    - Status updates to **Paid** or **Partial**.
4.  **Print Invoice**: Click the **Print** button to generate a professional bill with the **Kidz Clinic** header.

---

## 7. Inventory & Staff
- **Inventory**: Track stock of vaccines, syrups, and consumables.
- **Employees**: Manage staff profiles and attendance.

---

## 8. AI Assistance
Use the **MedFlow Assistant** (floating action button at bottom-right) to ask questions like:
- "Show me appointments for today"
- "Find patient Rohan"
- "What is the total revenue?"

---

**Support**: For technical issues, contact the MedFlow Superadmin.
