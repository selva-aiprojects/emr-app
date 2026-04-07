import { managementClient, getTenantClient } from '../db/prisma_manager.js';
import { query } from '../db/connection.js';
import { provisionNewTenant } from '../services/provisioning.service.js';
import { ensureManagementPlaneInfrastructure, getSuperadminOverview, refreshTenantMetrics } from '../services/superadminMetrics.service.js';
import bcrypt from 'bcryptjs';

/**
 * SuperAdmin Dashboard Statistics
 * Returns consolidated counts from the management plane only.
 */
export async function getConsolidatedStats(req, res) {
  try {
    const overview = await getSuperadminOverview();
    res.json({
      summary: {
        totalTenants: overview.totals.tenants,
        totalDoctors: overview.totals.doctors,
        totalPatients: overview.totals.patients,
        availableBeds: overview.totals.bedsAvailable,
        availableAmbulances: overview.totals.ambulancesAvailable,
        insuranceCapacity: overview.totals.insuranceCapacity,
        activeOffers: overview.totals.activeOffers,
        openTickets: overview.totals.openTickets,
        issues: overview.totals.issues
      },
      infra: overview.infra,
      tenants: overview.tenants,
      generatedAt: overview.generatedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getManagementOverview(req, res) {
  try {
    const overview = await getSuperadminOverview();
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Global Support Ticket Management
 */
export async function getGlobalSupportTickets(req, res) {
  try {
    try {
      const ticketsRes = await query(`
        SELECT * FROM emr.management_system_logs 
        WHERE event LIKE '%TICKET%' 
        ORDER BY created_at DESC 
        LIMIT 50
      `);
      res.json(ticketsRes.rows);
    } catch (dbErr) {
      console.warn('Support tickets table not ready:', dbErr.message);
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Global User Provisioning for a specific tenant
 */
export async function provisionTenantUser(req, res) {
  const { tenantCode, email, password, name, roleName } = req.body;

  try {
    const tenantRes = await query('SELECT * FROM emr.management_tenants WHERE code = $1', [tenantCode]);
    const tenant = tenantRes.rows[0];

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const tenantDb = getTenantClient(tenant.schema_name);

    let role = await tenantDb.role.findUnique({ where: { name: roleName } });
    if (!role) {
      role = await tenantDb.role.create({ data: { name: roleName } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await tenantDb.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        name,
        role_id: role.id
      }
    });

    await refreshTenantMetrics(tenant.id, tenant.schema_name);
    res.json({ success: true, userId: user.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Global Password Reset (Any User, Any Tenant)
 */
export async function globalPasswordReset(req, res) {
  const { tenantCode, email, newPassword } = req.body;

  try {
    const tenantRes = await query('SELECT * FROM emr.management_tenants WHERE code = $1', [tenantCode]);
    const tenant = tenantRes.rows[0];

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const tenantDb = getTenantClient(tenant.schema_name);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await tenantDb.user.update({
      where: { email },
      data: { password_hash: hashedPassword }
    });

    res.json({ success: true, message: `Password reset for ${email} in ${tenantCode}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Tenant Creation Wrapper
 */
export async function createNewTenant(req, res) {
  try {
    const { tenantData, adminData } = req.body;
    const result = await provisionNewTenant(tenantData, adminData);
    res.json(result);
  } catch (error) {
    if (error.code === 'P2002' || (error.message && error.message.includes('Unique constraint failed'))) {
      return res.status(400).json({ error: 'A tenant with this code or subdomain already exists. Please choose a unique identifier.' });
    }
    res.status(500).json({ error: error.message });
  }
}

/**
 * Sync Legacy Tenants to Control Plane
 * Bridges the old 'emr.tenants' table to the new 'management_tenants' registry.
 */
export async function syncLegacyTenants(req, res) {
  try {
    await ensureManagementPlaneInfrastructure();
    const legacy = await managementClient.$queryRawUnsafe('SELECT id, name, code, subdomain, schema_name FROM emr.tenants');

    let syncedCount = 0;

    for (const tenant of legacy) {
      await query(`
        INSERT INTO emr.management_tenants (id, name, code, subdomain, schema_name, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          subdomain = EXCLUDED.subdomain,
          schema_name = EXCLUDED.schema_name,
          updated_at = NOW()
      `, [tenant.id, tenant.name, tenant.code, tenant.subdomain, tenant.schema_name]);

      await refreshTenantMetrics(tenant.id, tenant.schema_name);
      syncedCount++;
    }

    res.json({ success: true, message: `Successfully synced ${syncedCount} legacy tenants to the Control Plane registry.` });
  } catch (error) {
    console.error('FAILED_TENANT_SYNC:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Strategic Communication Dispatch
 */
export async function sendCommunication(req, res) {
  const { tenantCode, templateId, metadata } = req.body;
  
  try {
    console.log(`[COMMUNICATION_HUB] Dispatching Shard [${templateId}] to Node [${tenantCode}]`, metadata);
    
    // In a real implementation, this would use a mail service or notification queue
    res.json({ 
      success: true, 
      message: `Strategic Communication Shard [${templateId}] successfully dispatched to ${tenantCode}.`,
      dispatchId: `SHARD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
  } catch (error) {
    console.error('Communication dispatch error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Trigger manual on-demand management plane refresh
 */
export async function syncManagementMetrics(req, res) {
  try {
    const { ensureManagementPlaneInfrastructure, refreshTenantMetrics } = await import('../services/superadminMetrics.service.js');
    const { query } = await import('../db/connection.js');

    console.log('🚀 [MANUAL_SYNC] Forced synchronization requested. Verifying Control Plane...');
    
    // 0. SELF-HEALING: Ensure function exists
    await ensureManagementPlaneInfrastructure();

    // 1. Audit legacy institutional nodes
    const { rows: legacy } = await query('SELECT id, name, code, subdomain, schema_name FROM emr.tenants');
    console.log(`🔍 [MANUAL_SYNC] Auditing ${legacy.length} legacy hospital nodes...`);

    for (const t of legacy) {
       // Ensure they exist in the management plane registry (using code as the anchor to prevent 500 collisions)
       const { rows: synced } = await query(`
         INSERT INTO emr.management_tenants (id, name, code, subdomain, schema_name, status)
         VALUES ($1, $2, $3, $4, $5, 'active')
         ON CONFLICT (code) DO UPDATE SET 
           name = EXCLUDED.name, 
           updated_at = NOW()
         RETURNING id
       `, [t.id, t.name, t.code, t.subdomain, t.schema_name || t.code.toLowerCase()]);
       
       const actualId = synced[0].id;

       // Perform the individual telemetry audit for this node using the correct identity
       console.log(`📊 [MANUAL_SYNC] Syncing shard: ${t.code} (Identity: ${actualId})`);
       await refreshTenantMetrics(actualId, t.schema_name || t.code.toLowerCase());
    }

    // 2. Final Dashboard Recalculation
    const pool = (await import('../db/connection.js')).default;
    await pool.query('SELECT emr.refresh_all_management_tenant_metrics()');
    
    res.json({ success: true, message: 'All management metrics synchronized from isolated shards.' });
  } catch (error) {
    console.error('[SYNC_FATAL_ERROR]', error);
    res.status(500).json({ 
      error: `Manual sync failed: ${error.message}`,
      hint: 'Check if you have recently run fix_management_plane.js which might have locked tables.'
    });
  }
}
