import { query } from './server/db/connection.js';

async function checkMissingMetrics() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== CHECKING MISSING DASHBOARD METRICS ===\n');
    
    // Check each metric that should be displayed
    const metrics = await Promise.all([
      // Revenue metrics
      query('SELECT COUNT(*) as count, COALESCE(SUM(paid), 0) as total FROM demo_emr.invoices WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.invoices WHERE tenant_id = $1 AND status = \'paid\'', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.invoices WHERE tenant_id = $1 AND status = \'pending\'', [tenantId]),
      
      // Patient metrics
      query('SELECT COUNT(*) as count FROM demo_emr.patients WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.patients WHERE tenant_id = $1', [tenantId]),
      
      // Appointment metrics
      query('SELECT COUNT(*) as count FROM demo_emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.appointments WHERE tenant_id = $1 AND status = \'completed\'', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.appointments WHERE tenant_id = $1 AND status = \'scheduled\'', [tenantId]),
      
      // Bed occupancy
      query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'occupied\' THEN 1 END) as occupied FROM demo_emr.beds WHERE tenant_id = $1', [tenantId]),
      
      // Laboratory metrics
      query('SELECT COUNT(*) as count FROM demo_emr.diagnostic_reports WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.diagnostic_reports WHERE tenant_id = $1 AND status = \'completed\'', [tenantId]),
      
      // Pharmacy metrics
      query('SELECT COUNT(*) as count FROM demo_emr.inventory_items WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.prescriptions WHERE tenant_id = $1', [tenantId]),
      
      // Employee metrics
      query('SELECT COUNT(*) as count FROM demo_emr.employees WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.attendance WHERE tenant_id = $1 AND DATE(date) = CURRENT_DATE', [tenantId]),
      
      // Financial metrics
      query('SELECT COALESCE(SUM(amount), 0) as total FROM demo_emr.expenses WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.expenses WHERE tenant_id = $1', [tenantId]),
      
      // Ambulance metrics
      query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'available\' THEN 1 END) as available FROM demo_emr.ambulances WHERE tenant_id = $1', [tenantId]),
      
      // Blood bank metrics
      query('SELECT COUNT(*) as count FROM demo_emr.blood_units WHERE tenant_id = $1 AND status = \'available\'', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.blood_requests WHERE tenant_id = $1 AND status = \'pending\'', [tenantId])
    ]);
    
    console.log('Dashboard Metrics Status:');
    console.log('=== REVENUE METRICS ===');
    console.log(` Total Revenue: $${metrics[0].rows[0].total.toLocaleString()}`);
    console.log(` Paid Invoices: ${metrics[1].rows[0].count}`);
    console.log(` Pending Invoices: ${metrics[2].rows[0].count}`);
    
    console.log('\n=== PATIENT METRICS ===');
    console.log(` New Patients Today: ${metrics[3].rows[0].count}`);
    console.log(` Total Patients: ${metrics[4].rows[0].count}`);
    
    console.log('\n=== APPOINTMENT METRICS ===');
    console.log(` Appointments Today: ${metrics[5].rows[0].count}`);
    console.log(` Completed Appointments: ${metrics[6].rows[0].count}`);
    console.log(` Scheduled Appointments: ${metrics[7].rows[0].count}`);
    
    console.log('\n=== BED OCCUPANCY ===');
    const beds = metrics[8].rows[0];
    console.log(` Total Beds: ${beds.total}`);
    console.log(` Occupied Beds: ${beds.occupied}`);
    console.log(` Occupancy Rate: ${beds.total > 0 ? ((beds.occupied / beds.total) * 100).toFixed(1) : 0}%`);
    
    console.log('\n=== LABORATORY METRICS ===');
    console.log(` Total Lab Reports: ${metrics[9].rows[0].count}`);
    console.log(` Completed Reports: ${metrics[10].rows[0].count}`);
    
    console.log('\n=== PHARMACY METRICS ===');
    console.log(` Inventory Items: ${metrics[11].rows[0].count}`);
    console.log(` Prescriptions: ${metrics[12].rows[0].count}`);
    
    console.log('\n=== EMPLOYEE METRICS ===');
    console.log(` Total Employees: ${metrics[13].rows[0].count}`);
    console.log(` Today\'s Attendance: ${metrics[14].rows[0].count}`);
    
    console.log('\n=== FINANCIAL METRICS ===');
    console.log(` Total Expenses: $${metrics[15].rows[0].total.toLocaleString()}`);
    console.log(` Expense Records: ${metrics[16].rows[0].count}`);
    
    console.log('\n=== AMBULANCE METRICS ===');
    const ambulances = metrics[17].rows[0];
    console.log(` Total Ambulances: ${ambulances.total}`);
    console.log(` Available: ${ambulances.available}`);
    
    console.log('\n=== BLOOD BANK METRICS ===');
    console.log(` Available Blood Units: ${metrics[18].rows[0].count}`);
    console.log(` Pending Blood Requests: ${metrics[19].rows[0].count}`);
    
    // Check for missing data
    console.log('\n=== MISSING DATA ANALYSIS ===');
    const issues = [];
    
    if (metrics[0].rows[0].total == 0) issues.push('Revenue data missing');
    if (metrics[3].rows[0].count == 0) issues.push('Today\'s new patients missing');
    if (metrics[5].rows[0].count == 0) issues.push('Today\'s appointments missing');
    if (metrics[8].rows[0].total == 0) issues.push('Bed data missing');
    if (metrics[9].rows[0].count == 0) issues.push('Lab reports missing');
    if (metrics[11].rows[0].count == 0) issues.push('Pharmacy inventory missing');
    if (metrics[14].rows[0].count == 0) issues.push('Today\'s attendance missing');
    if (metrics[15].rows[0].total == 0) issues.push('Expense data missing');
    if (metrics[17].rows[0].total == 0) issues.push('Ambulance data missing');
    if (metrics[18].rows[0].count == 0) issues.push('Blood bank data missing');
    
    if (issues.length > 0) {
      console.log('Missing data detected:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('All critical metrics have data!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkMissingMetrics();
