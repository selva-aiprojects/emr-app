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
  { id: 'Admin', name: 'Administrator', description: 'Institutional Administrator with governance access', is_system: true },
  { id: 'Doctor', name: 'Medical Doctor', description: 'Clinical Practitioner with patient care access', is_system: true },
  { id: 'Nurse', name: 'Nursing Staff', description: 'Nursing Staff with operational care access', is_system: true },
  { id: 'Lab', name: 'Lab Technician', description: 'Laboratory Technician with diagnostic access', is_system: true },
  { id: 'Pharmacy', name: 'Pharmacist', description: 'Pharmacist with inventory management access', is_system: true },
  { id: 'Frontdesk', name: 'Front Desk', description: 'Front Desk with operational access', is_system: true }
];

const MASTER_DEPARTMENTS = [
  { code: 'OPD-01', name: 'Outpatient Department' },
  { code: 'IPD-01', name: 'Inpatient Department' },
  { code: 'ER-01', name: 'Emergency & Trauma' },
  { code: 'PHARM-01', name: 'Pharmacy' },
  { code: 'LAB-01', name: 'Laboratory' }
];

const MASTER_SPECIALITIES = [
  { name: 'Cardiology', description: 'Heart and vascular care' },
  { name: 'Neurology', description: 'Brain and nervous system' },
  { name: 'Pediatrics', description: 'Child and adolescent care' },
  { name: 'Orthopedics', description: 'Musculoskeletal system' },
  { name: 'General Medicine', description: 'Primary and internal care' },
  { name: 'Dermatology', description: 'Skin and related tissue care' },
  { name: 'Gynecology', description: 'Female reproductive health' },
  { name: 'Oncology', description: 'Cancer diagnosis and treatment' },
  { name: 'Psychiatry', description: 'Mental health and behavior' }
];

const MASTER_DISEASES = [
  { code: 'ICD10-I10', name: 'Essential (primary) hypertension', category: 'Circulatory' },
  { code: 'ICD10-E11', name: 'Type 2 diabetes mellitus', category: 'Endocrine' },
  { code: 'ICD10-J45', name: 'Asthma', category: 'Respiratory' },
  { code: 'ICD10-M54', name: 'Dorsalgia (Back pain)', category: 'Musculoskeletal' },
  { code: 'ICD10-N39', name: 'Urinary tract infection', category: 'Genitourinary' }
];

const MASTER_TREATMENTS = [
  { code: 'PROC-001', name: 'General Consultation', category: 'Consultation', cost: 500 },
  { code: 'PROC-002', name: 'Specialist Consultation', category: 'Consultation', cost: 1000 },
  { code: 'PROC-003', name: 'Blood Glucose Test', category: 'Laboratory', cost: 150 },
  { code: 'PROC-004', name: 'Complete Blood Count (CBC)', category: 'Laboratory', cost: 450 },
  { code: 'PROC-005', name: 'X-Ray Chest', category: 'Radiology', cost: 800 },
  { code: 'PROC-006', name: 'ECG/EKG', category: 'Cardiology', cost: 600 }
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
 */
export async function provisionNewTenant(tenantData, adminData) {
  // Use provided password or fallback to institutional standard
  adminData.password = adminData.password || "Admin@123";

  const schemaName = buildTenantSchemaName(tenantData.code);
  let tenant;

  try {
    // 1. Create in legacy tenants table (for full platform visibility)
    const legacySql = `
      INSERT INTO nexus.tenants (name, code, subdomain, subscription_tier, status, logo_url, theme, features, billing_config, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        logo_url = EXCLUDED.logo_url,
        theme = EXCLUDED.theme,
        features = EXCLUDED.features,
        billing_config = EXCLUDED.billing_config,
        updated_at = NOW()
      RETURNING *
    `;
    const { rows: [legacyTenant] } = await query(legacySql, [
      tenantData.name,
      tenantData.code,
      tenantData.subdomain,
      tenantData.subscriptionTier || 'Enterprise',
      tenantData.logoUrl || null,
      JSON.stringify(tenantData.theme || {}),
      JSON.stringify(tenantData.features || {}),
      JSON.stringify(tenantData.billingConfig || {})
    ]);

    // 2. Map entry in the management database (Control Plane)
    const insertSql = `
      INSERT INTO nexus.management_tenants (id, name, code, subdomain, schema_name, status, contact_email, subscription_tier, logo_url, theme, features, billing_config, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        logo_url = EXCLUDED.logo_url,
        theme = EXCLUDED.theme,
        features = EXCLUDED.features,
        billing_config = EXCLUDED.billing_config,
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
      tenantData.subscriptionTier || 'Enterprise',
      tenantData.logoUrl || null,
      JSON.stringify(tenantData.theme || {}),
      JSON.stringify(tenantData.features || {}),
      JSON.stringify(tenantData.billingConfig || {})
    ]);
    
    tenant = createdTenant;
    console.log(`[PROVISIONING] Control plane registry active for ${tenant.code}.`);

    // 2. Execute raw SQL to create the dedicated Postgres schema
    await query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // 3. Run full tenant base schema — ALL tables required for operations
    console.log(`Initializing full tenant schema for ${schemaName}...`);
    await executeTenantBaseSchema(schemaName);
    console.log(`✅ [PROVISIONING] Full tenant schema initialized for ${schemaName}`);

    // 4. Seed the initial Master Data into the new schema
    console.log(`Seeding initial master data into ${schemaName}...`);

    // Roles
    const createdRoles = [];
    for (const roleDef of DEFAULT_ROLE_DEFINITIONS) {
      const roleResult = await query(`
        INSERT INTO "${schemaName}"."roles" (id, name, permissions)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          permissions = EXCLUDED.permissions
        RETURNING id, name
      `, [roleDef.id, roleDef.name, JSON.stringify(roleDef.permissions || [])]);
      
      createdRoles.push(roleResult.rows[0]);
    }

    // Departments
    for (const dept of MASTER_DEPARTMENTS) {
      await query(`
        INSERT INTO "${schemaName}"."departments" (tenant_id, code, name)
        VALUES ($1, $2, $3) ON CONFLICT DO NOTHING
      `, [tenant.id, dept.code, dept.name]);
    }

    // Specialities
    for (const spec of MASTER_SPECIALITIES) {
      await query(`
        INSERT INTO "${schemaName}"."specialities" (tenant_id, name, description)
        VALUES ($1, $2, $3) ON CONFLICT DO NOTHING
      `, [tenant.id, spec.name, spec.description]);
    }

    // Diseases
    for (const d of MASTER_DISEASES) {
      await query(`
        INSERT INTO "${schemaName}"."diseases" (tenant_id, code, name, category)
        VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING
      `, [tenant.id, d.code, d.name, d.category]);
    }

    // Treatments
    for (const t of MASTER_TREATMENTS) {
      await query(`
        INSERT INTO "${schemaName}"."treatments" (tenant_id, code, name, category, base_cost)
        VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING
      `, [tenant.id, t.code, t.name, t.category, t.cost]);
    }

    const adminRole = createdRoles.find((role) => role.id === 'Admin');
    if (!adminRole) {
      throw new Error('Admin role was not created during tenant provisioning.');
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const userResult = await query(`
      INSERT INTO "${schemaName}"."users" (tenant_id, email, password_hash, name, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, tenant_id = EXCLUDED.tenant_id
      RETURNING id, email
    `, [tenant.id, adminData.email, hashedPassword, adminData.name, adminRole.id]);

    const user = userResult.rows[0];

    // Auto-patch the schema just in case it's a legacy version
    await query(`ALTER TABLE nexus.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);

    // CRITICAL: Also register the admin in users (global control plane).
    await query(`
      INSERT INTO nexus.users (id, tenant_id, email, password_hash, name, role, is_active)
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
            INSERT INTO nexus.audit_logs (id, tenant_id, user_id, user_name, action, entity_name, entity_id, details, ip_address, user_agent, timestamp)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NULL, NULL, NOW())
          `, [tenant.id, user.id, user.name, 'tenant.provision', 'tenant', tenant.id, JSON.stringify({
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
            { email: adminData.email, password: adminData.password, tenantId: tenant.id }
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
          INSERT INTO nexus.audit_logs (id, tenant_id, user_id, user_name, action, entity_name, entity_id, details, ip_address, user_agent, timestamp)
          VALUES (gen_random_uuid(), $1, NULL, NULL, $2, $3, $4, $5, NULL, NULL, NOW())
        `, [tenant.id, 'tenant.provision.failed', 'tenant', tenant.id, JSON.stringify({
          schemaName,
          tenantCode: tenantData.code,
          message: error.message
        })]).catch(logErr => console.error('Failed to log provisioning failure:', logErr.message));
      }

      // 2. Cleanup partial Shard
      await query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      
      // 3. Purge orphaned metadata
      if (tenant?.id) {
        await query('DELETE FROM nexus.management_tenants WHERE id::text = $1::text', [tenant.id])
          .catch(err => console.error('Orphaned tenant metadata purge failed:', err.message));
      }
    } catch (rollbackError) {
      console.error('Tenant provisioning rollback failed:', rollbackError);
    }

    throw error;
  }
}
