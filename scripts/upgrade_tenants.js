import { query } from '../server/db/connection.js';

async function upgrade() {
  try {
    const res = await query("UPDATE emr.tenants SET subscription_tier = 'Enterprise'");
    console.log("Successfully upgraded tenants to Enterprise tier:", res.rowCount);
    
    // Also clear existing feature overrides to ensure tier defaults are used
    await query("DELETE FROM emr.tenant_features");
    console.log("Cleared tenant feature overrides");
    
  } catch (e) {
    console.error("Error upgrading tenants:", e);
  }
  process.exit(0);
}

upgrade();
