const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Testing NHSL Live Query Manually ===');
    
    const nhslTenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
    const schemaName = 'nhsl';
    
    console.log(`Schema: ${schemaName}`);
    console.log(`Tenant ID: ${nhslTenantId}`);
    
    // Verify schema exists
    const schemaCheck = await query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`, [schemaName]
    );
    console.log('Schema exists:', schemaCheck.rows.length > 0);
    
    if (schemaCheck.rows.length === 0) {
      console.log('Schema does not exist!');
      process.exit(0);
    }
    
    // Run the exact live query
    console.log('\n=== Running Live Query ===');
    const [pRes, dRes, bRes, aRes] = await Promise.all([
      query(`SELECT COUNT(*)::int as c FROM "${schemaName}".patients`).catch(() => ({ rows: [{ c: 0 }] })),
      query(`SELECT COUNT(*)::int as c FROM "${schemaName}".employees WHERE tenant_id = $1 AND (lower(designation) LIKE '%doctor%' OR lower(designation) LIKE '%consultant%' OR lower(designation) LIKE '%physician%' OR lower(designation) LIKE '%surgeon%')`, [nhslTenantId]).catch(() => ({ rows: [{ c: 0 }] })),
      query(`SELECT COUNT(CASE WHEN status = 'available' THEN 1 END)::int as c FROM "${schemaName}".beds`).catch(() => ({ rows: [{ c: 0 }] })),
      query(`SELECT COUNT(CASE WHEN status = 'available' THEN 1 END)::int as c FROM "${schemaName}".ambulances`).catch(() => ({ rows: [{ c: 0 }] })),
    ]);
    
    console.log('Live Query Results:');
    console.log(`  Patients: ${pRes.rows[0]?.c || 0}`);
    console.log(`  Doctors: ${dRes.rows[0]?.c || 0}`);
    console.log(`  Beds: ${bRes.rows[0]?.c || 0}`);
    console.log(`  Ambulances: ${aRes.rows[0]?.c || 0}`);
    
    // Test the upsert
    console.log('\n=== Testing Upsert ===');
    const livePatients = pRes.rows[0]?.c || 0;
    const liveDoctors  = dRes.rows[0]?.c || 0;
    const liveBeds     = bRes.rows[0]?.c || 0;
    const liveAmb      = aRes.rows[0]?.c || 0;
    
    const upsertResult = await query(`
      INSERT INTO emr.management_tenant_metrics
        (tenant_id, patients_count, doctors_count, available_beds, available_ambulances, active_users_count, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (tenant_id) DO UPDATE SET
        patients_count = EXCLUDED.patients_count,
        doctors_count = EXCLUDED.doctors_count,
        available_beds = EXCLUDED.available_beds,
        available_ambulances = EXCLUDED.available_ambulances,
        updated_at = NOW()
    `, [nhslTenantId, livePatients, liveDoctors, liveBeds, liveAmb, liveDoctors]);
    
    console.log('Upsert result:', upsertResult.rowCount, 'rows affected');
    
    // Check if it was inserted
    const checkResult = await query('SELECT * FROM emr.management_tenant_metrics WHERE tenant_id = $1', [nhslTenantId]);
    console.log('After upsert - cached metrics:', checkResult.rows.length, 'rows');
    checkResult.rows.forEach(m => {
      console.log(`  Patients: ${m.patients_count}, Doctors: ${m.doctors_count}, Beds: ${m.available_beds}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
