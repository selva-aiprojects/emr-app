import { query } from './server/db/connection.js';

(async () => {
  try {
    console.log('Checking nexus schema structure (multi-tenant management)...\n');
    
    // Check tables in nexus schema
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'nexus'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables in nexus schema:');
    console.log(JSON.stringify(tables.rows, null, 2));
    
    // Check if patients table exists in nexus
    if (tables.rows.some(t => t.table_name === 'patients')) {
      const patientsColumns = await query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'patients' AND table_schema = 'nexus'
        ORDER BY ordinal_position
      `);
      
      console.log('\n👥 Patients table structure in nexus schema:');
      console.log(JSON.stringify(patientsColumns.rows, null, 2));
      
      // Check existing patients in nexus
      const existingPatients = await query('SELECT COUNT(*) as count FROM nexus.patients');
      console.log(`\n📊 Existing patients in nexus schema: ${existingPatients.rows[0].count}`);
      
      // Show sample patients if any exist
      if (existingPatients.rows[0].count > 0) {
        const samplePatients = await query('SELECT * FROM nexus.patients LIMIT 3');
        console.log('\n📋 Sample patients in nexus:');
        console.log(JSON.stringify(samplePatients.rows, null, 2));
      }
    }
    
    // Check if there are any tenant-specific schemas
    const tenantSchemas = await query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%' OR schema_name IN ('nhgl', 'bhc', 'pmc', 'ehs')
      ORDER BY schema_name
    `);
    
    console.log('\n🏥 Tenant-specific schemas:');
    console.log(JSON.stringify(tenantSchemas.rows, null, 2));
    
    // Check nhgl schema if it exists (might be a tenant schema)
    if (tenantSchemas.rows.some(s => s.schema_name === 'nhgl')) {
      const nhglTables = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'nhgl'
        ORDER BY table_name
      `);
      
      console.log('\n📋 Tables in nhgl schema (tenant-specific):');
      console.log(JSON.stringify(nhglTables.rows, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
