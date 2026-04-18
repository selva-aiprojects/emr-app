import { query } from '../server/db/connection.js';

async function syncTenantIds() {
  try {
    const code = 'MGHPL';
    
    // 1. Get IDs from both tables
    const legacyRes = await query("SELECT id FROM emr.tenants WHERE code = $1", [code]);
    const mgmtRes = await query("SELECT id FROM emr.management_tenants WHERE code = $1", [code]);
    
    const legacyId = legacyRes.rows[0]?.id;
    const mgmtId = mgmtRes.rows[0]?.id;
    
    console.log(`Legacy ID (emr.tenants): ${legacyId}`);
    console.log(`Mgmt ID (emr.management_tenants): ${mgmtId}`);
    
    if (legacyId && mgmtId && legacyId !== mgmtId) {
      console.log('⚠️ IDs are out of sync! Unifying to Legacy ID...');
      
      // We must move the management tenant to the ID used by the users
      await query("UPDATE emr.management_tenants SET id = $1 WHERE code = $2", [legacyId, code]);
      console.log('✅ management_tenants updated.');
    } else {
      console.log('✅ IDs are already in sync or missing.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

syncTenantIds();
