-- ============================================================
-- TENANT BASE SCHEMA — MedFlow EMR
-- ============================================================
-- This script is executed ONCE per tenant on creation.
-- It creates ALL tables required inside the tenant's isolated
-- PostgreSQL schema (e.g., "nhgl", "magnum", "nah").
--
-- ARCHITECTURE:
--   emr.*   = Global shared tables (auth, management, config)
--   <schema>.* = Tenant-isolated operational data (this file)
--
-- Run AFTER: CREATE SCHEMA IF NOT EXISTS "<schema_name>";
-- Usage: Replace :schema with the actual schema name before running.
-- ============================================================

-- ============================================================
-- 1. CORE CLINICAL
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  mrn varchar(64) NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  gender varchar(16),
  phone varchar(32),
  email text,
  address text,
  blood_group varchar(8),
  emergency_contact varchar(128),
  insurance varchar(256),
  medical_history jsonb NOT NULL DEFAULT '{"chronicConditions":"","allergies":"","surgeries":"","familyHistory":""}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mrn)
);

CREATE TABLE IF NOT EXISTS walkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  phone varchar(32) NOT NULL,
  reason text,
  status varchar(16) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'converted', 'cancelled')),
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  provider_id uuid,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('requested','scheduled','checked_in','completed','cancelled','no_show')),
  reason text,
  source varchar(16) DEFAULT 'staff' CHECK (source IN ('staff','self','walkin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (scheduled_end > scheduled_start)
);

CREATE TABLE IF NOT EXISTS encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  provider_id uuid,
  encounter_type varchar(16) NOT NULL CHECK (encounter_type IN ('OPD','IPD','emergency')),
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint text,
  diagnosis text,
  notes text,
  status varchar(16) NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
  section varchar(32) NOT NULL CHECK (section IN ('caseHistory','medications','prescriptions','recommendations','feedbacks','testReports','vitals')),
  content jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  encounter_id uuid NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  drug_name text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  status varchar(16) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Dispensed','Cancelled')),
  is_followup boolean NOT NULL DEFAULT false,
  followup_date date,
  followup_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INPATIENT — WARDS & BEDS
-- ============================================================

CREATE TABLE IF NOT EXISTS wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  type varchar(32) NOT NULL CHECK (type IN ('General','Semi-Private','Private','ICU','Emergency','Operation Theater','Recovery')),
  base_rate numeric(12,2) NOT NULL DEFAULT 0,
  status varchar(16) DEFAULT 'Active' CHECK (status IN ('Active','Maintenance','Inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ward_id uuid REFERENCES wards(id) ON DELETE CASCADE,
  bed_number varchar(16) NOT NULL,
  type varchar(32) DEFAULT 'General',
  status varchar(16) DEFAULT 'Available' CHECK (status IN ('Available','Occupied','Cleaning','Maintenance')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
  ward_id uuid REFERENCES wards(id) ON DELETE SET NULL,
  bed_id uuid REFERENCES beds(id) ON DELETE SET NULL,
  admission_date timestamptz NOT NULL DEFAULT now(),
  discharge_date timestamptz,
  discharge_notes text,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','discharged','transferred')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. DEPARTMENTS & FRONTDESK
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  code varchar(32) NOT NULL,
  hod_user_id uuid,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS frontdesk_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  doctor_id uuid,
  token_no bigint NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'checked_in'
    CHECK (status IN ('checked_in','in_queue','called','in_consultation','completed','cancelled')),
  triage_notes text,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  called_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. BILLING & INVOICES
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
  invoice_number varchar(64) NOT NULL,
  description text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  paid numeric(12,2) NOT NULL DEFAULT 0,
  payment_method varchar(32),
  status varchar(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','issued','paid','partially_paid','void','unpaid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  code text,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  category varchar(64) NOT NULL
    CHECK (category IN ('Salary','Purchase','Maintenance','Utilities','Certifications','Govt Fees','Subscriptions','Equipment','Other')),
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method varchar(32) DEFAULT 'Bank Transfer',
  reference text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. INSURANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS insurance_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  provider_type varchar(32) DEFAULT 'INSURANCE'
    CHECK (provider_type IN ('TPA','INSURANCE','GOVT_SCHEME','CORPORATE')),
  contact_phone varchar(32),
  contact_email text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES insurance_providers(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  claim_number varchar(64),
  claim_amount numeric(12,2) NOT NULL DEFAULT 0,
  approved_amount numeric(12,2),
  status varchar(24) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','submitted','approved','partially_approved','rejected','settled')),
  submitted_at timestamptz,
  settled_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. PHARMACY & INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  item_code varchar(64) NOT NULL,
  name text NOT NULL,
  category text,
  current_stock numeric(12,2) NOT NULL DEFAULT 0,
  reorder_level numeric(12,2) NOT NULL DEFAULT 0,
  unit varchar(32),
  unit_price numeric(12,2) DEFAULT 0,
  expiry_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, item_code)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type varchar(16) NOT NULL CHECK (transaction_type IN ('issue','receipt','adjustment')),
  quantity numeric(12,2) NOT NULL,
  reference text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
  category varchar(32) NOT NULL CHECK (category IN ('lab','pharmacy','imaging','procedure','other')),
  status varchar(24) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','completed','cancelled')),
  notes jsonb DEFAULT '{}',
  result jsonb DEFAULT '{}',
  requested_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. BLOOD BANK
-- ============================================================

CREATE TABLE IF NOT EXISTS donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  code varchar(32) NOT NULL,
  name text NOT NULL,
  gender varchar(16),
  date_of_birth date,
  blood_group varchar(8) NOT NULL,
  phone varchar(32),
  email text,
  last_donation_date date,
  eligibility_status varchar(24) NOT NULL DEFAULT 'eligible'
    CHECK (eligibility_status IN ('eligible','temporary_deferral','permanent_deferral')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS blood_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  donor_id uuid REFERENCES donors(id) ON DELETE SET NULL,
  unit_number varchar(48) NOT NULL,
  blood_group varchar(8) NOT NULL,
  component varchar(24) NOT NULL DEFAULT 'whole_blood'
    CHECK (component IN ('whole_blood','rbc','plasma','platelets','cryoprecipitate')),
  volume_ml int DEFAULT 450,
  collected_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '35 days',
  status varchar(24) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','reserved','issued','discarded','expired')),
  storage_location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, unit_number)
);

CREATE TABLE IF NOT EXISTS blood_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
  requested_group varchar(8) NOT NULL,
  component varchar(24) NOT NULL DEFAULT 'whole_blood',
  units_requested int NOT NULL CHECK (units_requested > 0),
  units_issued int NOT NULL DEFAULT 0,
  priority varchar(16) NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine','urgent','stat')),
  status varchar(24) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','partially_issued','issued','rejected','cancelled')),
  indication text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. AMBULANCE / FLEET
-- ============================================================

CREATE TABLE IF NOT EXISTS ambulances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  vehicle_number varchar(32) NOT NULL,
  vehicle_type varchar(32) DEFAULT 'Basic Life Support',
  status varchar(24) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','En Route','maintenance','offline')),
  driver_name text,
  driver_phone varchar(32),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, vehicle_number)
);

CREATE TABLE IF NOT EXISTS ambulance_dispatch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ambulance_id uuid NOT NULL REFERENCES ambulances(id) ON DELETE RESTRICT,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  pickup_address text NOT NULL,
  destination text,
  dispatch_time timestamptz NOT NULL DEFAULT now(),
  arrival_time timestamptz,
  status varchar(24) NOT NULL DEFAULT 'dispatched'
    CHECK (status IN ('dispatched','en_route','arrived','completed','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. HR — EMPLOYEES, ATTENDANCE, PAYROLL, LEAVES
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  code varchar(64) NOT NULL,
  name text NOT NULL,
  email text,
  phone varchar(32),
  department text,
  designation text,
  join_date date,
  shift varchar(16) CHECK (shift IN ('Morning','Evening','Night','Rotating')),
  salary numeric(12,2) NOT NULL DEFAULT 0,
  leave_balance numeric(5,1) NOT NULL DEFAULT 12,
  bank_account text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS employee_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type varchar(16) NOT NULL CHECK (leave_type IN ('Casual','Sick','Earned','Unpaid')),
  from_date date NOT NULL,
  to_date date NOT NULL,
  days numeric(5,1) NOT NULL,
  reason text,
  status varchar(16) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (to_date >= from_date)
);

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in timestamptz,
  check_out timestamptz,
  status varchar(16) DEFAULT 'Present' CHECK (status IN ('Present','Absent','Half-Day','Leave')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, employee_id, date)
);

CREATE TABLE IF NOT EXISTS salary_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  base_salary numeric(12,2) NOT NULL DEFAULT 0 CHECK (base_salary >= 0),
  allowances jsonb NOT NULL DEFAULT '[]',
  deductions jsonb NOT NULL DEFAULT '[]',
  effective_from date NOT NULL,
  effective_to date,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  period_month int NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year int NOT NULL CHECK (period_year >= 2000),
  total_employees int NOT NULL DEFAULT 0,
  total_gross numeric(12,2) NOT NULL DEFAULT 0,
  total_deductions numeric(12,2) NOT NULL DEFAULT 0,
  total_net numeric(12,2) NOT NULL DEFAULT 0,
  status varchar(16) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','calculated','approved','paid','cancelled')),
  notes text,
  processed_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, period_month, period_year)
);

CREATE TABLE IF NOT EXISTS payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  payroll_run_id uuid NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  gross numeric(12,2) NOT NULL DEFAULT 0,
  deduction_total numeric(12,2) NOT NULL DEFAULT 0,
  net numeric(12,2) NOT NULL DEFAULT 0,
  breakdown jsonb NOT NULL DEFAULT '{}',
  status varchar(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payroll_run_id, employee_id)
);

-- ============================================================
-- 10. COMMUNICATIONS & AUDIT
-- ============================================================

CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  audience_roles jsonb NOT NULL DEFAULT '[]',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  status varchar(16) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  priority varchar(16) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
  category varchar(32) NOT NULL CHECK (category IN (
    'lab_report','prescription','invoice','consent','imaging','discharge_summary','admin','other'
  )),
  title text NOT NULL,
  file_name text NOT NULL,
  mime_type varchar(128),
  storage_key text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  tags jsonb NOT NULL DEFAULT '[]',
  is_deleted boolean NOT NULL DEFAULT false,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  user_name text,
  action text NOT NULL,
  entity_name text,
  entity_id text,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_patients_tenant_mrn ON patients(tenant_id, mrn);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_provider ON appointments(tenant_id, provider_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_encounters_tenant_patient ON encounters(tenant_id, patient_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_encounters_provider ON encounters(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_patient ON invoices(tenant_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date ON attendance(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON payroll_runs(tenant_id, period_year DESC, period_month DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_tenant_category ON service_requests(tenant_id, category, status);
CREATE INDEX IF NOT EXISTS idx_blood_units_tenant_status ON blood_units(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ambulances_tenant_status ON ambulances(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_beds_ward ON beds(ward_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date ON expenses(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_tenant ON insurance_claims(tenant_id, status);
