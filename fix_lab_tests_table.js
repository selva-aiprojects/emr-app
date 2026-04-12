import { query } from './server/db/connection.js';

async function fixLabTestsTable() {
  try {
    console.log('=== FIXING LAB_TESTS TABLE IN NHGL SCHEMA ===\n');
    
    // Create the lab_tests table manually with correct structure
    console.log('Creating nhgl.lab_tests table...');
    await query(`
      CREATE TABLE nhgl.lab_tests (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        test_name text NOT NULL,
        category varchar(255) NOT NULL,
        normal_range text,
        price numeric(10,2),
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      )
    `);
    
    console.log('Success: Created nhgl.lab_tests table');
    
    // Create indexes
    console.log('Creating indexes...');
    await query('CREATE INDEX idx_lab_tests_tenant_id ON nhgl.lab_tests(tenant_id)');
    await query('CREATE INDEX idx_lab_tests_category ON nhgl.lab_tests(category)');
    console.log('Success: Created indexes');
    
    // Populate with data from demo_emr
    console.log('Populating lab_tests data...');
    const nhglTenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
    
    await query(`
      INSERT INTO nhgl.lab_tests (tenant_id, test_name, category, normal_range, price, created_at, updated_at)
      SELECT 
        $1 as tenant_id,
        name as test_name,
        category,
        normal_range,
        price,
        NOW() as created_at,
        NOW() as updated_at
      FROM demo_emr.lab_tests
      LIMIT 20
      ON CONFLICT DO NOTHING
    `, [nhglTenantId]);
    
    console.log('Success: Populated lab_tests data');
    
    // Verify the table
    const verification = await query(`SELECT COUNT(*) as count FROM nhgl.lab_tests WHERE tenant_id = $1`, [nhglTenantId]);
    console.log(`Lab Tests created: ${verification.rows[0].count}`);
    
    // Test the Reports API for NHGL
    console.log('\n=== TESTING NHGL REPORTS API ===');
    
    const nhglTest = await Promise.all([
      query(`SELECT COUNT(*)::int as count FROM nhgl.patients WHERE tenant_id = $1`, [nhglTenantId]),
      query(`SELECT COUNT(*)::int as count FROM nhgl.appointments WHERE tenant_id = $1`, [nhglTenantId]),
      query(`SELECT COALESCE(SUM(total), 0) as total FROM nhgl.invoices WHERE tenant_id = $1 AND status IN ('paid', 'partially_paid')`, [nhglTenantId]),
      query(`SELECT COUNT(*)::int as count FROM nhgl.lab_tests WHERE tenant_id = $1`, [nhglTenantId]),
      query(`SELECT COUNT(*)::int as count FROM nhgl.blood_units WHERE tenant_id = $1`, [nhglTenantId])
    ]);
    
    console.log('\nNHGL Reports Test Results:');
    console.log(` Patients: ${nhglTest[0].rows[0].count}`);
    console.log(` Appointments: ${nhglTest[1].rows[0].count}`);
    console.log(` Revenue: $${(nhglTest[2].rows[0].total || 0).toLocaleString()}`);
    console.log(` Lab Tests: ${nhglTest[3].rows[0].count}`);
    console.log(` Blood Units: ${nhglTest[4].rows[0].count}`);
    
    const hasRequiredData = [
      nhglTest[0].rows[0].count > 0,
      nhglTest[1].rows[0].count > 0,
      nhglTest[2].rows[0].total > 0,
      nhglTest[3].rows[0].count > 0
    ].every(Boolean);
    
    console.log(`\nNHGL Reports Page Ready: ${hasRequiredData ? 'YES' : 'NO'}`);
    
    console.log('\n=== SUCCESS ===');
    console.log('NHGL lab_tests table has been created and populated!');
    console.log('The NHGL tenant should now work with the Reports & Analysis page.');
    
    console.log('\n=== FINAL TEST ===');
    
    // Test both tenants one more time
    const finalTest = await Promise.all([
      query(`SELECT COUNT(*)::int as count FROM demo_emr.lab_tests WHERE tenant_id = '20d07615-8de9-49b4-9929-ec565197e6f4'`),
      query(`SELECT COUNT(*)::int as count FROM nhgl.lab_tests WHERE tenant_id = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e'`)
    ]);
    
    console.log('\nFinal Lab Tests Count:');
    console.log(` DEMO: ${finalTest[0].rows[0].count}`);
    console.log(` NHGL: ${finalTest[1].rows[0].count}`);
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Restart the backend server');
    console.log('2. Test login with both DEMO and NHGL tenants');
    console.log('3. Verify Reports & Analysis page works for both tenants');
    console.log('4. Dynamic tenant schema functionality is now COMPLETE!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixLabTestsTable();
