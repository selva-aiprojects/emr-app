/**
 * Tenant Management Service
 * Handles all tenant-related database operations
 */

import { query } from './connection.js';

// =====================================================
// TENANT MANAGEMENT
// =====================================================

export async function getTenantTier(tenantId) {
  const sql = 'SELECT subscription_tier FROM management_tenants WHERE id::text = $1::text';
  const result = await query(sql, [tenantId]);
  return result.rows[0]?.subscription_tier || 'Basic';
}

export async function getTenantCustomFeatures(tenantId) {
  const sql = 'SELECT feature_flag, enabled FROM tenant_features WHERE tenant_id::uuid = $1::uuid';
  const result = await query(sql, [tenantId]);
  return result.rows.map(row => ({
    featureFlag: row.feature_flag,
    enabled: row.enabled
  }));
}

export async function getGlobalKillSwitches() {
  const sql = 'SELECT feature_flag, enabled FROM global_kill_switches WHERE enabled = true';
  const result = await query(sql);
  const killSwitches = {};
  result.rows.forEach(row => {
    killSwitches[row.feature_flag] = row.enabled;
  });
  return killSwitches;
}

export async function setGlobalKillSwitch(featureFlag, enabled, userId, reason) {
  const sql = `
    INSERT INTO global_kill_switches (feature_flag, enabled, created_by, reason)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (feature_flag) 
    DO UPDATE SET enabled = $2, updated_at = NOW(), updated_by = $3, reason = $4
  `;
  await query(sql, [featureFlag, enabled, userId, reason]);
}

export async function getTenantFeatureStatus(tenantId) {
  const sql = 'SELECT * FROM tenant_feature_status WHERE tenant_id::text = $1::text';
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function setTenantTier(tenantId, tier) {
  const sql = `
    UPDATE tenants 
    SET subscription_tier = $1, updated_at = NOW() 
    WHERE id::text = $2::text 
    RETURNING *
  `;
  const result = await query(sql, [tier, tenantId]);
  return result.rows[0];
}

export async function setTenantFeatureOverride(tenantId, featureFlag, enabled) {
  const sql = `
    INSERT INTO tenant_features (tenant_id, feature_flag, enabled, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (tenant_id, feature_flag) 
    DO UPDATE SET enabled = $3, updated_at = NOW()
  `;
  await query(sql, [tenantId, featureFlag, enabled]);
}

export async function createAuditLog({ tenantId, userId, userName, action, entityName, entityId, details, ipAddress, userAgent }) {
  const safeUserId = userId === '44000000-0000-0000-0000-000000000001' ? null : userId;
  const sql = `
    INSERT INTO audit_logs (tenant_id, user_id, user_name, action, entity_name, entity_id, details, ip_address, user_agent)
    VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, safeUserId, userName, action, entityName, entityId, details, ipAddress, userAgent]);
  return result.rows[0];
}

export async function updateTenantSettings({ tenantId, displayName, theme, features, subscriptionTier, billingConfig, logo_url: req_logo_url }) {
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (displayName !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(displayName);
  }
  if (theme !== undefined) {
    updates.push(`theme = $${paramIndex++}`);
    values.push(JSON.stringify(theme));
  }
  if (features !== undefined) {
    updates.push(`features = $${paramIndex++}`);
    values.push(JSON.stringify(features));
  }
  if (subscriptionTier !== undefined) {
    updates.push(`subscription_tier = $${paramIndex++}`);
    values.push(subscriptionTier);
  }
  if (billingConfig !== undefined) {
    updates.push(`billing_config = $${paramIndex++}`);
    values.push(JSON.stringify(billingConfig));
  }
  if (req_logo_url !== undefined) {
    updates.push(`logo_url = $${paramIndex++}`);
    values.push(req_logo_url);
  }

  if (updates.length === 0) return null;

  updates.push('updated_at = NOW()');
  values.push(String(tenantId));

  const sql = `
    UPDATE tenants 
    SET ${updates.join(', ')}
    WHERE id::text = $${paramIndex}::text
    RETURNING *
  `;

  const result = await query(sql, values);
  const tenant = result.rows[0];

  // Sync to management_tenants for the modern Control Plane
  if (tenant) {
    const mgmtUpdates = [];
    const mgmtValues = [];
    let mgmtIdx = 1;

    if (displayName !== undefined) {
      mgmtUpdates.push(`name = $${mgmtIdx++}`);
      mgmtValues.push(displayName);
    }
    if (subscriptionTier !== undefined) {
      mgmtUpdates.push(`subscription_tier = $${mgmtIdx++}`);
      mgmtValues.push(subscriptionTier);
    }
    if (req_logo_url !== undefined) {
      mgmtUpdates.push(`logo_url = $${mgmtIdx++}`);
      mgmtValues.push(req_logo_url);
    }
    if (theme !== undefined) {
      mgmtUpdates.push(`theme = $${mgmtIdx++}`);
      mgmtValues.push(JSON.stringify(theme));
    }
    if (features !== undefined) {
      mgmtUpdates.push(`features = $${mgmtIdx++}`);
      mgmtValues.push(JSON.stringify(features));
    }
    if (billingConfig !== undefined) {
      mgmtUpdates.push(`billing_config = $${mgmtIdx++}`);
      mgmtValues.push(JSON.stringify(billingConfig));
    }

    if (mgmtUpdates.length > 0) {
      mgmtUpdates.push('updated_at = NOW()');
      mgmtValues.push(tenantId);
      try {
        const mgmtSql = `UPDATE management_tenants SET ${mgmtUpdates.join(', ')} WHERE id::text = $${mgmtIdx}::text`;
        await query(mgmtSql, mgmtValues);
      } catch (syncErr) {
        console.warn(`[SYNC_WARNING] Failed to propagate settings to management plane for ${tenantId}:`, syncErr.message);
      }
    }
  }

  // Return merged data for frontend compatibility
  return {
    ...tenant,
    theme: theme || tenant?.theme || {},
    features: features || tenant?.features || {},
    billingConfig: billingConfig || tenant?.billing_config || {},
    logo_url: req_logo_url || tenant?.logo_url
  };
}

async function resolveTenantCode(tenantId) {
  let result = await query('SELECT code FROM management_tenants WHERE id::text = $1::text', [tenantId]);
  if (!result.rows[0]) {
    result = await query('SELECT code FROM tenants WHERE id::text = $1::text', [tenantId]);
  }
  return (result.rows[0]?.code || 'UNK').toUpperCase();
}

export async function generateMRN(tenantId) {
  const tenantCode = await resolveTenantCode(tenantId);

  const sql = `
    INSERT INTO mrn_sequences (tenant_id, sequence_value)
    VALUES ($1, 1)
    ON CONFLICT (tenant_id)
    DO UPDATE SET sequence_value = mrn_sequences.sequence_value + 1
    RETURNING sequence_value
  `;

  const result = await query(sql, [tenantId]);
  const sequence = result.rows[0].sequence_value;
  return `${tenantCode}${sequence.toString().padStart(6, '0')}`;
}

export async function generateInvoiceNumber(tenantId) {
  const tenantCode = await resolveTenantCode(tenantId);

  const sql = `
    INSERT INTO invoice_sequences (tenant_id, sequence_value)
    VALUES ($1, 1)
    ON CONFLICT (tenant_id)
    DO UPDATE SET sequence_value = invoice_sequences.sequence_value + 1
    RETURNING sequence_value
  `;

  const result = await query(sql, [tenantId]);
  const sequence = result.rows[0].sequence_value;
  return `INV-${tenantCode}-${sequence.toString().padStart(6, '0')}`;
}

export async function getTenants() {
  try {
    const mgmtRes = await query(`
      WITH metrics_by_code AS (
        SELECT
          lower(coalesce(mt.code, mtm.tenant_code)) AS code_key,
          MAX(COALESCE(mtm.patients_count, 0)) AS patients_count,
          MAX(COALESCE(mtm.doctors_count, 0)) AS doctors_count,
          MAX(COALESCE(mtm.available_beds, 0)) AS available_beds,
          MAX(COALESCE(mtm.available_ambulances, 0)) AS available_ambulances,
          MAX(COALESCE(mtm.active_users_count, 0)) AS active_users_count
        FROM management_tenant_metrics mtm
        LEFT JOIN management_tenants mt ON mt.id::text = mtm.tenant_id::text
        GROUP BY lower(coalesce(mt.code, mtm.tenant_code))
      )
      SELECT
        t.id, t.name, t.code, t.subdomain, t.status, t.created_at, t.updated_at,
        t.subscription_tier, t.contact_email, t.schema_name, mt.theme, mt.features, mt.logo_url, mt.billing_config,
        COALESCE(mbc.patients_count, 0) as patients,
        COALESCE(mbc.patients_count, 0) as patient_count,
        COALESCE(mbc.doctors_count, 0) as doctors,
        COALESCE(mbc.doctors_count, 0) as doctors_count,
        COALESCE(mbc.available_beds, 0) as "bedsAvailable",
        COALESCE(mbc.available_beds, 0) as beds_available,
        COALESCE(mbc.available_ambulances, 0) as "ambulancesAvailable",
        COALESCE(mbc.available_ambulances, 0) as ambulances_available,
        COALESCE(mbc.active_users_count, 0) as active_users_count,
        COALESCE(mbc.active_users_count, 0) as "activeUsers"
      FROM management_tenants t LEFT JOIN tenants mt ON mt.id::text = t.id::text
      LEFT JOIN metrics_by_code mbc ON lower(t.code) = mbc.code_key
      ORDER BY t.name
    `);
    
    const legacyRes = await query(`
      SELECT id, name, code, subdomain, status, created_at, updated_at, 
             subscription_tier, contact_email, code as schema_name, theme, features, logo_url, billing_config,
             0 as patients, 0 as patient_count, 0 as doctors, 0 as doctors_count, 0 as "bedsAvailable",
             0 as beds_available, 0 as "ambulancesAvailable", 0 as ambulances_available,
             0 as active_users_count, 0 as "activeUsers"
      FROM tenants 
      ORDER BY name
    `);

    const tenantsMap = new Map();
    legacyRes.rows.forEach(t => tenantsMap.set(t.id, t));
    mgmtRes.rows.forEach(t => tenantsMap.set(t.id, t));

    return Array.from(tenantsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('[CRITICAL_REGISTRY_ERROR] Registry lookup failed:', err.message);
    const result = await query(`SELECT id, name, code, subdomain, status FROM tenants LIMIT 100`);
    return result.rows;
  }
}

export const getAllTenants = () => getTenants();

export async function getTenantById(id) {
  const result = await query('SELECT * FROM management_tenants WHERE id::text = $1::text', [id]);
  return result.rows[0];
}

export async function updateTenantStatus(id, status) {
  const result = await query(
    'UPDATE management_tenants SET status = $1, updated_at = NOW() WHERE id::text = $2::text RETURNING *',
    [status, id]
  );
  return result.rows[0];
}

export async function getTenantByCode(code) {
  let result = await query('SELECT * FROM management_tenants WHERE UPPER(code) = UPPER($1)', [code]);
  if (result.rows.length === 0) {
    result = await query('SELECT * FROM tenants WHERE UPPER(code) = UPPER($1)', [code]);
  }
  return result.rows[0];
}

export async function createTenant({ name, code, subdomain, contactEmail, theme, features, subscription_tier }) {
  const sql = `
    INSERT INTO tenants (name, code, subdomain, contact_email, theme, features, subscription_tier, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
    RETURNING *
  `;
  const result = await query(sql, [
    name, 
    code, 
    subdomain, 
    contactEmail, 
    theme ? JSON.stringify(theme) : '{}', 
    features ? JSON.stringify(features) : '{}',
    subscription_tier || 'Professional'
  ]);
  const tenant = result.rows[0];

  const mgmtSql = `
    INSERT INTO management_tenants (id, name, code, subdomain, schema_name, status, contact_email, subscription_tier)
    VALUES ($1, $2, $3, $4, $5, 'active', $6, $7)
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      subdomain = EXCLUDED.subdomain,
      contact_email = EXCLUDED.contact_email,
      subscription_tier = EXCLUDED.subscription_tier,
      updated_at = NOW()
  `;
  await query(mgmtSql, [
    tenant.id, 
    name, 
    code, 
    subdomain, 
    code.toLowerCase(),
    contactEmail,
    subscription_tier || 'Professional'
  ]);

  return tenant;
}

export async function provisionTenantSchema(tenantId, schemaName) {
  const log = [`🚀 Provisioning schema [${schemaName}] for tenant [${tenantId}]`];
  
  try {
    await query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    log.push(`✅ Created schema: ${schemaName}`);

    const tableRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'nexus' AND table_type = 'BASE TABLE'
    `);
    
    const controlPlaneTables = [
      'tenants', 'users', 'audit_logs', 'tenant_resources', 
      'tenant_features', 'global_kill_switches', 'tenant_feature_status',
      'mrn_sequences', 'invoice_sequences', 'roles', 'role_permissions',
      'management_tenants', 'management_tenant_metrics', 'migrations_log'
    ];
    
    const candidates = tableRes.rows
      .map(r => r.table_name)
      .filter(t => !controlPlaneTables.includes(t));

    for (const table of candidates) {
      await query(`CREATE TABLE IF NOT EXISTS "${schemaName}"."${table}" (LIKE nexus."${table}" INCLUDING ALL)`);
      log.push(`   📦 Cloned clinical table: ${table}`);
    }

    log.push(`✨ Schema provisioning complete for ${schemaName}`);
    return { success: true, log };
  } catch (err) {
    console.error(`[PROVISIONING_ERROR] Failed for ${schemaName}:`, err.message);
    return { success: false, error: err.message, log };
  }
}
