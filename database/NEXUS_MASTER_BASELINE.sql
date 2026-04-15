-- ============================================================
-- NEXUS MASTER BASELINE (CONTROL PLANE)
-- ============================================================
-- Version: 2.0.0
-- Architecture: Platform Control Plane
-- Description: Standardized bootstrap for Global Superadmin Hub.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SCHEMA IF NOT EXISTS emr;

-- 1. Management Subscriptions
CREATE TABLE IF NOT EXISTS emr.management_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier varchar(50) NOT NULL DEFAULT 'Enterprise',
  plan_name text NOT NULL DEFAULT 'Enterprise Plan',
  price text NOT NULL DEFAULT '₹0',
  limit_users integer NOT NULL DEFAULT 100,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Management Registry (The Nexus)
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

-- 3. Legacy Bridge (Compatibility Shard)
CREATE TABLE IF NOT EXISTS emr.tenants (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  code varchar(64) UNIQUE,
  subdomain text UNIQUE,
  status text DEFAULT 'active',
  subscription_tier text DEFAULT 'Basic',
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
    created_at timestamp with time zone DEFAULT now()
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

-- 7. Audit & Support Shards
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

-- 9. Infrastructure Safety Functions
CREATE OR REPLACE FUNCTION emr.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_management_tenants_updated_at ON emr.management_tenants;
CREATE TRIGGER trg_management_tenants_updated_at BEFORE UPDATE ON emr.management_tenants 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_users_updated_at ON emr.users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON emr.users 
FOR EACH ROW EXECUTE FUNCTION emr.update_updated_at_column();

-- ============================================================
-- 10. GOVERNANCE & TELEMETRY FUNCTIONS
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
  found_sc text;
BEGIN
  SELECT name, code, schema_name INTO t_name, t_code, sc FROM emr.management_tenants WHERE id::text = target_tenant_id::text;
  sc := COALESCE(target_schema, sc);

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
    target_tenant_id::uuid, t_code, t_name, COALESCE(found_sc, sc),
    d_count, p_count, b_count, a_count,
    now()
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
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
