import { query } from '../server/db/connection.js';

const RELEVANT_TENANT_CODES = ['seedling', 'greenvalley', 'sunrise', 'apollo', 'dynamic', 'healthezee'];

async function cleanupTenants() {
  console.log("🚀 Starting Tenant Cleanup...");
  try {
    // Check both management_tenants and tenants if they exist
    // Get all tenants from management_tenants
    let tenantsToKeep = [];
    let tenantsToRemove = [];
    
    try {
        const res = await query('SELECT id, code, name FROM management_tenants');
        for (const t of res.rows) {
            if (RELEVANT_TENANT_CODES.includes(t.code.toLowerCase())) {
                tenantsToKeep.push(t.code);
            } else {
                tenantsToRemove.push(t.code);
                // Mark for deletion or delete
                await query('DELETE FROM management_tenants WHERE id = $1', [t.id]);
            }
        }
        console.log(`✅ Cleaned up management_tenants`);
    } catch(e) {
        console.warn('management_tenants not found or errored:', e.message);
    }

    try {
        const res = await query('SELECT id, code, name FROM tenants');
        for (const t of res.rows) {
            if (RELEVANT_TENANT_CODES.includes(t.code.toLowerCase())) {
                if(!tenantsToKeep.includes(t.code)) tenantsToKeep.push(t.code);
            } else {
                if(!tenantsToRemove.includes(t.code)) tenantsToRemove.push(t.code);
                // Mark for deletion or delete
                await query('DELETE FROM tenants WHERE id = $1', [t.id]);
            }
        }
        console.log(`✅ Cleaned up tenants`);
    } catch(e) {
        console.warn('tenants not found or errored:', e.message);
    }
    
    // Attempt to drop their schemas
    for (const code of tenantsToRemove) {
        try {
            await query(`DROP SCHEMA IF EXISTS ${code} CASCADE`);
            console.log(`🗑️ Dropped schema for ${code}`);
        } catch (e) {
            // ignore
        }
    }

    console.log("\n==================================");
    console.log("Tenant Clean Up Summary:");
    console.log("Kept:", tenantsToKeep.join(', ') || 'None');
    console.log("Removed:", tenantsToRemove.join(', ') || 'None');
    console.log("==================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error cleaning up tenants:", error);
    process.exit(1);
  }
}

cleanupTenants();
