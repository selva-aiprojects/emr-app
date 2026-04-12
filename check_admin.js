import { query } from './server/db/connection.js';

async function checkAdmin() {
  try {
    const result = await query('SELECT email, name, role FROM emr.users WHERE tenant_id = $1 AND role ILIKE \'%admin%\'', ['20d07615-8de9-49b4-9929-ec565197e6f4']);
    
    console.log('Admin users in DEMO tenant:');
    if (result.rows.length === 0) {
      console.log('No admin users found');
      
      // Check all users in DEMO tenant
      const allUsers = await query('SELECT email, name, role FROM emr.users WHERE tenant_id = $1', ['20d07615-8de9-49b4-9929-ec565197e6f4']);
      console.log('\nAll users in DEMO tenant:');
      allUsers.rows.forEach(user => {
        console.log(`  ${user.email} - ${user.name} (${user.role})`);
      });
    } else {
      result.rows.forEach(user => {
        console.log(`  ${user.email} - ${user.name} (${user.role})`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkAdmin();
