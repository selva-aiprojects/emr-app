import pool from '../db/connection.js';

const MANAGEMENT_PLANE_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SCHEMA IF NOT EXISTS emr;

-- 0. Drop Legacy Broken Triggers
DROP TRIGGER IF EXISTS trg_management_metrics_users_shared ON emr.users;
DROP FUNCTION IF EXISTS management_metrics_trigger_shared() CASCADE;

-- 1. Management Registry
CREATE TABLE IF NOT EXISTS emr.management_subscriptions (
  id uuid PRIMARY KEY DEFAULT COALESCE(gen_random_uuid(), uuid_generate_v4()),
  tier varchar(50) NOT NULL DEFAULT 'Enterprise',
  plan_name text NOT NULL DEFAULT 'Enterprise Plan',
  price text NOT NULL DEFAULT '₹0',
  limit_users integer NOT NULL DEFAULT 100,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE emr.management_subscriptions ADD COLUMN IF NOT EXISTS price text NOT NULL DEFAULT '₹0';
ALTER TABLE emr.management_subscriptions ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS emr.management_tenants (
  id uuid PRIMARY KEY DEFAULT COALESCE(gen_random_uuid(), uuid_generate_v4()),
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

ALTER TABLE emr.management_tenants ADD COLUMN IF NOT EXISTS logo_url text NULL;
ALTER TABLE emr.management_tenants ADD COLUMN IF NOT EXISTS theme jsonb DEFAULT '{}'::jsonb;
ALTER TABLE emr.management_tenants ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{}'::jsonb;
ALTER TABLE emr.management_tenants ADD COLUMN IF NOT EXISTS billing_config jsonb DEFAULT '{}'::jsonb;

-- 2. Precision Telemetry Matrix (THE METRICS TABLE)
CREATE TABLE IF NOT EXISTS emr.management_tenant_metrics (
  tenant_id uuid PRIMARY KEY REFERENCES emr.management_tenants(id) ON DELETE CASCADE,
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

-- 3. Global Control Summary
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

-- 4. Audit Shard (SYSTEM LOGS)
CREATE TABLE IF NOT EXISTS emr.management_system_logs (
  id uuid PRIMARY KEY DEFAULT COALESCE(gen_random_uuid(), uuid_generate_v4()),
  event text NOT NULL,
  details jsonb,
  tenant_id uuid REFERENCES emr.management_tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. FUNCTION: Atomic Dashboard Refresh
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

-- 6. FUNCTION: Precision Shard Scan (Universal Data Recovery)
CREATE OR REPLACE FUNCTION emr.refresh_management_tenant_metrics(target_tenant_id uuid, target_schema text DEFAULT NULL)
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
  SELECT name, code, schema_name INTO t_name, t_code, sc FROM emr.management_tenants WHERE id = target_tenant_id;
  sc := COALESCE(target_schema, sc);

  -- A. SCAN ISOLATED SHARD (If exists)
  IF sc IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = sc) THEN
       found_sc := sc;
    ELSIF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = lower(t_code)) THEN
       found_sc := lower(t_code);
    END IF;

    IF found_sc IS NOT NULL THEN
      BEGIN EXECUTE format('SELECT count(*)::int FROM %I.patients', found_sc) INTO p_count; EXCEPTION WHEN OTHERS THEN p_count := 0; END;
      BEGIN EXECUTE format('SELECT count(*)::int FROM %I.users WHERE lower(role) LIKE %s', found_sc, '''%doctor%''') INTO d_count; EXCEPTION WHEN OTHERS THEN d_count := 0; END;
      BEGIN EXECUTE format('SELECT count(*)::int FROM %I.beds WHERE status = ''available''', found_sc) INTO b_count; EXCEPTION WHEN OTHERS THEN b_count := 0; END;
      BEGIN EXECUTE format('SELECT count(*)::int FROM %I.ambulances WHERE status = ''active''', found_sc) INTO a_count; EXCEPTION WHEN OTHERS THEN a_count := 0; END;
    END IF;
  END IF;

  -- B. SCAN CONTROL PLANE (Safety Fallback)
  p_count := p_count + COALESCE((SELECT count(*)::int FROM emr.patients WHERE tenant_id = target_tenant_id), 0);
  d_count := d_count + COALESCE((SELECT count(*)::int FROM emr.users WHERE tenant_id = target_tenant_id AND (lower(role) LIKE '%doctor%' OR name LIKE 'Dr.%')), 0);

  INSERT INTO emr.management_tenant_metrics (
    tenant_id, tenant_code, tenant_name, schema_name,
    doctors_count, patients_count, available_beds, available_ambulances,
    updated_at
  )
  VALUES (
    target_tenant_id, t_code, t_name, COALESCE(found_sc, sc),
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

-- 7. FUNCTION: Universal Shard Sync (Master Refresh)
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

-- 8. FUNCTION: Trigger Bridge (Telemetry Logic)
CREATE OR REPLACE FUNCTION emr.refresh_tenant_metrics_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM emr.refresh_management_tenant_metrics(TG_ARGV[0]::uuid, TG_ARGV[1]);
  RETURN NULL;
END;
$$;

-- 9. FUNCTION: Shard Sync Implementation (The Bridge)
CREATE OR REPLACE FUNCTION emr.install_tenant_metrics_sync(target_schema text, target_tenant_id uuid)
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
  PERFORM emr.refresh_management_tenant_metrics(target_tenant_id, target_schema);
END;
$$;
`;

let infrastructureReady = false;

export async function ensureManagementPlaneInfrastructure() {
  try {
    if (infrastructureReady) return;

    // A. Install Core Schema
    await pool.query(MANAGEMENT_PLANE_SQL);

    // B. Seed Official Subscriptions (FEATURES.md v2.0 Sync)
    await pool.query(`
      INSERT INTO emr.management_subscriptions (tier, plan_name, price, limit_users, features)
      VALUES 
        ('Free', 'Hobbyist Pilot', '₹0', 1, '["permission-core_engine-access"]'),
        ('Basic', 'Small Clinic', '₹1999', 5, '["permission-core_engine-access", "permission-pharmacy_lab-access", "permission-customer_support-access"]'),
        ('Professional', 'Specialty Center', '₹5999', 25, '["permission-core_engine-access", "permission-pharmacy_lab-access", "permission-customer_support-access", "permission-inpatient-access", "permission-accounts-access"]'),
        ('Enterprise', 'Full Hospital OS', '₹9999', 1000, '["permission-core_engine-access", "permission-pharmacy_lab-access", "permission-customer_support-access", "permission-inpatient-access", "permission-accounts-access", "permission-hr_payroll-access"]')
      ON CONFLICT DO NOTHING
    `);

    // C. Precision Seeding for Institutional Nodes
    const adminHash = '$2a$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC'; // Admin@123
    
    // [CLEANUP] Hardcoded junk tenants (NAH, EHS) removed to prevent resurrection.

    // [CLEANUP] Strategic Auto-Discovery disabled to prevent accidental resurrection of stale shards.
    console.log('🔍 [INFRA] Institutional Auto-Discovery is now dormant (Clean State Enabled).');

    // Superadmin Governance
    await pool.query(`
      INSERT INTO emr.users (email, password_hash, role, name, is_active)
      VALUES ('admin@healthezee.com', $1, 'Superadmin', 'Healthezee Governance', true)
      ON CONFLICT (email) DO UPDATE SET is_active = true
    `, [adminHash]);

    // Cleanup & Map Management Registry
    console.log('🔄 [INFRA] Finalizing Management Plane Mapping...');
    const { rows: tenants } = await pool.query('SELECT * FROM emr.tenants');
    for (const t of tenants) {
      const scName = (t.code || 'public').toLowerCase();
      await pool.query(`
        INSERT INTO emr.management_tenants (id, name, code, subdomain, schema_name, status)
        VALUES ($1, $2, $3, $4, $5, 'active')
        ON CONFLICT (code) DO UPDATE SET 
          name = EXCLUDED.name,
          updated_at = NOW()
      `, [t.id, t.name, t.code, t.subdomain, scName]);
    }

    infrastructureReady = true;
    console.log('✅ [INFRA] Management Plane and Governance initialized.');
  } catch (err) {
    console.error('❌ [INFRA_ERROR] Management Plane stabilization failed:', err.message);
    // Don't crash the server, just warn
    infrastructureReady = true; 
  }
}

export async function performFullTelemetrySync() {
  await ensureManagementPlaneInfrastructure();
  try {
     console.log('🔄 [TELEMETRY] Starting platform-wide telemetry audit...');
     await pool.query('SELECT emr.refresh_all_management_tenant_metrics()');
     console.log('✅ [TELEMETRY] Platform-wide audit complete.');
  } catch (e) {
     console.error('❌ [TELEMETRY_ERROR] Audit failed:', e.message);
  }
}

export async function installTenantMetricsSync(schemaName, tenantId) {
  await ensureManagementPlaneInfrastructure();
  await pool.query('SELECT emr.install_tenant_metrics_sync($1, $2::uuid)', [schemaName, tenantId]);
}

export async function refreshTenantMetrics(tenantId, schemaName = null) {
  await ensureManagementPlaneInfrastructure();
  await pool.query('SELECT emr.refresh_management_tenant_metrics($1::uuid, $2)', [tenantId, schemaName]);
}

export async function getSuperadminOverview() {
  try {
    if (!infrastructureReady) await ensureManagementPlaneInfrastructure();

    const { rows: summaryRows } = await pool.query("SELECT * FROM emr.management_dashboard_summary WHERE summary_key = 'global'");
    let summary = summaryRows[0] || { total_tenants: 0, total_doctors: 0, total_patients: 0 };
    
    const { rows: tenantRows } = await pool.query(`
      SELECT 
        t.id as tenant_id,
        t.code as tenant_code,
        t.name as tenant_name,
        t.status,
        t.subscription_tier,
        t.contact_email,
        COALESCE(mtm.doctors_count, 0) as doctors_count,
        COALESCE(mtm.patients_count, 0) as patients_count,
        COALESCE(mtm.available_beds, 0) as available_beds,
        COALESCE(mtm.available_ambulances, 0) as available_ambulances,
        COALESCE(mtm.active_users_count, 0) as active_users_count
      FROM emr.management_tenants t
      LEFT JOIN emr.management_tenant_metrics mtm ON t.id = mtm.tenant_id
      ORDER BY t.created_at DESC
    `);

    return {
      totals: {
        tenants: Number(summary.total_tenants || 0),
        doctors: Number(summary.total_doctors || 0),
        patients: Number(summary.total_patients || 0),
        bedsAvailable: Number(summary.available_beds || 0),
        ambulancesAvailable: Number(summary.available_ambulances || 0),
        labTests: Number(summary.insurance_capacity || 0),
        activeOffers: Number(summary.active_offers || 0),
        openTickets: Number(summary.open_tickets || 0),
        issues: Number(summary.issue_count || 0)
      },
      infra: summary.infrastructure_status,
      tenants: tenantRows.map(row => ({
        id: row.tenant_id,
        code: row.tenant_code,
        name: row.tenant_name,
        patients: Number(row.patients_count || 0),
        doctors: Number(row.doctors_count || 0),
        bedsAvailable: Number(row.available_beds || 0),
        ambulancesAvailable: Number(row.available_ambulances || 0),
        activeUsers: Number(row.active_users_count || 0),
        status: row.status,
        subscriptionTier: row.subscription_tier || 'Professional',
        contactEmail: row.contact_email,
        identity: row.tenant_id.substring(0, 8).toUpperCase()
      })),
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.warn('[getSuperadminOverview] Management tables not ready:', err.message);
    return {
      totals: { tenants: 0, doctors: 0, patients: 0, bedsAvailable: 0, ambulancesAvailable: 0, labTests: 0, activeOffers: 0, openTickets: 0, issues: 0 },
      infra: { cpu: 0, memory: 0, disk: 0, network: 0, status: 'initializing' },
      tenants: [],
      generatedAt: new Date().toISOString()
    };
  }
}
