import { query } from './server/db/connection.js';

async function testReportsAPI() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== TESTING REPORTS API ENDPOINTS ===\n');
    
    // Test the same queries that the report summary API uses
    const reportData = await Promise.all([
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
    
    // Test today's specific metrics
    const todayMetrics = await Promise.all([
      query(`SELECT COUNT(*)::int as count FROM demo_emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.patients WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE`, [tenantId]),
      query(`SELECT COALESCE(SUM(total), 0) as total FROM demo_emr.invoices WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = 'paid'`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.diagnostic_reports WHERE tenant_id = $1 AND DATE(issued_datetime) = CURRENT_DATE`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.discharges WHERE tenant_id = $1 AND discharge_date = CURRENT_DATE`, [tenantId])
    ]);
    
    // Test monthly revenue data
    const monthlyRevenue = await query(`
      SELECT TO_CHAR(gs, 'Mon') as label, COALESCE(SUM(i.total), 0) as value
      FROM generate_series(date_trunc('month', CURRENT_DATE) - INTERVAL '5 months', date_trunc('month', CURRENT_DATE), INTERVAL '1 month') gs
      LEFT JOIN demo_emr.invoices i ON date_trunc('month', i.created_at) = gs AND i.tenant_id = $1 AND i.status IN ('paid', 'partially_paid')
      GROUP BY gs ORDER BY gs
    `, [tenantId]);
    
    // Test doctor payouts data
    const doctorPayouts = await query(`
      SELECT
        u.id as doctor_id,
        u.name as doctor_name,
        u.role,
        COUNT(a.id)::int as patient_count,
        COALESCE(SUM(i.total), 0) as total_revenue,
        COALESCE(SUM(i.total) * 0.3, 0) as estimated_commission
      FROM emr.users u
      LEFT JOIN demo_emr.appointments a ON a.provider_id = u.id AND a.tenant_id = u.tenant_id
      LEFT JOIN demo_emr.invoices i ON i.patient_id = a.patient_id AND i.tenant_id = u.tenant_id AND i.status IN ('paid', 'partially_paid')
      WHERE u.tenant_id = $1 AND lower(u.role) = 'doctor'
      GROUP BY u.id, u.name, u.role
      ORDER BY total_revenue DESC
      LIMIT 10
    `, [tenantId]);
    
    console.log('REPORTS API TEST RESULTS:');
    console.log('\nCore Metrics:');
    console.log(` Total Patients: ${reportData[0].rows[0].count}`);
    console.log(` Total Appointments: ${reportData[1].rows[0].count}`);
    console.log(` Total Revenue: $${(reportData[2].rows[0].total || 0).toLocaleString()}`);
    console.log(` Total Beds: ${reportData[3].rows[0].count}`);
    console.log(` Occupied Beds: ${reportData[4].rows[0].occupied || 0}`);
    console.log(` Bed Occupancy Rate: ${reportData[3].rows[0].count > 0 ? (((reportData[4].rows[0].occupied || 0) / reportData[3].rows[0].count) * 100).toFixed(1) : 0}%`);
    console.log(` Lab Tests Available: ${reportData[5].rows[0].count}`);
    console.log(` Blood Units Available: ${reportData[6].rows[0].count}`);
    console.log(` Total Employees: ${reportData[7].rows[0].count}`);
    console.log(` Today's Attendance: ${reportData[8].rows[0].count}`);
    
    console.log('\nToday\'s Metrics:');
    console.log(` Today's Appointments: ${todayMetrics[0].rows[0].count}`);
    console.log(` Today's New Patients: ${todayMetrics[1].rows[0].count}`);
    console.log(` Today's Revenue: $${(todayMetrics[2].rows[0].total || 0).toLocaleString()}`);
    console.log(` Today's Lab Reports: ${todayMetrics[3].rows[0].count}`);
    console.log(` Today's Discharges: ${todayMetrics[4].rows[0].count}`);
    
    console.log('\nMonthly Revenue Data:');
    monthlyRevenue.rows.forEach(row => {
      console.log(` ${row.label}: $${(row.value || 0).toLocaleString()}`);
    });
    
    console.log('\nDoctor Payouts Data:');
    if (doctorPayouts.rows.length > 0) {
      doctorPayouts.rows.forEach((doctor, index) => {
        console.log(` ${index + 1}. Dr. ${doctor.doctor_name} - ${doctor.patient_count} patients, $${(doctor.total_revenue || 0).toLocaleString()} revenue`);
      });
    } else {
      console.log(' No doctor data found');
      // Create some doctor data
      console.log('\nCreating doctor data...');
      await createDoctorData(tenantId);
      
      // Test again
      const newPayouts = await query(`
        SELECT
          u.id as doctor_id,
          u.name as doctor_name,
          u.role,
          COUNT(a.id)::int as patient_count,
          COALESCE(SUM(i.total), 0) as total_revenue,
          COALESCE(SUM(i.total) * 0.3, 0) as estimated_commission
        FROM emr.users u
        LEFT JOIN demo_emr.appointments a ON a.provider_id = u.id AND a.tenant_id = u.tenant_id
        LEFT JOIN demo_emr.invoices i ON i.patient_id = a.patient_id AND i.tenant_id = u.tenant_id AND i.status IN ('paid', 'partially_paid')
        WHERE u.tenant_id = $1 AND lower(u.role) = 'doctor'
        GROUP BY u.id, u.name, u.role
        ORDER BY total_revenue DESC
        LIMIT 10
      `, [tenantId]);
      
      console.log('\nAfter creating data:');
      newPayouts.rows.forEach((doctor, index) => {
        console.log(` ${index + 1}. Dr. ${doctor.doctor_name} - ${doctor.patient_count} patients, $${(doctor.total_revenue || 0).toLocaleString()} revenue`);
      });
    }
    
    console.log('\n=== API STATUS ===');
    const hasData = [
      reportData[0].rows[0].count > 0, // Patients
      reportData[1].rows[0].count > 0, // Appointments
      reportData[3].rows[0].count > 0, // Beds
      reportData[5].rows[0].count > 0, // Lab tests
      reportData[7].rows[0].count > 0, // Employees
      todayMetrics[0].rows[0].count > 0, // Today's appointments
      monthlyRevenue.rows.length > 0 // Monthly revenue data
    ];
    
    if (hasData.every(metric => metric)) {
      console.log('SUCCESS: All Reports API endpoints are returning data!');
      console.log('The Reports & Analysis page should now display complete metrics.');
    } else {
      console.log('ISSUE: Some Reports API endpoints are still returning empty data.');
      const missing = [
        !reportData[0].rows[0].count && 'Patients',
        !reportData[1].rows[0].count && 'Appointments', 
        !reportData[3].rows[0].count && 'Beds',
        !reportData[5].rows[0].count && 'Lab Tests',
        !reportData[7].rows[0].count && 'Employees',
        !todayMetrics[0].rows[0].count && 'Today Appointments',
        !monthlyRevenue.rows.length && 'Monthly Revenue'
      ].filter(Boolean);
      console.log('Missing data for:', missing.join(', '));
    }
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Refresh the Reports & Analysis page');
    console.log('2. Check if the page now displays data');
    console.log('3. If still blank, check browser console for API errors');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

async function createDoctorData(tenantId) {
  console.log('Creating doctor data for Reports page...');
  
  // Create some doctor users if they don't exist
  const doctors = [
    { name: 'Rajesh Kumar', role: 'doctor' },
    { name: 'Priya Sharma', role: 'doctor' },
    { name: 'Amit Patel', role: 'doctor' }
  ];
  
  for (const doctor of doctors) {
    try {
      await query(`
        INSERT INTO emr.users (tenant_id, name, role, email, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        ON CONFLICT (tenant_id, email) DO NOTHING
      `, [tenantId, doctor.name, doctor.role, `${doctor.name.toLowerCase().replace(' ', '.')}@demo.hospital`]);
    } catch (error) {
      // Ignore duplicates
    }
  }
  
  // Create appointments for doctors
  const patients = await query('SELECT id FROM demo_emr.patients WHERE tenant_id = $1 LIMIT 20', [tenantId]);
  const doctorUsers = await query('SELECT id FROM emr.users WHERE tenant_id = $1 AND role = \'doctor\'', [tenantId]);
  
  if (doctorUsers.rows.length > 0 && patients.rows.length > 0) {
    for (let i = 0; i < 10; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.appointments 
          (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, created_at, updated_at)
          VALUES ($1, $2, $3, NOW() + INTERVAL '${i} days', NOW() + INTERVAL '${i} days' + INTERVAL '1 hour', 'completed', NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          patients.rows[i % patients.rows.length].id,
          doctorUsers.rows[i % doctorUsers.rows.length].id
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
  }
}

testReportsAPI();
