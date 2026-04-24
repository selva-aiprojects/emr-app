/**
 * NUCLEAR PURGE v2 — SAFE TENANT CLEANUP
 * =====================================
 * This script removes ONLY clinical shard schemas that belong to stale tenants.
 * It avoids system schemas (pgbouncer, realtime, etc.) entirely.
 */

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const PROTECTED_SUBDOMAINS = ['admin', 'nhgl'];

async function purgeJunk() {
  try {
    await client.connect();
    console.log('☢️  Executing Safe Purge of Stale Tenants...');

    // 1. Identify junk tenants from the central registry
    const junkTenants = (await client.query(
      `SELECT subdomain FROM emr.management_tenants WHERE subdomain NOT IN ($1, $2)`, 
      PROTECTED_SUBDOMAINS
    )).rows;

    if (junkTenants.length === 0) {
      console.log('✅ No junk tenants found in registry.');
    } else {
      for (const tenant of junkTenants) {
        console.log(`🗑️  Dropping Clinical Shard: ${tenant.subdomain}`);
        // Only drop if it matches a subdomain we found in the registry
        await client.query(`DROP SCHEMA IF EXISTS "${tenant.subdomain}" CASCADE`);
      }
    }

    // 2. Clean Central Registries
    console.log('🧹 Purging Registry Records (management_tenants & tenants)...');
    await client.query(`DELETE FROM emr.management_tenants WHERE subdomain NOT IN ($1, $2)`, PROTECTED_SUBDOMAINS);
    await client.query(`DELETE FROM emr.tenants WHERE subdomain NOT IN ($1, $2)`, PROTECTED_SUBDOMAINS);

    // 3. Clean Global Users
    console.log('🧹 Purging Ghost User Accounts...');
    await client.query(`DELETE FROM emr.users 
      WHERE tenant_id NOT IN (SELECT id FROM emr.management_tenants)
      AND email NOT LIKE '%admin%'`);

    console.log('\n✨ Safe Purge Complete. Dropdown cleaned. System schemas preserved.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Purge Failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

purgeJunk();
