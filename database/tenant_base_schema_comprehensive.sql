-- ============================================================
-- COMPREHENSIVE TENANT BASE SCHEMA - MedFlow EMR
-- ============================================================
-- This script is executed ONCE per tenant on creation.
-- It creates ALL tables required inside the tenant's isolated
-- PostgreSQL schema (e.g., "nhgl", "magnum", "nah", "demo_emr").
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
  encounter_type varchar(32) NOT NULL CHECK (encounter_type IN ('OPD','IPD','emergency','In-patient','Out-patient','Emergency-Department','Observation')),
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
  section varchar(32) NOT NULL CHECK (section IN ('caseHistory','medications','prescriptions','recommendations','feedbacks','testReports','vitals','orders','progressNotes')),
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

-- NEW: Drug Allergies (Critical for patient safety)
CREATE TABLE IF NOT EXISTS drug_allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  allergen text NOT NULL,
  severity varchar(16) NOT NULL DEFAULT 'mild' CHECK (severity IN ('mild','moderate','severe','life_threatening')),
  reaction text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NEW: Medication Administrations
CREATE TABLE IF NOT EXISTS medication_administrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text,
  route varchar(16) CHECK (route IN ('oral','iv','im','subcutaneous','topical','inhalation','rectal')),
  administered_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  administered_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NEW: Patient Conditions
CREATE TABLE IF NOT EXISTS conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  code varchar(32),
  description text,
  category varchar(32),
  severity varchar(16) NOT NULL DEFAULT 'mild' CHECK (severity IN ('mild','moderate','severe','critical')),
  onset_date date,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','chronic')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NEW: Medical Procedures
CREATE TABLE IF NOT EXISTS procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
  procedure_code varchar(32),
  description text,
  category varchar(32),
  performed_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  performed_at timestamptz,
  status varchar(16) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NEW: Clinical Observations
CREATE TABLE IF NOT EXISTS observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
  category varchar(32),
  observation_type varchar(32),
  value numeric(12,4),
  unit varchar(16),
  notes text,
  recorded_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INPATIENT - WARDS & BEDS
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
  created_by uuid,
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

-- NEW: Pharmacy Alerts
CREATE TABLE IF NOT EXISTS pharmacy_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  alert_type varchar(32) NOT NULL,
  message text NOT NULL,
  severity varchar(16) NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NEW: Pharmacy Inventory Details
CREATE TABLE IF NOT EXISTS pharmacy_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  batch_number varchar(64),
  expiry_date date,
  location varchar(32),
  quantity numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NEW: Prescription Items (Line Items)
CREATE TABLE IF NOT EXISTS prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  quantity numeric(12,2) NOT NULL,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
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

-- ============================================================
-- 6.1 SUPPLIERS & PURCHASING
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  contact_person text,
  phone varchar(32),
  email text,
  address text,
  category varchar(32) DEFAULT 'Medical',
  status varchar(16) DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS inventory_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  item_id uuid REFERENCES inventory_items(id) ON DELETE SET NULL,
  po_number varchar(64),
  batch_number varchar(64),
  quantity numeric(12,2) NOT NULL,
  unit_price numeric(12,2),
  total_amount numeric(12,2),
  expiry_date date,
  received_date date DEFAULT CURRENT_DATE,
  status varchar(16) DEFAULT 'Received' CHECK (status IN ('Ordered','Received','Cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE NULL,
  encounter_id uuid REFERENCES encounters(id) ON DELETE NULL,
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

-- NEW: Ambulance Dispatch
CREATE TABLE IF NOT EXISTS ambulance_dispatch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ambulance_id uuid NOT NULL REFERENCES ambulances(id) ON DELETE RESTRICT,
  patient_id uuid REFERENCES patients(id) ON DELETE NULL,
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
-- 9. HR - EMPLOYEES, ATTENDANCE, PAYROLL, LEAVES
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

-- NEW: Document Audit Logs
CREATE TABLE IF NOT EXISTS document_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  user_id uuid,
  action varchar(32) NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. COMMUNICATION & CHAT SYSTEM
-- ============================================================

-- NEW: Chat Threads
CREATE TABLE IF NOT EXISTS chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title text,
  participants jsonb NOT NULL DEFAULT '[]',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NEW: Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  thread_id uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id uuid,
  message text NOT NULL,
  message_type varchar(16) NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NEW: Chat Participants
CREATE TABLE IF NOT EXISTS chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  thread_id uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, user_id)
);

-- NEW: Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  ticket_number varchar(32) NOT NULL,
  title text NOT NULL,
  description text,
  category varchar(32) NOT NULL,
  priority varchar(16) NOT NULL DEFAULT 'medium',
  status varchar(16) NOT NULL DEFAULT 'open',
  assigned_to uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, ticket_number)
);

-- ============================================================
-- 12. NOTIFICATION SYSTEM
-- ============================================================

-- NEW: Notification Jobs
CREATE TABLE IF NOT EXISTS notification_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  job_type varchar(32) NOT NULL,
  recipient_id uuid,
  recipient_type varchar(16) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NEW: Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  template_name varchar(64) NOT NULL,
  category varchar(32) NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NEW: Feature Flag Audit
CREATE TABLE IF NOT EXISTS feature_flag_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  flag_name varchar(64) NOT NULL,
  old_value jsonb,
  new_value jsonb,
  changed_by uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- NEW: Patient Medication Allocations
CREATE TABLE IF NOT EXISTS patient_medication_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  allocated_quantity numeric(12,2) NOT NULL,
  allocated_by uuid,
  allocated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- NEW: User Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token varchar(255) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 13. PROCEDURES & FUNCTIONS
-- ============================================================

-- Function to generate MRN
CREATE OR REPLACE FUNCTION generate_mrn()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  mrn_prefix text := 'MRN';
  mrn_number text;
  mrn_year text := to_char(now(), 'YY');
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(mrn FROM 7 FOR 4)), '0000')::text
  INTO mrn_number
  FROM patients
  WHERE tenant_id = current_setting('app.current_tenant_id');
  
  RETURN mrn_prefix || mrn_year || LPAD((mrn_number::integer + 1)::text, 4, '0');
END;
$$;

-- Function to get next token number
CREATE OR REPLACE FUNCTION get_next_token_number()
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  last_token bigint;
BEGIN
  SELECT COALESCE(MAX(token_no), 0) INTO last_token
  FROM frontdesk_visits
  WHERE tenant_id = current_setting('app.current_tenant_id')
    AND DATE(created_at) = CURRENT_DATE;
  
  RETURN last_token + 1;
END;
$$;

-- Trigger to automatically set updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 14. TRIGGERS
-- ============================================================

-- Updated_at triggers for all tables
CREATE TRIGGER set_patients_updated_at BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_walkins_updated_at BEFORE UPDATE ON walkins
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_appointments_updated_at BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_encounters_updated_at BEFORE UPDATE ON encounters
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_clinical_records_updated_at BEFORE UPDATE ON clinical_records
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_prescriptions_updated_at BEFORE UPDATE ON prescriptions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_drug_allergies_updated_at BEFORE UPDATE ON drug_allergies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_medication_administrations_updated_at BEFORE UPDATE ON medication_administrations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_conditions_updated_at BEFORE UPDATE ON conditions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_procedures_updated_at BEFORE UPDATE ON procedures
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_observations_updated_at BEFORE UPDATE ON observations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_wards_updated_at BEFORE UPDATE ON wards
FOR EACH ROW EXECUTE SET updated_at = NOW();

CREATE TRIGGER set_beds_updated_at BEFORE UPDATE ON beds
FOR EACH ROW EXECUTE SET updated_at = NOW();

CREATE TRIGGER set_admissions_updated_at BEFORE UPDATE ON admissions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_departments_updated_at BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_frontdesk_visits_updated_at BEFORE UPDATE ON frontdesk_visits
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_invoices_updated_at BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_invoice_items_updated_at BEFORE UPDATE ON invoice_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_expenses_updated_at BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_insurance_providers_updated_at BEFORE UPDATE ON insurance_providers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_insurance_claims_updated_at BEFORE UPDATE ON insurance_claims
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_inventory_items_updated_at BEFORE UPDATE ON inventory_items
FOR EACH ROW EXECUTE SET updated_at = NOW();

CREATE TRIGGER set_inventory_transactions_updated_at BEFORE UPDATE ON inventory_transactions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_suppliers_updated_at BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_inventory_purchases_updated_at BEFORE UPDATE ON inventory_purchases
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_service_requests_updated_at BEFORE UPDATE ON service_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_donors_updated_at BEFORE UPDATE ON donors
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_blood_units_updated_at BEFORE UPDATE ON blood_units
FOR EACH ROW EXECUTE SET updated_at = NOW();

CREATE TRIGGER set_blood_requests_updated_at BEFORE UPDATE ON blood_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_ambulances_updated_at BEFORE UPDATE ON ambulances
FOR EACH ROW EXECUTE SET updated_at = NOW();

CREATE TRIGGER set_ambulance_dispatch_updated_at BEFORE UPDATE ON ambulance_dispatch
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_employees_updated_at BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_employee_leaves_updated_at BEFORE UPDATE ON employee_leaves
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_attendance_updated_at BEFORE UPDATE ON attendance
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_salary_structures_updated_at BEFORE UPDATE ON salary_structures
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_payroll_runs_updated_at BEFORE UPDATE ON payroll_runs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_payroll_items_updated_at BEFORE UPDATE ON payroll_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_notices_updated_at BEFORE UPDATE ON notices
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_documents_updated_at BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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

CREATE TRIGGER set_pharmacy_alerts_updated_at BEFORE UPDATE ON pharmacy_alerts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_pharmacy_inventory_updated_at BEFORE UPDATE ON pharmacy_inventory
FOR EACH ROW EXECUTE SET updated_at = NOW();

CREATE TRIGGER set_prescription_items_updated_at BEFORE UPDATE ON prescription_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS document_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  user_id uuid,
  action varchar(32) NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_chat_threads_updated_at BEFORE UPDATE ON chat_threads
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_chat_messages_updated_at BEFORE UPDATE ON chat_messages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_chat_participants_updated_at BEFORE UPDATE ON chat_participants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_support_tickets_updated_at BEFORE UPDATE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_notification_jobs_updated_at BEFORE UPDATE ON notification_jobs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_notification_templates_updated_at BEFORE UPDATE ON notification_templates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_feature_flag_audit_updated_at BEFORE UPDATE ON feature_flag_audit
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_patient_medication_allocations_updated_at BEFORE UPDATE ON patient_medication_allocations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_sessions_updated_at BEFORE UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_audit_logs_updated_at BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_document_audit_logs_updated_at BEFORE UPDATE ON document_audit_logs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 15. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_patients_tenant_mrn ON patients(tenant_id, mrn);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_patients_dob ON patients(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);

CREATE INDEX IF NOT EXISTS idx_walkins_tenant ON walkins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_walkins_phone ON walkins(phone);
CREATE INDEX IF NOT EXISTS idx_walkins_status ON walkins(status);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_provider ON appointments(tenant_id, provider_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(scheduled_start);

CREATE INDEX IF NOT EXISTS idx_encounters_tenant_patient ON encounters(tenant_id, patient_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_encounters_provider ON encounters(provider_id);
CREATE IF NOT EXISTS idx_encounters_type ON encounters(encounter_type);
CREATE INDEX IF NOT EXISTS idx_encounters_date ON encounters(visit_date);

CREATE INDEX IF NOT EXISTS idx_clinical_records_tenant_patient ON clinical_records(tenant_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_records_section ON clinical_records(section);
CREATE INDEX IF NOT EXISTS idx_clinical_records_encounter ON clinical_records(encounter_id);

CREATE INDEX IF NOT EXISTS idx_prescriptions_tenant ON prescriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_encounter ON prescriptions(encounter_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

CREATE INDEX IF NOT EXISTS idx_drug_allergies_patient ON drug_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_drug_allergies_severity ON drug_allergies(severity);

CREATE INDEX IF NOT EXISTS idx_medication_administrations_patient ON medication_administrations(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_administrations_date ON medication_administrations(administered_at);

CREATE INDEX IF NOT EXISTS idx_conditions_patient ON conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_conditions_category ON conditions(category);
CREATE INDEX IF NOT EXISTS idx_conditions_severity ON conditions(severity);

CREATE INDEX IF NOT EXISTS idx_procedures_patient ON procedures(patient_id);
CREATE IF NOT EXISTS idx_procedures_category ON procedures(category);
CREATE INDEX IF NOT EXISTS idx_procedures_status ON procedures(status);
CREATE INDEX IF NOT EXISTS idx_procedures_date ON procedures(performed_at);

CREATE INDEX IF NOT EXISTS idx_observations_patient ON observations(patient_id);
CREATE INDEX IF NOT EXISTS idx_observations_category ON observations(category);
CREATE INDEX IF NOT EXISTS idx_observations_date ON observations(recorded_at);

CREATE INDEX IF NOT EXISTS idx_wards_tenant ON wards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wards_name ON wards(name);
CREATE INDEX IF NOT EXISTS idx_wards_type ON wards(type);
CREATE INDEX IF NOT EXISTS idx_wards_status ON wards(status);

CREATE INDEX IF NOT EXISTS idx_beds_ward ON beds(ward_id);
CREATE INDEX IF NOT EXISTS idx_beds_number ON beds(bed_number);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);

CREATE INDEX IF NOT EXISTS idx_admissions_tenant ON admissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admissions_patient ON admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_date ON admissions(admission_date);

CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);

CREATE INDEX IF NOT EXISTS idx_frontdesk_visits_tenant ON frontdesk_visits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_frontdesk_visits_patient ON frontdesk_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_frontdesk_visits_token ON frontdesk_visits(token_no);
CREATE INDEX IF NOT EXISTS idx_frontdesk_visits_status ON frontdesk_visits(status);
CREATE INDEX IF NOT EXISTS idx_frontdesk_visits_date ON frontdesk_visits(created_at);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(created_at);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

CREATE INDEX IF NOT EXISTS idx_insurance_providers_tenant ON insurance_providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_insurance_providers_active ON insurance_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_tenant ON insurance_claims(tenant_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient ON insurance_claims(patient_id);

CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant ON inventory_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_code ON inventory_items(item_code);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_stock ON inventory_items(current_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiry ON inventory_items(expiry_date);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_tenant ON inventory_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_pharmacy_alerts_tenant ON pharmacy_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_alerts_severity ON pharmacy_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_pharmacy_alerts_read ON pharmacy_alerts(is_read);

CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_item ON pharmacy_inventory(item_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_location ON pharmacy_inventory(location);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_expiry ON pharmacy_inventory(expiry_date);

CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_medication ON prescription_items(medication_name);

CREATE INDEX IF NOT EXISTS idx_service_requests_tenant ON service_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_category ON service_requests(category);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_patient ON service_requests(patient_id);

CREATE INDEX IF NOT EXISTS idx_donors_tenant ON donors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_eligibility ON donors(eligibility_status);
CREATE INDEX IF NOT EXISTS idx_donors_last_donation ON donors(last_donation_date);

CREATE INDEX IF NOT EXISTS idx_blood_units_tenant ON blood_units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blood_units_status ON blood_units(status);
CREATE INDEX IF NOT EXISTS idx_blood_units_expiry ON blood_units(expires_at);
CREATE INDEX IF NOT EXISTS idx_blood_units_group ON blood_units(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_units_component ON blood_units(component);

CREATE INDEX IF NOT EXISTS idx_blood_requests_tenant ON blood_requests(tenant_id);
CREATE IF NOT EXISTS idx_blood_requests_patient ON blood_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_priority ON blood_requests(priority);
CREATE INDEX IF NOT EXISTS idx_blood_requests_group ON blood_requests(requested_group);

CREATE INDEX IF NOT EXISTS idx_ambulances_tenant ON ambulances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ambulances_status ON ambulances(status);
CREATE INDEX IF NOT EXISTS idx_ambulances_number ON ambulances(vehicle_number);

CREATE INDEX IF NOT EXISTS idx_ambulance_dispatch_tenant ON ambulance_dispatch(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ambulance_dispatch_ambulance ON ambulance_dispatch(ambulance_id);
CREATE INDEX IF NOT EXISTS idx_ambulance_dispatch_status ON ambulance_dispatch(status);
CREATE INDEX IF NOT EXISTS idx_ambulance_dispatch_date ON ambulance_dispatch(dispatch_time);

CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(code);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);

CREATE INDEX IF NOT EXISTS idx_employee_leaves_employee ON employee_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_leaves_tenant ON employee_leaves(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_leaves_status ON employee_leaves(status);
CREATE INDEX IF NOT EXISTS idx_employee_leaves_date ON employee_leaves(from_date);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date ON attendance(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

CREATE INDEX IF NOT EXISTS idx_salary_structures_employee ON salary_structures(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_active ON salary_structures(status);
CREATE INDEX IF NOT EXISTS idx_salary_structures_date ON salary_structures(effective_from);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant_period ON payroll_runs(tenant_id, period_year DESC, period_month DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON payroll_runs(status);
CREATE INDEX IF NOT EXISTS idx_payroll_items_payroll ON payroll_items(payroll_run_id);
CREATE IF NOT EXISTS idx_payroll_items_employee ON payroll_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_status ON payroll_items(status);

CREATE INDEX IF NOT EXISTS idx_notices_tenant ON notices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notices_status ON notices(status);
CREATE INDEX IF NOT EXISTS idx_notices_priority ON notices(priority);
CREATE IF NOT EXISTS idx_notices_dates ON notices(starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE IF NOT EXISTS idx_documents_patient ON documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(is_deleted);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_document_audit_logs_tenant ON document_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_document ON document_audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_action ON document_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_date ON document_audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_drug_allergies_patient ON drug_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_drug_allergies_severity ON drug_allergies(severity);

CREATE INDEX IF NOT EXISTS idx_medication_administrations_patient ON medication_administrations(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_administrations_date ON medication_administrations(administered_at);

CREATE INDEX IF NOT EXISTS idx_conditions_patient ON conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_conditions_category ON conditions(category);
CREATE INDEX IF NOT EXISTS idx_conditions_severity ON conditions(severity);

CREATE INDEX IF NOT EXISTS idx_procedures_patient ON procedures(patient_id);
CREATE INDEX IF NOT EXISTS idx_procedures_category ON procedures(category);
CREATE INDEX IF NOT EXISTS idx_procedures_status ON procedures(status);
CREATE INDEX IF NOT EXISTS idx_procedures_date ON procedures(performed_at);

CREATE INDEX IF NOT EXISTS idx_observations_patient ON observations(patient_id);
CREATE INDEX IF NOT EXISTS idx_observations_category ON observations(category);
CREATE INDEX IF NOT EXISTS idx_observations_date ON observations(recorded_at);

CREATE INDEX IF NOT EXISTS idx_pharmacy_alerts_tenant ON pharmacy_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_alerts_severity ON pharmacy_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_pharmacy_alerts_read ON pharmacy_alerts(is_read);

CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_item ON pharmacy_inventory(item_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_location ON pharmacy_inventory(location);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_expiry ON pharmacy_inventory(expiry_date);

CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_medication ON prescription_items(medication_name);

CREATE INDEX IF NOT EXISTS idx_chat_threads_tenant ON chat_threads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_created ON chat_threads(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_participants_thread ON chat_participants(thread_id, user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_joined ON chat_participants(joined_at);

CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_number ON support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);

CREATE INDEX IF NOT EXISTS idx_notification_jobs_tenant ON notification_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_status ON notification_jobs(status);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_scheduled_at ON notification_jobs(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_notification_templates_tenant ON notification_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE IF NOT EXISTS idx_notification_templates_name ON notification_templates(template_name);

CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_tenant ON feature_flag_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_flag_name ON feature_flag_audit(flag_name);
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_created_at ON feature_flag_audit(created_at);

CREATE INDEX IF NOT EXISTS idx_patient_medication_allocations_patient ON patient_medication_allocations(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medication_allocations_medication ON patient_medication_allocations(medication_name);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_beds_ward ON beds(ward_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date ON expenses(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_tenant ON insurance_claims(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ambulances_tenant_status ON ambulances(tenant_id, status);

-- ============================================================
-- 16. BASE INFRASTRUCTURE PROVISIONING (IDEMPOTENT)
-- ============================================================
-- This section ensures every tenant has at least one functional ward/bed
-- to prevent E2E test failures and provide a better day-one experience.
-- Note: Replace :tenant_id with actual UUID in registration scripts.

/*
INSERT INTO wards (tenant_id, name, type, base_rate, status)
SELECT :tenant_id, 'General Medicine Ward', 'General', 1500, 'Active'
WHERE NOT EXISTS (SELECT 1 FROM wards WHERE tenant_id = :tenant_id);

INSERT INTO beds (tenant_id, ward_id, bed_number, type, status)
SELECT :tenant_id, (SELECT id FROM wards WHERE tenant_id = :tenant_id LIMIT 1), 'Unit-01', 'General', 'Available'
WHERE NOT EXISTS (SELECT 1 FROM beds WHERE tenant_id = :tenant_id);
*/

-- ============================================================

-- END OF TENANT BASE SCHEMA
-- ============================================================
