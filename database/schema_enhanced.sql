-- Enhanced EMR Database Schema with Security and All Features
-- PostgreSQL 14+

BEGIN;

-- Create schema and extension
CREATE SCHEMA IF NOT EXISTS emr;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper function for updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TENANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code varchar(32) NOT NULL UNIQUE,
  subdomain varchar(128) NOT NULL UNIQUE,
  theme jsonb NOT NULL DEFAULT '{"primary": "#0f5a6e", "accent": "#f57f17"}'::jsonb,
  features jsonb NOT NULL DEFAULT '{"inventory": true, "telehealth": false}'::jsonb,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- USERS TABLE (With password hash)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role varchar(32) NOT NULL CHECK (role IN ('Superadmin', 'Admin', 'Doctor', 'Nurse', 'Front Office', 'Billing', 'Inventory', 'Patient')),
  patient_id uuid NULL, -- Links user to patient record if role is Patient
  is_active boolean NOT NULL DEFAULT true,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email),
  CHECK ((role = 'Superadmin' AND tenant_id IS NULL) OR (role != 'Superadmin' AND tenant_id IS NOT NULL))
);

-- =====================================================
-- SESSIONS TABLE (JWT token management)
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- PATIENTS TABLE (Enhanced with all medical fields)
-- =====================================================
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
  
  -- Medical History (JSONB for flexibility)
  medical_history jsonb NOT NULL DEFAULT '{
    "chronicConditions": "",
    "allergies": "",
    "surgeries": "",
    "familyHistory": ""
  }'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mrn)
);

-- =====================================================
-- CLINICAL RECORDS (Case History, Medications, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS clinical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  section varchar(32) NOT NULL CHECK (section IN ('caseHistory', 'medications', 'prescriptions', 'recommendations', 'feedbacks', 'testReports')),
  content jsonb NOT NULL, -- Flexible content structure
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- WALK-INS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS walkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone varchar(32) NOT NULL,
  reason text,
  status varchar(16) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'converted', 'cancelled')),
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- APPOINTMENTS TABLE (Enhanced with more statuses)
-- =====================================================
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  provider_id uuid REFERENCES users(id) ON DELETE SET NULL,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('requested', 'scheduled', 'checked_in', 'completed', 'cancelled', 'no_show')),
  reason text,
  source varchar(16) DEFAULT 'staff' CHECK (source IN ('staff', 'self', 'walkin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (scheduled_end > scheduled_start)
);

-- =====================================================
-- ENCOUNTERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  provider_id uuid REFERENCES users(id) ON DELETE SET NULL,
  encounter_type varchar(16) NOT NULL CHECK (encounter_type IN ('OPD', 'IPD', 'emergency')),
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  chief_complaint text,
  diagnosis text,
  notes text,
  status varchar(16) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- PRESCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  encounter_id uuid NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  drug_name text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  status varchar(16) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Dispensed', 'Cancelled')),
  is_followup boolean NOT NULL DEFAULT false,
  followup_date date,
  followup_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
  invoice_number varchar(64) NOT NULL,
  description text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  paid numeric(12,2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'partially_paid', 'void')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_number)
);

-- =====================================================
-- INVOICE ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  code text,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- INVENTORY ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_code varchar(64) NOT NULL,
  name text NOT NULL,
  category text,
  current_stock numeric(12,2) NOT NULL DEFAULT 0,
  reorder_level numeric(12,2) NOT NULL DEFAULT 0,
  unit varchar(32),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, item_code)
);

-- =====================================================
-- INVENTORY TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type varchar(16) NOT NULL CHECK (transaction_type IN ('issue', 'receipt', 'adjustment')),
  quantity numeric(12,2) NOT NULL,
  reference text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- EMPLOYEES TABLE (HR Management)
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code varchar(64) NOT NULL,
  name text NOT NULL,
  department text,
  designation text,
  join_date date,
  shift varchar(16) CHECK (shift IN ('Morning', 'Evening', 'Night', 'Rotating')),
  salary numeric(12,2) NOT NULL DEFAULT 0,
  leave_balance numeric(5,1) NOT NULL DEFAULT 12,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

-- =====================================================
-- EMPLOYEE LEAVES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS employee_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type varchar(16) NOT NULL CHECK (leave_type IN ('Casual', 'Sick', 'Earned', 'Unpaid')),
  from_date date NOT NULL,
  to_date date NOT NULL,
  days numeric(5,1) NOT NULL,
  reason text,
  status varchar(16) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (to_date >= from_date)
);

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_name text,
  action text NOT NULL,
  entity_name text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Tenants
CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_patient_id ON users(patient_id);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Patients
CREATE INDEX IF NOT EXISTS idx_patients_tenant_mrn ON patients(tenant_id, mrn);
CREATE INDEX IF NOT EXISTS idx_patients_tenant ON patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);

-- Clinical Records
CREATE INDEX IF NOT EXISTS idx_clinical_records_patient ON clinical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_records_section ON clinical_records(section);

-- Walk-ins
CREATE INDEX IF NOT EXISTS idx_walkins_tenant ON walkins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_walkins_status ON walkins(status);

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_provider_start ON appointments(tenant_id, provider_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Encounters
CREATE INDEX IF NOT EXISTS idx_encounters_tenant_patient_visit ON encounters(tenant_id, patient_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_encounters_provider ON encounters(provider_id);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_patient ON invoices(tenant_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Inventory
CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant ON inventory_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_code ON inventory_items(item_code);

-- Employees
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(code);

-- Employee Leaves
CREATE INDEX IF NOT EXISTS idx_employee_leaves_employee ON employee_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_leaves_dates ON employee_leaves(from_date, to_date);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATED_AT
-- =====================================================

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_clinical_records_updated_at BEFORE UPDATE ON clinical_records 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_walkins_updated_at BEFORE UPDATE ON walkins 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_encounters_updated_at BEFORE UPDATE ON encounters 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_prescriptions_updated_at BEFORE UPDATE ON prescriptions 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inventory_items_updated_at BEFORE UPDATE ON inventory_items 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON employees 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_employee_leaves_updated_at BEFORE UPDATE ON employee_leaves 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
