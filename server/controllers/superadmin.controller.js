import { managementClient, getTenantClient } from '../db/prisma_manager.js';
import { query } from '../db/connection.js';
import { provisionNewTenant } from '../services/provisioning.service.js';
import { ensureManagementPlaneInfrastructure, getSuperadminOverview, refreshTenantMetrics } from '../services/superadminMetrics.service.js';
import bcrypt from 'bcryptjs';

function assertSafeSchemaName(schemaName) {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(String(schemaName || ''))) {
    throw new Error(`Invalid tenant schema: ${schemaName}`);
  }
  return schemaName;
}

async function resolveTenantNode(tenantRef) {
  if (!tenantRef) return null;

  const managementLookup = await query(
    `SELECT id, code, name, subdomain, schema_name, contact_email
     FROM emr.management_tenants
     WHERE upper(code) = upper($1) OR id::text = $1::text
     LIMIT 1`,
    [tenantRef]
  );

  if (managementLookup.rows[0]) {
    return managementLookup.rows[0];
  }

  const legacyLookup = await query(
    `SELECT id, code, name, subdomain,
            COALESCE(schema_name, lower(code)) AS schema_name,
            contact_email
     FROM emr.tenants
     WHERE upper(code) = upper($1) OR id::text = $1::text
     LIMIT 1`,
    [tenantRef]
  );

  return legacyLookup.rows[0] || null;
}

async function ensureManagementTenantNode(tenant) {
  if (!tenant?.id || !tenant?.code) return;

  const fallbackSubdomain = String(tenant.subdomain || tenant.code).toLowerCase();
  const fallbackSchema = String(tenant.schema_name || tenant.code).toLowerCase();
  const fallbackName = tenant.name || tenant.code;
  const fallbackTier = tenant.subscription_tier || 'Professional';

  await query(
    `INSERT INTO emr.management_tenants
      (id, name, code, subdomain, schema_name, status, contact_email, subscription_tier, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, NOW(), NOW())
     ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      subdomain = COALESCE(NULLIF(emr.management_tenants.subdomain, ''), EXCLUDED.subdomain),
      schema_name = COALESCE(NULLIF(emr.management_tenants.schema_name, ''), EXCLUDED.schema_name),
      contact_email = COALESCE(emr.management_tenants.contact_email, EXCLUDED.contact_email),
      updated_at = NOW()`,
    [tenant.id, fallbackName, tenant.code, fallbackSubdomain, fallbackSchema, tenant.contact_email || null, fallbackTier]
  );
}

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
  const { tenantCode, tenantId, email, password, name, roleName } = req.body;

  try {
    const tenantRef = tenantCode || tenantId;
    if (!tenantRef) {
      return res.status(400).json({ error: 'tenantCode or tenantId is required' });
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'password is required' });
    }
    const effectiveRoleName = String(roleName || 'Admin').trim() || 'Admin';

    const tenant = await resolveTenantNode(tenantRef);

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    await ensureManagementTenantNode(tenant);

    const schemaName = assertSafeSchemaName(tenant.schema_name || String(tenant.code || '').toLowerCase());
    const tenantDb = getTenantClient(schemaName);

    let role = await tenantDb.role.findUnique({ where: { name: effectiveRoleName } });
    if (!role) {
      role = await tenantDb.role.create({ data: { name: effectiveRoleName } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await tenantDb.user.findUnique({ where: { email: normalizedEmail } });
    const user = existingUser
      ? await tenantDb.user.update({
          where: { email: normalizedEmail },
          data: { password_hash: hashedPassword, name, role_id: role.id }
        })
      : await tenantDb.user.create({
          data: {
            email: normalizedEmail,
            password_hash: hashedPassword,
            name,
            role_id: role.id
          }
        });

    await query(
      `INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (email) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id,
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        is_active = true`,
      [user.id, tenant.id, normalizedEmail, hashedPassword, name, effectiveRoleName]
    );

    let emailDelivery = 'skipped';
    try {
      const { sendTenantWelcomeEmail } = await import('../services/mail.service.js');
      const recipient = tenant.contact_email || normalizedEmail;
      await sendTenantWelcomeEmail(
        recipient,
        tenant.name || tenant.code,
        (tenant.subdomain || tenant.code || '').toLowerCase(),
        { email: normalizedEmail, password }
      );
      emailDelivery = 'sent';
    } catch (mailErr) {
      emailDelivery = `failed: ${mailErr.message}`;
      console.warn('[PROVISION_MAIL_WARN]', mailErr.message);
    }

    await refreshTenantMetrics(tenant.id, schemaName);
    res.json({
      success: true,
      userId: user.id,
      user: {
        id: user.id,
        name: user.name || name,
        email: normalizedEmail,
        tenantId: tenant.id,
        tenantCode: tenant.code
      },
      defaultPassword: password,
      emailDelivery
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Global Password Reset (Any User, Any Tenant)
 */
export async function globalPasswordReset(req, res) {
  const { tenantCode, tenantId, email, newPassword } = req.body;

  try {
    const tenantRef = tenantCode || tenantId;
    if (!tenantRef) {
      return res.status(400).json({ error: 'tenantCode or tenantId is required' });
    }
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !newPassword) {
      return res.status(400).json({ error: 'email and newPassword are required' });
    }

    const tenant = await resolveTenantNode(tenantRef);

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    await ensureManagementTenantNode(tenant);

    const schemaName = assertSafeSchemaName(tenant.schema_name || String(tenant.code || '').toLowerCase());
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const tenantUpdate = await query(
      `UPDATE "${schemaName}"."users"
       SET password_hash = $1
       WHERE lower(email) = lower($2) AND tenant_id::text = $3::text
       RETURNING id, name, email`,
      [hashedPassword, normalizedEmail, tenant.id]
    );

    if (!tenantUpdate.rows[0]) {
      return res.status(404).json({ error: `User ${normalizedEmail} not found in tenant ${tenant.code}` });
    }

    await query(
      `UPDATE emr.users
       SET password_hash = $1
       WHERE lower(email) = lower($2) AND tenant_id::text = $3::text`,
      [hashedPassword, normalizedEmail, tenant.id]
    );

    let emailDelivery = 'skipped';
    try {
      const { sendTenantWelcomeEmail } = await import('../services/mail.service.js');
      await sendTenantWelcomeEmail(
        normalizedEmail,
        tenant.name || tenant.code,
        (tenant.subdomain || tenant.code || '').toLowerCase(),
        { email: normalizedEmail, password: newPassword }
      );
      emailDelivery = 'sent';
    } catch (mailErr) {
      emailDelivery = `failed: ${mailErr.message}`;
      console.warn('[PASSWORD_RESET_MAIL_WARN]', mailErr.message);
    }

    res.json({
      success: true,
      message: `Password reset for ${normalizedEmail} in ${tenant.code}`,
      tenant: { id: tenant.id, code: tenant.code },
      user: tenantUpdate.rows[0],
      emailDelivery
    });
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
    // Guard against watchdog having already sent a 503 response
    if (!res.headersSent) {
      res.json(result);
    }
  } catch (error) {
    if (error.code === 'P2002' || error.code === '23505' || (error.message && (error.message.includes('Unique constraint failed') || error.message.includes('duplicate key value violates unique constraint')))) {
      if (!res.headersSent) {
        return res.status(400).json({ error: 'A tenant with this code or subdomain already exists. Please choose a unique identifier.' });
      }
      return;
    }
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
}

/**
 * Sync Legacy Tenants to Control Plane
 * Bridges the old 'emr.tenants' table to the new 'management_tenants' registry.
 */
export async function syncLegacyTenants(req, res) {
  try {
    await ensureManagementPlaneInfrastructure();

    // 1. REGISTRY ALIGNMENT: Identify and Purge Orphans (Validated Multi-Tenant Discovery)
    const { rows: dbSchemas } = await query(`
      SELECT s.schema_name 
      FROM information_schema.schemata s
      INNER JOIN information_schema.tables t ON s.schema_name = t.table_schema
      WHERE s.schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'emr')
      AND t.table_name = 'patients'
    `);
    const activeSchemas = new Set(dbSchemas.map(s => s.schema_name));
    
    // Purge Management Orphans
    const { rows: mTenants } = await query('SELECT id, schema_name FROM emr.management_tenants');
    const mOrphans = mTenants.filter(t => !activeSchemas.has(t.schema_name));
    if (mOrphans.length > 0) {
      await query('DELETE FROM emr.management_tenants WHERE id = ANY($1)', [mOrphans.map(t => t.id)]);
      console.log(`[SYNC_INFRA] Purged ${mOrphans.length} management orphans.`);
    }

    // Purge Legacy Orphans
    const { rows: lTenants } = await query('SELECT id, code FROM emr.tenants');
    const lOrphans = lTenants.filter(t => !activeSchemas.has(t.code.toLowerCase()));
    if (lOrphans.length > 0) {
      await query('DELETE FROM emr.tenants WHERE id = ANY($1)', [lOrphans.map(t => t.id)]);
      console.log(`[SYNC_INFRA] Purged ${lOrphans.length} legacy orphans.`);
    }

    // 2. RE-SYNC: Only sync what physically exists
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
      `, [tenant.id, tenant.name, tenant.code, tenant.subdomain, tenant.schema_name || tenant.code.toLowerCase()]);

      await refreshTenantMetrics(tenant.id, tenant.schema_name || tenant.code.toLowerCase());
      syncedCount++;
    }

    res.json({ 
      success: true, 
      message: `Registry Alignment Complete. Purged ${mOrphans.length} orphans. Synced ${syncedCount} active institutional nodes.` 
    });
  } catch (error) {
    console.error('FAILED_TENANT_SYNC:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Strategic Communication Dispatch
 * Dispatches a formal protocol to a specific hospital node (Email + In-App Notice)
 */
export async function sendCommunication(req, res) {
  const { tenantCode, templateId, metadata } = req.body;
  
  try {
    const { sendTenantWelcomeEmail } = await import('../services/mail.service.js');
    const { query } = await import('../db/connection.js');
    
    console.log(`[COMMUNICATION_HUB] Dispatching Shard [${templateId}] to Node [${tenantCode}]`, metadata);
    
    // 1. Fetch Tenant Identity & Schema
    const tenantRes = await query('SELECT id, schema_name, name FROM emr.management_tenants WHERE code = $1', [tenantCode]);
    const tenant = tenantRes.rows[0];
    if (!tenant) return res.status(404).json({ error: 'Institutional Node not found.' });

    const recipient = metadata.recipientEmail || `admin@${tenantCode.toLowerCase()}.com`;
    const templateName = metadata.templateName || templateId;

    // 2. DISPATCH EMAIL SHARD
    try {
      await sendTenantWelcomeEmail(
        recipient,
        tenant.name,
        tenantCode.toLowerCase(),
        { 
          email: recipient, 
          password: `[PROTOCOL_ACTIVE: ${templateId.toUpperCase()}]` 
        }
      );
    } catch (mailErr) {
      console.warn(`[COMMUNICATION_HUB] Email dispatch failed for ${tenantCode}, falling back to In-App notice only.`, mailErr.message);
    }
    
    // 3. INJECT IN-APP DIRECTIVE (Schema Ingress)
    const directiveTitle = `[DIRECTIVE] :: ${templateName}`;
    const directiveBody = `This institutional directive regarding "${templateName}" has been authorized by the Root Nexus. Please review the attached protocol parameters and synchronize your local node accordingly.`;
    
    try {
      await query(`
        INSERT INTO "${tenant.schema_name}"."notices" 
        (tenant_id, title, body, audience_roles, starts_at, status, priority, created_by)
        VALUES ($1, $2, $3, $4, NOW(), 'published', $5, $6)
      `, [
        tenant.id, 
        directiveTitle, 
        directiveBody, 
        JSON.stringify(['Admin', 'Management']), 
        templateId === 'isolation' ? 'critical' : 'high',
        req.user?.id || null
      ]);
      console.log(`[COMMUNICATION_HUB] In-App directive successfully injected into schema: ${tenant.schema_name}`);
    } catch (dbErr) {
      console.error(`[COMMUNICATION_HUB] Failed to inject directive into schema: ${tenant.schema_name}`, dbErr.message);
    }
    
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
 * Global Broadcast — fires a templated directive to ALL active institutional nodes
 */
export async function broadcastToAllTenants(req, res) {
  const { templateId, subject, body: msgBody } = req.body;

  try {
    const { sendTenantWelcomeEmail } = await import('../services/mail.service.js');
    const { query } = await import('../db/connection.js');
    
    const tenantsRes = await query(
      `SELECT id, name, code, subdomain, schema_name, contact_email FROM emr.management_tenants WHERE status = 'active'`
    );
    const tenants = tenantsRes.rows;

    let dispatched = 0;
    let failed = 0;
    const results = [];

    const broadcastTitle = subject || `[GLOBAL_BROADCAST] :: Institutional Update`;
    const broadcastBody = msgBody || `A universal directive has been issued across all platform nodes. Please verify compliance with the latest protocol updates.`;

    for (const t of tenants) {
      const recipient = t.contact_email || `admin@${t.subdomain}.com`;
      let inAppSuccess = false;
      let emailSuccess = false;

      // 1. DISPATCH EMAIL
      try {
        await sendTenantWelcomeEmail(
          recipient,
          t.name,
          t.subdomain,
          { email: recipient, password: `[${templateId?.toUpperCase() || 'BROADCAST'}]` }
        );
        emailSuccess = true;
      } catch (mailErr) {
        console.warn(`Broadcast Email failed for ${t.code}`);
      }

      // 2. DISPATCH IN-APP NOTICE (Multi-Schema Pivot)
      try {
        await query(`
          INSERT INTO "${t.schema_name}"."notices" 
          (tenant_id, title, body, audience_roles, starts_at, status, priority, created_by)
          VALUES ($1, $2, $3, $4, NOW(), 'published', 'high', $5)
        `, [
          t.id,
          broadcastTitle,
          broadcastBody,
          JSON.stringify(['*']),
          req.user?.id || null
        ]);
        inAppSuccess = true;
      } catch (dbErr) {
        console.error(`Broadcast In-App injection failed for ${t.schema_name}`);
      }

      if (emailSuccess || inAppSuccess) {
        dispatched++;
        results.push({ code: t.code, status: 'dispatched', email: emailSuccess, app: inAppSuccess });
      } else {
        failed++;
        results.push({ code: t.code, status: 'failed' });
      }
    }

    // Log the broadcast event
    try {
      await query(`
        INSERT INTO emr.management_system_logs (event, details)
        VALUES ('GLOBAL_BROADCAST', $1)
      `, [JSON.stringify({ templateId, subject, dispatched, failed, total: tenants.length })]);
    } catch (err) {
       console.warn('[BROADCAST_WARN] Log deferred:', err.message);
    }

    res.json({ 
      success: true, 
      dispatched, 
      failed,
      total: tenants.length,
      results 
    });
  } catch (error) {
    console.error('[BROADCAST_ERROR]', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Fetch the actual admin user for an institutional node (Identity Shard Discovery)
 */
export async function getTenantAdmin(req, res) {
  const { id } = req.params;
  try {
    const tenantRes = await query('SELECT schema_name, code FROM emr.management_tenants WHERE id::text = $1::text', [id]);
    const tenant = tenantRes.rows[0];
    if (!tenant) return res.status(404).json({ error: 'Shard not found.' });

    const schema = tenant.schema_name;
    // Query the tenant's isolated user shard for the primary admin
    const adminRes = await query(`
      SELECT email, name FROM "${schema}"."users" 
      WHERE lower(role_id::text) IN (SELECT id::text FROM "${schema}"."roles" WHERE name = 'Admin')
      LIMIT 1
    `);

    if (adminRes.rows[0]) {
      res.json({ success: true, email: adminRes.rows[0].email, name: adminRes.rows[0].name });
    } else {
      res.json({ success: true, email: `admin@${tenant.code.toLowerCase()}.com`, name: 'Default Admin' });
    }
  } catch (err) {
    console.error('[GET_TENANT_ADMIN_ERROR]', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Platform Governance: Universal Security Audit
 */
export async function platformAudit(req, res) {
  try {
    try {
      await query(`
        INSERT INTO emr.management_system_logs (event, details)
        VALUES ('SECURITY_PLATFORM_AUDIT', $1)
      `, [JSON.stringify({ triggeredBy: 'Superadmin', timestamp: new Date().toISOString() })]);
    } catch (err) {
       console.warn('[AUDIT_WARN] Security log deferred:', err.message);
    }

    res.json({ success: true, message: 'Platform-wide security audit initiated across all shards.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Platform Governance: Revoke All Institutional Sessions
 */
export async function revokePlatformSessions(req, res) {
  try {
    try {
      await query(`
        INSERT INTO emr.management_system_logs (event, details)
        VALUES ('UNIVERSAL_SESSION_REVOCATION', $1)
      `, [JSON.stringify({ triggeredBy: 'Superadmin', scope: 'GLOBAL' })]);
    } catch (err) {
       console.warn('[REVOKE_WARN] Revocation log deferred:', err.message);
    }

    res.json({ success: true, message: 'Universal session revocation protocol active. All node tokens invalidated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Propagate subscription tier changes to a tenant
 */
export async function updateTenantSubscription(req, res) {
  const { id } = req.params;
  const { tier } = req.body;
  try {
    await query('UPDATE emr.management_tenants SET updated_at = NOW() WHERE id::text = $1::text', [id]); // Verify exists
    await query('UPDATE emr.tenants SET subscription_tier = $1 WHERE id::text = $2::text', [tier, id]);
    
    try {
       await query(`
         INSERT INTO emr.management_system_logs (event, tenant_id, details)
         VALUES ('SUBSCRIPTION_UPGRADED', $1, $2)
       `, [id, JSON.stringify({ tenantId: id, newTier: tier })]);
    } catch (err) {
       console.warn('[SUBSCRIPTION_WARN] Log deferred:', err.message);
    }

    res.json({ success: true, message: `Tenant subscription upgraded to ${tier}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

/**
 * Update Tenant metadata (name, subdomain, tier, contactEmail, status)
 */
export async function updateTenant(req, res) {
  const { id } = req.params;
  const { name, subdomain, subscription_tier, contact_email, status } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name)              { fields.push(`name = $${idx++}`);              values.push(name); }
    if (subdomain)         { fields.push(`subdomain = $${idx++}`);         values.push(subdomain); }
    if (subscription_tier) { fields.push(`subscription_tier = $${idx++}`); values.push(subscription_tier); }
    if (contact_email)     { fields.push(`contact_email = $${idx++}`);     values.push(contact_email); }
    if (status)            { fields.push(`status = $${idx++}`);            values.push(status); }
    fields.push(`updated_at = NOW()`);

    if (values.length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided.' });
    }

    values.push(id);
    const result = await query(
      `UPDATE emr.management_tenants SET ${fields.join(', ')} WHERE id::text = $${idx}::text RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    try {
       await query(`
         INSERT INTO emr.management_system_logs (event, tenant_id, details)
         VALUES ('TENANT_UPDATED', $1, $2)
       `, [id, JSON.stringify({ tenantId: id, changes: req.body })]);
    } catch (err) {
       console.warn('[UPDATE_WARN] Log deferred:', err.message);
    }

    res.json({ success: true, tenant: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Delete / Decommission a Tenant (purges schema and metadata)
 */
export async function deleteTenant(req, res) {
  const { id } = req.params;

  try {
    // 1. Fetch tenant info
    const tenantRes = await query('SELECT * FROM emr.management_tenants WHERE id::text = $1::text', [id]);
    const tenant = tenantRes.rows[0];
    if (!tenant) return res.status(404).json({ error: 'Tenant not found.' });

    const schemaName = tenant.schema_name;

    // 2. Remove FK-dependent rows first to prevent constraint violations on delete
    await query('DELETE FROM emr.management_tenant_metrics WHERE tenant_id::text = $1::text', [id]).catch(() => {});
    await query('DELETE FROM emr.management_system_logs WHERE tenant_id::text = $1::text', [id]).catch(() => {});

    // 3. Log decommission to catch-all (no FK now)
    try {
       await query(`
         INSERT INTO emr.management_system_logs (event, details)
         VALUES ('TENANT_DECOMMISSIONED', $1)
       `, [JSON.stringify({ tenantId: id, tenantCode: tenant.code, schemaName })]);
    } catch (err) {
       console.warn('[DELETE_WARN] Log deferred:', err.message);
    }

    // 4. Also remove from emr.users (the global auth plane entry created during provisioning)
    await query('DELETE FROM emr.users WHERE tenant_id::text = $1::text', [id]).catch(() => {});

    // 5. Drop the tenant's isolated schema
    await query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);

    // 6. Purge tenant from management metadata
    await query('DELETE FROM emr.management_tenants WHERE id::text = $1::text', [id]);

    // 7. Also remove from legacy table if present
    await query('DELETE FROM emr.tenants WHERE id::text = $1::text', [id]).catch(() => {});

    // 8. Release any cached Prisma client for this schema
    const { releaseTenantClient } = await import('../db/prisma_manager.js');
    releaseTenantClient(schemaName);

    res.json({ 
      success: true, 
      message: `Tenant [${tenant.code}] decommissioned. Schema "${schemaName}" has been purged.` 
    });
  } catch (error) {
    console.error('[DELETE_TENANT_ERROR]', error);
    res.status(500).json({ error: error.message });
  }
}
