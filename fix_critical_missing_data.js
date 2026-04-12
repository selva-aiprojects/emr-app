import { query } from './server/db/connection.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fixCriticalMissingData() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== FIXING CRITICAL MISSING DASHBOARD DATA ===\n');
    
    // Set search path to demo_emr schema
    await query('SET search_path TO demo_emr');
    
    // 1. FIX BEDS (CRITICAL - Currently 0)
    console.log('1. Creating Beds (Currently: 0)');
    
    const wards = await query('SELECT id, name, type FROM wards WHERE tenant_id = $1', [tenantId]);
    
    for (const ward of wards.rows) {
      const bedCount = ward.type === 'ICU' ? 10 : ward.type === 'Emergency' ? 15 : ward.type.includes('Private') ? 15 : ward.type === 'Maternity' ? 20 : ward.type === 'Pediatric' ? 25 : 30;
      
      for (let i = 1; i <= bedCount; i++) {
        const bedNumber = `${ward.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}`;
        const isOccupied = Math.random() < 0.75; // 75% occupancy
        
        try {
          await query(`
            INSERT INTO beds (tenant_id, ward_id, bed_number, type, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (tenant_id, bed_number) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
          `, [tenantId, ward.id, bedNumber, ward.type, isOccupied ? 'occupied' : 'available']);
        } catch (error) {
          // Ignore duplicates
        }
      }
      console.log(`Created ${bedCount} beds for ${ward.name}`);
    }
    
    const bedCount = await query('SELECT COUNT(*) as count FROM beds WHERE tenant_id = $1', [tenantId]);
    const occupiedCount = await query('SELECT COUNT(*) as count FROM beds WHERE tenant_id = $1 AND status = \'occupied\'', [tenantId]);
    console.log(`✅ Total Beds: ${bedCount.rows[0].count}, Occupied: ${occupiedCount.rows[0].count}`);
    
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
          INSERT INTO lab_tests (tenant_id, test_name, category, normal_range, price, created_at, updated_at)
          VALUES ($1, $2, $3, 'Normal range defined', $4, NOW(), NOW())
          ON CONFLICT (tenant_id, test_name) DO UPDATE SET updated_at = NOW()
        `, [tenantId, test.name, test.category, test.price]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    const labTestCount = await query('SELECT COUNT(*) as count FROM lab_tests WHERE tenant_id = $1', [tenantId]);
    console.log(`✅ Lab Tests Created: ${labTestCount.rows[0].count}`);
    
    // 3. CREATE TODAY'S DIAGNOSTIC REPORTS
    console.log('\n3. Creating Today\'s Diagnostic Reports');
    
    const patients = await query('SELECT id FROM patients WHERE tenant_id = $1 LIMIT 20', [tenantId]);
    
    for (let i = 0; i < 10; i++) {
      try {
        await query(`
          INSERT INTO diagnostic_reports 
          (tenant_id, patient_id, status, category, conclusion, issued_datetime, created_at, updated_at)
          VALUES ($1, $2, 'completed', 'Laboratory', 'Normal findings reported', NOW(), NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [tenantId, getRandomItem(patients.rows).id]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    const reportCount = await query('SELECT COUNT(*) as count FROM diagnostic_reports WHERE tenant_id = $1 AND DATE(issued_datetime) = CURRENT_DATE', [tenantId]);
    console.log(`✅ Today's Reports: ${reportCount.rows[0].count}`);
    
    // 4. CREATE TODAY'S DISCHARGES
    console.log('\n4. Creating Today\'s Discharges');
    
    for (let i = 0; i < 3; i++) {
      try {
        await query(`
          INSERT INTO discharges 
          (tenant_id, patient_id, discharge_date, discharge_type, final_diagnosis, outcome, created_at, updated_at)
          VALUES ($1, $2, CURRENT_DATE, 'Discharged', 'Recovered', 'Improved', NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [tenantId, getRandomItem(patients.rows).id]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    const dischargeCount = await query('SELECT COUNT(*) as count FROM discharges WHERE tenant_id = $1 AND discharge_date = CURRENT_DATE', [tenantId]);
    console.log(`✅ Today's Discharges: ${dischargeCount.rows[0].count}`);
    
    // 5. UPDATE INVOICE STATUSES
    console.log('\n5. Updating Invoice Statuses');
    
    await query(`
      UPDATE invoices 
      SET status = CASE 
        WHEN random() > 0.7 THEN 'pending'
        WHEN random() > 0.5 THEN 'overdue'
        ELSE 'paid'
      END,
      updated_at = NOW()
      WHERE tenant_id = $1 AND status = 'paid'
    `, [tenantId]);
    
    const pendingCount = await query('SELECT COUNT(*) as count FROM invoices WHERE tenant_id = $1 AND status = \'pending\'', [tenantId]);
    console.log(`✅ Pending Invoices: ${pendingCount.rows[0].count}`);
    
    // Reset search path
    await query('SET search_path TO emr, public');
    
    console.log('\n=== CRITICAL DATA FIX COMPLETED ===');
    console.log('✅ Bed Occupancy will now show realistic percentage');
    console.log('✅ Laboratory metrics will now display data');
    console.log('✅ Daily activity metrics are populated');
    console.log('✅ Dashboard should show complete data');
    
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

fixCriticalMissingData();
