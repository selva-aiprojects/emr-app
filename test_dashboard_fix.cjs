const { getRealtimeDashboardMetrics } = require('./server/enhanced_dashboard_metrics_fixed.mjs');

(async () => {
  try {
    console.log('=== Testing Starlight Dashboard Fix ===');
    
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
      console.log('\n✅ SUCCESS: Dashboard is now showing data!');
    } else {
      console.log('\n❌ ISSUE: Dashboard still showing zeros');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
