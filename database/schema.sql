BEGIN;

CREATE SCHEMA IF NOT EXISTS emr;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code varchar(32) NOT NULL UNIQUE,
  subdomain varchar(128) NOT NULL UNIQUE,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role varchar(32) NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'front_office', 'billing', 'inventory')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

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
  allergies jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mrn)
);

CREATE TABLE IF NOT EXISTS encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  provider_id uuid REFERENCES users(id) ON DELETE SET NULL,
  encounter_type varchar(16) NOT NULL CHECK (encounter_type IN ('OPD', 'IPD', 'emergency')),
  visit_date timestamptz NOT NULL DEFAULT now(),
  chief_complaint text,
  diagnosis text,
  notes text,
  status varchar(16) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  provider_id uuid REFERENCES users(id) ON DELETE SET NULL,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (scheduled_end > scheduled_start)
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  encounter_id uuid NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  drug_name text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  encounter_id uuid REFERENCES encounters(id) ON DELETE SET NULL,
  invoice_number varchar(64) NOT NULL,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  balance_amount numeric(12,2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'partially_paid', 'void')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_number)
);

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

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_code varchar(64) NOT NULL,
  name text NOT NULL,
  category text,
  reorder_level numeric(12,2) NOT NULL DEFAULT 0,
  current_stock numeric(12,2) NOT NULL DEFAULT 0,
  unit varchar(32),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, item_code)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type varchar(16) NOT NULL CHECK (transaction_type IN ('issue', 'receipt', 'adjustment')),
  quantity numeric(12,2) NOT NULL,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(32) NOT NULL CHECK (action IN ('login', 'logout', 'create', 'update', 'delete', 'view', 'export')),
  entity_name text,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_tenant_mrn ON patients(tenant_id, mrn);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_provider_start ON appointments(tenant_id, provider_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_encounters_tenant_patient_visit ON encounters(tenant_id, patient_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_patient ON invoices(tenant_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant ON inventory_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_tenants_set_updated_at ON tenants;
CREATE TRIGGER trg_tenants_set_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;
CREATE TRIGGER trg_users_set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_patients_set_updated_at ON patients;
CREATE TRIGGER trg_patients_set_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_encounters_set_updated_at ON encounters;
CREATE TRIGGER trg_encounters_set_updated_at BEFORE UPDATE ON encounters FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_appointments_set_updated_at ON appointments;
CREATE TRIGGER trg_appointments_set_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_prescriptions_set_updated_at ON prescriptions;
CREATE TRIGGER trg_prescriptions_set_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_invoices_set_updated_at ON invoices;
CREATE TRIGGER trg_invoices_set_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_inventory_items_set_updated_at ON inventory_items;
CREATE TRIGGER trg_inventory_items_set_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_tenant_settings_set_updated_at ON tenant_settings;
CREATE TRIGGER trg_tenant_settings_set_updated_at BEFORE UPDATE ON tenant_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
