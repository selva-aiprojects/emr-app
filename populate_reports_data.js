import { query } from './server/db/connection.js';

async function populateReportsData() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== POPULATING COMPREHENSIVE REPORTS DATA ===\n');
    
    // Create more monthly revenue data
    console.log('Creating monthly revenue data...');
    const months = [
      { month: '2024-11-01', amount: 15000 },
      { month: '2024-12-01', amount: 22000 },
      { month: '2025-01-01', amount: 18660.70 },
      { month: '2025-02-01', amount: 25000 },
      { month: '2025-03-01', amount: 31000 },
      { month: '2025-04-01', amount: 28000 }
    ];
    
    for (const monthData of months) {
      try {
        await query(`
          INSERT INTO demo_emr.invoices 
          (tenant_id, patient_id, invoice_number, total, status, created_at, updated_at)
          SELECT $1, id, 'INV-' || EXTRACT(MONTH FROM $2)::text || '-' || EXTRACT(DAY FROM $2)::text || '-' || floor(random() * 1000)::text, $3, 'paid', $2, NOW()
          FROM demo_emr.patients 
          WHERE tenant_id = $1 
          LIMIT 5
          ON CONFLICT DO NOTHING
        `, [tenantId, monthData.month, monthData.amount / 5]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // Create doctor appointments and revenue
    console.log('Creating doctor appointments and revenue...');
    const patients = await query('SELECT id FROM demo_emr.patients WHERE tenant_id = $1 LIMIT 50', [tenantId]);
    const doctorUsers = await query('SELECT id, name FROM emr.users WHERE tenant_id = $1 AND role = \'doctor\'', [tenantId]);
    
    if (doctorUsers.rows.length === 0) {
      console.log('Creating doctor users...');
      const doctors = [
        { name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@demo.hospital' },
        { name: 'Dr. Priya Sharma', email: 'priya.sharma@demo.hospital' },
        { name: 'Dr. Amit Patel', email: 'amit.patel@demo.hospital' },
        { name: 'Dr. Sarah Johnson', email: 'sarah.johnson@demo.hospital' },
        { name: 'Dr. Michael Chen', email: 'michael.chen@demo.hospital' }
      ];
      
      for (const doctor of doctors) {
        try {
          await query(`
            INSERT INTO emr.users (tenant_id, name, role, email, is_active, created_at, updated_at)
            VALUES ($1, $2, 'doctor', $3, true, NOW(), NOW())
            ON CONFLICT (tenant_id, email) DO NOTHING
          `, [tenantId, doctor.name, doctor.email]);
        } catch (error) {
          // Ignore duplicates
        }
      }
      
      // Get the newly created doctors
      const newDoctors = await query('SELECT id, name FROM emr.users WHERE tenant_id = $1 AND role = \'doctor\'', [tenantId]);
      doctorUsers.rows = newDoctors.rows;
    }
    
    // Create appointments with revenue for each doctor
    for (let i = 0; i < doctorUsers.rows.length; i++) {
      const doctor = doctorUsers.rows[i];
      const patientCount = 15 + Math.floor(Math.random() * 20); // 15-35 patients per doctor
      
      for (let j = 0; j < patientCount; j++) {
        try {
          const appointmentDate = new Date();
          appointmentDate.setDate(appointmentDate.getDate() - Math.floor(Math.random() * 90)); // Random date in last 90 days
          
          // Create appointment
          await query(`
            INSERT INTO demo_emr.appointments 
            (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'completed', NOW(), NOW())
            ON CONFLICT DO NOTHING
          `, [
            tenantId,
            patients.rows[j % patients.rows.length].id,
            doctor.id,
            appointmentDate.toISOString(),
            new Date(appointmentDate.getTime() + 60 * 60 * 1000).toISOString() // +1 hour
          ]);
          
          // Create corresponding invoice
          const revenue = 500 + Math.floor(Math.random() * 1500); // $500-2000 per appointment
          await query(`
            INSERT INTO demo_emr.invoices 
            (tenant_id, patient_id, invoice_number, total, status, created_at, updated_at)
            VALUES ($1, $2, 'INV-' || EXTRACT(EPOCH FROM NOW())::text || '-' || floor(random() * 1000)::text, $3, 'paid', $4, NOW())
            ON CONFLICT DO NOTHING
          `, [
            tenantId,
            patients.rows[j % patients.rows.length].id,
            revenue,
            appointmentDate.toISOString()
          ]);
          
        } catch (error) {
          // Ignore duplicates
        }
      }
    }
    
    // Create some pending invoices for financial metrics
    console.log('Creating pending invoices...');
    for (let i = 0; i < 25; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.invoices 
          (tenant_id, patient_id, invoice_number, total, status, created_at, updated_at)
          VALUES ($1, $2, 'PEND-' || EXTRACT(EPOCH FROM NOW())::text || '-' || floor(random() * 1000)::text, $3, 'pending', NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          patients.rows[i % patients.rows.length].id,
          200 + Math.floor(Math.random() * 800)
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // Create open encounters for resource load metrics
    console.log('Creating open encounters...');
    for (let i = 0; i < 12; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.encounters 
          (tenant_id, patient_id, encounter_type, visit_date, status, created_at, updated_at)
          VALUES ($1, $2, 'admission', NOW() - INTERVAL '${i} hours', 'open', NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          patients.rows[i % patients.rows.length].id
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    console.log('\n=== VERIFYING REPORTS DATA ===');
    
    // Test the reports data again
    const verification = await Promise.all([
      query(`SELECT COUNT(*)::int as count FROM demo_emr.patients WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.appointments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COALESCE(SUM(total), 0) as total FROM demo_emr.invoices WHERE tenant_id = $1 AND status IN ('paid', 'partially_paid')`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.invoices WHERE tenant_id = $1 AND status = 'pending'`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM demo_emr.encounters WHERE tenant_id = $1 AND status = 'open'`, [tenantId]),
      query(`SELECT COUNT(*)::int as count FROM emr.users WHERE tenant_id = $1 AND role = 'doctor'`, [tenantId])
    ]);
    
    console.log('\nUpdated Reports Data:');
    console.log(` Total Patients: ${verification[0].rows[0].count}`);
    console.log(` Total Appointments: ${verification[1].rows[0].count}`);
    console.log(` Total Revenue: $${(verification[2].rows[0].total || 0).toLocaleString()}`);
    console.log(` Pending Invoices: ${verification[3].rows[0].count}`);
    console.log(` Open Encounters: ${verification[4].rows[0].count}`);
    console.log(` Total Doctors: ${verification[5].rows[0].count}`);
    
    // Test monthly revenue again
    const monthlyRevenueCheck = await query(`
      SELECT TO_CHAR(gs, 'Mon') as label, COALESCE(SUM(i.total), 0) as value
      FROM generate_series(date_trunc('month', CURRENT_DATE) - INTERVAL '5 months', date_trunc('month', CURRENT_DATE), INTERVAL '1 month') gs
      LEFT JOIN demo_emr.invoices i ON date_trunc('month', i.created_at) = gs AND i.tenant_id = $1 AND i.status IN ('paid', 'partially_paid')
      GROUP BY gs ORDER BY gs
    `, [tenantId]);
    
    console.log('\nUpdated Monthly Revenue:');
    monthlyRevenueCheck.rows.forEach(row => {
      console.log(` ${row.label}: $${(row.value || 0).toLocaleString()}`);
    });
    
    // Test doctor payouts again
    const doctorPayoutsCheck = await query(`
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
    
    console.log('\nUpdated Doctor Payouts:');
    if (doctorPayoutsCheck.rows.length > 0) {
      doctorPayoutsCheck.rows.forEach((doctor, index) => {
        console.log(` ${index + 1}. ${doctor.doctor_name} - ${doctor.patient_count} patients, $${(doctor.total_revenue || 0).toLocaleString()} revenue`);
      });
    } else {
      console.log(' No doctor payouts data available');
    }
    
    console.log('\n=== SUCCESS ===');
    console.log('Reports & Analysis page should now display comprehensive data:');
    console.log('- Core metrics with realistic numbers');
    console.log('- Monthly revenue trend with 6 months of data');
    console.log('- Doctor performance table with revenue sharing');
    console.log('- AI strategic insights based on actual data');
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Navigate to Reports & Analysis page');
    console.log('2. Refresh the page if needed');
    console.log('3. All sections should now display data');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

populateReportsData();
