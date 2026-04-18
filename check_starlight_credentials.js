const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Starlight Tenant Credentials ===');
    
    // Get tenant info
    const tenantResult = await query('SELECT id, name, schema_name FROM emr.management_tenants WHERE name LIKE $1', ['%Starlight%']);
    console.log('Tenant Info:');
    tenantResult.rows.forEach(t => console.log('  ID:', t.id, 'Name:', t.name, 'Schema:', t.schema_name));
    
    // Get users for Starlight tenant
    if (tenantResult.rows.length > 0) {
      const tenantId = tenantResult.rows[0].id;
      const userResult = await query('SELECT email, password, role FROM emr.management_users WHERE tenant_id = $1', [tenantId]);
      
      console.log('\nUsers:');
      if (userResult.rows.length === 0) {
        console.log('  No users found for Starlight tenant');
      } else {
        userResult.rows.forEach(user => {
          console.log('  Email:', user.email);
          console.log('  Password:', user.password);
          console.log('  Role:', user.role);
          console.log('  ---');
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
