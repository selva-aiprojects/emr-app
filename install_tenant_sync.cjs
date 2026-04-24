const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Installing Tenant Metrics Sync ===');
    
    // Get active tenants with data
    const tenants = await query(`
      SELECT id, code, name, schema_name 
      FROM emr.management_tenants 
      WHERE schema_name IN ('nhsl', 'smcmega')
      ORDER BY name
    `);
    
    console.log('Found active tenants:');
    tenants.rows.forEach(t => {
      console.log(`- ${t.name} (${t.code}) - Schema: ${t.schema_name}`);
    });
    
    // Install metrics sync for each tenant
    for (const tenant of tenants.rows) {
      console.log(`\n=== Installing sync for ${tenant.name} ===`);
      
      try {
        // Install the tenant metrics sync
        const installResult = await query('SELECT emr.install_tenant_metrics_sync($1::text, $2::text)', [tenant.schema_name, tenant.id]);
        console.log(`Install result for ${tenant.name}:`, installResult.rows[0]);
        
        // Test the refresh for this specific tenant
        const refreshResult = await query('SELECT emr.refresh_management_tenant_metrics($1::text, $2)', [tenant.id, tenant.schema_name]);
        console.log(`Refresh result for ${tenant.name}:`, refreshResult.rows[0]);
        
        // Check if triggers were created
        const triggerCheck = await query(`
          SELECT trigger_name, event_manipulation, event_object_table
          FROM information_schema.triggers
          WHERE trigger_schema = $1
        `, [tenant.schema_name]);
        
        console.log(`Triggers created in ${tenant.schema_name}:`);
        triggerCheck.rows.forEach(t => {
          console.log(`  - ${t.trigger_name}: ${t.event_manipulation} on ${t.event_object_table}`);
        });
        
      } catch (error) {
        console.error(`Error installing sync for ${tenant.name}:`, error.message);
      }
    }
    
    // After installing, run a full refresh
    console.log('\n=== Running Full Refresh ===');
    const fullRefresh = await query('SELECT emr.refresh_all_management_tenant_metrics()');
    console.log('Full refresh result:', fullRefresh.rows[0]);
    
    // Check the final cache state
    console.log('\n=== Checking Final Cache State ===');
    const cacheCheck = await query(`
      SELECT tenant_id, tenant_name, patients_count, doctors_count, available_beds, updated_at
      FROM emr.management_tenant_metrics 
      WHERE tenant_id IN (SELECT id FROM emr.management_tenants WHERE schema_name IN ('nhsl', 'smcmega'))
      ORDER BY updated_at DESC
    `);
    
    console.log('Final cache state:');
    cacheCheck.rows.forEach(c => {
      console.log(`- ${c.tenant_name}: ${c.patients_count} patients, ${c.doctors_count} doctors, ${c.available_beds} beds`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
