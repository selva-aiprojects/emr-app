const { getRealtimeDashboardMetrics } = require('./server/enhanced_dashboard_metrics_fixed.mjs');

(async () => {
  try {
    console.log('=== Testing Dashboard Metrics Directly ===');
    
    const tenantId = 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa'; // Starlight tenant ID
    const metrics = await getRealtimeDashboardMetrics(tenantId);
    
    console.log('\n📊 Dashboard Metrics Results:');
    console.log('💰 Total Income:', metrics.todayRevenue);
    console.log('📅 Check up Bookings:', metrics.todayAppointments);
    console.log('👥 Total Registered Patients:', metrics.todayPatients);
    console.log('🚨 System Alerts:', metrics.criticalAlerts);
    console.log('🩸 Blood Bank Stock:', metrics.bloodBank.value);
    console.log('🔬 Lab Progress:', metrics.labProgress.value);
    console.log('🚑 Fleet Available:', metrics.fleetStatus.available);
    console.log('🛏️ Occupied Beds:', metrics.occupiedBeds);
    console.log('🛏️ Available Beds:', metrics.availableBeds);
    console.log('🛏️ Total Beds:', metrics.totalBeds);
    
    if (metrics.todayPatients > 0 || metrics.todayRevenue > 0) {
      console.log('\n✅ SUCCESS: Dashboard metrics are working!');
      console.log('The data is there - the issue is likely in the API authentication layer.');
    } else {
      console.log('\n❌ ISSUE: Dashboard metrics still showing zeros');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
