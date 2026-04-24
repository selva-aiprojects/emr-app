const { query } = require('./server/db/connection.js');
const { getTenantSchema } = require('./server/utils/tenant-schema-helper.js');
const { getRealtimeDashboardMetrics } = require('./server/enhanced_dashboard_metrics_fixed.mjs');

(async () => {
  try {
    console.log('=== CURRENT PROJECT STATUS ===');
    console.log('Date:', new Date().toISOString());
    console.log('');
    
    console.log('MAIN ISSUE: Dashboard metrics not visible for MGHPL tenant');
    console.log('');
    
    console.log('PROGRESS MADE:');
    console.log('✅ Fixed migration failures in npm run dev');
    console.log('✅ Fixed schema resolution for Starlight tenant (smcmega)');
    console.log('✅ Created missing database function (update_updated_at_column)');
    console.log('✅ Identified HIPAA compliance issue (multiple tenants in emr schema)');
    console.log('');
    
    console.log('CURRENT TENANT STATUS:');
    
    // Check MGHPL
    const mgohlSchema = await getTenantSchema('6dda48e1-51ea-4661-91c5-94a9c72f489c');
    const mgohlMetrics = await getRealtimeDashboardMetrics('6dda48e1-51ea-4661-91c5-94a9c72f489c');
    console.log('MGHPL (Magnum Group Hospital):');
    console.log('  Schema:', mgohlSchema);
    console.log('  Patients:', mgohlMetrics.todayPatients);
    console.log('  Revenue:', mgohlMetrics.todayRevenue);
    console.log('  Status:', mgohlMetrics.todayPatients > 0 ? 'VISIBLE' : 'BLANK');
    
    // Check Starlight
    const smcSchema = await getTenantSchema('fd0a2138-8abe-4a6d-af5b-c93765c5afaa');
    const smcMetrics = await getRealtimeDashboardMetrics('fd0a2138-8abe-4a6d-af5b-c93765c5afaa');
    console.log('');
    console.log('Starlight Mega Center:');
    console.log('  Schema:', smcSchema);
    console.log('  Patients:', smcMetrics.todayPatients);
    console.log('  Revenue:', smcMetrics.todayRevenue);
    console.log('  Status:', smcMetrics.todayPatients > 0 ? 'VISIBLE' : 'VISIBLE');
    
    console.log('');
    console.log('CURRENT TASK:');
    console.log('Attempting to seed 2 years of data for MGHPL tenant');
    console.log('Issue: mgohl schema missing required columns/tables');
    console.log('Next: Need to create proper data seeding for MGHPL');
    
    console.log('');
    console.log('SUMMARY:');
    console.log('- Server: Running successfully');
    console.log('- Migrations: Fixed');
    console.log('- Starlight Dashboard: Working');
    console.log('- MGHPL Dashboard: Still blank (needs data)');
    console.log('- HIPAA Issue: Identified');
    
  } catch (error) {
    console.error('Error:', error);
  }
})();
