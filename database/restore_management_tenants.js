import { query } from '../server/db/connection.js';

async function restoreTenants() {
  console.log("🚀 Restoring missing tenants to Login dropdown...");
  try {
    // Check what is in tenants
    const tenantsRes = await query('SELECT id, name, code, subdomain FROM tenants');
    
    let restoredCount = 0;
    for (const t of tenantsRes.rows) {
      const code = t.code;
      const tName = t.name || t.code;
      const schemaName = t.code.toLowerCase().replace(/[^a-z0-9_]/g, '');

      // Check if it exists in management_tenants
      const existing = await query('SELECT id FROM management_tenants WHERE id = $1 OR code = $2', [t.id, code]);
      
      if (existing.rowCount === 0) {
        // Insert it back
        await query(`
          INSERT INTO management_tenants (id, name, code, schema_name, subdomain, status, created_at)
          VALUES ($1, $2, $3, $4, $5, 'active', NOW())
        `, [t.id, tName, code, schemaName, t.subdomain || code]);
        console.log(`✅ Restored: ${tName} (${code})`);
        restoredCount++;
      }
    }
    
    // Some demos might have been fully deleted from management_tenants but also we want to make sure the seeded ones exist
    // Let's ensure 'sunrise', 'seedling', 'greenvalley', 'apollo', 'dynamic', 'NAH' are known
    const defaultCodes = ['seedling', 'greenvalley', 'sunrise', 'apollo', 'dynamic', 'NAH'];
    for (const dcode of defaultCodes) {
       const existing = await query('SELECT id FROM management_tenants WHERE code = $1', [dcode.toLowerCase()]);
       if (existing.rowCount === 0) {
         // Also check upper case for NAH
         const existingUp = await query('SELECT id FROM management_tenants WHERE code = $1', [dcode]);
         if(existingUp.rowCount === 0) {
             console.log(`⚠️ Note: ${dcode} does not exist in your database right now. If you want it, please seed it.`);
         }
       }
    }

    if (restoredCount > 0) {
      console.log(`\n🎉 Successfully restored ${restoredCount} tenants to the Facility dropdown!`);
    } else {
      console.log(`\n⚠️ No missing tenants were found to restore. If the list is still empty, you may need to re-run your seed script.`);
    }

    process.exit(0);

  } catch (error) {
    console.error("❌ Error restoring tenants:", error);
    process.exit(1);
  }
}

restoreTenants();
