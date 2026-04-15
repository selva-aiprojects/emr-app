import { managementClient, getTenantClient, getTenantDatabaseUrl, releaseTenantClient } from '../db/prisma_manager.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { installTenantMetricsSync } from './superadminMetrics.service.js';
import { sendTenantWelcomeEmail } from './mail.service.js';
import { query } from '../db/connection.js';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Executes the tenant base schema SQL on the given schema.
 * This is the canonical way to initialize a new tenant's database.
 */
async function executeTenantBaseSchema(schemaName) {
  const sqlPath = join(__dirname, '../../database/SHARD_MASTER_BASELINE.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  const pool = (await import('../db/connection.js')).default;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // SET LOCAL keeps the search_path within this transaction only
    await client.query(`SET LOCAL search_path TO "${schemaName}", public`);

    // Split SQL into individual statements, respecting $$ dollar-quoted PL/pgSQL blocks
    const statements = [];
    let current = '';
    let inDollarQuote = false;
    let dollarTag = '';

    for (let i = 0; i < sql.length; i++) {
      const ch = sql[i];
      current += ch;

      if (!inDollarQuote) {
        const dollarMatch = sql.slice(i).match(/^\$[^$]*\$/);
        if (dollarMatch) {
          inDollarQuote = true;
          dollarTag = dollarMatch[0];
          current += dollarTag.slice(1);
          i += dollarTag.length - 1;
          continue;
        }
        if (ch === ';') {
          const stmt = current.trim().slice(0, -1).trim();
          if (stmt.length > 0 && !stmt.replace(/^--.*$/mg, '').trim().startsWith('--')) {
            statements.push(stmt);
          }
          current = '';
        }
      } else {
        if (sql.slice(i - dollarTag.length + 1, i + 1) === dollarTag) {
          inDollarQuote = false;
          dollarTag = '';
        }
      }
    }
    const trailing = current.trim();
    if (trailing.length > 0) statements.push(trailing);

    let executed = 0;
    for (const stmt of statements) {
      // Use SAVEPOINT per statement: a failed statement only rolls back itself,
      // the transaction stays alive and subsequent statements continue normally.
      await client.query('SAVEPOINT sp');
      try {
        await client.query(stmt);
        await client.query('RELEASE SAVEPOINT sp');
        executed++;
      } catch (stmtErr) {
        await client.query('ROLLBACK TO SAVEPOINT sp');
        // Only log unexpected errors, not routine "already exists" notices
        if (!stmtErr.message.includes('already exists')) {
          console.warn(`[SCHEMA_WARN] ${schemaName}: ${stmtErr.message.substring(0, 120)}`);
        }
      }
    }

    await client.query('COMMIT');
    console.log(`✅ [SCHEMA_OK] Deployed ${executed}/${statements.length} statements to schema: ${schemaName}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(`[SCHEMA_FATAL] Base schema deployment failed for ${schemaName}:`, e.message);
    throw e;
  } finally {
    client.release();
  }
}


const DEFAULT_ROLE_DEFINITIONS = [
  {
    name: 'Admin',
    description: 'Institutional Administrator with governance access',
    is_system: true
  },
  {
    name: 'Doctor',
    description: 'Clinical Practitioner with patient care access',
    is_system: true
  },
  {
    name: 'Nurse',
    description: 'Nursing Staff with operational care access',
    is_system: true
  },
  {
    name: 'Lab',
    description: 'Laboratory Technician with diagnostic access',
    is_system: true
  },
  {
    name: 'Pharmacy',
    description: 'Pharmacist with inventory management access',
    is_system: true
  }
];

function buildTenantSchemaName(code) {
  const normalizedCode = String(code || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');

  if (!normalizedCode) {
    throw new Error('Tenant code is required to derive the tenant schema.');
  }

  return `${normalizedCode}`;
}

/**
 * Provisions a new tenant with its own dedicated PostgreSQL schema.
 * Handles metadata creation, schema creation, migrations, and initial seeding.
 *
 * @param {Object} tenantData
 * @param {string} tenantData.name
 * @param {string} tenantData.code
 * @param {string} tenantData.subdomain
 * @param {Object} adminData
 * @param {string} adminData.email
 * @param {string} adminData.password
 * @param {string} adminData.name
 * @returns {Promise<Object>} The newly created tenant record
 */
export async function provisionNewTenant(tenantData, adminData) {
  // Always enforce the default setup credential for new Tenant Admins
  adminData.password = "Admin@123";

  const schemaName = buildTenantSchemaName(tenantData.code);
  let tenant;

  try {
    // 1. Create in legacy tenants table (for full platform visibility)
    const legacySql = `
      INSERT INTO emr.tenants (name, code, subdomain, contact_email, subscription_tier, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `;
    const { rows: [legacyTenant] } = await query(legacySql, [
      tenantData.name,
      tenantData.code,
      tenantData.subdomain,
      tenantData.contactEmail,
      tenantData.subscriptionTier || 'Enterprise'
    ]);

    // 2. Map entry in the management database (Control Plane)
    const insertSql = `
      INSERT INTO emr.management_tenants (id, name, code, subdomain, schema_name, status, contact_email, subscription_tier)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW()
      RETURNING *
    `;
    
    const { rows: [createdTenant] } = await query(insertSql, [
      legacyTenant.id,
      tenantData.name,
      tenantData.code,
      tenantData.subdomain,
      schemaName,
      'active',
      tenantData.contactEmail,
      tenantData.subscriptionTier || 'Enterprise'
    ]);
    
    tenant = createdTenant;
    console.log(`[PROVISIONING] Control plane registry active for ${tenant.code}.`);

    // 2. Execute raw SQL to create the dedicated Postgres schema
    await query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // 3. Run full tenant base schema — ALL tables required for operations
    console.log(`Initializing full tenant schema for ${schemaName}...`);
    await executeTenantBaseSchema(schemaName);
    console.log(`✅ [PROVISIONING] Full tenant schema initialized for ${schemaName}`);

    // 4. Seed the initial Admin User and default Roles into the new schema
    console.log(`Seeding initial data into ${schemaName}...`);

    const createdRoles = [];
    for (const roleDef of DEFAULT_ROLE_DEFINITIONS) {
      const roleResult = await query(`
        INSERT INTO "${schemaName}"."roles" (tenant_id, name, description, is_system)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO UPDATE SET 
          description = EXCLUDED.description,
          is_system = EXCLUDED.is_system
        RETURNING id, name
      `, [tenant.id, roleDef.name, roleDef.description, roleDef.is_system]);
      
      createdRoles.push(roleResult.rows[0]);
    }

    const adminRole = createdRoles.find((role) => role.name === 'Admin');
    if (!adminRole) {
      throw new Error('Admin role was not created during tenant provisioning.');
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const userResult = await query(`
      INSERT INTO "${schemaName}"."users" (tenant_id, email, password_hash, name, role_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, tenant_id = EXCLUDED.tenant_id
      RETURNING id, email
    `, [tenant.id, adminData.email, hashedPassword, adminData.name, adminRole.id]);

    const user = userResult.rows[0];

    // CRITICAL: Also register the admin in emr.users (global control plane).
    // The auth system (getUserByEmail in user.service.js) queries emr.users for ALL tenant
    // logins. Without this, the admin exists in the shard but is invisible to the login flow.
    await query(`
      INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, 'Admin', true)
      ON CONFLICT (email) DO UPDATE SET 
        tenant_id = EXCLUDED.tenant_id,
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = 'Admin',
        is_active = true
    `, [user.id, tenant.id, adminData.email, hashedPassword, adminData.name]);
    console.log(`[PROVISIONING] Admin user registered in global auth plane for ${schemaName}.`);

    // BACKGROUND: metrics sync, logging, and email are non-blocking.
    // The critical provisioning (schema + users) is complete — return immediately.
    // These tasks complete asynchronously and do not affect the tenant's usability.
    setImmediate(() => {
      (async () => {
        try {
          await installTenantMetricsSync(schemaName, tenant.id);
          console.log(`[PROVISIONING_BG] Metrics sync installed for ${schemaName}`);
        } catch (metricsErr) {
          console.warn(`[PROVISIONING_BG] Metrics sync deferred for ${schemaName}:`, metricsErr?.message || metricsErr);
        }
        
        try {
          await query(`
            INSERT INTO emr.management_system_logs (id, event, tenant_id, details, created_at)
            VALUES (gen_random_uuid(), 'TENANT_PROVISIONED', $1, $2, NOW())
          `, [tenant.id, JSON.stringify({
            schemaName,
            tenantId: tenant.id,
            adminEmail: user.email,
            seededRoles: createdRoles.map((role) => role.name)
          })]);
        } catch (logErr) {
          console.warn('[PROVISIONING_BG] Log deferred:', logErr?.message || logErr);
        }

        try {
          const communicationRecipient = tenantData.contactEmail || 'b.selvakumar@gmail.com';
          await sendTenantWelcomeEmail(
            communicationRecipient,
            tenantData.name,
            tenantData.subdomain,
            { email: adminData.email, password: adminData.password }
          );
          console.log(`[PROVISIONING_BG] Welcome email dispatched for ${tenantData.code}`);
        } catch (mailErr) {
          console.warn(`[PROVISIONING_BG] Email deferred:`, mailErr?.message || mailErr);
        }
      })().catch(err => {
        console.error('[PROVISIONING_BG] Fatal background error intercepted:', err);
      });
    });

    return {
      ...tenant,
      schema_name: schemaName,
      adminLoginEmail: adminData.email,
      contactEmail: tenantData.contactEmail,
      defaultPassword: adminData.password // For UI preview
    };

  } catch (error) {
    console.error(`Provisioning failed for ${tenantData.code}:`, error);

    try {
      await releaseTenantClient(schemaName);
      
      // 1. Log failure BEFORE purging metadata (prevents FK violation)
      if (tenant?.id) {
        await query(`
          INSERT INTO emr.management_system_logs (id, event, tenant_id, details, created_at)
          VALUES (gen_random_uuid(), 'TENANT_PROVISIONING_FAILED', $1, $2, NOW())
        `, [tenant.id, JSON.stringify({
           schemaName,
           tenantCode: tenantData.code,
           message: error.message
        })]).catch(logErr => console.error('Failed to log provisioning failure:', logErr.message));
      }

      // 2. Cleanup partial Shard
      await query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      
      // 3. Purge orphaned metadata
      if (tenant?.id) {
        await query('DELETE FROM emr.management_tenants WHERE id::text = $1::text', [tenant.id])
          .catch(err => console.error('Orphaned tenant metadata purge failed:', err.message));
      }
    } catch (rollbackError) {
      console.error('Tenant provisioning rollback failed:', rollbackError);
    }

    throw error;
  }
}
