const { query } = require('./server/db/connection.js');

async function testDashboardMetrics() {
  console.log('🔍 Testing dashboard metrics...');
  
  try {
    // Test basic query
    const testResult = await query(`
      SELECT COUNT(*) as count
      FROM emr.patients 
      WHERE tenant_id = $1
    `, ['f998a8f5-95b9-4fd7-a583-63cf574d65ed']);
    
    console.log('📊 Test query result:', testResult.rows[0]?.count || 0);
    
    // Test the enhanced dashboard metrics function
    const { getRealtimeDashboardMetrics } = require('./server/enhanced_dashboard_metrics_fixed.mjs');
    const metrics = await getRealtimeDashboardMetrics('f998a8f5-95b9-4fd7-a583-63cf574d65ed');
    
    console.log('📊 Enhanced dashboard metrics result:');
    console.log('  todayAppointments:', metrics.todayAppointments);
    console.log('  todayRevenue:', metrics.todayRevenue);
    console.log('  todayPatients:', metrics.todayPatients);
    console.log('  todayAdmissions:', metrics.todayAdmissions);
    console.log('  todayDischarges:', metrics.todayDischarges);
    console.log('  occupiedBeds:', metrics.occupiedBeds);
    console.log('  availableBeds:', metrics.availableBeds);
    console.log('  totalBeds:', metrics.totalBeds);
    console.log('  criticalLabResults:', metrics.criticalLabResults);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing dashboard metrics:', error);
    process.exit(1);
  }
}

testDashboardMetrics();
