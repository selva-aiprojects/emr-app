const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Checking Management Tenant Metrics ===');
    const result = await query('SELECT * FROM emr.management_tenant_metrics ORDER BY updated_at DESC');
    console.log('Current cached metrics:');
    result.rows.forEach(m => {
      console.log(`- Tenant: ${m.tenant_id} - Patients: ${m.patients_count} - Doctors: ${m.doctors_count} - Beds: ${m.available_beds}`);
    });
    
    console.log('\n=== Checking NHSL Specifically ===');
    const nhslResult = await query('SELECT * FROM emr.management_tenant_metrics WHERE tenant_id = $1', ['a730192d-efe3-4fd8-82a3-829ad905acff']);
    console.log('NHSL cached metrics:', nhslResult.rows.length, 'rows');
    nhslResult.rows.forEach(m => {
      console.log(JSON.stringify(m, null, 2));
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
