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
  const sqlPath = join(__dirname, '../../database/tenant_base_schema.sql');
  const sql = readFileSync(sqlPath, 'utf8');
  
  // Set search_path to the tenant schema first, then execute all DDL
  await query(`SET search_path TO "${schemaName}", public`);
  
  // Split on semicolons and run each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const stmt of statements) {
    try {
      await query(stmt);
    } catch (e) {
      // Log but continue — some statements may already exist
      if (!e.message.includes('already exists')) {
        console.warn(`[SCHEMA_WARN] ${e.message.substring(0, 100)}`);
      }
    }
  }
  
  // Reset search_path to default
  await query(`SET search_path TO "${schemaName}", emr, public`);
}

const DEFAULT_ROLE_DEFINITIONS = [
  {
    name: 'Admin',
    description: 'Tenant administrator with full access',
    is_system: true
  },
  {
    name: 'Doctor',
    description: 'Clinical staff with patient care access',
    is_system: true
  },
  {
    name: 'Nurse',
    description: 'Nursing staff with operational care access',
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
    // 1. Create or Map entry in the management database (Control Plane)
    const insertSql = `
      INSERT INTO emr.management_tenants (id, name, code, subdomain, schema_name, status, contact_email, subscription_tier)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW()
      RETURNING *
    `;
    
    const { rows: [createdTenant] } = await query(insertSql, [
      tenantData.name,
      tenantData.code,
      tenantData.subdomain,
      schemaName,
      'active',
      tenantData.contactEmail,
      tenantData.subscriptionTier || 'Professional'
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
        INSERT INTO "${schemaName}"."roles" (name, description, is_system)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET 
          description = EXCLUDED.description,
          is_system = EXCLUDED.is_system
        RETURNING id, name
      `, [roleDef.name, roleDef.description, roleDef.is_system]);
      
      createdRoles.push(roleResult.rows[0]);
    }

    const adminRole = createdRoles.find((role) => role.name === 'Admin');
    if (!adminRole) {
      throw new Error('Admin role was not created during tenant provisioning.');
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const userResult = await query(`
      INSERT INTO "${schemaName}"."users" (email, password_hash, name, role_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, email
    `, [adminData.email, hashedPassword, adminData.name, adminRole.id]);

    const user = userResult.rows[0];

    await installTenantMetricsSync(schemaName, tenant.id);

    // 5. Log success to the global system log
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
      console.warn('[PROVISIONING_WARN] System log recording deferred:', logErr.message);
    }

    // 6. Send welcome email to the communication address (strictly as per requirements)
    const communicationRecipient = tenantData.contactEmail || 'b.selvakumar@gmail.com';
    console.log(`[PROVISIONING] Sending welcome email to Board Member / Communication recipient: ${communicationRecipient}`);
    
    try {
      await sendTenantWelcomeEmail(
        communicationRecipient, 
        tenantData.name, 
        tenantData.subdomain, 
        { email: adminData.email, password: adminData.password }
      );
      console.log(`[PROVISIONING] Welcome email successfully dispatched to communication hub for ${tenantData.code}`);
    } catch (mailErr) {
      console.warn(`[PROVISIONING] Communication dispatch failed for ${communicationRecipient}:`, mailErr.message);
      // Non-fatal for the core process
    }

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
        await query('DELETE FROM emr.management_tenants WHERE id = $1', [tenant.id])
          .catch(err => console.error('Orphaned tenant metadata purge failed:', err.message));
      }
    } catch (rollbackError) {
      console.error('Tenant provisioning rollback failed:', rollbackError);
    }

    throw error;
  }
}
