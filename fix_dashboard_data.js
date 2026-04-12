import { query } from './server/db/connection.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fixDashboardData() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== FIXING DASHBOARD DATA ===\n');
    
    // 1. Fix Beds (Critical for Bed Occupancy)
    console.log('1. Creating Beds for Bed Occupancy...');
    
    try {
      // Check if wards exist
      const wards = await query('SELECT id, name, type FROM demo_emr.wards WHERE tenant_id = $1', [tenantId]);
      
      if (wards.rows.length === 0) {
        console.log('Creating wards first...');
        // Create wards
        const wardTypes = [
          { name: 'ICU', type: 'ICU', baseRate: 2000 },
          { name: 'General Ward - Male', type: 'General', baseRate: 800 },
          { name: 'General Ward - Female', type: 'General', baseRate: 800 },
          { name: 'Private Ward - A', type: 'Private', baseRate: 1500 },
          { name: 'Private Ward - B', type: 'Private', baseRate: 1500 },
          { name: 'Maternity Ward', type: 'Maternity', baseRate: 1200 },
          { name: 'Pediatric Ward', type: 'Pediatric', baseRate: 1000 },
          { name: 'Emergency Ward', type: 'Emergency', baseRate: 1000 }
        ];
        
        for (const wardType of wardTypes) {
          const wardResult = await query(`
            INSERT INTO demo_emr.wards (tenant_id, name, type, base_rate, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
            ON CONFLICT (tenant_id, name) DO UPDATE SET updated_at = NOW()
            RETURNING id
          `, [tenantId, wardType.name, wardType.type, wardType.baseRate]);
          
          const wardId = wardResult.rows[0]?.id;
          console.log(`Created ward: ${wardType.name}`);
        }
      }
      
      // Get wards again
      const updatedWards = await query('SELECT id, name, type FROM demo_emr.wards WHERE tenant_id = $1', [tenantId]);
      
      // Create beds for each ward
      for (const ward of updatedWards.rows) {
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
      
      // Verify beds
      const bedCount = await query('SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1', [tenantId]);
      const occupiedCount = await query('SELECT COUNT(*) as count FROM demo_emr.beds WHERE tenant_id = $1 AND status = \'occupied\'', [tenantId]);
      console.log(`Total Beds: ${bedCount.rows[0].count}, Occupied: ${occupiedCount.rows[0].count}`);
      
    } catch (error) {
      console.log('Beds creation error:', error.message);
    }
    
    // 2. Fix Lab Tests
    console.log('\n2. Creating Lab Tests...');
    
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
    
    // 3. Create Today's Lab Reports
    console.log('\n3. Creating Today\'s Lab Reports...');
    
    const patients = await query('SELECT id FROM demo_emr.patients WHERE tenant_id = $1 LIMIT 20', [tenantId]);
    
    for (let i = 0; i < 8; i++) {
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
    
    // 4. Fix Blood Bank
    console.log('\n4. Creating Blood Bank Data...');
    
    // Check if blood_units table exists
    try {
      await query('SELECT COUNT(*) FROM demo_emr.blood_units WHERE tenant_id = $1', [tenantId]);
      
      const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
      
      for (let i = 0; i < 30; i++) {
        try {
          const collectionDate = new Date();
          collectionDate.setDate(collectionDate.getDate() - getRandomInt(1, 30));
          const expiryDate = new Date(collectionDate);
          expiryDate.setDate(expiryDate.getDate() + 35);
          
          await query(`
            INSERT INTO demo_emr.blood_units (tenant_id, blood_group, collection_date, expiry_date, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 'available', NOW(), NOW())
            ON CONFLICT DO NOTHING
          `, [tenantId, getRandomItem(bloodGroups), collectionDate.toISOString().split('T')[0], expiryDate.toISOString().split('T')[0]]);
        } catch (error) {
          // Ignore duplicates
        }
      }
      
      const bloodUnitCount = await query('SELECT COUNT(*) as count FROM demo_emr.blood_units WHERE tenant_id = $1 AND status = \'available\'', [tenantId]);
      console.log(`Available Blood Units: ${bloodUnitCount.rows[0].count}`);
      
    } catch (error) {
      console.log('Blood bank table issue:', error.message);
    }
    
    // 5. Create Discharges
    console.log('\n5. Creating Discharges...');
    
    try {
      await query('SELECT COUNT(*) FROM demo_emr.discharges WHERE tenant_id = $1', [tenantId]);
      
      for (let i = 0; i < 5; i++) {
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
      console.log(`Discharges Today: ${dischargeCount.rows[0].count}`);
      
    } catch (error) {
      console.log('Discharges table issue:', error.message);
    }
    
    // 6. Fix Invoice Statuses
    console.log('\n6. Updating Invoice Statuses...');
    
    try {
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
      
    } catch (error) {
      console.log('Invoice update error:', error.message);
    }
    
    console.log('\n=== DASHBOARD DATA FIX COMPLETED ===');
    console.log('The dashboard should now show complete data!');
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

fixDashboardData();
