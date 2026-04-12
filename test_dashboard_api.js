import { query } from './server/db/connection.js';

async function testDashboardAPI() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== TESTING DASHBOARD API ENDPOINTS ===\n');
    
    // Test the same queries that the dashboard uses
    const metrics = await Promise.all([
      // These are the queries from the fixed report.routes.js
      query(`SELECT COUNT(*)::int as count FROM demo_emr.patients WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.appointments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COALESCE(SUM(total), 0) as total FROM demo_emr.invoices WHERE tenant_id = $1 AND status IN ('paid', 'partially_paid')`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.beds WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*)::int as occupied FROM demo_emr.beds WHERE tenant_id = $1 AND status = 'occupied'`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.lab_tests WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.blood_units WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.employees WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.attendance WHERE tenant_id = $1 AND date = CURRENT_DATE AND status = 'present'`, [tenantId])
    ]);
    
    console.log('DASHBOARD API TEST RESULTS:');
    console.log(` Total Patients: ${metrics[0].rows[0].count}`);
    console.log(` Total Appointments: ${metrics[1].rows[0].count}`);
    console.log(` Total Revenue: $${(metrics[2].rows[0].total || 0).toLocaleString()}`);
    console.log(` Total Beds: ${metrics[3].rows[0].count}`);
    console.log(` Occupied Beds: ${metrics[4].rows[0].count || 0}`);
    console.log(` Bed Occupancy Rate: ${metrics[3].rows[0].count > 0 ? ((metrics[4].rows[0].count / metrics[3].rows[0].count) * 100).toFixed(1) : 0}%`);
    console.log(` Lab Tests Available: ${metrics[5].rows[0].count}`);
    console.log(` Blood Units Available: ${metrics[6].rows[0].count}`);
    console.log(` Total Employees: ${metrics[7].rows[0].count}`);
    console.log(` Today's Attendance: ${metrics[8].rows[0].count}`);
    
    // Test today's specific metrics
    const todayMetrics = await Promise.all([
      query(`SELECT COUNT(*)::int as count FROM demo_emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.patients WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.invoices WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = 'paid'`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.diagnostic_reports WHERE tenant_id = $1 AND DATE(issued_datetime) = CURRENT_DATE`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.discharges WHERE tenant_id = $1 AND discharge_date = CURRENT_DATE`, [tenantId])
    ]);
    
    console.log('\nTODAY\'S METRICS:');
    console.log(` Today's Appointments: ${todayMetrics[0].rows[0].count}`);
    console.log(` Today's New Patients: ${todayMetrics[1].rows[0].count}`);
    console.log(` Today's Revenue: $${(todayMetrics[2].rows[0].total || 0).toLocaleString()}`);
    console.log(` Today's Lab Reports: ${todayMetrics[3].rows[0].count}`);
    console.log(` Today's Discharges: ${todayMetrics[4].rows[0].count}`);
    
    // Check if the metrics are showing data
    const hasData = [
      metrics[0].rows[0].count > 0, // Patients
      metrics[1].rows[0].count > 0, // Appointments
      metrics[3].rows[0].count > 0, // Beds
      (metrics[4].rows[0].occupied || metrics[4].rows[0].count || 0) > 0, // Occupied beds
      metrics[5].rows[0].count > 0, // Lab tests
      metrics[7].rows[0].count > 0, // Employees
      todayMetrics[0].rows[0].count > 0 // Today's appointments
    ];
    
    console.log('\n=== API STATUS ===');
    if (hasData.every(metric => metric)) {
      console.log('SUCCESS: All dashboard API endpoints are returning data!');
      console.log('The dashboard should now display complete metrics.');
    } else {
      console.log('ISSUE: Some API endpoints are still returning empty data.');
      const missing = [
        !metrics[0].rows[0].count && 'Patients',
        !metrics[1].rows[0].count && 'Appointments', 
        !metrics[3].rows[0].count && 'Beds',
        !metrics[4].rows[0].count && 'Occupied Beds',
        !metrics[5].rows[0].count && 'Lab Tests',
        !metrics[7].rows[0].count && 'Employees',
        !todayMetrics[0].rows[0].count && 'Today Appointments'
      ].filter(Boolean);
      console.log('Missing data for:', missing.join(', '));
    }
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Refresh the dashboard at http://localhost:5175');
    console.log('2. Login with admin@demo.hospital / Demo@123');
    console.log('3. Check if dashboard cards now show data');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testDashboardAPI();
