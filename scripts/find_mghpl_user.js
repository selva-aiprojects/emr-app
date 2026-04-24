import { query } from '../server/db/connection.js';

async function findUser() {
  try {
    const tenantRes = await query("SELECT id, name FROM emr.tenants WHERE code = 'MGHPL'");
    if (tenantRes.rowCount === 0) {
      console.log('MGHPL tenant not found');
      return;
    }
    const tenantId = tenantRes.rows[0].id;
    console.log(`Found tenant ${tenantRes.rows[0].name} with ID ${tenantId}`);

    const userRes = await query("SELECT email, role FROM emr.users WHERE tenant_id = $1", [tenantId]);
    if (userRes.rowCount === 0) {
      console.log('No users found for MGHPL');
    } else {
      console.log('Found users for MGHPL:');
      console.table(userRes.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

findUser();
