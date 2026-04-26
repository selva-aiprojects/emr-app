-- ============================================================
-- NEXUS MASTER BASELINE (CONTROL PLANE)
-- ============================================================
-- Version: 2.2.1 (Force Sync Enabled)
-- Architecture: Platform Control Plane
-- Description: Standardized bootstrap for Global Superadmin Hub.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SCHEMA IF NOT EXISTS nexus;

-- 0. Migration Log (Master Tracker)
CREATE TABLE IF NOT EXISTS nexus.migrations_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL UNIQUE,
  executed_at timestamptz DEFAULT now()
);

-- 1. Management Subscriptions
CREATE TABLE IF NOT EXISTS nexus.management_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier varchar(50) NOT NULL UNIQUE,
  plan_name text NOT NULL DEFAULT 'Enterprise Plan',
  price text NOT NULL DEFAULT 'Rs0',
  limit_users integer NOT NULL DEFAULT 100,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Management Registry (The Nexus)
CREATE TABLE IF NOT EXISTS nexus.management_tenants (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  code varchar(32) NOT NULL UNIQUE,
  subdomain varchar(128) NOT NULL UNIQUE,
  schema_name varchar(64) NOT NULL UNIQUE,
  status varchar(16) NOT NULL DEFAULT 'active',
  contact_email varchar(128) NULL,
  subscription_tier varchar(50) NOT NULL DEFAULT 'Professional',
  subscription_id uuid NULL REFERENCES nexus.management_subscriptions(id) ON DELETE SET NULL,
  logo_url text NULL,
  theme jsonb DEFAULT '{}'::jsonb,
  features jsonb DEFAULT '{}'::jsonb,
  billing_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Legacy Bridge (Compatibility Shard)
CREATE TABLE IF NOT EXISTS nexus.tenants (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  code varchar(64) UNIQUE,
  subdomain text UNIQUE,
  status text DEFAULT 'active',
  subscription_tier text DEFAULT 'Basic',
  logo_url text NULL,
  theme jsonb DEFAULT '{}'::jsonb,
  features jsonb DEFAULT '{}'::jsonb,
  billing_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Global Identity Shards
CREATE TABLE IF NOT EXISTS nexus.roles (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255),
    name text NOT NULL UNIQUE,
    description text,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nexus.users (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id VARCHAR(255) REFERENCES nexus.management_tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.5 Governance & Sequences
CREATE TABLE IF NOT EXISTS nexus.role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id VARCHAR(255) REFERENCES nexus.roles(id) ON DELETE CASCADE,
    permission text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(role_id, permission)
);

CREATE TABLE IF NOT EXISTS nexus.mrn_sequences (
    tenant_id VARCHAR(255) PRIMARY KEY,
    sequence_value integer DEFAULT 1,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nexus.invoice_sequences (
    tenant_id VARCHAR(255) PRIMARY KEY,
    sequence_value integer DEFAULT 1,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nexus.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255),
    user_id VARCHAR(255),
    user_name text,
    action text NOT NULL,
    entity_name text,
    entity_id text,
    details jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Precision Telemetry Matrix
CREATE TABLE IF NOT EXISTS nexus.management_tenant_metrics (
  tenant_id VARCHAR(255) PRIMARY KEY REFERENCES nexus.management_tenants(id) ON DELETE CASCADE,
  tenant_code varchar(32) NOT NULL,
  tenant_name text NOT NULL,
  schema_name varchar(64) NOT NULL,
  doctors_count integer NOT NULL DEFAULT 0,
  patients_count integer NOT NULL DEFAULT 0,
  available_beds integer NOT NULL DEFAULT 0,
  available_ambulances integer NOT NULL DEFAULT 0,
  active_users_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Global Control Summary
CREATE TABLE IF NOT EXISTS nexus.management_dashboard_summary (
  summary_key text PRIMARY KEY,
  total_tenants integer NOT NULL DEFAULT 0,
  total_doctors integer NOT NULL DEFAULT 0,
  total_patients integer NOT NULL DEFAULT 0,
  available_beds integer NOT NULL DEFAULT 0,
  available_ambulances integer NOT NULL DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Audit & Support Shards
CREATE TABLE IF NOT EXISTS nexus.support_tickets (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) REFERENCES nexus.management_tenants(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  status varchar(32) DEFAULT 'open',
  priority varchar(32) DEFAULT 'normal',
  created_by VARCHAR(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Communications Audit Log
CREATE TABLE IF NOT EXISTS nexus.communications (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) REFERENCES nexus.management_tenants(id) ON DELETE SET NULL,
  type VARCHAR(50) DEFAULT 'email',
  direction VARCHAR(10) DEFAULT 'outbound',
  sender TEXT,
  recipient TEXT,
  subject TEXT,
  content TEXT,
  status VARCHAR(20) DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communications_tenant_id ON nexus.communications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_communications_created_at ON nexus.communications(created_at DESC);

-- 9. Infrastructure Safety Functions
CREATE OR REPLACE FUNCTION nexus.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER trg_management_tenants_updated_at BEFORE UPDATE ON nexus.management_tenants 
FOR EACH ROW EXECUTE FUNCTION nexus.update_updated_at_column();

-- ============================================================
-- 11. GOVERNANCE & TELEMETRY FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION nexus.refresh_management_dashboard_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO nexus.management_dashboard_summary (
    summary_key, total_tenants, total_doctors, total_patients,
    available_beds, available_ambulances, updated_at
  )
  VALUES (
    'global',
    COALESCE((SELECT COUNT(*) FROM nexus.management_tenants WHERE status = 'active'), 0),
    COALESCE((SELECT SUM(doctors_count) FROM nexus.management_tenant_metrics), 0),
    COALESCE((SELECT SUM(patients_count) FROM nexus.management_tenant_metrics), 0),
    COALESCE((SELECT SUM(available_beds) FROM nexus.management_tenant_metrics), 0),
    COALESCE((SELECT SUM(available_ambulances) FROM nexus.management_tenant_metrics), 0),
    NOW()
  )
  ON CONFLICT (summary_key) DO UPDATE SET
    total_tenants = EXCLUDED.total_tenants,
    total_doctors = EXCLUDED.total_doctors,
    total_patients = EXCLUDED.total_patients,
    available_beds = EXCLUDED.available_beds,
    available_ambulances = EXCLUDED.available_ambulances,
    updated_at = EXCLUDED.updated_at;
END;
$$;

CREATE OR REPLACE FUNCTION nexus.refresh_management_tenant_metrics(target_tenant_id text, target_schema text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  sc text;
  p_count int := 0;
  d_count int := 0;
  b_count int := 0;
  a_count int := 0;
  t_name text;
  t_code text;
BEGIN
  SELECT name, code, schema_name INTO t_name, t_code, sc FROM nexus.management_tenants WHERE id::text = target_tenant_id::text;
  IF t_code IS NULL THEN RETURN; END IF;
  sc := COALESCE(target_schema, sc, lower(t_code));

  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = sc) THEN
    BEGIN EXECUTE format('SELECT count(*)::int FROM %I.patients', sc) INTO p_count; EXCEPTION WHEN OTHERS THEN p_count := 0; END;
    BEGIN EXECUTE format('SELECT count(*)::int FROM %I.employees WHERE lower(designation) LIKE ''%%doctor%%''', sc) INTO d_count; EXCEPTION WHEN OTHERS THEN d_count := 0; END;
    BEGIN EXECUTE format('SELECT count(*)::int FROM %I.beds WHERE status = ''available''', sc) INTO b_count; EXCEPTION WHEN OTHERS THEN b_count := 0; END;
    BEGIN EXECUTE format('SELECT count(*)::int FROM %I.ambulances WHERE status = ''active''', sc) INTO a_count; EXCEPTION WHEN OTHERS THEN a_count := 0; END;
  END IF;

  INSERT INTO nexus.management_tenant_metrics (
    tenant_id, tenant_code, tenant_name, schema_name,
    doctors_count, patients_count, available_beds, available_ambulances,
    updated_at
  )
  VALUES (target_tenant_id, t_code, t_name, sc, d_count, p_count, b_count, a_count, now())
  ON CONFLICT (tenant_id) DO UPDATE SET
    doctors_count = EXCLUDED.doctors_count,
    patients_count = EXCLUDED.patients_count,
    updated_at = EXCLUDED.updated_at;

  PERFORM nexus.refresh_management_dashboard_summary();
END;
$$;

-- Seed Data
INSERT INTO nexus.management_subscriptions (tier, plan_name, price, limit_users) VALUES
('Basic', 'Hobbyist Pilot', 'Rs1999', 10),
('Standard', 'Growing Clinic', 'Rs4999', 25),
('Professional', 'Specialty Center', 'Rs7999', 50),
('Enterprise', 'Full Hospital OS', 'Rs14999', 100)
ON CONFLICT (tier) DO NOTHING;

INSERT INTO nexus.roles (id, name, description, is_system) VALUES
('superadmin', 'Superadmin', 'Platform Super Administrator', true),
('admin', 'Admin', 'Institutional Administrator', true),
('doctor', 'Doctor', 'Clinical Practitioner', true),
('nurse', 'Nurse', 'Nursing Staff', true)
ON CONFLICT (name) DO NOTHING;

-- Seed Default Role Permissions
INSERT INTO nexus.role_permissions (role_id, permission)
SELECT 'admin', unnest(ARRAY['dashboard', 'patients', 'appointments', 'emr', 'inpatient', 'billing', 'accounts', 'insurance', 'inventory', 'pharmacy', 'lab', 'employees', 'reports', 'admin', 'users', 'communication', 'documents'])
ON CONFLICT DO NOTHING;

INSERT INTO nexus.role_permissions (role_id, permission)
SELECT 'doctor', unnest(ARRAY['dashboard', 'patients', 'appointments', 'emr', 'inpatient', 'pharmacy', 'reports', 'communication', 'documents'])
ON CONFLICT DO NOTHING;

INSERT INTO nexus.role_permissions (role_id, permission)
SELECT 'nurse', unnest(ARRAY['dashboard', 'patients', 'appointments', 'emr', 'inpatient', 'pharmacy', 'communication', 'documents'])
ON CONFLICT DO NOTHING;
