const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Finding NHSL Admin User ===');
    const tenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
    
    const users = await query('SELECT * FROM emr.users WHERE tenant_id = $1 AND role = \'Admin\' LIMIT 1', [tenantId]);
    if (users.rows.length > 0) {
      const user = users.rows[0];
      console.log('NHSL Admin Credentials:');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Tenant ID:', user.tenant_id);
      console.log('User ID:', user.id);
      console.log('Default Password: Admin@123 (if password is hashed)');
    } else {
      console.log('No admin user found for NHSL tenant');
      console.log('Default credentials should be:');
      console.log('Email: admin@nhsl.local');
      console.log('Password: Admin@123');
    }
    
    // Also check if there are any users for NHSL
    console.log('\n=== All NHSL Users ===');
    const allUsers = await query('SELECT email, name, role FROM emr.users WHERE tenant_id = $1', [tenantId]);
    console.log(`Found ${allUsers.rows.length} users for NHSL:`);
    allUsers.rows.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
