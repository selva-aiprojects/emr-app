const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Debugging NHSL Condition ===');
    
    const nhslTenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
    
    // Get the exact same query that superadmin service uses
    const { rows: tenantRows } = await query(`
      SELECT 
        t.id as tenant_id,
        t.code as tenant_code,
        t.name as tenant_name,
        t.status,
        t.subscription_tier,
        t.contact_email,
        t.schema_name,
        COALESCE(mtm.doctors_count, 0) as doctors_count,
        COALESCE(mtm.patients_count, 0) as patients_count,
        COALESCE(mtm.available_beds, 0) as available_beds,
        COALESCE(mtm.available_ambulances, 0) as available_ambulances,
        COALESCE(mtm.active_users_count, 0) as active_users_count
      FROM emr.management_tenants t
      LEFT JOIN emr.management_tenant_metrics mtm ON t.id::text = mtm.tenant_id::text
      WHERE t.id = $1
    `, [nhslTenantId]);
    
    console.log('NHSL Query Results:');
    if (tenantRows.length > 0) {
      const row = tenantRows[0];
      console.log(`- Name: ${row.tenant_name}`);
      console.log(`- Schema: ${row.schema_name}`);
      console.log(`- Patients Count: ${row.patients_count}`);
      console.log(`- Doctors Count: ${row.doctors_count}`);
      console.log(`- Beds Count: ${row.available_beds}`);
      console.log(`- Doctors Zero: ${Number(row.doctors_count) === 0}`);
      console.log(`- Schema Exists: ${!!row.schema_name}`);
    } else {
      console.log('NHSL tenant not found!');
    }
    
    // Also check if there's any data in management_tenant_metrics for NHSL
    const metricsCheck = await query('SELECT * FROM emr.management_tenant_metrics WHERE tenant_id::text = $1::text', [nhslTenantId]);
    console.log(`\nDirect metrics check: ${metricsCheck.rows.length} rows found`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
