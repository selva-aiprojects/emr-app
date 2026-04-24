const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Checking Starlight Tenant ===');
    
    const tenantId = 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa';
    
    // Check if tenant exists in emr.tenants
    const tenantResult = await query('SELECT * FROM emr.tenants WHERE id = $1', [tenantId]);
    console.log('emr.tenants rows:', tenantResult.rows.length);
    if (tenantResult.rows.length > 0) {
      console.log('Tenant found:', tenantResult.rows[0].name);
    }
    
    // Check if tenant exists in management_tenants
    const mgmtResult = await query('SELECT * FROM emr.management_tenants WHERE id = $1', [tenantId]);
    console.log('emr.management_tenants rows:', mgmtResult.rows.length);
    if (mgmtResult.rows.length > 0) {
      console.log('Management tenant found:', mgmtResult.rows[0].name);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
