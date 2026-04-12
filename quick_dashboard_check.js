import { query } from './server/db/connection.js';

async function quickDashboardCheck() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== QUICK DASHBOARD METRICS CHECK ===\n');
    
    // Check critical dashboard metrics
    const metrics = await Promise.all([
      // Bed Occupancy (CRITICAL - was 0%)
      query('SELECT COUNT(*) as total FROM demo_emr.beds WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as occupied FROM demo_emr.beds WHERE tenant_id = $1 AND status = \'occupied\'', [tenantId]),
      
      // Today's Appointments
      query('SELECT COUNT(*) as count FROM demo_emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE', [tenantId]),
      
      // Revenue Metrics
      query('SELECT COALESCE(SUM(total), 0) as total FROM demo_emr.invoices WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as pending FROM demo_emr.invoices WHERE tenant_id = $1 AND status = \'pending\'', [tenantId]),
      
      // Patient Metrics
      query('SELECT COUNT(*) as count FROM demo_emr.patients WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE', [tenantId]),
      
      // Lab Tests
      query('SELECT COUNT(*) as count FROM demo_emr.lab_tests WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as reports FROM demo_emr.diagnostic_reports WHERE tenant_id = $1 AND DATE(issued_datetime) = CURRENT_DATE', [tenantId]),
      
      // Pharmacy
      query('SELECT COUNT(*) as items FROM demo_emr.inventory_items WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as low_stock FROM demo_emr.inventory_items WHERE tenant_id = $1 AND current_stock <= reorder_level', [tenantId]),
      
      // Employee Attendance
      query('SELECT COUNT(*) as present FROM demo_emr.attendance WHERE tenant_id = $1 AND date = CURRENT_DATE AND status = \'present\'', [tenantId]),
      
      // Expenses
      query('SELECT COALESCE(SUM(amount), 0) as total FROM demo_emr.expenses WHERE tenant_id = $1 AND date >= CURRENT_DATE - INTERVAL \'30 days\'', [tenantId]),
      
      // Ambulances
      query('SELECT COUNT(*) as total FROM demo_emr.ambulances WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as available FROM demo_emr.ambulances WHERE tenant_id = $1 AND status = \'available\'', [tenantId]),
      
      // Blood Bank
      query('SELECT COUNT(*) as units FROM demo_emr.blood_units WHERE tenant_id = $1 AND status = \'available\'', [tenantId]),
      
      // Discharges Today
      query('SELECT COUNT(*) as count FROM demo_emr.discharges WHERE tenant_id = $1 AND discharge_date = CURRENT_DATE', [tenantId])
    ]);
    
    console.log('DASHBOARD METRICS STATUS:');
    console.log('=== BED OCCUPANCY ===');
    const totalBeds = metrics[0].rows[0].total;
    const occupiedBeds = metrics[1].rows[0].occupied;
    console.log(` Total Beds: ${totalBeds}`);
    console.log(` Occupied Beds: ${occupiedBeds}`);
    console.log(` Occupancy Rate: ${totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0}%`);
    
    console.log('\n=== TODAY\'S ACTIVITY ===');
    console.log(` Appointments Today: ${metrics[2].rows[0].count}`);
    console.log(` New Patients Today: ${metrics[5].rows[0].count}`);
    console.log(` Lab Reports Today: ${metrics[7].rows[0].reports}`);
    console.log(` Discharges Today: ${metrics[14].rows[0].count}`);
    
    console.log('\n=== REVENUE & BILLING ===');
    console.log(` Total Revenue: $${metrics[3].rows[0].total.toLocaleString()}`);
    console.log(` Pending Invoices: ${metrics[4].rows[0].pending}`);
    console.log(` Recent Expenses (30 days): $${metrics[10].rows[0].total.toLocaleString()}`);
    
    console.log('\n=== LABORATORY ===');
    console.log(` Lab Tests Available: ${metrics[6].rows[0].count}`);
    console.log(` Reports Issued Today: ${metrics[7].rows[0].reports}`);
    
    console.log('\n=== PHARMACY ===');
    console.log(` Inventory Items: ${metrics[8].rows[0].items}`);
    console.log(` Low Stock Items: ${metrics[9].rows[0].low_stock}`);
    
    console.log('\n=== EMPLOYEES ===');
    console.log(` Present Today: ${metrics[10].rows[0].present}`);
    
    console.log('\n=== FLEET ===');
    console.log(` Total Ambulances: ${metrics[11].rows[0].total}`);
    console.log(` Available: ${metrics[12].rows[0].available}`);
    
    console.log('\n=== BLOOD BANK ===');
    console.log(` Available Blood Units: ${metrics[13].rows[0].units}`);
    
    // Identify critical issues
    console.log('\n=== CRITICAL ISSUES IDENTIFIED ===');
    const issues = [];
    
    if (totalBeds === 0) issues.push('BEDS: No beds created - Bed Occupancy will show 0%');
    if (metrics[2].rows[0].count < 5) issues.push('APPOINTMENTS: Less than 5 appointments today');
    if (metrics[6].rows[0].count === 0) issues.push('LAB TESTS: No lab tests configured');
    if (metrics[10].rows[0].present === 0) issues.push('ATTENDANCE: No employee attendance marked today');
    if (metrics[13].rows[0].units === 0) issues.push('BLOOD BANK: No blood units available');
    
    if (issues.length > 0) {
      console.log('Missing data causing dashboard issues:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('All critical metrics appear to have data!');
    }
    
    // Quick fix suggestions
    console.log('\n=== QUICK FIXES NEEDED ===');
    if (totalBeds === 0) {
      console.log('Run: node final_completion_script.js (fixes beds and other missing data)');
    }
    if (metrics[6].rows[0].count === 0) {
      console.log('Lab tests need to be populated');
    }
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('URL: http://localhost:5175');
    console.log('Email: admin@demo.hospital');
    console.log('Password: Demo@123');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

quickDashboardCheck();
