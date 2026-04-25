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
     FROM nexus.management_tenants
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
     FROM nexus.tenants
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
    `INSERT INTO nexus.management_tenants
      (id, name, code, subdomain, schema_name, status, contact_email, subscription_tier, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, NOW(), NOW())
     ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      subdomain = COALESCE(NULLIF(nexus.management_tenants.subdomain, ''), EXCLUDED.subdomain),
      schema_name = COALESCE(NULLIF(nexus.management_tenants.schema_name, ''), EXCLUDED.schema_name),
      contact_email = COALESCE(nexus.management_tenants.contact_email, EXCLUDED.contact_email),
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
        SELECT * FROM nexus.management_system_logs
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
      `INSERT INTO nexus.users (id, tenant_id, email, password_hash, name, role, is_active)
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

    // Also sync password in nexus.users (global auth plane)
    await query(
      `UPDATE nexus.users
       SET password_hash = $1
       WHERE lower(email) = lower($2) AND tenant_id::text = $3::text`,
      [hashedPassword, normalizedEmail, tenant.id]
    ).catch(err => console.warn('[RESET_NEXUS_SYNC]', err.message));

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
 * Provision a New Institutional Tenant
 */
export async function createNewTenant(req, res) {
  const { tenantData, adminData } = req.body;
  try {
    if (!tenantData || !adminData) {
      return res.status(400).json({ error: 'tenantData and adminData are required' });
    }
    const result = await provisionNewTenant(tenantData, adminData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
