import { query } from './server/db/connection.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function finalDashboardFix() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== FINAL DASHBOARD FIX ===\n');
    
    // 1. FIX BEDS (Still showing 0)
    console.log('1. Creating Beds (Currently: 0)');
    
    const wards = await query('SELECT id, name, type FROM demo_emr.wards WHERE tenant_id = $1', [tenantId]);
    console.log(`Found ${wards.rows.length} wards`);
    
    let totalBedsCreated = 0;
    for (const ward of wards.rows) {
      const bedCount = ward.type === 'ICU' ? 10 : ward.type === 'Emergency' ? 15 : ward.type.includes('Private') ? 15 : ward.type === 'Maternity' ? 20 : ward.type === 'Pediatric' ? 25 : 30;
      
      for (let i = 1; i <= bedCount; i++) {
        const bedNumber = `${ward.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}`;
        const isOccupied = Math.random() < 0.75; // 75% occupancy
        
        try {
          await query(`
            INSERT INTO demo_emr.beds (tenant_id, ward_id, bed_number, type, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT DO NOTHING
          `, [tenantId, ward.id, bedNumber, ward.type, isOccupied ? 'occupied' : 'available']);
          totalBedsCreated++;
        } catch (error) {
          // Ignore duplicates
        }
      }
    }
    
    const bedCount = await query('SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1', [tenantId]);
    const occupiedCount = await query('SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1 AND status = \'occupied\'', [tenantId]);
    console.log(`Total Beds Created: ${totalBedsCreated}, Database Count: ${bedCount.rows[0].count}, Occupied: ${occupiedCount.rows[0].count}`);
    
    // 2. FIX LAB TESTS (Still showing 0)
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
    
    let labTestsCreated = 0;
    for (const test of labTests) {
      try {
        await query(`
          INSERT INTO demo_emr.lab_tests (tenant_id, test_name, category, normal_range, price, created_at, updated_at)
          VALUES ($1, $2, $3, 'Normal range defined', $4, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [tenantId, test.name, test.category, test.price]);
        labTestsCreated++;
      } catch (error) {
        console.log(`Error creating ${test.name}: ${error.message}`);
      }
    }
    
    const labTestCount = await query('SELECT COUNT(*) as count FROM demo_emr.lab_tests WHERE tenant_id = $1', [tenantId]);
    console.log(`Lab Tests Created: ${labTestsCreated}, Database Count: ${labTestCount.rows[0].count}`);
    
    // 3. CREATE MORE DIAGNOSTIC REPORTS
    console.log('\n3. Creating Diagnostic Reports');
    
    const patients = await query('SELECT id FROM demo_emr.patients WHERE tenant_id = $1 LIMIT 20', [tenantId]);
    
    for (let i = 0; i < 15; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.diagnostic_reports 
          (tenant_id, patient_id, status, category, conclusion, issued_datetime, created_at, updated_at)
          VALUES ($1, $2, 'completed', 'Laboratory', '{"findings": "Normal", "recommendations": "No action needed"}', NOW(), NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [tenantId, patients.rows[i % patients.rows.length].id]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    const reportCount = await query('SELECT COUNT(*) as count FROM demo_emr.diagnostic_reports WHERE tenant_id = $1 AND DATE(issued_datetime) = CURRENT_DATE', [tenantId]);
    console.log(`Today's Reports: ${reportCount.rows[0].count}`);
    
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
      query('SELECT COUNT(*) as count FROM demo_emr.blood_units WHERE tenant_id = $1 AND status = \'available\'', [tenantId]),
      query('SELECT COUNT(*) as count FROM demo_emr.attendance WHERE tenant_id = $1 AND date = CURRENT_DATE AND status = \'present\'', [tenantId])
    ]);
    
    console.log('\n=== FINAL DASHBOARD METRICS ===');
    console.log(` Total Beds: ${finalCounts[0].rows[0].count}`);
    console.log(` Occupied Beds: ${finalCounts[1].rows[0].count}`);
    console.log(` Bed Occupancy Rate: ${finalCounts[0].rows[0].count > 0 ? ((finalCounts[1].rows[0].count / finalCounts[0].rows[0].count) * 100).toFixed(1) : 0}%`);
    console.log(` Lab Tests Available: ${finalCounts[2].rows[0].count}`);
    console.log(` Today's Lab Reports: ${finalCounts[3].rows[0].count}`);
    console.log(` Today's Discharges: ${finalCounts[4].rows[0].count}`);
    console.log(` Today's Appointments: ${finalCounts[5].rows[0].count}`);
    console.log(` Pending Invoices: ${finalCounts[6].rows[0].count}`);
    console.log(` Available Blood Units: ${finalCounts[7].rows[0].count}`);
    console.log(` Today's Attendance: ${finalCounts[8].rows[0].count}`);
    
    // Check if all critical metrics are populated
    const successCriteria = [
      finalCounts[0].rows[0].count > 0, // Beds
      finalCounts[1].rows[0].count > 0, // Occupied beds
      finalCounts[2].rows[0].count > 0, // Lab tests
      finalCounts[3].rows[0].count > 0, // Today's reports
      finalCounts[5].rows[0].count > 0, // Today's appointments
      finalCounts[6].rows[0].count > 0, // Pending invoices
      finalCounts[7].rows[0].count > 0, // Blood units
      finalCounts[8].rows[0].count > 0  // Attendance
    ];
    
    if (successCriteria.every(criterion => criterion)) {
      console.log('\n=== SUCCESS: ALL DASHBOARD METRICS POPULATED ===');
      console.log('The dashboard should now display complete data across all cards!');
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

finalDashboardFix();
