import { query } from './server/db/connection.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fixDashboardDirect() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== FIXING DASHBOARD DATA (DIRECT SCHEMA APPROACH) ===\n');
    
    // 1. FIX BEDS (CRITICAL - Currently 0)
    console.log('1. Creating Beds (Currently: 0)');
    
    const wards = await query('SELECT id, name, type FROM demo_emr.wards WHERE tenant_id = $1', [tenantId]);
    
    for (const ward of wards.rows) {
      const bedCount = ward.type === 'ICU' ? 10 : ward.type === 'Emergency' ? 15 : ward.type.includes('Private') ? 15 : ward.type === 'Maternity' ? 20 : ward.type === 'Pediatric' ? 25 : 30;
      
      for (let i = 1; i <= bedCount; i++) {
        const bedNumber = `${ward.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}`;
        const isOccupied = Math.random() < 0.75; // 75% occupancy
        
        try {
          await query(`
            INSERT INTO demo_emr.beds (tenant_id, ward_id, bed_number, type, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (tenant_id, bed_number) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
          `, [tenantId, ward.id, bedNumber, ward.type, isOccupied ? 'occupied' : 'available']);
        } catch (error) {
          // Ignore duplicates
        }
      }
      console.log(`Created ${bedCount} beds for ${ward.name}`);
    }
    
    const bedCount = await query('SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1', [tenantId]);
    const occupiedCount = await query('SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1 AND status = \'occupied\'', [tenantId]);
    console.log(`Total Beds: ${bedCount.rows[0].count}, Occupied: ${occupiedCount.rows[0].count}`);
    
    // 2. FIX LAB TESTS (CRITICAL - Currently 0)
    console.log('\n2. Creating Lab Tests (Currently: 0)');
    
    const labTests = [
      { name: 'Complete Blood Count', category: 'Hematology', price: 350 },
      { name: 'Liver Function Test', category: 'Biochemistry', price: 850 },
      { name: 'Kidney Function Test', category: 'Biochemistry', price: 750 },
      { name: 'Blood Sugar Fasting', category: 'Biochemistry', price: 150 },
      { name: 'Blood Sugar PP', category: 'Biochemistry', price: 180 },
      { name: 'Lipid Profile', category: 'Biochemistry', price: 650 },
      { name: 'Thyroid Function Test', category: 'Biochemistry', price: 1200 },
      { name: 'Vitamin D Test', category: 'Biochemistry', price: 950 },
      { name: 'COVID-19 RT-PCR', category: 'Pathology', price: 800 },
      { name: 'X-Ray Chest PA', category: 'Radiology', price: 300 },
      { name: 'Ultrasound Abdomen', category: 'Radiology', price: 1200 },
      { name: 'CT Scan Head', category: 'Radiology', price: 3500 },
      { name: 'MRI Brain', category: 'Radiology', price: 8000 },
      { name: 'ECG', category: 'Cardiology', price: 250 },
      { name: 'Echocardiogram', category: 'Cardiology', price: 1500 },
      { name: 'Treadmill Test', category: 'Cardiology', price: 2000 },
      { name: 'Pulmonary Function Test', category: 'Pulmonology', price: 1200 }
    ];
    
    for (const test of labTests) {
      try {
        await query(`
          INSERT INTO demo_emr.lab_tests (tenant_id, test_name, category, normal_range, price, created_at, updated_at)
          VALUES ($1, $2, $3, 'Normal range defined', $4, NOW(), NOW())
          ON CONFLICT (tenant_id, test_name) DO UPDATE SET updated_at = NOW()
        `, [tenantId, test.name, test.category, test.price]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    const labTestCount = await query('SELECT COUNT(*) as count FROM demo_emr.lab_tests WHERE tenant_id = $1', [tenantId]);
    console.log(`Lab Tests Created: ${labTestCount.rows[0].count}`);
    
    // 3. CREATE TODAY'S DIAGNOSTIC REPORTS
    console.log('\n3. Creating Today\'s Diagnostic Reports');
    
    const patients = await query('SELECT id FROM demo_emr.patients WHERE tenant_id = $1 LIMIT 20', [tenantId]);
    
    for (let i = 0; i < 10; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.diagnostic_reports 
          (tenant_id, patient_id, status, category, conclusion, issued_datetime, created_at, updated_at)
          VALUES ($1, $2, 'completed', 'Laboratory', 'Normal findings reported', NOW(), NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [tenantId, getRandomItem(patients.rows).id]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    const reportCount = await query('SELECT COUNT(*) as count FROM demo_emr.diagnostic_reports WHERE tenant_id = $1 AND DATE(issued_datetime) = CURRENT_DATE', [tenantId]);
    console.log(`Today's Reports: ${reportCount.rows[0].count}`);
    
    // 4. CREATE TODAY'S DISCHARGES
    console.log('\n4. Creating Today\'s Discharges');
    
    for (let i = 0; i < 3; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.discharges 
          (tenant_id, patient_id, discharge_date, discharge_type, final_diagnosis, outcome, created_at, updated_at)
          VALUES ($1, $2, CURRENT_DATE, 'Discharged', 'Recovered', 'Improved', NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [tenantId, getRandomItem(patients.rows).id]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    const dischargeCount = await query('SELECT COUNT(*) as count FROM demo_emr.discharges WHERE tenant_id = $1 AND discharge_date = CURRENT_DATE', [tenantId]);
    console.log(`Today's Discharges: ${dischargeCount.rows[0].count}`);
    
    // 5. UPDATE INVOICE STATUSES
    console.log('\n5. Updating Invoice Statuses');
    
    await query(`
      UPDATE demo_emr.invoices 
      SET status = CASE 
        WHEN random() > 0.7 THEN 'pending'
        WHEN random() > 0.5 THEN 'overdue'
        ELSE 'paid'
      END,
      updated_at = NOW()
      WHERE tenant_id = $1 AND status = 'paid'
    `, [tenantId]);
    
    const pendingCount = await query('SELECT COUNT(*) as count FROM demo_emr.invoices WHERE tenant_id = $1 AND status = \'pending\'', [tenantId]);
    console.log(`Pending Invoices: ${pendingCount.rows[0].count}`);
    
    // 6. CREATE TODAY'S APPOINTMENTS (if needed)
    console.log('\n6. Checking Today\'s Appointments');
    
    const todayAppointments = await query('SELECT COUNT(*) as count FROM demo_emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE', [tenantId]);
    console.log(`Today's Appointments: ${todayAppointments.rows[0].count}`);
    
    if (todayAppointments.rows[0].count < 5) {
      console.log('Creating more appointments for today...');
      const employees = await query('SELECT id FROM demo_emr.employees WHERE tenant_id = $1 AND designation ILIKE \'%doctor%\'', [tenantId]);
      
      const today = new Date();
      today.setHours(9, 0, 0, 0);
      
      for (let i = 0; i < 8; i++) {
        const appointmentTime = new Date(today);
        appointmentTime.setHours(9 + (i * 1), 0, 0, 0);
        
        try {
          await query(`
            INSERT INTO demo_emr.appointments 
            (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'scheduled', NOW(), NOW())
            ON CONFLICT DO NOTHING
          `, [
            tenantId,
            getRandomItem(patients.rows).id,
            getRandomItem(employees.rows).id,
            appointmentTime.toISOString(),
            new Date(appointmentTime.getTime() + 60 * 60 * 1000).toISOString()
          ]);
        } catch (error) {
          // Ignore duplicates
        }
      }
      
      const updatedAppointments = await query('SELECT COUNT(*) as count FROM demo_emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE', [tenantId]);
      console.log(`Updated Today's Appointments: ${updatedAppointments.rows[0].count}`);
    }
    
    console.log('\n=== FINAL VERIFICATION ===');
    
    // Final verification
    const finalCounts = await Promise.all([
      query('SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1 AND status = \'occupied\'', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.lab_tests WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.diagnostic_reports WHERE tenant_id = $1 AND DATE(issued_datetime) = CURRENT_DATE', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.discharges WHERE tenant_id = $1 AND discharge_date = CURRENT_DATE', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.invoices WHERE tenant_id = $1 AND status = \'pending\'', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.blood_units WHERE tenant_id = $1 AND status = \'available\'', [tenantId])
    ]);
    
    console.log('\nFinal Dashboard Metrics:');
    console.log(` Total Beds: ${finalCounts[0].rows[0].count}`);
    console.log(` Occupied Beds: ${finalCounts[1].rows[0].count}`);
    console.log(` Bed Occupancy Rate: ${finalCounts[0].rows[0].count > 0 ? ((finalCounts[1].rows[0].count / finalCounts[0].rows[0].count) * 100).toFixed(1) : 0}%`);
    console.log(` Lab Tests Available: ${finalCounts[2].rows[0].count}`);
    console.log(` Today's Lab Reports: ${finalCounts[3].rows[0].count}`);
    console.log(` Today's Discharges: ${finalCounts[4].rows[0].count}`);
    console.log(` Today's Appointments: ${finalCounts[5].rows[0].count}`);
    console.log(` Pending Invoices: ${finalCounts[6].rows[0].count}`);
    console.log(` Available Blood Units: ${finalCounts[7].rows[0].count}`);
    
    console.log('\n=== DASHBOARD DATA FIX COMPLETED ===');
    console.log('All dashboard cards should now show complete data!');
    
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

fixDashboardDirect();
