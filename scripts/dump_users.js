import { query } from '../server/db/connection.js';
import fs from 'fs';

async function dumpUsers() {
  try {
    const res = await query("SELECT u.email, u.role, t.name as tenant_name, t.code as tenant_code FROM emr.users u JOIN emr.tenants t ON u.tenant_id = t.id");
    fs.writeFileSync('./users_dump.json', JSON.stringify(res.rows, null, 2));
    console.log('Dumped users to users_dump.json');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

dumpUsers();
