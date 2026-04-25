import { query } from './server/db/connection.js';

(async () => {
  try {
    console.log('Checking tenant details and schema mapping...\n');
    
    // Get tenant info
    const tenantResult = await query('SELECT * FROM nexus.tenants WHERE code = $1', ['BHC']);
    if (tenantResult.rows.length === 0) {
      console.log('❌ BHC tenant not found');
      return;
    }
    
    const tenant = tenantResult.rows[0];
    console.log('✅ Found tenant details:');
    console.log(JSON.stringify(tenant, null, 2));
    
    // Check if tenant code is used as schema name
    const schemaName = tenant.code.toLowerCase();
    console.log(`\n📁 Likely schema name: ${schemaName}`);
    
    // Check if this schema exists
    const schemaCheck = await query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `, [schemaName]);
    
    if (schemaCheck.rows.length === 0) {
      console.log(`❌ Tenant schema '${schemaName}' does not exist`);
      
      // Check what schemas do exist
      const allSchemas = await query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'nexus')
        ORDER BY schema_name
      `);
      
      console.log(`\n📁 Available tenant schemas:`);
      console.log(JSON.stringify(allSchemas.rows, null, 2));
    } else {
      console.log(`✅ Tenant schema exists: ${schemaName}`);
      
      // Check tables in tenant schema
      const tables = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1
        ORDER BY table_name
      `, [schemaName]);
      
      console.log(`\n📋 Tables in ${schemaName} schema:`);
      console.log(JSON.stringify(tables.rows, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
