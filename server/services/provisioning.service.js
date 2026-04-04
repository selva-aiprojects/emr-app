import { managementClient, getTenantClient, getTenantDatabaseUrl, releaseTenantClient } from '../db/prisma_manager.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import bcrypt from 'bcryptjs';
import { installTenantMetricsSync } from './superadminMetrics.service.js';

const execAsync = promisify(exec);

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
  const normalizedCode = String(code || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

  if (!normalizedCode) {
    throw new Error('Tenant code is required to derive the tenant schema.');
  }

  return `tenant_${normalizedCode}`;
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
  const schemaName = buildTenantSchemaName(tenantData.code);
  let tenant;

  try {
    // 1. Create entry in the management database (Control Plane)
    tenant = await managementClient.tenant.create({
      data: {
        name: tenantData.name,
        code: tenantData.code,
        subdomain: tenantData.subdomain,
        schema_name: schemaName,
        status: 'active'
      }
    });

    // 2. Execute raw SQL to create the dedicated Postgres schema
    await managementClient.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);

    // 3. Run migrations for the new schema using Prisma CLI
    console.log(`Running migrations for schema ${schemaName}...`);
    await execAsync('npx prisma migrate deploy --schema=./prisma/tenant.prisma', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: getTenantDatabaseUrl(schemaName)
      }
    });

    // 4. Seed the initial Admin User and default Roles into the new schema
    console.log(`Seeding initial data into ${schemaName}...`);
    const tenantDb = getTenantClient(schemaName);

    const createdRoles = await Promise.all(
      DEFAULT_ROLE_DEFINITIONS.map((role) =>
        tenantDb.role.upsert({
          where: { name: role.name },
          update: {
            description: role.description,
            is_system: role.is_system
          },
          create: role
        })
      )
    );

    const adminRole = createdRoles.find((role) => role.name === 'Admin');
    if (!adminRole) {
      throw new Error('Admin role was not created during tenant provisioning.');
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const user = await tenantDb.user.create({
      data: {
        email: adminData.email,
        password_hash: hashedPassword,
        name: adminData.name,
        role_id: adminRole.id
      }
    });

    await installTenantMetricsSync(schemaName, tenant.id);

    // 5. Log success to the global system log
    await managementClient.systemLog.create({
      data: {
        event: 'TENANT_PROVISIONED',
        details: {
          schemaName,
          tenantId: tenant.id,
          adminEmail: user.email,
          seededRoles: createdRoles.map((role) => role.name)
        },
        tenant_id: tenant.id
      }
    });

    return {
      ...tenant,
      schema_name: schemaName
    };
  } catch (error) {
    console.error(`Provisioning failed for ${tenantData.code}:`, error);

    try {
      await releaseTenantClient(schemaName);
      await managementClient.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      if (tenant?.id) {
        await managementClient.tenant.delete({
          where: { id: tenant.id }
        });
      }
      await managementClient.systemLog.create({
        data: {
          event: 'TENANT_PROVISIONING_FAILED',
          details: {
            schemaName,
            tenantCode: tenantData.code,
            message: error.message
          },
          tenant_id: tenant?.id
        }
      });
    } catch (rollbackError) {
      console.error('Tenant provisioning rollback failed:', rollbackError);
    }

    throw error;
  }
}
