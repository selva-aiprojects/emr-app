/**
 * Tenant Management Service
 * Handles all tenant-related database operations
 */

import { query } from './connection.js';

// =====================================================
// TENANT MANAGEMENT
// =====================================================

export async function getTenantTier(tenantId) {
  const sql = 'SELECT subscription_tier FROM emr.tenants WHERE id = $1';
  const result = await query(sql, [tenantId]);
  return result.rows[0]?.subscription_tier || 'Basic';
}

export async function getTenantCustomFeatures(tenantId) {
  const sql = 'SELECT feature_flag, enabled FROM emr.tenant_features WHERE tenant_id = $1';
  const result = await query(sql, [tenantId]);
  return result.rows.map(row => ({
    featureFlag: row.feature_flag,
    enabled: row.enabled
  }));
}

export async function getGlobalKillSwitches() {
  const sql = 'SELECT feature_flag, enabled FROM emr.global_kill_switches WHERE enabled = true';
  const result = await query(sql);
  const killSwitches = {};
  result.rows.forEach(row => {
    killSwitches[row.feature_flag] = row.enabled;
  });
  return killSwitches;
}

export async function setGlobalKillSwitch(featureFlag, enabled, userId, reason) {
  const sql = `
    INSERT INTO emr.global_kill_switches (feature_flag, enabled, created_by, reason)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (feature_flag) 
    DO UPDATE SET enabled = $2, updated_at = NOW(), updated_by = $3, reason = $4
  `;
  await query(sql, [featureFlag, enabled, userId, reason]);
}

export async function getTenantFeatureStatus(tenantId) {
  const sql = 'SELECT * FROM emr.tenant_feature_status WHERE tenant_id = $1';
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function setTenantTier(tenantId, tier) {
  const sql = `
    UPDATE emr.tenants 
    SET subscription_tier = $1, updated_at = NOW() 
    WHERE id = $2 
    RETURNING *
  `;
  const result = await query(sql, [tier, tenantId]);
  return result.rows[0];
}

export async function setTenantFeatureOverride(tenantId, featureFlag, enabled) {
  const sql = `
    INSERT INTO emr.tenant_features (tenant_id, feature_flag, enabled, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (tenant_id, feature_flag) 
    DO UPDATE SET enabled = $3, updated_at = NOW()
  `;
  await query(sql, [tenantId, featureFlag, enabled]);
}

export async function createAuditLog({ tenantId, userId, userName, action, entityName, entityId, details, ipAddress, userAgent }) {
  const sql = `
    INSERT INTO emr.audit_logs (tenant_id, user_id, user_name, action, entity_name, entity_id, details, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, userId, userName, action, entityName, entityId, details, ipAddress, userAgent]);
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

  updates.push('updated_at = NOW()');
  values.push(tenantId);

  const sql = `
    UPDATE emr.tenants 
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  console.log('[REPO_DEBUG] updateTenantSettings SQL:', sql);
  console.log('[REPO_DEBUG] updateTenantSettings Values:', values);
  const result = await query(sql, values);
  return result.rows[0];
}

export async function generateMRN(tenantId) {
  const tenantResult = await query('SELECT code FROM emr.tenants WHERE id = $1', [tenantId]);
  const tenantCode = tenantResult.rows[0]?.code || 'UNK';

  const sql = `
    INSERT INTO emr.mrn_sequences (tenant_id, sequence_value)
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
  const tenantResult = await query('SELECT code FROM emr.tenants WHERE id = $1', [tenantId]);
  const tenantCode = tenantResult.rows[0]?.code || 'UNK';

  const sql = `
    INSERT INTO emr.invoice_sequences (tenant_id, sequence_value)
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
  const result = await query(`
    SELECT
      t.id,
      t.name,
      t.code,
      t.subdomain,
      t.theme,
      t.features,
      t.billing_config,
      t.status,
      t.created_at,
      t.updated_at,
      t.subscription_tier,
      t.logo_url,
      t.contact_email,
      COALESCE(
        mtm.patients_count,
        CASE
          WHEN lower(t.code) = 'nah' THEN (SELECT COUNT(*) FROM nah.patients)
          WHEN lower(t.code) = 'ehs' THEN (SELECT COUNT(*) FROM ehs.patients)
          ELSE (SELECT COUNT(*) FROM emr.patients WHERE tenant_id = t.id)
        END
      ) as patient_count,
      COALESCE(mtm.doctors_count, 0) as doctors_count,
      COALESCE(mtm.available_beds, 0) as beds_available,
      COALESCE(mtm.available_ambulances, 0) as ambulances_available,
      COALESCE(mtm.insurance_capacity, 0) as insurance_capacity,
      COALESCE(mtm.active_users_count, 0) as active_users_count
    FROM emr.tenants t
    LEFT JOIN public.management_tenant_metrics mtm
      ON mtm.tenant_id = t.id
    ORDER BY t.name
  `);
  return result.rows;
}

export async function getTenantById(id) {
  const result = await query('SELECT * FROM emr.tenants WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateTenantStatus(id, status) {
  const result = await query(
    'UPDATE emr.tenants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
}

export async function getTenantByCode(code) {
  const result = await query('SELECT * FROM emr.tenants WHERE code = $1', [code]);
  return result.rows[0];
}
export async function createTenant({ name, code, subdomain, contactEmail, theme, features }) {
  const sql = `
    INSERT INTO emr.tenants (name, code, subdomain, contact_email, theme, features, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'active')
    RETURNING *
  `;
  const result = await query(sql, [name, code, subdomain, contactEmail, theme, JSON.stringify(features)]);
  return result.rows[0];
}

/**
 * Automates the creation of an isolated clinical schema for a new tenant.
 * Clones all clinical table structures from the foundational 'emr' schema.
 */
export async function provisionTenantSchema(tenantId, schemaName) {
  const log = [`🚀 Provisioning schema [${schemaName}] for tenant [${tenantId}]`];
  
  try {
    // 1. Create the schema
    await query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    log.push(`✅ Created schema: ${schemaName}`);

    // 2. Identify clinical tables to clone
    const tableRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'emr' AND table_type = 'BASE TABLE'
    `);
    
    // Core master tables that stay in 'emr' Control Plane
    const controlPlaneTables = [
      'tenants', 'users', 'audit_logs', 'tenant_resources', 
      'tenant_features', 'global_kill_switches', 'tenant_feature_status',
      'mrn_sequences', 'invoice_sequences', 'roles', 'role_permissions'
    ];
    
    const candidates = tableRes.rows
      .map(r => r.table_name)
      .filter(t => !controlPlaneTables.includes(t));

    // 3. Clone table structures
    for (const table of candidates) {
      // Use INCLUDING ALL to copy indexes, constraints, and defaults
      await query(`CREATE TABLE IF NOT EXISTS ${schemaName}.${table} (LIKE emr.${table} INCLUDING ALL)`);
      log.push(`   📦 Cloned clinical table: ${table}`);
    }

    log.push(`✨ Schema provisioning complete for ${schemaName}`);
    return { success: true, log };
  } catch (err) {
    console.error(`[PROVISIONING_ERROR] Failed for ${schemaName}:`, err.message);
    return { success: false, error: err.message, log };
  }
}
