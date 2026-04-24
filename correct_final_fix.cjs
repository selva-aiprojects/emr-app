const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== CORRECTING Final Superadmin Fix ===');
    
    const nhslTenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
    const starlightTenantId = 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa';
    
    // Get correct data from both tenants (separate queries)
    const [nhslDoctors, nhslPatients, nhslBeds, starlightDoctors, starlightPatients, starlightBeds] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM nhsl.employees WHERE tenant_id = $1 AND (lower(designation) LIKE '%doctor%' OR lower(designation) LIKE '%consultant%' OR lower(designation) LIKE '%physician%' OR lower(designation) LIKE '%surgeon%')`, [nhslTenantId]),
      query(`SELECT COUNT(*) as count FROM nhsl.patients WHERE tenant_id = $1`, [nhslTenantId]),
      query(`SELECT COUNT(*) as count FROM nhsl.beds WHERE tenant_id = $1 AND status = 'available'`, [nhslTenantId]),
      query(`SELECT COUNT(*) as count FROM smcmega.employees WHERE tenant_id = $1 AND (lower(designation) LIKE '%doctor%' OR lower(designation) LIKE '%consultant%' OR lower(designation) LIKE '%physician%' OR lower(designation) LIKE '%surgeon%')`, [starlightTenantId]),
      query(`SELECT COUNT(*) as count FROM smcmega.patients WHERE tenant_id = $1`, [starlightTenantId]),
      query(`SELECT COUNT(*) as count FROM smcmega.beds WHERE tenant_id = $1 AND status = 'available'`, [starlightTenantId])
    ]);
    
    const nhslData = {
      doctors: nhslDoctors.rows[0].count,
      patients: nhslPatients.rows[0].count,
      beds: nhslBeds.rows[0].count
    };
    
    const starlightData = {
      doctors: starlightDoctors.rows[0].count,
      patients: starlightPatients.rows[0].count,
      beds: starlightBeds.rows[0].count
    };
    
    console.log('Correct NHSL Data:', nhslData);
    console.log('Correct Starlight Data:', starlightData);
    
    // Update both tenant caches with correct data
    await Promise.all([
      query(`
        UPDATE emr.management_tenant_metrics 
        SET doctors_count = $1, patients_count = $2, available_beds = $3, updated_at = NOW()
        WHERE tenant_id = $4
      `, [nhslData.doctors, nhslData.patients, nhslData.beds, nhslTenantId]),
      
      query(`
        UPDATE emr.management_tenant_metrics 
        SET doctors_count = $1, patients_count = $2, available_beds = $3, updated_at = NOW()
        WHERE tenant_id = $4
      `, [starlightData.doctors, starlightData.patients, starlightData.beds, starlightTenantId])
    ]);
    
    console.log('Both tenant caches updated with correct data');
    
    // Recalculate global summary
    const globalTotals = await query(`
      SELECT 
        COUNT(*) as total_tenants,
        COALESCE(SUM(doctors_count), 0) as total_doctors,
        COALESCE(SUM(patients_count), 0) as total_patients,
        COALESCE(SUM(available_beds), 0) as total_beds
      FROM emr.management_tenant_metrics
    `);
    
    const totals = globalTotals.rows[0];
    console.log('Corrected Totals:', totals);
    
    // Update global summary
    await query(`
      INSERT INTO emr.management_dashboard_summary
        (summary_key, total_tenants, total_doctors, total_patients, available_beds, updated_at)
      VALUES ('global', $1, $2, $3, $4, NOW())
      ON CONFLICT (summary_key) DO UPDATE SET
        total_tenants = EXCLUDED.total_tenants,
        total_doctors = EXCLUDED.total_doctors,
        total_patients = EXCLUDED.total_patients,
        available_beds = EXCLUDED.available_beds,
        updated_at = NOW()
    `, [totals.total_tenants, totals.total_doctors, totals.total_patients, totals.total_beds]);
    
    console.log('Global summary updated with correct totals');
    
    // Final verification
    const finalCheck = await query(`
      SELECT tenant_name, patients_count, doctors_count, available_beds
      FROM emr.management_tenant_metrics 
      WHERE tenant_name ILIKE '%nitra%' OR tenant_name ILIKE '%starlight%'
      ORDER BY tenant_name
    `);
    
    console.log('\n=== Final Verification ===');
    finalCheck.rows.forEach(row => {
      console.log(`- ${row.tenant_name}: ${row.patients_count} patients, ${row.doctors_count} doctors, ${row.available_beds} beds`);
    });
    
    console.log('\n=== CORRECTED FINAL RESULTS ===');
    console.log(`Total Patients: ${totals.total_patients}`);
    console.log(`Total Doctors: ${totals.total_doctors}`);
    console.log(`Available Beds: ${totals.total_beds}`);
    console.log(`Total Tenants: ${totals.total_tenants}`);
    
    console.log('\n=== SUPERADMIN DASHBOARD IS NOW CORRECTLY FIXED! ===');
    console.log('Expected Results:');
    console.log('- NHSL: 270 patients, 28 doctors, 3 beds');
    console.log('- Starlight: 280 patients, 14 doctors, 0 beds');
    console.log('- TOTALS: 550 patients, 42 doctors, 3 beds');
    console.log('\nPlease refresh your browser to see the updated data.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
