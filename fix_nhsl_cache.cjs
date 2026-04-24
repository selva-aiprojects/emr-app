const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Manually Fixing NHSL Cache ===');
    
    const nhslTenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
    const schemaName = 'nhsl';
    
    // Get the actual data from NHSL schema
    const [pRes, dRes, bRes, aRes] = await Promise.all([
      query(`SELECT COUNT(*)::int as c FROM "${schemaName}".patients`),
      query(`SELECT COUNT(*)::int as c FROM "${schemaName}".employees WHERE tenant_id = $1 AND (lower(designation) LIKE '%doctor%' OR lower(designation) LIKE '%consultant%' OR lower(designation) LIKE '%physician%' OR lower(designation) LIKE '%surgeon%')`, [nhslTenantId]),
      query(`SELECT COUNT(CASE WHEN status = 'available' THEN 1 END)::int as c FROM "${schemaName}".beds`),
      query(`SELECT COUNT(CASE WHEN status = 'available' THEN 1 END)::int as c FROM "${schemaName}".ambulances`),
    ]);
    
    const livePatients = pRes.rows[0]?.c || 0;
    const liveDoctors  = dRes.rows[0]?.c || 0;
    const liveBeds     = bRes.rows[0]?.c || 0;
    const liveAmb      = aRes.rows[0]?.c || 0;
    
    console.log('Live NHSL Data:');
    console.log(`  Patients: ${livePatients}`);
    console.log(`  Doctors: ${liveDoctors}`);
    console.log(`  Beds: ${liveBeds}`);
    console.log(`  Ambulances: ${liveAmb}`);
    
    // Get tenant info
    const tenantInfo = await query('SELECT code, name, schema_name FROM emr.management_tenants WHERE id = $1', [nhslTenantId]);
    
    if (tenantInfo.rows.length > 0) {
      const tenant = tenantInfo.rows[0];
      
      // Update the cache with correct data
      const updateResult = await query(`
        INSERT INTO emr.management_tenant_metrics
          (tenant_id, tenant_code, tenant_name, schema_name, patients_count, doctors_count, available_beds, available_ambulances, active_users_count, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (tenant_id) DO UPDATE SET
          tenant_code = EXCLUDED.tenant_code,
          tenant_name = EXCLUDED.tenant_name,
          schema_name = EXCLUDED.schema_name,
          patients_count = EXCLUDED.patients_count,
          doctors_count = EXCLUDED.doctors_count,
          available_beds = EXCLUDED.available_beds,
          available_ambulances = EXCLUDED.available_ambulances,
          active_users_count = EXCLUDED.active_users_count,
          updated_at = NOW()
      `, [nhslTenantId, tenant.code, tenant.name, tenant.schema_name, livePatients, liveDoctors, liveBeds, liveAmb, liveDoctors]);
      
      console.log('Cache update result:', updateResult.rowCount, 'rows affected');
      
      // Verify the update
      const checkResult = await query('SELECT * FROM emr.management_tenant_metrics WHERE tenant_id = $1', [nhslTenantId]);
      console.log('Updated cache:');
      checkResult.rows.forEach(m => {
        console.log(`  Patients: ${m.patients_count}, Doctors: ${m.doctors_count}, Beds: ${m.available_beds}`);
      });
      
      // Clear global summary to force recalculation
      await query('DELETE FROM emr.management_dashboard_summary WHERE summary_key = \'global\'');
      console.log('Global summary cache cleared');
      
    } else {
      console.log('NHSL tenant not found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
