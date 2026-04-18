import { query } from '../server/db/connection.js';

async function checkUserData() {
  try {
    const email = 'administrator@mghplhospital.com';
    const res = await query("SELECT id, email, password_hash, tenant_id FROM emr.users WHERE email ILIKE $1", [email]);
    
    if (res.rowCount === 0) {
      console.log('User not found with ILIKE');
    } else {
      console.log('User data:');
      res.rows.forEach(r => {
        console.log(`- ID: ${r.id}`);
        console.log(`- Email in DB: "${r.email}" (Length: ${r.email.length})`);
        console.log(`- Tenant ID: ${r.tenant_id}`);
        console.log(`- Hash length: ${r.password_hash.length}`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkUserData();
