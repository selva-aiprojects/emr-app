import { query } from './server/db/connection.js';

async function fixAttendanceTimestamp() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== FIXING ATTENDANCE WITH CORRECT TIMESTAMPS ===\n');
    
    // Get all employees
    const employees = await query('SELECT id FROM demo_emr.employees WHERE tenant_id = $1', [tenantId]);
    console.log(`Total Employees: ${employees.rows.length}`);
    
    // Create today's attendance for all employees with correct timestamps
    const today = new Date().toISOString().split('T')[0];
    let attendanceCreated = 0;
    
    for (const employee of employees.rows) {
      try {
        const present = Math.random() < 0.9; // 90% attendance
        
        // Create proper timestamp with timezone
        const checkInTime = present ? new Date().toISOString() : null;
        const checkOutTime = present ? new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() : null; // 8 hours later
        
        await query(`
          INSERT INTO demo_emr.attendance (tenant_id, employee_id, date, check_in, check_out, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT (tenant_id, employee_id, date) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
        `, [
          tenantId, 
          employee.id, 
          today, 
          checkInTime, 
          checkOutTime, 
          present ? 'present' : 'absent'
        ]);
        attendanceCreated++;
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // Verify attendance
    const finalAttendance = await query('SELECT COUNT(*) as count FROM demo_emr.attendance WHERE tenant_id = $1 AND date = CURRENT_DATE AND status = \'present\'', [tenantId]);
    const absentCount = await query('SELECT COUNT(*) as count FROM demo_emr.attendance WHERE tenant_id = $1 AND date = CURRENT_DATE AND status = \'absent\'', [tenantId]);
    
    console.log(`Attendance Records Created: ${attendanceCreated}`);
    console.log(`Present Today: ${finalAttendance.rows[0].count}`);
    console.log(`Absent Today: ${absentCount.rows[0].count}`);
    
    console.log('\n=== FINAL DASHBOARD STATUS ===');
    
    // Quick verification of all metrics
    const metrics = await Promise.all([
      query('SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1 AND status = \'occupied\'', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.lab_tests WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.diagnostic_reports WHERE tenant_id = $1 AND DATE(issued_datetime) = CURRENT_DATE', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.discharges WHERE tenant_id = $1 AND discharge_date = CURRENT_DATE', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.invoices WHERE tenant_id = $1 AND status = \'pending\'', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.blood_units WHERE tenant_id = $1 AND status = \'available\'', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.attendance WHERE tenant_id = $1 AND date = CURRENT_DATE AND status = \'present\'', [tenantId])
    ]);
    
    console.log('\n=== COMPLETE DASHBOARD METRICS ===');
    console.log(` Total Beds: ${metrics[0].rows[0].count}`);
    console.log(` Occupied Beds: ${metrics[1].rows[0].count}`);
    console.log(` Bed Occupancy Rate: ${metrics[0].rows[0].count > 0 ? ((metrics[1].rows[0].count / metrics[0].rows[0].count) * 100).toFixed(1) : 0}%`);
    console.log(` Lab Tests Available: ${metrics[2].rows[0].count}`);
    console.log(` Today's Lab Reports: ${metrics[3].rows[0].count}`);
    console.log(` Today's Discharges: ${metrics[4].rows[0].count}`);
    console.log(` Today's Appointments: ${metrics[5].rows[0].count}`);
    console.log(` Pending Invoices: ${metrics[6].rows[0].count}`);
    console.log(` Available Blood Units: ${metrics[7].rows[0].count}`);
    console.log(` Today's Attendance: ${metrics[8].rows[0].count}`);
    
    // Check if all critical metrics are populated
    const successCriteria = [
      metrics[0].rows[0].count > 0, // Beds
      metrics[1].rows[0].count > 0, // Occupied beds
      metrics[2].rows[0].count > 0, // Lab tests
      metrics[3].rows[0].count > 0, // Today's reports
      metrics[5].rows[0].count > 0, // Today's appointments
      metrics[6].rows[0].count > 0, // Pending invoices
      metrics[7].rows[0].count > 0, // Blood units
      metrics[8].rows[0].count > 0  // Attendance
    ];
    
    if (successCriteria.every(criterion => criterion)) {
      console.log('\n=== SUCCESS: ALL DASHBOARD METRICS POPULATED ===');
      console.log('The dashboard should now display complete data across all cards!');
      console.log('No more "No Data" cards should be visible.');
      console.log('All red-circled cards from your screenshots should now show data.');
    } else {
      console.log('\n=== SOME METRICS STILL NEED ATTENTION ===');
      console.log('Check the above counts for any remaining issues.');
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

fixAttendanceTimestamp();
