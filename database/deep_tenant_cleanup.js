import { query } from '../server/db/connection.js';

// The exact 2-3 tenants you want to KEEP
const QUALIFIED_TENANTS = ['greenvalley', 'apollo', 'NAH'];

async function keepQualifiedTenants() {
  console.log("🚀 Initializing deep removal of unwanted tenants...");
  try {
    // 1. Get all tenants and identify which ones to keep/remove
    const allTenants = await query('SELECT id, code, schema_name FROM tenants');
    const tenantsToKeep = allTenants.rows.filter(t => QUALIFIED_TENANTS.includes(t.code) || QUALIFIED_TENANTS.includes(t.code.toUpperCase()));
    const tenantsToRemove = allTenants.rows.filter(t => !QUALIFIED_TENANTS.includes(t.code) && !QUALIFIED_TENANTS.includes(t.code.toUpperCase()));
    
    if (tenantsToRemove.length === 0) {
      console.log("✅ No unwanted tenants found! Database only contains qualified tenants.");
      process.exit(0);
    }

    const idsToRemove = tenantsToRemove.map(t => t.id);
    const codesToRemove = tenantsToRemove.map(t => t.code);
    console.log(`🗑️ Identified ${idsToRemove.length} unwanted tenants to remove: ${codesToRemove.join(', ')}`);

    // 2. Find all tables in the database that have a 'tenant_id' column
    const tablesRes = await query(`
      SELECT table_schema, table_name 
      FROM information_schema.columns 
      WHERE column_name = 'tenant_id' AND table_schema = 'emr'
    `);

    // 3. Delete records from all child tables first to prevent Foreign Key constraints
    console.log("🧹 Sweeping all child records (Users, Patients, Encounters, etc.)...");
    for (const tbl of tablesRes.rows) {
      // Skip the main tenants table for now, we will do it at the end
      if (tbl.table_name === 'tenants') continue; 

      await query(`
        DELETE FROM "${tbl.table_schema}"."${tbl.table_name}" 
        WHERE tenant_id = ANY($1)
      `, [idsToRemove]);
    }

    // 4. Delete from the main core tenant tables
    await query('DELETE FROM tenants WHERE id = ANY($1)', [idsToRemove]);
    await query('DELETE FROM management_tenants WHERE id = ANY($1)', [idsToRemove]);
    console.log("✅ Removed tenant records from core tables.");

    // 5. Drop their isolated clinical data schemas
    for (const t of tenantsToRemove) {
      const schemaToDrop = t.schema_name || t.code.toLowerCase().replace(/[^a-z0-9_]/g, '');
      try {
        await query(`DROP SCHEMA IF EXISTS "${schemaToDrop}" CASCADE`);
        console.log(`🗑️ Erased isolated schema: ${schemaToDrop}`);
      } catch (err) {
        // Ignored
      }
    }

    console.log("\n=================================");
    console.log("🎉 DEEP CLEANUP SUCCESSFUL!");
    console.log("Remaining Qualified Tenants:", tenantsToKeep.map(t => t.code).join(', ') || 'None');
    console.log("=================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal setup error:", error);
    process.exit(1);
  }
}

keepQualifiedTenants();
