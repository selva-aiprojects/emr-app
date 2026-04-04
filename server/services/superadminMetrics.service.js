import pool from '../db/connection.js';

const MANAGEMENT_PLANE_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.management_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier varchar(50) NOT NULL,
  plan_name text NOT NULL,
  limit_users integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.management_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code varchar(32) NOT NULL UNIQUE,
  subdomain varchar(128) NOT NULL UNIQUE,
  schema_name varchar(64) NOT NULL UNIQUE,
  status varchar(16) NOT NULL DEFAULT 'active',
  subscription_id uuid NULL REFERENCES public.management_subscriptions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.management_system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  details jsonb NULL,
  tenant_id uuid NULL REFERENCES public.management_tenants(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.management_tenant_metrics (
  tenant_id uuid PRIMARY KEY REFERENCES public.management_tenants(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS public.management_dashboard_summary (
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

CREATE TABLE IF NOT EXISTS public.management_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  target_tier varchar(50) NOT NULL,
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  status varchar(16) NOT NULL DEFAULT 'draft',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  starts_at timestamptz NULL,
  ends_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.refresh_management_dashboard_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  cpu_metric integer := 24;
  memory_metric integer := 38;
  disk_metric integer := 31;
  network_metric integer := 4;
BEGIN
  INSERT INTO public.management_dashboard_summary (
    summary_key,
    total_tenants,
    total_doctors,
    total_patients,
    available_beds,
    available_ambulances,
    insurance_capacity,
    active_offers,
    open_tickets,
    issue_count,
    infrastructure_status,
    generated_at,
    updated_at
  )
  VALUES (
    'global',
    COALESCE((SELECT COUNT(*) FROM public.management_tenants WHERE status = 'active'), 0),
    COALESCE((SELECT SUM(doctors_count) FROM public.management_tenant_metrics), 0),
    COALESCE((SELECT SUM(patients_count) FROM public.management_tenant_metrics), 0),
    COALESCE((SELECT SUM(available_beds) FROM public.management_tenant_metrics), 0),
    COALESCE((SELECT SUM(available_ambulances) FROM public.management_tenant_metrics), 0),
    COALESCE((SELECT SUM(insurance_capacity) FROM public.management_tenant_metrics), 0),
    COALESCE((SELECT COUNT(*) FROM public.management_offers WHERE status = 'active'), 0),
    COALESCE((SELECT COUNT(*) FROM emr.support_tickets WHERE COALESCE(status, 'open') NOT IN ('resolved', 'closed')), 0),
    COALESCE((SELECT COUNT(*) FROM public.management_system_logs WHERE event LIKE '%FAILED%' AND created_at >= NOW() - INTERVAL '7 days'), 0),
    jsonb_build_object(
      'cpu', cpu_metric,
      'memory', memory_metric,
      'disk', disk_metric,
      'network', network_metric,
      'status', CASE WHEN cpu_metric < 80 AND memory_metric < 80 AND disk_metric < 80 THEN 'stable' ELSE 'degraded' END
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (summary_key) DO UPDATE
  SET total_tenants = EXCLUDED.total_tenants,
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

CREATE OR REPLACE FUNCTION public.refresh_management_tenant_metrics(target_tenant_id uuid, target_schema text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  effective_schema text;
  doctors_count integer := 0;
  patients_count integer := 0;
  available_beds integer := 0;
  available_ambulances integer := 0;
  insurance_capacity integer := 0;
  active_users_count integer := 0;
  has_roles boolean := false;
  has_users boolean := false;
  has_patients boolean := false;
  has_beds boolean := false;
  has_bed_status boolean := false;
  has_ambulances boolean := false;
  has_ambulance_status boolean := false;
  has_insurance_providers boolean := false;
  has_insurance_status boolean := false;
BEGIN
  SELECT schema_name
    INTO effective_schema
  FROM public.management_tenants
  WHERE id = target_tenant_id;

  effective_schema := COALESCE(target_schema, effective_schema);

  IF effective_schema IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = effective_schema AND table_name = 'roles'
  ) INTO has_roles;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = effective_schema AND table_name = 'users'
  ) INTO has_users;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = effective_schema AND table_name = 'patients'
  ) INTO has_patients;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = effective_schema AND table_name = 'beds'
  ) INTO has_beds;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = effective_schema AND table_name = 'beds' AND column_name = 'status'
  ) INTO has_bed_status;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = effective_schema AND table_name = 'ambulances'
  ) INTO has_ambulances;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = effective_schema AND table_name = 'ambulances' AND column_name = 'status'
  ) INTO has_ambulance_status;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = effective_schema AND table_name = 'insurance_providers'
  ) INTO has_insurance_providers;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = effective_schema AND table_name = 'insurance_providers' AND column_name = 'status'
  ) INTO has_insurance_status;

  IF has_users THEN
    EXECUTE format('SELECT COUNT(*) FROM %I.users WHERE COALESCE(is_active, true) = true', effective_schema)
      INTO active_users_count;
  END IF;

  IF active_users_count = 0 THEN
    SELECT COUNT(*)
      INTO active_users_count
    FROM emr.users
    WHERE tenant_id = target_tenant_id
      AND COALESCE(is_active, true) = true;
  END IF;

  IF has_roles AND has_users THEN
    EXECUTE format(
      'SELECT COUNT(*) FROM %I.users u
       JOIN %I.roles r ON r.id = u.role_id
       WHERE COALESCE(u.is_active, true) = true
       AND lower(r.name) = %L',
      effective_schema,
      effective_schema,
      'doctor'
    ) INTO doctors_count;
  END IF;

  IF doctors_count = 0 THEN
    SELECT COUNT(*)
      INTO doctors_count
    FROM emr.users
    WHERE tenant_id = target_tenant_id
      AND COALESCE(is_active, true) = true
      AND lower(COALESCE(role, '')) = 'doctor';
  END IF;

  IF has_patients THEN
    EXECUTE format('SELECT COUNT(*) FROM %I.patients', effective_schema)
      INTO patients_count;
  END IF;

  IF has_beds THEN
    IF has_bed_status THEN
      EXECUTE format(
        'SELECT COUNT(*) FROM %I.beds WHERE lower(COALESCE(status, %L)) IN (%L, %L, %L)',
        effective_schema,
        '',
        'available',
        'vacant',
        'ready'
      ) INTO available_beds;
    ELSE
      EXECUTE format('SELECT COUNT(*) FROM %I.beds', effective_schema)
        INTO available_beds;
    END IF;
  END IF;

  IF has_ambulances THEN
    IF has_ambulance_status THEN
      EXECUTE format(
        'SELECT COUNT(*) FROM %I.ambulances WHERE lower(COALESCE(status, %L)) IN (%L, %L, %L)',
        effective_schema,
        '',
        'available',
        'idle',
        'ready'
      ) INTO available_ambulances;
    ELSE
      EXECUTE format('SELECT COUNT(*) FROM %I.ambulances', effective_schema)
        INTO available_ambulances;
    END IF;
  END IF;

  IF has_insurance_providers THEN
    IF has_insurance_status THEN
      EXECUTE format(
        'SELECT COUNT(*) FROM %I.insurance_providers WHERE lower(COALESCE(status, %L)) IN (%L, %L)',
        effective_schema,
        '',
        'active',
        'enabled'
      ) INTO insurance_capacity;
    ELSE
      EXECUTE format('SELECT COUNT(*) FROM %I.insurance_providers', effective_schema)
        INTO insurance_capacity;
    END IF;
  END IF;

  INSERT INTO public.management_tenant_metrics (
    tenant_id,
    tenant_code,
    tenant_name,
    schema_name,
    doctors_count,
    patients_count,
    available_beds,
    available_ambulances,
    insurance_capacity,
    active_users_count,
    updated_at
  )
  SELECT
    t.id,
    t.code,
    t.name,
    effective_schema,
    doctors_count,
    patients_count,
    available_beds,
    available_ambulances,
    insurance_capacity,
    active_users_count,
    NOW()
  FROM public.management_tenants t
  WHERE t.id = target_tenant_id
  ON CONFLICT (tenant_id) DO UPDATE
  SET tenant_code = EXCLUDED.tenant_code,
      tenant_name = EXCLUDED.tenant_name,
      schema_name = EXCLUDED.schema_name,
      doctors_count = EXCLUDED.doctors_count,
      patients_count = EXCLUDED.patients_count,
      available_beds = EXCLUDED.available_beds,
      available_ambulances = EXCLUDED.available_ambulances,
      insurance_capacity = EXCLUDED.insurance_capacity,
      active_users_count = EXCLUDED.active_users_count,
      updated_at = EXCLUDED.updated_at;

  PERFORM public.refresh_management_dashboard_summary();
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_all_management_tenant_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  tenant_record record;
BEGIN
  FOR tenant_record IN
    SELECT id, schema_name FROM public.management_tenants
  LOOP
    PERFORM public.refresh_management_tenant_metrics(tenant_record.id, tenant_record.schema_name);
  END LOOP;

  PERFORM public.refresh_management_dashboard_summary();
END;
$$;

CREATE OR REPLACE FUNCTION public.management_metrics_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.refresh_management_tenant_metrics(TG_ARGV[0]::uuid, TG_TABLE_SCHEMA);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.install_tenant_metrics_sync(target_schema text, target_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  watched_table text;
  watched_tables text[] := ARRAY['roles', 'users', 'patients', 'beds', 'ambulances', 'insurance_providers'];
BEGIN
  FOREACH watched_table IN ARRAY watched_tables
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = target_schema
        AND information_schema.tables.table_name = watched_table
    ) THEN
      EXECUTE format(
        'DROP TRIGGER IF EXISTS %I ON %I.%I',
        'trg_management_metrics_' || watched_table,
        target_schema,
        watched_table
      );

      EXECUTE format(
        'CREATE TRIGGER %I
           AFTER INSERT OR UPDATE OR DELETE
           ON %I.%I
           FOR EACH STATEMENT
           EXECUTE FUNCTION public.management_metrics_trigger(%L)',
        'trg_management_metrics_' || watched_table,
        target_schema,
        watched_table,
        target_tenant_id::text
      );
    END IF;
  END LOOP;

  PERFORM public.refresh_management_tenant_metrics(target_tenant_id, target_schema);
END;
$$;
`;

let infrastructureReady = false;

export async function ensureManagementPlaneInfrastructure() {
  if (infrastructureReady) {
    return;
  }

  await pool.query(MANAGEMENT_PLANE_SQL);
  await pool.query(`SELECT public.refresh_all_management_tenant_metrics()`);
  infrastructureReady = true;
}

export async function installTenantMetricsSync(schemaName, tenantId) {
  await ensureManagementPlaneInfrastructure();
  await pool.query(
    `SELECT public.install_tenant_metrics_sync($1, $2::uuid)`,
    [schemaName, tenantId]
  );
}

export async function refreshTenantMetrics(tenantId, schemaName = null) {
  await ensureManagementPlaneInfrastructure();
  await pool.query(
    `SELECT public.refresh_management_tenant_metrics($1::uuid, $2)`,
    [tenantId, schemaName]
  );
}

export async function getSuperadminOverview() {
  await ensureManagementPlaneInfrastructure();

  const { rows: summaryRows } = await pool.query(`
    SELECT *
    FROM public.management_dashboard_summary
    WHERE summary_key = 'global'
  `);

  const { rows: tenantRows } = await pool.query(`
    SELECT
      tenant_id,
      tenant_code,
      tenant_name,
      schema_name,
      doctors_count,
      patients_count,
      available_beds,
      available_ambulances,
      insurance_capacity,
      active_users_count,
      updated_at
    FROM public.management_tenant_metrics
    ORDER BY tenant_name ASC
  `);

  const summary = summaryRows[0] || {
    total_tenants: 0,
    total_doctors: 0,
    total_patients: 0,
    available_beds: 0,
    available_ambulances: 0,
    insurance_capacity: 0,
    active_offers: 0,
    open_tickets: 0,
    issue_count: 0,
    infrastructure_status: { cpu: 0, memory: 0, disk: 0, network: 0, status: 'unknown' },
    generated_at: new Date().toISOString()
  };

  return {
    totals: {
      tenants: Number(summary.total_tenants || 0),
      doctors: Number(summary.total_doctors || 0),
      patients: Number(summary.total_patients || 0),
      bedsAvailable: Number(summary.available_beds || 0),
      ambulancesAvailable: Number(summary.available_ambulances || 0),
      insuranceCapacity: Number(summary.insurance_capacity || 0),
      activeOffers: Number(summary.active_offers || 0),
      openTickets: Number(summary.open_tickets || 0),
      issues: Number(summary.issue_count || 0)
    },
    infra: summary.infrastructure_status || { cpu: 0, memory: 0, disk: 0, network: 0, status: 'unknown' },
    tenants: tenantRows.map((row) => ({
      id: row.tenant_id,
      code: row.tenant_code,
      name: row.tenant_name,
      schemaName: row.schema_name,
      doctors: Number(row.doctors_count || 0),
      patients: Number(row.patients_count || 0),
      bedsAvailable: Number(row.available_beds || 0),
      ambulancesAvailable: Number(row.available_ambulances || 0),
      insuranceCapacity: Number(row.insurance_capacity || 0),
      activeUsers: Number(row.active_users_count || 0),
      updatedAt: row.updated_at
    })),
    generatedAt: summary.generated_at
  };
}
