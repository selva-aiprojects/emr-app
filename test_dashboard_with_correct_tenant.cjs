const { query } = require('./server/db/connection.js');

async function testDashboardMetrics() {
  console.log('Testing dashboard metrics with correct tenant...');
  
  try {
    // Test with the correct Magnum tenant ID
    const tenantId = '6dda48e1-51ea-4661-91c5-94a9c72f489c';
    
    // Test basic query to verify data exists
    const testResult = await query(`
      SELECT COUNT(*) as count
      FROM mgohl.patients 
      WHERE tenant_id::text = $1::text
    `, [tenantId]);
    
    console.log('Patients in mgohl schema:', testResult.rows[0]?.count || 0);
    
    // Test the enhanced dashboard metrics function
    const { getRealtimeDashboardMetrics } = require('./server/enhanced_dashboard_metrics_fixed.mjs');
    const metrics = await getRealtimeDashboardMetrics(tenantId);
    
    console.log('\nEnhanced dashboard metrics result:');
    console.log('  todayAppointments:', metrics.todayAppointments);
    console.log('  todayRevenue:', metrics.todayRevenue);
    console.log('  todayPatients:', metrics.todayPatients);
    console.log('  todayAdmissions:', metrics.todayAdmissions);
    console.log('  todayDischarges:', metrics.todayDischarges);
    console.log('  occupiedBeds:', metrics.occupiedBeds);
    console.log('  availableBeds:', metrics.availableBeds);
    console.log('  totalBeds:', metrics.totalBeds);
    console.log('  criticalLabResults:', metrics.criticalLabResults);
    console.log('  bloodBank:', metrics.bloodBank);
    console.log('  labProgress:', metrics.labProgress);
    console.log('  fleetStatus:', metrics.fleetStatus);
    console.log('  criticalAlerts:', metrics.criticalAlerts);
    console.log('  growth:', metrics.growth);
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error testing dashboard metrics:', error);
    process.exit(1);
  }
}

testDashboardMetrics();
