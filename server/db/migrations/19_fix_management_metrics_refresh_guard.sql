-- Guard metrics refresh when management_tenants drift exists
-- Prevents null tenant_code insert failures during tenant-user updates/triggers.

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

  -- Registry self-heal: fall back to legacy tenant registry if management row is missing.
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

  -- No tenant metadata means nothing to refresh.
  IF t_code IS NULL THEN
    RETURN;
  END IF;

  sc := COALESCE(target_schema, sc, lower(t_code));

  -- 1. Scan isolated shard if available.
  IF sc IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = sc) THEN
      found_sc := sc;
    ELSIF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = lower(t_code)) THEN
      found_sc := lower(t_code);
    END IF;

    IF found_sc IS NOT NULL THEN
      BEGIN EXECUTE format('SELECT count(*)::int FROM %I.patients', found_sc) INTO p_count; EXCEPTION WHEN OTHERS THEN p_count := 0; END;
      BEGIN
        EXECUTE format(
          'SELECT count(*)::int FROM %I.users WHERE lower(coalesce(role, '''')) LIKE ''%%doctor%%''',
          found_sc
        ) INTO d_count;
      EXCEPTION WHEN OTHERS THEN
        BEGIN
          EXECUTE format(
            'SELECT count(*)::int FROM %I.employees WHERE lower(coalesce(designation, '''')) LIKE ''%%doctor%%''',
            found_sc
          ) INTO d_count;
        EXCEPTION WHEN OTHERS THEN d_count := 0; END;
      END;
      BEGIN EXECUTE format('SELECT count(*)::int FROM %I.beds WHERE lower(coalesce(status, '''')) = ''available''', found_sc) INTO b_count; EXCEPTION WHEN OTHERS THEN b_count := 0; END;
      BEGIN EXECUTE format('SELECT count(*)::int FROM %I.ambulances WHERE lower(coalesce(status, '''')) IN (''active'',''online'',''available'')', found_sc) INTO a_count; EXCEPTION WHEN OTHERS THEN a_count := 0; END;
    END IF;
  END IF;

  -- 2. Legacy fallback if shard-level count is still zero.
  IF p_count = 0 THEN
    BEGIN SELECT count(*)::int INTO p_count FROM emr.patients WHERE tenant_id::text = target_tenant_id::text; EXCEPTION WHEN OTHERS THEN p_count := 0; END;
  END IF;
  IF d_count = 0 THEN
    BEGIN SELECT count(*)::int INTO d_count FROM emr.users WHERE tenant_id::text = target_tenant_id::text AND lower(coalesce(role, '')) LIKE '%doctor%'; EXCEPTION WHEN OTHERS THEN d_count := 0; END;
  END IF;
  IF b_count = 0 THEN
    BEGIN SELECT count(*)::int INTO b_count FROM emr.beds WHERE tenant_id::text = target_tenant_id::text AND lower(coalesce(status, '')) = 'available'; EXCEPTION WHEN OTHERS THEN b_count := 0; END;
  END IF;
  IF a_count = 0 THEN
    BEGIN SELECT count(*)::int INTO a_count FROM emr.ambulances WHERE tenant_id::text = target_tenant_id::text AND lower(coalesce(status, '')) IN ('active','online','available'); EXCEPTION WHEN OTHERS THEN a_count := 0; END;
  END IF;

  INSERT INTO emr.management_tenant_metrics (
    tenant_id, tenant_code, tenant_name, schema_name,
    doctors_count, patients_count, available_beds, available_ambulances, updated_at
  )
  VALUES (
    target_tenant_id::uuid,
    t_code,
    COALESCE(t_name, t_code),
    COALESCE(found_sc, sc, lower(t_code)),
    d_count, p_count, b_count, a_count, NOW()
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
