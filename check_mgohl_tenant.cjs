const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('Checking MGHPL tenant data...');
    
    // Check MGHPL tenant details
    const tenantResult = await query('SELECT id, name, code, schema_name FROM emr.management_tenants WHERE name LIKE $1', ['%Magnum%']);
    console.log('\nMGHPL Tenant Details:');
    console.log(tenantResult.rows);
    
    // Check which schema MGHPL resolves to
    const { getTenantSchema } = require('./server/utils/tenant-schema-helper.js');
    if (tenantResult.rows.length > 0) {
      const tenantId = tenantResult.rows[0].id;
      const schema = await getTenantSchema(tenantId);
      console.log('\nMGHPL resolves to schema:', schema);
      
      // Check data in that schema
      const tables = ['patients', 'appointments', 'encounters', 'beds', 'invoices'];
      console.log('\nData in ' + schema + ' schema:');
      
      for (const table of tables) {
        try {
          const countResult = await query('SELECT COUNT(*) as count FROM ' + schema + '.' + table + ' WHERE tenant_id::text = $1::text', [tenantId]);
          console.log('  ' + table + ':', countResult.rows[0]?.count || 0);
        } catch (error) {
          console.log('  ' + table + ': ERROR -', error.message);
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
