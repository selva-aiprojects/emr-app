-- 17. Master Plane (EMR) Cleanup
-- Removes clinical and operational tables from the Control Plane to enforce strict architectural isolation.
-- Business features now reside exclusively in the Tenant Plane (Data Plane).

-- Healthcare Operations
DROP TABLE IF EXISTS emr.frontdesk_visits CASCADE;
DROP TABLE IF EXISTS emr.clinical_records CASCADE;
DROP TABLE IF EXISTS emr.conditions CASCADE;
DROP TABLE IF EXISTS emr.observations CASCADE;
DROP TABLE IF EXISTS emr.diagnostic_reports CASCADE;
DROP TABLE IF EXISTS emr.procedures CASCADE;
DROP TABLE IF EXISTS emr.prescriptions CASCADE;
DROP TABLE IF EXISTS emr.service_requests CASCADE;

-- Facility Infrastructure
DROP TABLE IF EXISTS emr.wards CASCADE;
DROP TABLE IF EXISTS emr.beds CASCADE;
DROP TABLE IF EXISTS emr.locations CASCADE;
DROP TABLE IF EXISTS emr.departments CASCADE;
DROP TABLE IF EXISTS emr.services CASCADE;
DROP TABLE IF EXISTS emr.ward_stock CASCADE;

-- Operational Logistics
DROP TABLE IF EXISTS emr.ambulances CASCADE;
DROP TABLE IF EXISTS emr.ambulance_trips CASCADE;
DROP TABLE IF EXISTS emr.blood_units CASCADE;
DROP TABLE IF EXISTS emr.blood_requests CASCADE;
DROP TABLE IF EXISTS emr.donors CASCADE;
DROP TABLE IF EXISTS emr.walkins CASCADE;
DROP TABLE IF EXISTS emr.notices CASCADE;
DROP TABLE IF EXISTS emr.tenant_communications CASCADE;

-- Financial & Billing
DROP TABLE IF EXISTS emr.invoices CASCADE;
DROP TABLE IF EXISTS emr.invoice_items CASCADE;
DROP TABLE IF EXISTS emr.billing CASCADE;
DROP TABLE IF EXISTS emr.expenses CASCADE;
DROP TABLE IF EXISTS emr.claims CASCADE;
DROP TABLE IF EXISTS emr.insurance_providers CASCADE;
DROP TABLE IF EXISTS emr.accounts_receivable CASCADE;
DROP TABLE IF EXISTS emr.accounts_payable CASCADE;

-- Supply Chain & Pharmacy
DROP TABLE IF EXISTS emr.inventory_items CASCADE;
DROP TABLE IF EXISTS emr.inventory_transactions CASCADE;
DROP TABLE IF EXISTS emr.pharmacy_inventory CASCADE;
DROP TABLE IF EXISTS emr.pharmacy_alerts CASCADE;
DROP TABLE IF EXISTS emr.purchase_orders CASCADE;
DROP TABLE IF EXISTS emr.vendors CASCADE;
DROP TABLE IF EXISTS emr.drug_batches CASCADE;
DROP TABLE IF EXISTS emr.drug_allergies CASCADE;
DROP TABLE IF EXISTS emr.medication_schedules CASCADE;
DROP TABLE IF EXISTS emr.medication_administrations CASCADE;
DROP TABLE IF EXISTS emr.patient_medication_allocations CASCADE;

-- Human Resources & Payroll
DROP TABLE IF EXISTS emr.employees CASCADE;
DROP TABLE IF EXISTS emr.employee_leaves CASCADE;
DROP TABLE IF EXISTS emr.salary_structures CASCADE;
DROP TABLE IF EXISTS emr.payroll_items CASCADE;
DROP TABLE IF EXISTS emr.attendance CASCADE;
DROP TABLE IF EXISTS emr.payroll_runs CASCADE;
DROP TABLE IF EXISTS emr.payslips CASCADE;

-- Governance & Communication
DROP TABLE IF EXISTS emr.chat_threads CASCADE;
DROP TABLE IF EXISTS emr.documents CASCADE;
DROP TABLE IF EXISTS emr.document_access_policies CASCADE;
DROP TABLE IF EXISTS emr.document_audit_logs CASCADE;
DROP TABLE IF EXISTS emr.notification_templates CASCADE;
DROP TABLE IF EXISTS emr.notification_jobs CASCADE;
DROP TABLE IF EXISTS emr.notification_logs CASCADE;

-- Core Clinical Base (Leave emr.patients/encounters/appointments if unsure, but user said ALL business features)
-- We will keep emr.tenants, emr.management_tenants, emr.users, emr.roles as they are Control Plane.

DROP TABLE IF EXISTS emr.patients CASCADE;
DROP TABLE IF EXISTS emr.encounters CASCADE;
DROP TABLE IF EXISTS emr.appointments CASCADE;

-- Log the cleanup
INSERT INTO emr.management_system_logs (id, event, details, created_at)
VALUES (gen_random_uuid(), 'MASTER_PLANE_CLEANUP', '{"message": "Strict isolation enforced. All clinical tables removed from emr schema."}', NOW());
