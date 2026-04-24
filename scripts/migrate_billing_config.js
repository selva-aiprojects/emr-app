import { query } from '../server/db/connection.js';

async function migrate() {
  try {
    await query(`
      ALTER TABLE emr.tenants 
      ADD COLUMN IF NOT EXISTS billing_config JSONB 
      DEFAULT '{"provider": "manual", "currency": "INR", "gatewayKey": "", "accountStatus": "unlinked"}'
    `);
    console.log("Successfully added billing_config to emr.tenants");
  } catch (e) {
    console.error("Migration error:", e);
  }
  process.exit(0);
}

migrate();
