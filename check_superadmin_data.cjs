const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Checking Management Tenants Data ===');
    const tenants = await query('SELECT * FROM emr.management_tenants ORDER BY name');
    console.log('Management Tenants:');
    tenants.rows.forEach(t => {
      console.log(`- ${t.name} (${t.code}) - Schema: ${t.schema_name} - Status: ${t.status}`);
    });
    
    console.log('\n=== Checking Management Tenant Metrics ===');
    const metrics = await query('SELECT * FROM emr.management_tenant_metrics');
    console.log('Cached Metrics:');
    metrics.rows.forEach(m => {
      console.log(`- Tenant: ${m.tenant_id} - Patients: ${m.patients_count} - Doctors: ${m.doctors_count} - Beds: ${m.available_beds}`);
    });
    
    console.log('\n=== Checking Dashboard Summary ===');
    const summary = await query('SELECT * FROM emr.management_dashboard_summary');
    console.log('Dashboard Summary:');
    summary.rows.forEach(s => {
      console.log(`- ${s.summary_key}: Tenants: ${s.total_tenants}, Doctors: ${s.total_doctors}, Patients: ${s.total_patients}, Beds: ${s.available_beds}`);
    });
    
    console.log('\n=== Checking Actual Data in Schemas ===');
    for (const tenant of tenants.rows) {
      if (tenant.schema_name) {
        try {
          const [patients, staff] = await Promise.all([
            query(`SELECT COUNT(*) as count FROM "${tenant.schema_name}".patients`),
            query(`SELECT COUNT(*) as count FROM "${tenant.schema_name}".employees`)
          ]);
          console.log(`${tenant.name}: ${patients.rows[0].count} patients, ${staff.rows[0].count} staff`);
        } catch (err) {
          console.log(`${tenant.name}: Error checking data - ${err.message}`);
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
