import { query } from '../server/db/connection.js';

async function checkAdmin() {
  try {
    const res = await query("SELECT * FROM nexus.users WHERE tenant_id::text = (SELECT id::text FROM nexus.tenants WHERE code = 'mahindra-s' LIMIT 1)");
    console.log("Admin in nexus.users:", res.rows);
    
    const tenantRes = await query("SELECT id, name, code, schema_name FROM nexus.management_tenants WHERE code = 'mahindra-s'");
    const tenant = tenantRes.rows[0];
    if (tenant) {
      const shardRes = await query(`SELECT id, email, password_hash, role FROM "${tenant.schema_name}".users`);
      console.log(`Admin in shard [${tenant.schema_name}]:`, shardRes.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkAdmin();
