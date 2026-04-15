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
  // Fallback if file missing (optional, but keep it empty if we want strictness)
  console.warn('[INFRA] NEXUS_MASTER_BASELINE.sql not found at:', baselinePath);
}

// The following block was previously hardcoded but is now loaded from NEXUS_MASTER_BASELINE.sql
// We keep any service-specific dynamic functions here if they aren't in the baseline
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
    
    // B. Install Service Extensions
    await pool.query(SERVICE_LAYER_EXTENSIONS);

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
  await pool.query('SELECT emr.install_tenant_metrics_sync($1, $2::text)', [schemaName, tenantId]);
}

export async function refreshTenantMetrics(tenantId, schemaName = null) {
  await ensureManagementPlaneInfrastructure();
  await pool.query('SELECT emr.refresh_management_tenant_metrics($1::text, $2)', [tenantId, schemaName]);
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
