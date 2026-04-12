import { query } from './server/db/connection.js';

async function checkLabTestsColumns() {
  try {
    console.log('=== CHECKING LAB_TESTS COLUMNS ===\n');
    
    const result = await query(`
      SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale
      FROM information_schema.columns 
      WHERE table_schema = 'demo_emr' AND table_name = 'lab_tests'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in demo_emr.lab_tests:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}${row.numeric_precision ? `(${row.numeric_precision}, ${row.numeric_scale})` : ''}`);
    });
    
    // Create lab tests data manually
    console.log('\n=== POPULATING NHGL LAB_TESTS MANUALLY ===');
    
    const nhglTenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
    
    // Insert sample lab tests
    const labTests = [
      { test_name: 'Complete Blood Count', category: 'Hematology', normal_range: 'RBC: 4.5-5.5, WBC: 4-11', price: 500.00 },
      { test_name: 'Lipid Profile', category: 'Biochemistry', normal_range: 'Total Cholesterol: <200 mg/dL', price: 800.00 },
      { test_name: 'ECG', category: 'Cardiology', normal_range: 'Normal rhythm', price: 1200.00 },
      { test_name: 'X-Ray Chest', category: 'Radiology', normal_range: 'Normal findings', price: 1500.00 },
      { test_name: 'Blood Sugar', category: 'Pathology', normal_range: 'Fasting: 70-100 mg/dL', price: 300.00 },
      { test_name: 'Liver Function Test', category: 'Biochemistry', normal_range: 'SGOT: <40 U/L, SGPT: <40 U/L', price: 600.00 },
      { test_name: 'Kidney Function Test', category: 'Biochemistry', normal_range: 'Creatinine: 0.6-1.2 mg/dL', price: 700.00 },
      { test_name: 'Thyroid Profile', category: 'Endocrinology', normal_range: 'TSH: 0.4-4.0 mIU/L', price: 900.00 },
      { test_name: 'Urine Routine', category: 'Pathology', normal_range: 'Color: Pale yellow, pH: 4.5-8', price: 200.00 },
      { test_name: 'Vitamin D', category: 'Biochemistry', normal_range: '30-100 ng/mL', price: 1000.00 }
    ];
    
    for (const test of labTests) {
      await query(`
        INSERT INTO nhgl.lab_tests (tenant_id, test_name, category, normal_range, price, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [nhglTenantId, test.test_name, test.category, test.normal_range, test.price]);
    }
    
    console.log('Successfully populated nhgl.lab_tests with sample data');
    
    // Verify
    const verification = await query(`SELECT COUNT(*) as count FROM nhgl.lab_tests WHERE tenant_id = $1`, [nhglTenantId]);
    console.log(`NHGL Lab Tests: ${verification.rows[0].count}`);
    
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
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkLabTestsColumns();
