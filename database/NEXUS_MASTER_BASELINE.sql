-- ============================================================
-- NEXUS MASTER BASELINE (CONTROL PLANE)
-- ============================================================
-- Version: 2.1.1 (Updated with audit log fixes and institutional branding)
-- Architecture: Platform Control Plane
-- Description: Standardized bootstrap for Global Superadmin Hub.
-- Updated: Includes audit log fixes, institutional branding, and latest schema improvements
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SCHEMA IF NOT EXISTS emr;

-- 1. Management Subscriptions
CREATE TABLE IF NOT EXISTS emr.management_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier varchar(50) NOT NULL DEFAULT 'Enterprise',
  plan_name text NOT NULL DEFAULT 'Enterprise Plan',
  price text NOT NULL DEFAULT 'Rs0',
  limit_users integer NOT NULL DEFAULT 100,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Management Registry (The Nexus) - UPDATED with branding columns
CREATE TABLE IF NOT EXISTS emr.management_tenants (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  code varchar(32) NOT NULL UNIQUE,
  subdomain varchar(128) NOT NULL UNIQUE,
  schema_name varchar(64) NOT NULL UNIQUE,
  status varchar(16) NOT NULL DEFAULT 'active',
  contact_email varchar(128) NULL,
  subscription_tier varchar(50) NOT NULL DEFAULT 'Professional',
  subscription_id uuid NULL REFERENCES emr.management_subscriptions(id) ON DELETE SET NULL,
  logo_url text NULL,
  theme jsonb DEFAULT '{}'::jsonb,
  features jsonb DEFAULT '{}'::jsonb,
  billing_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Legacy Bridge (Compatibility Shard) - UPDATED with branding columns
CREATE TABLE IF NOT EXISTS emr.tenants (
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

-- 4. Global Identity Shards (Cross-Tenant Admin Access)
CREATE TABLE IF NOT EXISTS emr.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255), -- Compatibility with institutional masters
    name text NOT NULL UNIQUE,
    description text,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emr.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255), -- Compatibility with institutional masters
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    name text NOT NULL,
    role text, -- Legacy role string
    role_id uuid REFERENCES emr.roles(id) ON DELETE SET NULL,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. Precision Telemetry Matrix
CREATE TABLE IF NOT EXISTS emr.management_tenant_metrics (
  tenant_id VARCHAR(255) PRIMARY KEY REFERENCES emr.management_tenants(id) ON DELETE CASCADE,
  tenant_code varchar(32) NOT NULL,
  tenant_name text NOT NULL,
  schema_name varchar(64) NOT NULL,
  doctors_count integer NOT NULL DEFAULT 0,
  patients_count integer NOT NULL DEFAULT 0,
  available_beds integer NOT NULL DEFAULT 0,
  available_ambulances integer NOT NULL DEFAULT 0,
  insurance_capacity integer NOT NULL DEFAULT 0,
  active_users_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Global Control Summary
CREATE TABLE IF NOT EXISTS emr.management_dashboard_summary (
  summary_key text PRIMARY KEY,
  total_tenants integer NOT NULL DEFAULT 0,
  total_doctors integer NOT NULL DEFAULT 0,
  total_patients integer NOT NULL DEFAULT 0,
  available_beds integer NOT NULL DEFAULT 0,
  available_ambulances integer NOT NULL DEFAULT 0,
  insurance_capacity integer NOT NULL DEFAULT 0,
  active_offers integer NOT NULL DEFAULT 0,
  open_tickets integer NOT NULL DEFAULT 0,
  issue_count integer NOT NULL DEFAULT 0,
  infrastructure_status jsonb NOT NULL DEFAULT '{"cpu":0,"memory":0,"disk":0,"network":0,"status":"unknown"}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Audit & Support Shards (UPDATED with proper audit_logs)
CREATE TABLE IF NOT EXISTS emr.management_system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  details jsonb,
  tenant_id VARCHAR(255) REFERENCES emr.management_tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emr.support_tickets (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) REFERENCES emr.management_tenants(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  status varchar(32) DEFAULT 'open',
  priority varchar(32) DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Management Offers (Platform-wide Campaigns)
CREATE TABLE IF NOT EXISTS emr.management_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  discount_code text,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now()
);

-- 9. CRITICAL: Audit Logs Table (FIXED for UUID compatibility)
CREATE TABLE IF NOT EXISTS emr.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  user_name text,
  action character varying(100) NOT NULL,
  table_name character varying(100),
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  timestamp timestamp with time zone DEFAULT now()
);

-- ============================================================
-- ADVANCED BILLING & INSURANCE EXTENSIONS (ENTERPRISE FEATURES)
-- ============================================================

-- 9.1 Concessions & Discounts
CREATE TABLE IF NOT EXISTS emr.concessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    bill_id uuid,
    concession_type character varying(50) NOT NULL CHECK (concession_type IN ('doctor', 'hospital', 'charity', 'vip', 'staff')),
    amount decimal(10,2),
    percentage decimal(5,2),
    reason text NOT NULL,
    applied_by uuid NOT NULL,
    approved_by uuid,
    approval_status character varying(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approval_level integer DEFAULT 1,
    comments text,
    expiry_date date,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 9.2 Credit Notes & Receivables
CREATE TABLE IF NOT EXISTS emr.credit_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    original_bill_id uuid,
    credit_amount decimal(10,2) NOT NULL CHECK (credit_amount > 0),
    reason text NOT NULL,
    status character varying(20) DEFAULT 'active' CHECK (status IN ('active', 'utilized', 'expired', 'cancelled')),
    expiry_date date,
    utilized_amount decimal(10,2) DEFAULT 0,
    remaining_amount decimal(10,2) GENERATED ALWAYS AS (credit_amount - utilized_amount) STORED,
    created_by uuid NOT NULL,
    utilized_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 9.3 Credit Note Utilizations
CREATE TABLE IF NOT EXISTS emr.credit_note_utilizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_note_id uuid NOT NULL REFERENCES emr.credit_notes(id) ON DELETE CASCADE,
    bill_id uuid,
    utilized_amount decimal(10,2) NOT NULL CHECK (utilized_amount > 0),
    utilized_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 9.4 Billing Approvals
CREATE TABLE IF NOT EXISTS emr.bill_approvals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    bill_id uuid NOT NULL,
    approval_type character varying(50) NOT NULL CHECK (approval_type IN ('discount', 'refund', 'write_off', 'modification', 'cancellation')),
    requested_by uuid NOT NULL,
    approved_by uuid,
    approval_level integer DEFAULT 1,
    status character varying(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
    priority character varying(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    comments text,
    escalation_reason text,
    escalated_at timestamp with time zone,
    approved_at timestamp with time zone,
    rejected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 9.5 Approval Workflows
CREATE TABLE IF NOT EXISTS emr.approval_workflows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    workflow_type character varying(50) NOT NULL CHECK (workflow_type IN ('discount', 'refund', 'write_off', 'modification', 'cancellation')),
    min_amount decimal(10,2) NOT NULL,
    max_amount decimal(10,2),
    required_role character varying(50) NOT NULL,
    approval_level integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 9.6 Insurance Providers
CREATE TABLE IF NOT EXISTS emr.insurance_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    code character varying(32) NOT NULL,
    contact_person text,
    phone character varying(32),
    email text,
    address text,
    pre_auth_required boolean DEFAULT true,
    claim_submission_method character varying(20) DEFAULT 'electronic' CHECK (claim_submission_method IN ('electronic', 'manual', 'api')),
    processing_time_days integer DEFAULT 7,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(tenant_id, code)
);

-- 9.7 Insurance Pre-Authorizations
CREATE TABLE IF NOT EXISTS emr.insurance_pre_auth (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    admission_id uuid,
    insurance_provider_id uuid NOT NULL REFERENCES emr.insurance_providers(id),
    policy_number character varying(100) NOT NULL,
    pre_auth_number character varying(100),
    requested_amount decimal(10,2) NOT NULL,
    approved_amount decimal(10,2),
    status character varying(20) DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'partially_approved', 'rejected', 'expired')),
    request_date date NOT NULL DEFAULT CURRENT_DATE,
    approval_date date,
    expiry_date date,
    diagnosis_codes text[],
    procedure_codes text[],
    remarks text,
    requested_by uuid NOT NULL,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 9.8 Pre-Auth Revisions
CREATE TABLE IF NOT EXISTS emr.insurance_pre_auth_revisions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pre_auth_id uuid NOT NULL REFERENCES emr.insurance_pre_auth(id) ON DELETE CASCADE,
    revision_number integer NOT NULL,
    previous_amount decimal(10,2),
    revised_amount decimal(10,2) NOT NULL,
    reason text NOT NULL,
    status character varying(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_by uuid NOT NULL,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- 9.9 Corporate Clients
CREATE TABLE IF NOT EXISTS emr.corporate_clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    code character varying(32) NOT NULL,
    contact_person text,
    phone character varying(32),
    email text,
    address text,
    credit_limit decimal(10,2),
    payment_terms character varying(20) DEFAULT 'net30' CHECK (payment_terms IN ('immediate', 'net15', 'net30', 'net45', 'net60', 'net90')),
    billing_cycle character varying(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly')),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(tenant_id, code)
);

-- 9.10 Corporate Bills
CREATE TABLE IF NOT EXISTS emr.corporate_bills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    bill_id uuid NOT NULL,
    corporate_client_id uuid NOT NULL REFERENCES emr.corporate_clients(id),
    bill_type character varying(20) DEFAULT 'ipd' CHECK (bill_type IN ('ipd', 'opd', 'emergency')),
    total_amount decimal(10,2) NOT NULL,
    insurance_coverage decimal(10,2) DEFAULT 0,
    corporate_coverage decimal(10,2) DEFAULT 0,
    patient_responsibility decimal(10,2) DEFAULT 0,
    settled_amount decimal(10,2) DEFAULT 0,
    outstanding_amount decimal(10,2) GENERATED ALWAYS AS (total_amount - settled_amount) STORED,
    settlement_date date,
    status character varying(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partially_settled', 'settled', 'written_off')),
    due_date date,
    remarks text,
    created_by uuid NOT NULL,
    settled_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 9.11 Corporate Bill Register
CREATE TABLE IF NOT EXISTS emr.corporate_bill_register (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    corporate_client_id uuid NOT NULL REFERENCES emr.corporate_clients(id),
    register_date date NOT NULL DEFAULT CURRENT_DATE,
    total_bills integer DEFAULT 0,
    total_amount decimal(10,2) DEFAULT 0,
    settled_amount decimal(10,2) DEFAULT 0,
    outstanding_amount decimal(10,2) GENERATED ALWAYS AS (total_amount - settled_amount) STORED,
    generated_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 10. Infrastructure Safety Functions
CREATE OR REPLACE FUNCTION emr.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns (UPDATED)
DROP TRIGGER IF EXISTS trg_management_tenants_updated_at ON emr.management_tenants;
CREATE TRIGGER trg_management_tenants_updated_at BEFORE UPDATE ON emr.management_tenants 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON emr.tenants;
CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON emr.tenants 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_users_updated_at ON emr.users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON emr.users 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_roles_updated_at ON emr.roles;
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON emr.roles 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_management_subscriptions_updated_at ON emr.management_subscriptions;
CREATE TRIGGER trg_management_subscriptions_updated_at BEFORE UPDATE ON emr.management_subscriptions 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

-- ============================================================
-- 11. GOVERNANCE & TELEMETRY FUNCTIONS
-- ============================================================

-- A. FUNCTION: Atomic Dashboard Refresh
CREATE OR REPLACE FUNCTION emr.refresh_management_dashboard_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO emr.management_dashboard_summary (
    summary_key,
    total_tenants, total_doctors, total_patients,
    available_beds, available_ambulances, insurance_capacity,
    active_offers, open_tickets, issue_count,
    infrastructure_status, generated_at, updated_at
  )
  VALUES (
    'global',
    COALESCE((SELECT COUNT(*) FROM emr.management_tenants WHERE status = 'active'), 0),
    COALESCE((SELECT SUM(doctors_count) FROM emr.management_tenant_metrics), 0),
    COALESCE((SELECT SUM(patients_count) FROM emr.management_tenant_metrics), 0),
    COALESCE((SELECT SUM(available_beds) FROM emr.management_tenant_metrics), 0),
    COALESCE((SELECT SUM(available_ambulances) FROM emr.management_tenant_metrics), 0),
    COALESCE((SELECT SUM(insurance_capacity) FROM emr.management_tenant_metrics), 0),
    COALESCE((SELECT COUNT(*) FROM emr.management_offers WHERE status = 'active' AND ends_at > NOW()), 0),
    COALESCE((SELECT COUNT(*) FROM emr.support_tickets WHERE COALESCE(status, 'open') NOT IN ('resolved', 'closed')), 0),
    COALESCE((SELECT COUNT(*) FROM emr.management_system_logs WHERE event LIKE '%FAILED%' AND created_at >= NOW() - INTERVAL '7 days'), 0),
    '{"cpu":12, "memory":34, "disk":15, "network":1, "status":"stable"}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (summary_key) DO UPDATE SET
    total_tenants = EXCLUDED.total_tenants,
    total_doctors = EXCLUDED.total_doctors,
    total_patients = EXCLUDED.total_patients,
    available_beds = EXCLUDED.available_beds,
    available_ambulances = EXCLUDED.available_ambulances,
    insurance_capacity = EXCLUDED.insurance_capacity,
    active_offers = EXCLUDED.active_offers,
    open_tickets = EXCLUDED.open_tickets,
    issue_count = EXCLUDED.issue_count,
    infrastructure_status = EXCLUDED.infrastructure_status,
    generated_at = EXCLUDED.generated_at,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- B. FUNCTION: Precision Shard Scan (Universal Data Recovery)
CREATE OR REPLACE FUNCTION emr.refresh_management_tenant_metrics(target_tenant_id text, target_schema text DEFAULT NULL)
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
  t_subdomain text;
  found_sc text;
BEGIN
  SELECT name, code, subdomain, schema_name
    INTO t_name, t_code, t_subdomain, sc
  FROM emr.management_tenants
  WHERE id::text = target_tenant_id::text;

  -- Self-heal registry drift: if management row is missing, use legacy tenant row.
  IF t_code IS NULL THEN
    SELECT
      COALESCE(NULLIF(name, ''), code),
      code,
      COALESCE(NULLIF(subdomain, ''), lower(code)),
      COALESCE(NULLIF(schema_name, ''), lower(code))
    INTO t_name, t_code, t_subdomain, sc
    FROM emr.tenants
    WHERE id::text = target_tenant_id::text;

    IF t_code IS NOT NULL THEN
      INSERT INTO emr.management_tenants (id, name, code, subdomain, schema_name, status, created_at, updated_at)
      VALUES (
        target_tenant_id::uuid,
        t_name,
        t_code,
        COALESCE(NULLIF(t_subdomain, ''), lower(t_code)),
        COALESCE(NULLIF(sc, ''), lower(t_code)),
        'active',
        NOW(),
        NOW()
      )
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW();
    END IF;
  END IF;

  IF t_code IS NULL THEN
    RETURN;
  END IF;

  sc := COALESCE(target_schema, sc, lower(t_code));

  -- 1. SCAN ISOLATED SHARD (If exists)
  IF sc IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = sc) THEN
       found_sc := sc;
    ELSIF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = lower(t_code)) THEN
       found_sc := lower(t_code);
    END IF;

    IF found_sc IS NOT NULL THEN
      BEGIN EXECUTE format('SELECT count(*)::int FROM %I.patients', found_sc) INTO p_count; EXCEPTION WHEN OTHERS THEN p_count := 0; END;
      BEGIN EXECUTE format('SELECT count(*)::int FROM %I.employees WHERE lower(designation) LIKE %s', found_sc, '''%doctor%''') INTO d_count; EXCEPTION WHEN OTHERS THEN d_count := 0; END;
      BEGIN EXECUTE format('SELECT count(*)::int FROM %I.beds WHERE status = ''available''', found_sc) INTO b_count; EXCEPTION WHEN OTHERS THEN b_count := 0; END;
      BEGIN EXECUTE format('SELECT count(*)::int FROM %I.ambulances WHERE status = ''active'' OR status = ''ONLINE''', found_sc) INTO a_count; EXCEPTION WHEN OTHERS THEN a_count := 0; END;
    END IF;
  END IF;

  -- 2. UPDATE LOCAL METRICS
  INSERT INTO emr.management_tenant_metrics (
    tenant_id, tenant_code, tenant_name, schema_name,
    doctors_count, patients_count, available_beds, available_ambulances,
    updated_at
  )
  VALUES (
    target_tenant_id::uuid, t_code, COALESCE(t_name, t_code), COALESCE(found_sc, sc, lower(t_code)),
    d_count, p_count, b_count, a_count,
    now()
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    tenant_code = EXCLUDED.tenant_code,
    tenant_name = EXCLUDED.tenant_name,
    schema_name = EXCLUDED.schema_name,
    doctors_count = EXCLUDED.doctors_count,
    patients_count = EXCLUDED.patients_count,
    available_beds = EXCLUDED.available_beds,
    available_ambulances = EXCLUDED.available_ambulances,
    updated_at = EXCLUDED.updated_at;

  PERFORM emr.refresh_management_dashboard_summary();
END;
$$;

-- C. FUNCTION: Master Refresh
CREATE OR REPLACE FUNCTION emr.refresh_all_management_tenant_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id, schema_name FROM emr.management_tenants LOOP
    PERFORM emr.refresh_management_tenant_metrics(r.id, r.schema_name);
  END LOOP;
  PERFORM emr.refresh_management_dashboard_summary();
END;
$$;

-- D. FUNCTION: Trigger Bridge
CREATE OR REPLACE FUNCTION emr.refresh_tenant_metrics_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM emr.refresh_management_tenant_metrics(TG_ARGV[0]::text, TG_ARGV[1]);
  RETURN NULL;
END;
$$;

-- E. FUNCTION: Shard Sync Implementation
CREATE OR REPLACE FUNCTION emr.install_tenant_metrics_sync(target_schema text, target_tenant_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  tbl text;
  tbls text[] := ARRAY['users', 'patients', 'beds'];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = target_schema AND table_name = tbl) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', 'trg_mgmt_sync_' || tbl, target_schema, tbl);
      EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH STATEMENT EXECUTE FUNCTION emr.refresh_tenant_metrics_trigger(%L, %L)',
        'trg_mgmt_sync_' || tbl, target_schema, tbl, target_tenant_id::text, target_schema);
    END IF;
  END LOOP;
  PERFORM emr.refresh_management_tenant_metrics(target_tenant_id::text, target_schema);
END;
$$;

-- ============================================================
-- 12. BASE SEED DATA
-- ============================================================

-- Insert default management subscription tiers
INSERT INTO emr.management_subscriptions (tier, plan_name, price, limit_users, features) VALUES
('Free', 'Hobbyist Pilot', 'Rs0', 10, '["permission-core_engine-access"]'),
('Professional', 'Specialty Center', 'Rs0', 50, '["permission-core_engine-access", "permission-pharmacy_lab-access", "permission-customer_support-access", "permission-inpatient-access", "permission-accounts-access"]'),
('Enterprise', 'Full Hospital OS', 'Rs0', 100, '["permission-core_engine-access", "permission-pharmacy_lab-access", "permission-customer_support-access", "permission-inpatient-access", "permission-accounts-access", "permission-hr_payroll-access", "permission-telemedicine-access", "permission-advanced_analytics-access"]')
ON CONFLICT (tier) DO UPDATE SET 
  plan_name = EXCLUDED.plan_name,
  price = EXCLUDED.price,
  limit_users = EXCLUDED.limit_users,
  features = EXCLUDED.features;

-- Insert default system roles
INSERT INTO emr.roles (name, description, is_system) VALUES
('Superadmin', 'Platform Super Administrator', true),
('Admin', 'Institutional Administrator', true),
('Doctor', 'Clinical Practitioner', true),
('Nurse', 'Nursing Staff', true),
('Lab', 'Laboratory Technician', true),
('Pharmacy', 'Pharmacist', true)
ON CONFLICT (name) DO NOTHING;
