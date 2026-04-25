import { query } from './server/db/connection.js';

(async () => {
  try {
    console.log('Checking tenant-specific schema structure...\n');
    
    // Get tenant info
    const tenantResult = await query('SELECT id, code, schema_name FROM nexus.tenants WHERE code = $1', ['BHC']);
    if (tenantResult.rows.length === 0) {
      console.log('❌ BHC tenant not found');
      return;
    }
    
    const tenant = tenantResult.rows[0];
    console.log(`✅ Found tenant: ${tenant.name} (${tenant.code})`);
    console.log(`📁 Schema: ${tenant.schema_name}`);
    
    // Check if tenant schema exists
    const schemaCheck = await query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = $1
    `, [tenant.schema_name]);
    
    if (schemaCheck.rows.length === 0) {
      console.log(`❌ Tenant schema '${tenant.schema_name}' does not exist`);
      return;
    }
    
    console.log(`✅ Tenant schema exists: ${tenant.schema_name}`);
    
    // Check tables in tenant schema
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
      ORDER BY table_name
    `, [tenant.schema_name]);
    
    console.log(`\n📋 Tables in ${tenant.schema_name} schema:`);
    console.log(JSON.stringify(tables.rows, null, 2));
    
    // Check patients table structure in tenant schema
    if (tables.rows.some(t => t.table_name === 'patients')) {
      const patientsColumns = await query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'patients' AND table_schema = $1
        ORDER BY ordinal_position
      `, [tenant.schema_name]);
      
      console.log(`\n👥 Patients table structure in ${tenant.schema_name}:`);
      console.log(JSON.stringify(patientsColumns.rows, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
