import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
dotenv.config();

const { PrismaClient: ManagementClient } = require('@prisma/client');
const { PrismaClient: TenantClient } = require('@prisma/client');

/**
 * Cache for tenant Prisma clients to prevent connection leaks.
 * Key: tenant schema name
 * Value: PrismaClient instance
 */
const tenantClientCache = new Map();
let cleanupRegistered = false;

function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  return process.env.DATABASE_URL;
}

function validateTenantSchema(tenantSchema) {
  if (!tenantSchema || !/^[A-Za-z][A-Za-z0-9_]*$/.test(tenantSchema)) {
    throw new Error(`Invalid tenant schema name: ${tenantSchema}`);
  }
}

function withSchema(baseConnectionString, schemaName) {
  const url = new URL(baseConnectionString);
  url.searchParams.set('schema', schemaName);
  return url.toString();
}

function registerCleanupHooks() {
  if (cleanupRegistered) {
    return;
  }

  const cleanup = async () => {
    await Promise.allSettled(
      Array.from(tenantClientCache.values()).map((client) => client.$disconnect())
    );
    tenantClientCache.clear();
    await managementClient.$disconnect();
  };

  process.once('beforeExit', cleanup);
  process.once('SIGINT', async () => {
    await cleanup();
    process.exit(0);
  });
  process.once('SIGTERM', async () => {
    await cleanup();
    process.exit(0);
  });

  cleanupRegistered = true;
}

const managementDatabaseUrl = withSchema(ensureDatabaseUrl(), 'emr');
const managementPool = new pg.Pool({
  connectionString: managementDatabaseUrl,
  ssl: { rejectUnauthorized: false }
});
const managementAdapter = new PrismaPg(managementPool);

/**
 * Management client for the Control Plane (always points to the emr schema).
 */
export const managementClient = new ManagementClient({
  adapter: managementAdapter
});

registerCleanupHooks();

/**
 * Dynamically retrieves a Prisma client for a specific tenant schema.
 * It uses DATABASE_URL + "?schema=" + tenantSchema and caches instances in memory.
 *
 * @param {string} tenantSchema - The PostgreSQL schema name (e.g. "tenant_abc")
 * @returns {TenantClient}
 */
export function getTenantClient(tenantSchema) {
  validateTenantSchema(tenantSchema);

  if (tenantClientCache.has(tenantSchema)) {
    return tenantClientCache.get(tenantSchema);
  }

  const tenantPool = new pg.Pool({
    connectionString: getTenantDatabaseUrl(tenantSchema),
    ssl: { rejectUnauthorized: false }
  });
  const tenantAdapter = new PrismaPg(tenantPool);
  const client = new TenantClient({
    adapter: tenantAdapter,
    log: ['error']
  });

  tenantClientCache.set(tenantSchema, client);
  return client;
}

/**
 * Disconnects and removes a cached tenant client.
 */
export async function releaseTenantClient(tenantSchema) {
  const client = tenantClientCache.get(tenantSchema);
  if (client) {
    await client.$disconnect();
    tenantClientCache.delete(tenantSchema);
  }
}

export function getManagementDatabaseUrl() {
  return managementDatabaseUrl;
}

export function getTenantDatabaseUrl(tenantSchema) {
  validateTenantSchema(tenantSchema);
  return withSchema(ensureDatabaseUrl(), tenantSchema);
}
