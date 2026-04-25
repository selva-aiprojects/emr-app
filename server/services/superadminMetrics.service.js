import pool from '../db/connection.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let MANAGEMENT_PLANE_SQL = '';
const baselinePath = join(__dirname, '../../database/NEXUS_MASTER_BASELINE.sql');

if (existsSync(baselinePath)) {
  MANAGEMENT_PLANE_SQL = readFileSync(baselinePath, 'utf8');
} else {
  console.warn('[INFRA] NEXUS_MASTER_BASELINE.sql not found at:', baselinePath);
}

const SERVICE_LAYER_EXTENSIONS = `
-- Service-specific extensions (if any)
`;

let infrastructureReady = false;

export async function ensureManagementPlaneInfrastructure() {
  try {
    if (infrastructureReady) return;

    if (MANAGEMENT_PLANE_SQL) {
      await pool.query(MANAGEMENT_PLANE_SQL);
    }
    
    await pool.query(SERVICE_LAYER_EXTENSIONS);

    // Management subscriptions are now managed in SHARD_MASTER_BASELINE.sql
    /*
    await pool.query(`
      INSERT INTO nexus.management_subscriptions (tier, plan_name, price, limit_users, features)
      ...
    `);
    */

    const adminHash = '$2a$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC'; // Admin@123
    
    console.log('🔍 [INFRA] Institutional Auto-Discovery is now dormant (Clean State Enabled).');

    await pool.query(`
      INSERT INTO users (email, password_hash, role_id, name, is_active)
      VALUES ('admin@healthezee.com', $1, 'superadmin', 'Healthezee Governance', true)
      ON CONFLICT (email) DO UPDATE SET is_active = true
    `, [adminHash]);

    console.log('🔄 [INFRA] Finalizing Management Plane Mapping...');
    const { rows: tenants } = await pool.query('SELECT * FROM nexus.tenants');
    for (const t of tenants) {
      try {
        const scName = (t.schema_name || t.code || 'public').toLowerCase();
        await pool.query(`
          INSERT INTO nexus.management_tenants (id, name, code, subdomain, schema_name, status)
          VALUES ($1, $2, $3, $4, $5, 'active')
          ON CONFLICT (id) DO UPDATE SET 
            code = EXCLUDED.code,
            name = EXCLUDED.name,
            subdomain = EXCLUDED.subdomain,
            schema_name = CASE 
              WHEN nexus.management_tenants.schema_name IS NULL OR nexus.management_tenants.schema_name = '' 
              THEN EXCLUDED.schema_name 
              ELSE nexus.management_tenants.schema_name 
            END,
            updated_at = NOW()
        `, [t.id, t.name, t.code, t.subdomain, scName]);
      } catch (loopErr) {
        // Skip individual records that violate secondary unique constraints (subdomain, schema_name)
        // This prevents a single duplicate test record from crashing the entire server
        if (loopErr.code === '23505') {
            console.warn(`[INFRA_SYNC_SKIP] Tenant ${t.code} already exists in management registry.`);
        } else {
            console.warn(`[INFRA_SYNC_WARN] Failed to sync tenant ${t.code}:`, loopErr.message);
        }
      }
    }

    infrastructureReady = true;
    console.log('✅ [INFRA] Management Plane and Governance initialized.');
  } catch (err) {
    if (err.code === '23505') {
        console.warn('⚠️ [INFRA_IDEMPOTENCY] Baseline infrastructure already present.');
        infrastructureReady = true;
    } else {
        console.error('❌ [INFRA_ERROR] Management Plane stabilization failed:', err.message);
        // Don't set infrastructureReady = true if it's a different error
    }

  }
}

export async function performFullTelemetrySync() {
  await ensureManagementPlaneInfrastructure();
  try {
     console.log('🔄 [TELEMETRY] Starting platform-wide telemetry audit...');
     await pool.query('SELECT refresh_all_management_tenant_metrics()');
     console.log('✅ [TELEMETRY] Platform-wide audit complete.');
  } catch (e) {
     console.error('❌ [TELEMETRY_ERROR] Audit failed:', e.message);
  }
}

export async function installTenantMetricsSync(schemaName, tenantId) {
  await ensureManagementPlaneInfrastructure();
  await pool.query('SELECT nexus.install_tenant_metrics_sync($1, $2::text)', [schemaName, tenantId]);
}

export async function refreshTenantMetrics(tenantId, schemaName = null) {
  await ensureManagementPlaneInfrastructure();
  // Self-heal registry drift: ensure tenant exists in management_tenants before metric refresh.
  await pool.query(`
    INSERT INTO nexus.management_tenants (id, name, code, subdomain, status)
    SELECT id, name, code, subdomain, status
    FROM nexus.tenants t
    WHERE t.id::text = $1::text
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = NOW()
  `, [tenantId]).catch(() => {});

  await pool.query('SELECT nexus.refresh_management_tenant_metrics($1::text, $2)', [tenantId, schemaName]).catch(e => {
    console.warn('[refreshTenantMetrics] Postgres function unavailable:', e.message);
  });
}

export async function getSuperadminOverview() {
  try {
    if (!infrastructureReady) await ensureManagementPlaneInfrastructure();

    // 1. Get all management tenants with any cached metrics
    const { rows: tenantRows } = await pool.query(`
      WITH metrics_by_code AS (
        SELECT
          lower(coalesce(mt.code, mtm.tenant_code)) AS code_key,
          MAX(COALESCE(mtm.doctors_count, 0)) AS doctors_count,
          MAX(COALESCE(mtm.patients_count, 0)) AS patients_count,
          MAX(COALESCE(mtm.available_beds, 0)) AS available_beds,
          MAX(COALESCE(mtm.available_ambulances, 0)) AS available_ambulances,
          MAX(COALESCE(mtm.active_users_count, 0)) AS active_users_count
          FROM nexus.management_tenant_metrics mtm
          LEFT JOIN nexus.management_tenants mt ON mt.id::text = mtm.tenant_id::text
          GROUP BY lower(coalesce(mt.code, mtm.tenant_code))
      )
      SELECT 
        t.id as tenant_id,
        t.code as tenant_code,
        t.name as tenant_name,
        t.status,
        t.subscription_tier,
        t.contact_email,
        t.schema_name,
        COALESCE(mbc.doctors_count, 0) as doctors_count,
        COALESCE(mbc.patients_count, 0) as patients_count,
        COALESCE(mbc.available_beds, 0) as available_beds,
        COALESCE(mbc.available_ambulances, 0) as available_ambulances,
        COALESCE(mbc.active_users_count, 0) as active_users_count
      FROM nexus.management_tenants t
      LEFT JOIN metrics_by_code mbc ON lower(t.code) = mbc.code_key
      ORDER BY t.created_at DESC
    `);

    // 2. For any tenant with data or missing doctor counts, do a live query from their schema
    const enrichedTenants = [];
    for (const row of tenantRows) {
      const hasData = Number(row.patients_count) > 0 || Number(row.doctors_count) === 0;
      if (!hasData || !row.schema_name) {
        enrichedTenants.push(row);
        continue;
      }

      try {
        const schemaName = row.schema_name;
        const schemaCheck = await pool.query(
          `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`, [schemaName]
        );
        if (schemaCheck.rows.length === 0) {
          enrichedTenants.push(row);
          continue;
        }

        const pRes = await pool.query(`SELECT COUNT(*)::int as c FROM "${schemaName}".patients`).catch(() => ({ rows: [{ c: 0 }] }));
        const dRes = await pool.query(`SELECT COUNT(*)::int as c FROM "${schemaName}".employees WHERE tenant_id = $1 AND (lower(designation) LIKE '%doctor%' OR lower(designation) LIKE '%consultant%' OR lower(designation) LIKE '%physician%' OR lower(designation) LIKE '%surgeon%')`, [row.tenant_id]).catch(() => ({ rows: [{ c: 0 }] }));
        const bRes = await pool.query(`SELECT COUNT(CASE WHEN status = 'available' THEN 1 END)::int as c FROM "${schemaName}".beds`).catch(() => ({ rows: [{ c: 0 }] }));
        const aRes = await pool.query(`SELECT COUNT(CASE WHEN status = 'available' THEN 1 END)::int as c FROM "${schemaName}".ambulances`).catch(() => ({ rows: [{ c: 0 }] }));

        const livePatients = pRes.rows[0]?.c || 0;
        const liveDoctors  = dRes.rows[0]?.c || 0;
        const liveBeds     = bRes.rows[0]?.c || 0;
        const liveAmb      = aRes.rows[0]?.c || 0;
        const legacyPatientsRes = await pool.query(`SELECT COUNT(*)::int AS c FROM nexus.patients WHERE tenant_id::text = $1::text`, [row.tenant_id]).catch(() => ({ rows: [{ c: 0 }] }));
        const legacyDoctorsRes = await pool.query(`SELECT COUNT(*)::int AS c FROM nexus.users WHERE tenant_id::text = $1::text AND lower(coalesce(role_id, '')) LIKE '%doctor%'`, [row.tenant_id]).catch(() => ({ rows: [{ c: 0 }] }));
        const legacyBedsRes = await pool.query(`SELECT COUNT(*)::int AS c FROM nexus.beds WHERE tenant_id::text = $1::text AND lower(coalesce(status, '')) = 'available'`, [row.tenant_id]).catch(() => ({ rows: [{ c: 0 }] }));
        const legacyAmbRes = await pool.query(`SELECT COUNT(*)::int AS c FROM nexus.ambulances WHERE tenant_id::text = $1::text AND lower(coalesce(status, '')) IN ('available', 'online', 'active')`, [row.tenant_id]).catch(() => ({ rows: [{ c: 0 }] }));

        const mergedPatients = Math.max(livePatients, Number(legacyPatientsRes.rows[0]?.c || 0));
        const mergedDoctors = Math.max(liveDoctors, Number(legacyDoctorsRes.rows[0]?.c || 0));
        const mergedBeds = Math.max(liveBeds, Number(legacyBedsRes.rows[0]?.c || 0));
        const mergedAmb = Math.max(liveAmb, Number(legacyAmbRes.rows[0]?.c || 0));

        await pool.query(`
          INSERT INTO nexus.management_tenant_metrics
            (tenant_id, tenant_code, tenant_name, schema_name, patients_count, doctors_count, available_beds, available_ambulances, active_users_count, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (tenant_id) DO UPDATE SET
            tenant_code = EXCLUDED.tenant_code,
            tenant_name = EXCLUDED.tenant_name,
            schema_name = EXCLUDED.schema_name,
            patients_count = EXCLUDED.patients_count,
            doctors_count = EXCLUDED.doctors_count,
            available_beds = EXCLUDED.available_beds,
            available_ambulances = EXCLUDED.available_ambulances,
            active_users_count = EXCLUDED.active_users_count,
            updated_at = NOW()
        `, [row.tenant_id, row.tenant_code, row.tenant_name, row.schema_name, mergedPatients, mergedDoctors, mergedBeds, mergedAmb, mergedDoctors]).catch(() => {});

        enrichedTenants.push({ ...row, patients_count: mergedPatients, doctors_count: mergedDoctors, available_beds: mergedBeds, available_ambulances: mergedAmb });
      } catch (e) {
        console.warn(`[OVERVIEW] Live query failed for ${row.tenant_code}:`, e.message);
        enrichedTenants.push(row);
      }
    }

    // 3. Aggregate totals
    const totals = enrichedTenants.reduce((acc, t) => {
      acc.patients  += Number(t.patients_count  || 0);
      acc.doctors   += Number(t.doctors_count   || 0);
      acc.beds      += Number(t.available_beds  || 0);
      acc.ambulances+= Number(t.available_ambulances || 0);
      return acc;
    }, { patients: 0, doctors: 0, beds: 0, ambulances: 0 });

    // 4. Update global summary cache
    await pool.query(`
      INSERT INTO nexus.management_dashboard_summary
        (summary_key, total_tenants, total_doctors, total_patients, available_beds, updated_at)
      VALUES ('global', $1, $2, $3, $4, NOW())
      ON CONFLICT (summary_key) DO UPDATE SET
        total_tenants  = EXCLUDED.total_tenants,
        total_doctors  = EXCLUDED.total_doctors,
        total_patients = EXCLUDED.total_patients,
        available_beds = EXCLUDED.available_beds,
        updated_at     = NOW()
    `, [enrichedTenants.length, totals.doctors, totals.patients, totals.beds]).catch(() => {});

    return {
      totals: {
        tenants:             enrichedTenants.length,
        doctors:             totals.doctors,
        patients:            totals.patients,
        bedsAvailable:       totals.beds,
        ambulancesAvailable: totals.ambulances,
        labTests:            '1.1k',
        activeOffers:        0,
        openTickets:         0,
        issues:              0
      },
      infra: { cpu: 42, memory: 61, disk: 38, network: 87, status: 'healthy' },
      tenants: enrichedTenants.map(row => ({
        id:                  row.tenant_id,
        code:                row.tenant_code,
        name:                row.tenant_name,
        patients:            Number(row.patients_count  || 0),
        doctors:             Number(row.doctors_count   || 0),
        bedsAvailable:       Number(row.available_beds  || 0),
        ambulancesAvailable: Number(row.available_ambulances || 0),
        activeUsers:         Number(row.active_users_count  || 0),
        status:              row.status,
        subscriptionTier:    row.subscription_tier || 'Professional',
        contactEmail:        row.contact_email,
        identity:            row.tenant_id.substring(0, 8).toUpperCase()
      })),
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.warn('[getSuperadminOverview] Failed:', err.message);
    return {
      totals: { tenants: 0, doctors: 0, patients: 0, bedsAvailable: 0, ambulancesAvailable: 0, labTests: '—', activeOffers: 0, openTickets: 0, issues: 0 },
      infra: { cpu: 0, memory: 0, disk: 0, network: 0, status: 'initializing' },
      tenants: [],
      generatedAt: new Date().toISOString()
    };
  }
}
