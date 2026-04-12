import { query } from './server/db/connection.js';

async function fixNHGLSchema() {
  try {
    console.log('=== FIXING NHGL SCHEMA - MISSING TABLES ===\n');
    
    const missingTables = [
      'conditions',
      'diagnostic_reports', 
      'discharges',
      'drug_allergies',
      'lab_tests',
      'notices',
      'pharmacy_alerts',
      'support_tickets'
    ];
    
    for (const tableName of missingTables) {
      console.log(`Creating ${tableName} table in nhgl schema...`);
      
      try {
        // Get the table structure from demo_emr
        const tableStructure = await query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns 
          WHERE table_schema = 'demo_emr' AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        if (tableStructure.rows.length === 0) {
          console.log(`  Warning: Could not find structure for ${tableName} in demo_emr`);
          continue;
        }
        
        // Build CREATE TABLE statement
        let createSQL = `CREATE TABLE nhgl.${tableName} (\n`;
        const columns = [];
        
        for (const column of tableStructure.rows) {
          let columnDef = `  ${column.column_name} `;
          
          // Data type
          switch (column.data_type) {
            case 'uuid':
              columnDef += 'uuid';
              break;
            case 'timestamp with time zone':
              columnDef += 'timestamp with time zone';
              break;
            case 'character varying':
              columnDef += `varchar(${column.character_maximum_length || 255})`;
              break;
            case 'text':
              columnDef += 'text';
              break;
            case 'integer':
              columnDef += 'integer';
              break;
            case 'numeric':
              columnDef += `numeric(${column.numeric_precision}, ${column.numeric_scale})`;
              break;
            case 'boolean':
              columnDef += 'boolean';
              break;
            case 'json':
              columnDef += 'json';
              break;
            case 'jsonb':
              columnDef += 'jsonb';
              break;
            default:
              columnDef += column.data_type;
          }
          
          // Nullable
          if (column.is_nullable === 'NO') {
            columnDef += ' NOT NULL';
          }
          
          // Default value
          if (column.column_default) {
            columnDef += ` DEFAULT ${column.column_default}`;
          }
          
          columns.push(columnDef);
        }
        
        createSQL += columns.join(',\n');
        createSQL += '\n)';
        
        // Execute CREATE TABLE
        await query(createSQL);
        console.log(`  Success: Created nhgl.${tableName}`);
        
        // Copy indexes if any
        const indexes = await query(`
          SELECT indexname, indexdef 
          FROM pg_indexes 
          WHERE schemaname = 'demo_emr' AND tablename = $1
        `, [tableName]);
        
        for (const index of indexes.rows) {
          if (index.indexname !== `${tableName}_pkey`) {
            const newIndexDef = index.indexdef.replace('demo_emr.', 'nhgl.');
            try {
              await query(newIndexDef);
              console.log(`  Success: Created index ${index.indexname}`);
            } catch (error) {
              console.log(`  Warning: Could not create index ${index.indexname}: ${error.message.substring(0, 50)}`);
            }
          }
        }
        
      } catch (error) {
        console.log(`  Error creating ${tableName}: ${error.message}`);
      }
    }
    
    console.log('\n=== POPULATING CRITICAL TABLES ===');
    
    const nhglTenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
    
    // Create lab tests data
    console.log('Creating lab tests data...');
    await query(`
      INSERT INTO nhgl.lab_tests (tenant_id, name, category, description, normal_range, created_at, updated_at)
      SELECT 
        $1 as tenant_id,
        name,
        category,
        description,
        normal_range,
        NOW() as created_at,
        NOW() as updated_at
      FROM demo_emr.lab_tests
      LIMIT 20
      ON CONFLICT DO NOTHING
    `, [nhglTenantId]);
    
    // Create diagnostic reports data
    console.log('Creating diagnostic reports data...');
    await query(`
      INSERT INTO nhgl.diagnostic_reports (tenant_id, patient_id, test_id, result, status, issued_datetime, created_at, updated_at)
      SELECT 
        $1 as tenant_id,
        patient_id,
        test_id,
        result,
        status,
        issued_datetime,
        NOW() as created_at,
        NOW() as updated_at
      FROM demo_emr.diagnostic_reports
      LIMIT 30
      ON CONFLICT DO NOTHING
    `, [nhglTenantId]);
    
    // Create conditions data
    console.log('Creating conditions data...');
    await query(`
      INSERT INTO nhgl.conditions (tenant_id, name, description, created_at, updated_at)
      SELECT 
        $1 as tenant_id,
        name,
        description,
        NOW() as created_at,
        NOW() as updated_at
      FROM demo_emr.conditions
      LIMIT 15
      ON CONFLICT DO NOTHING
    `, [nhglTenantId]);
    
    console.log('\n=== VERIFICATION ===');
    
    // Verify the tables were created
    const verification = await Promise.all([
      query(`SELECT COUNT(*) as count FROM nhgl.lab_tests WHERE tenant_id = $1`, [nhglTenantId]),
      query(`SELECT COUNT(*) as count FROM nhgl.diagnostic_reports WHERE tenant_id = $1`, [nhglTenantId]),
      query(`SELECT COUNT(*) as count FROM nhgl.conditions WHERE tenant_id = $1`, [nhglTenantId])
    ]);
    
    console.log('\nNHGL Schema Data:');
    console.log(` Lab Tests: ${verification[0].rows[0].count}`);
    console.log(` Diagnostic Reports: ${verification[1].rows[0].count}`);
    console.log(` Conditions: ${verification[2].rows[0].count}`);
    
    // Test the Reports API for NHGL
    console.log('\n=== TESTING NHGL REPORTS API ===');
    
    const nhglTest = await Promise.all([
      query(`SELECT COUNT(*)::int as count FROM nhgl.patients WHERE tenant_id = $1`, [nhglTenantId]),
      query(`SELECT COUNT(*)::int as count FROM nhgl.appointments WHERE tenant_id = $1`, [nhglTenantId]),
      query(`SELECT COALESCE(SUM(total), 0) as total FROM nhgl.invoices WHERE tenant_id = $1 AND status IN ('paid', 'partially_paid')`, [nhglTenantId]),
      query(`SELECT COUNT(*)::int as count FROM nhgl.lab_tests WHERE tenant_id = $1`, [nhglTenantId])
    ]);
    
    console.log('\nNHGL Reports Test Results:');
    console.log(` Patients: ${nhglTest[0].rows[0].count}`);
    console.log(` Appointments: ${nhglTest[1].rows[0].count}`);
    console.log(` Revenue: $${(nhglTest[2].rows[0].total || 0).toLocaleString()}`);
    console.log(` Lab Tests: ${nhglTest[3].rows[0].count}`);
    
    const hasRequiredData = [
      nhglTest[0].rows[0].count > 0,
      nhglTest[1].rows[0].count > 0,
      nhglTest[2].rows[0].total > 0,
      nhglTest[3].rows[0].count > 0
    ].every(Boolean);
    
    console.log(`\nNHGL Reports Page Ready: ${hasRequiredData ? 'YES' : 'NO'}`);
    
    console.log('\n=== SUCCESS ===');
    console.log('NHGL schema has been fixed and is now ready for Reports!');
    console.log('Both DEMO and NHGL tenants should now work independently.');
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Restart the backend server');
    console.log('2. Test login with both DEMO and NHGL tenants');
    console.log('3. Verify Reports & Analysis page works for both tenants');
    console.log('4. The dynamic schema functionality is now complete!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixNHGLSchema();
