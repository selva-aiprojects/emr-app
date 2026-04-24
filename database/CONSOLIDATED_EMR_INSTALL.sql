-- =====================================================
-- CONSOLIDATED EMR INSTALLATION SCRIPT (ALL-IN-ONE)
-- Version: 2.2.0
-- Description: Unified schema, migrations, and demo data
-- Scope: Full clinical, operational, and financial suite
-- =====================================================

BEGIN;

-- =====================================================
-- 0. SYSTEM INITIALIZATION
-- =====================================================
CREATE SCHEMA IF NOT EXISTS emr;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared timestamp trigger function
CREATE OR REPLACE FUNCTION emr.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON emr.patients FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON emr.appointments FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();
CREATE TRIGGER trg_ambulances_updated_at BEFORE UPDATE ON emr.ambulances FOR EACH ROW EXECUTE FUNCTION emr.set_updated_at();

-- =====================================================
-- 1. TENANCY & GOVERNANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code varchar(32) NOT NULL UNIQUE,
  subdomain varchar(128) NOT NULL UNIQUE,
  subscription_tier varchar(50) DEFAULT 'Basic' CHECK (subscription_tier IN ('Basic', 'Professional', 'Enterprise')),
  theme jsonb NOT NULL DEFAULT '{"primary": "#0f5a6e", "accent": "#f57f17"}'::jsonb,
  features jsonb NOT NULL DEFAULT '{"inventory": true, "telehealth": false}'::jsonb,
  billing_config jsonb DEFAULT '{}'::jsonb,
  logo_url text,
  contact_email text,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- 2. USER ACCESS & SECURITY
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES emr.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role varchar(32) NOT NULL,
  patient_id uuid NULL, 
  is_active boolean NOT NULL DEFAULT true,
  is_2fa_enabled boolean DEFAULT false,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email),
  CHECK ((role = 'Superadmin' AND tenant_id IS NULL) OR (role != 'Superadmin' AND tenant_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS emr.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES emr.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. CORE CLINICAL ENTITIES
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
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
  medical_history jsonb NOT NULL DEFAULT '{"chronicConditions": "", "allergies": "", "surgeries": "", "familyHistory": ""}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mrn)
);

CREATE TABLE IF NOT EXISTS emr.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE RESTRICT,
  provider_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('requested', 'scheduled', 'checked_in', 'completed', 'cancelled', 'no_show')),
  reason text,
  source varchar(16) DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emr.encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE RESTRICT,
  provider_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
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
-- 4. PHARMACY & LABORATORY
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  encounter_id uuid NOT NULL REFERENCES emr.encounters(id) ON DELETE CASCADE,
  drug_name text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  status varchar(16) DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emr.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  encounter_id uuid REFERENCES emr.encounters(id) ON DELETE SET NULL,
  requester_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  category varchar(32) NOT NULL CHECK (category IN ('lab', 'radiology', 'procedure', 'consultation')),
  code varchar(64),
  display text NOT NULL,
  status varchar(24) DEFAULT 'pending',
  priority varchar(16) DEFAULT 'routine',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- 5. OPERATIONAL UNITS (WARDS, BEDS, DEPARTMENTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code varchar(32) NOT NULL,
  status varchar(16) DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS emr.wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  type varchar(32) NOT NULL,
  status varchar(16) DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS emr.beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  ward_id uuid NOT NULL REFERENCES emr.wards(id) ON DELETE CASCADE,
  bed_number varchar(16) NOT NULL,
  status varchar(16) DEFAULT 'Available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, ward_id, bed_number)
);

-- =====================================================
-- 6. FINANCE & BILLING
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES emr.patients(id) ON DELETE RESTRICT,
  encounter_id uuid REFERENCES emr.encounters(id) ON DELETE SET NULL,
  invoice_number varchar(64) NOT NULL,
  total numeric(12,2) DEFAULT 0,
  paid numeric(12,2) DEFAULT 0,
  status varchar(20) DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS emr.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  item_code varchar(64) NOT NULL,
  name text NOT NULL,
  category text,
  current_stock numeric(12,2) DEFAULT 0,
  reorder_level numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, item_code)
);

CREATE TABLE IF NOT EXISTS emr.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  category varchar(64) NOT NULL,
  amount numeric(12,2) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  status varchar(16) DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- 7. HR & PAYROLL
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  code varchar(64) NOT NULL,
  name text NOT NULL,
  role varchar(32),
  join_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS emr.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  period_month int NOT NULL,
  period_year int NOT NULL,
  status varchar(16) DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- 8. ADVANCED MODULES (BLOOD BANK, AMBULANCE)
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  code varchar(32) NOT NULL,
  name text NOT NULL,
  blood_group varchar(8) NOT NULL,
  phone varchar(32),
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS emr.blood_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  created_by uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  unit_number varchar(48) NOT NULL,
  blood_group varchar(8) NOT NULL,
  component varchar(24) NOT NULL,
  volume_ml int,
  expires_at timestamptz NOT NULL,
  status varchar(24) DEFAULT 'Available',
  storage_location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, unit_number)
);

CREATE TABLE IF NOT EXISTS emr.ambulances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
  vehicle_number varchar(32) NOT NULL,
  model text,
  status varchar(24) DEFAULT 'Available',
  current_driver text,
  contact_number varchar(32),
  last_location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, vehicle_number)
);

-- =====================================================
-- 9. SECURITY & GOVERNANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.global_kill_switches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_flag VARCHAR(100) NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emr.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES emr.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES emr.users(id) ON DELETE SET NULL,
  user_name text,
  action text NOT NULL,
  entity_name text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- 10. SEED DATA (SUPERADMIN & DEMO TENANT)
-- =====================================================

-- Initial Superadmin
INSERT INTO emr.users (email, password_hash, name, role, is_active)
VALUES (
  'superadmin@emr.local',
  '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC', -- Admin@123
  'Global Administrator',
  'Superadmin',
  true
) ON CONFLICT (email) WHERE (tenant_id IS NULL) DO NOTHING;

-- Demo Tenant: New Age Hospital (NAH)
INSERT INTO emr.tenants (id, name, code, subdomain, subscription_tier, theme)
VALUES (
  'f998a8f5-95b9-4fd7-a583-63cf574d65ed',
  'New Age Hospital',
  'NAH',
  'nah.local',
  'Professional',
  '{"primary": "#011627", "accent": "#0077B6"}'
) ON CONFLICT (code) DO UPDATE SET subscription_tier = 'Professional';

-- Demo Tenant Admin: admin@newage.hospital
INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
VALUES (
  'f998a8f5-95b9-4fd7-a583-63cf574d65ed',
  'admin@newage.hospital',
  '$2b$10$RQ/2010sUHDLNH2k.sE25.fJLK23MzLmvcFV6O9kc7Ip1krJkSQtG', -- Admin@123
  'Dr. Sarah Johnson',
  'Admin',
  true
) ON CONFLICT (tenant_id, email) DO NOTHING;

COMMIT;
