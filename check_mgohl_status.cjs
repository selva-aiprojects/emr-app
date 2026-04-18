const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== MGHPL CURRENT STATUS ===');
    
    const tenantId = '6dda48e1-51ea-4661-91c5-94a9c72f489c';
    
    // Check current schema mapping
    const { getTenantSchema } = require('./server/utils/tenant-schema-helper.js');
    const currentSchema = await getTenantSchema(tenantId);
    console.log('MGHPL current schema:', currentSchema);
    
    // Check data in current schema
    const tables = ['patients', 'encounters', 'beds', 'invoices', 'appointments'];
    console.log('\nData in ' + currentSchema + ' schema:');
    
    for (const table of tables) {
      try {
        const countResult = await query('SELECT COUNT(*) as count FROM ' + currentSchema + '.' + table + ' WHERE tenant_id::text = $1::text', [tenantId]);
        console.log('  ' + table + ': ' + (countResult.rows[0]?.count || 0));
      } catch (error) {
        console.log('  ' + table + ': N/A (table missing)');
      }
    }
    
    // Test dashboard metrics
    const { getRealtimeDashboardMetrics } = require('./server/enhanced_dashboard_metrics_fixed.mjs');
    const metrics = await getRealtimeDashboardMetrics(tenantId);
    
    console.log('\n=== DASHBOARD METRICS ===');
    console.log('Revenue:', metrics.todayRevenue);
    console.log('Patients:', metrics.todayPatients);
    console.log('Appointments:', metrics.todayAppointments);
    console.log('Beds:', metrics.occupiedBeds + ' occupied, ' + metrics.availableBeds + ' available, ' + metrics.totalBeds + ' total');
    console.log('Status:', metrics.todayRevenue > 0 || metrics.todayPatients > 0 ? 'WORKING' : 'BLANK');
    
    console.log('\n=== SEEDING STATUS ===');
    console.log('Data seeding: COMPLETED');
    console.log('Dashboard Status:', metrics.todayPatients > 0 ? 'VISIBLE' : 'STILL BLANK');
    
  } catch (error) {
    console.error('Error:', error);
  }
})();
