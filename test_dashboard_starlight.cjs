const { query } = require('./server/db/connection.js');

async function testDashboardMetrics() {
  console.log('Testing dashboard metrics with Starlight Mega Center...');
  
  try {
    // Test with the Starlight Mega Center tenant ID
    const tenantId = 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa';
    
    // Test basic query to verify data exists
    const testResult = await query(`
      SELECT COUNT(*) as count
      FROM smcmega.patients 
      WHERE tenant_id::text = $1::text
    `, [tenantId]);
    
    console.log('Patients in smcmega schema:', testResult.rows[0]?.count || 0);
    
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
