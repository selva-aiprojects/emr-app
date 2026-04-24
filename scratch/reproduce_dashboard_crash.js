const { getRealtimeDashboardMetrics } = require('../server/enhanced_dashboard_metrics_fixed.mjs');

async function reproduce() {
  const tenantId = '6dda48e1-51ea-4661-91c5-94a9c72f489c'; // MGHPL
  try {
    console.log('Testing metrics for MGHPL...');
    const metrics = await getRealtimeDashboardMetrics(tenantId);
    console.log('Metrics retrieved:', metrics);
    process.exit(0);
  } catch (err) {
    console.error('CRASH DETECTED:', err);
    process.exit(1);
  }
}

reproduce();
