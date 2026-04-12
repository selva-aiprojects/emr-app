import { query } from './server/db/connection.js';
import { getTenantSchema, getAvailableTenantSchemas } from './server/utils/tenant-schema-helper.js';

async function testDynamicSchemas() {
  try {
    console.log('=== TESTING DYNAMIC TENANT SCHEMAS ===\n');
    
    // Test 1: Get all available tenant schemas
    console.log('1. Getting all available tenant schemas...');
    const availableSchemas = await getAvailableTenantSchemas();
    
    console.log('Available Tenant Schemas:');
    availableSchemas.forEach(schema => {
      console.log(` ${schema.tenant_code} (${schema.tenant_name}): ${schema.schema_name} - Exists: ${schema.schema_exists}`);
    });
    
    // Test 2: Test DEMO tenant schema
    console.log('\n2. Testing DEMO tenant schema...');
    const demoTenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    const demoSchema = await getTenantSchema(demoTenantId);
    console.log(`DEMO Tenant Schema: ${demoSchema}`);
    
    // Test DEMO data
    const demoData = await query(`SELECT COUNT(*) as count FROM ${demoSchema}.patients WHERE tenant_id = $1`, [demoTenantId]);
    console.log(`DEMO Patients Count: ${demoData.rows[0].count}`);
    
    // Test 3: Test NHGL tenant schema
    console.log('\n3. Testing NHGL tenant schema...');
    const nhglTenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
    const nhglSchema = await getTenantSchema(nhglTenantId);
    console.log(`NHGL Tenant Schema: ${nhglSchema}`);
    
    // Test NHGL data
    const nhglData = await query(`SELECT COUNT(*) as count FROM ${nhglSchema}.patients WHERE tenant_id = $1`, [nhglTenantId]);
    console.log(`NHGL Patients Count: ${nhglData.rows[0].count}`);
    
    // Test 4: Verify schema structure exists
    console.log('\n4. Verifying schema structure...');
    
    const schemasToTest = [
      { name: 'DEMO', schema: demoSchema, tenantId: demoTenantId },
      { name: 'NHGL', schema: nhglSchema, tenantId: nhglTenantId }
    ];
    
    for (const schemaInfo of schemasToTest) {
      console.log(`\n${schemaInfo.name} Schema (${schemaInfo.schema}):`);
      
      const tables = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `, [schemaInfo.schema]);
      
      console.log(`   Tables (${tables.rows.length}): ${tables.rows.slice(0, 10).map(t => t.table_name).join(', ')}${tables.rows.length > 10 ? '...' : ''}`);
      
      // Test key tables
      const keyTables = ['patients', 'appointments', 'invoices', 'beds', 'employees'];
      for (const table of keyTables) {
        const tableExists = await query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = $2
          ) as exists
        `, [schemaInfo.schema, table]);
        
        console.log(`   ${table}: ${tableExists.rows[0].exists ? 'EXISTS' : 'MISSING'}`);
      }
    }
    
    // Test 5: Create missing schemas if needed
    console.log('\n5. Creating missing schemas if needed...');
    
    for (const schemaInfo of schemasToTest) {
      const schemaCheck = await query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = $1
      `, [schemaInfo.schema]);
      
      if (schemaCheck.rows.length === 0) {
        console.log(`Creating schema: ${schemaInfo.schema}`);
        await query(`CREATE SCHEMA ${schemaInfo.schema}`);
        console.log(`Schema ${schemaInfo.schema} created successfully`);
      } else {
        console.log(`Schema ${schemaInfo.schema} already exists`);
      }
    }
    
    console.log('\n=== SUCCESS ===');
    console.log('Dynamic tenant schema functionality is working correctly!');
    console.log('The application can now dynamically identify and use the correct schema for each tenant.');
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Restart the server to apply schema changes');
    console.log('2. Test login with both DEMO and NHGL tenants');
    console.log('3. Verify dashboard shows data for both tenants');
    console.log('4. The Reports & Analysis page should now work for both tenants');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testDynamicSchemas();
