import { BRAND } from './branding.js';

export const helpContent = {
    Superadmin: `
    <h3>Platform Superadmin</h3>
    <p>You have full access to manage all tenants (hospitals/clinics) and platform settings.</p>
    <ul>
      <li><strong>Tenants:</strong> Create and configure new hospital environments.</li>
      <li><strong>Global Users:</strong> Manage system-wide administrators.</li>
      <li><strong>Audit Logs:</strong> View cross-tenant activity logs.</li>
    </ul>
  `,
    Admin: `
    <h3>Facility Administrator</h3>
    <p>You manage this specific facility's operations and users.</p>
    <ul>
      <li><strong>Users:</strong> Add Doctors, Nurses, and Staff accounts.</li>
      <li><strong>Settings:</strong> Configure facility name, theme, and modules.</li>
      <li><strong>Reports:</strong> View financial and operational analytics.</li>
    </ul>
  `,
    Doctor: `
    <h3>Physician / Doctor</h3>
    <p>Your workspace is focused on patient care and clinical documentation.</p>
    <ul>
      <li><strong>Appointments:</strong> View your daily schedule and queue.</li>
      <li><strong>EMR:</strong> Conduct consultations, record vitals, and diagnoses.</li>
      <li><strong>Prescriptions:</strong> Use CPOE to order medications.</li>
      <li><strong>Patient History:</strong> Review the comprehensive clinical journal.</li>
    </ul>
  `,
    Nurse: `
    <h3>Nursing Staff</h3>
    <p>Assist with patient care, triage, and ward management.</p>
    <ul>
      <li><strong>Triage:</strong> Check in patients and record initial vitals.</li>
      <li><strong>Inpatient:</strong> Manage ward admissions and bed status.</li>
      <li><strong>Med Administration:</strong> Log medication administration records (MAR).</li>
    </ul>
  `,
    'Front Office': `
    <h3>Reception / Front Office</h3>
    <p>Manage patient flow, registration, and initial billing.</p>
    <ul>
      <li><strong>Registration:</strong> Create new patient records (MPI).</li>
      <li><strong>Scheduling:</strong> Book and reschedule appointments.</li>
      <li><strong>Billing:</strong> Generate invoices for registration/consultation.</li>
    </ul>
  `,
    Pharmacist: `
    <h3>Pharmacy</h3>
    <p>Manage medication dispensing and inventory.</p>
    <ul>
      <li><strong>Dispensing:</strong> fulfill prescriptions from doctors.</li>
      <li><strong>Inventory:</strong> Track stock levels and expiry dates.</li>
      <li><strong>Alerts:</strong> Monitor low-stock notifications.</li>
    </ul>
  `,
    Lab: `
    <h3>Laboratory Technician</h3>
    <p>Manage diagnostic tests and results.</p>
    <ul>
      <li><strong>Requests:</strong> View pending test orders.</li>
      <li><strong>Results:</strong> Upload or enter test data into patient records.</li>
    </ul>
  `,
    Patient: `
    <h3>Patient Portal</h3>
    <p>Access your personal health information.</p>
    <ul>
      <li><strong>Appointments:</strong> Book new visits or view upcoming ones.</li>
      <li><strong>History:</strong> View your past prescriptions and diagnoses.</li>
      <li><strong>Profile:</strong> Update your contact details.</li>
    </ul>
  `,
    default: `
    <h3>Help & Support</h3>
    <p>Welcome to ${BRAND.name}. Navigate using the clinical toolbar to access platform nodes.</p>
    <p>Operational assistance contact: ${BRAND.support.email}</p>
  `
};
