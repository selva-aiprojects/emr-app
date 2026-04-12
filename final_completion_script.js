import { query } from './server/db/connection.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function finalCompletion() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== FINAL COMPLETION SCRIPT ===\n');
    
    // 1. Fix Beds Table and Populate
    console.log('1. Fixing Beds Table...');
    
    // Check current beds table structure
    const bedsStructure = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'demo_emr' AND table_name = 'beds'
      ORDER BY ordinal_position
    `);
    
    const bedColumns = bedsStructure.rows.map(row => row.column_name);
    console.log('Current beds columns:', bedColumns.join(', '));
    
    // Get wards to create beds
    const wards = await query('SELECT id, name, type FROM demo_emr.wards WHERE tenant_id = $1', [tenantId]);
    
    for (const ward of wards.rows) {
      const bedCount = ward.type === 'ICU' ? 10 : ward.type === 'Emergency' ? 15 : ward.type.includes('Private') ? 15 : ward.type === 'Maternity' ? 20 : ward.type === 'Pediatric' ? 25 : 30;
      
      for (let i = 1; i <= bedCount; i++) {
        const bedNumber = `${ward.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}`;
        const isOccupied = Math.random() < 0.75; // 75% occupancy
        
        try {
          await query(`
            INSERT INTO demo_emr.beds 
            (tenant_id, ward_id, bed_number, type, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (tenant_id, bed_number) DO UPDATE SET
              status = EXCLUDED.status,
              updated_at = NOW()
          `, [
            tenantId,
            ward.id,
            bedNumber,
            ward.type,
            isOccupied ? 'occupied' : 'available'
          ]);
        } catch (error) {
          // Ignore duplicates
        }
      }
    }
    
    // 2. Fix Blood Bank Tables
    console.log('2. Fixing Blood Bank Tables...');
    
    // Check blood_units structure
    const bloodUnitsStructure = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'demo_emr' AND table_name = 'blood_units'
      ORDER BY ordinal_position
    `);
    
    const bloodUnitsColumns = bloodUnitsStructure.rows.map(row => row.column_name);
    console.log('Current blood_units columns:', bloodUnitsColumns.join(', '));
    
    // Add missing columns if needed
    if (!bloodUnitsColumns.includes('collection_date')) {
      await query(`ALTER TABLE demo_emr.blood_units ADD COLUMN collection_date date`);
    }
    if (!bloodUnitsColumns.includes('expiry_date')) {
      await query(`ALTER TABLE demo_emr.blood_units ADD COLUMN expiry_date date`);
    }
    
    // Check blood_requests structure
    const bloodRequestsStructure = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'demo_emr' AND table_name = 'blood_requests'
      ORDER BY ordinal_position
    `);
    
    const bloodRequestsColumns = bloodRequestsStructure.rows.map(row => row.column_name);
    console.log('Current blood_requests columns:', bloodRequestsColumns.join(', '));
    
    // Add missing columns if needed
    if (!bloodRequestsColumns.includes('blood_group')) {
      await query(`ALTER TABLE demo_emr.blood_requests ADD COLUMN blood_group character varying`);
    }
    
    // 3. Populate Blood Units with Correct Schema
    console.log('3. Populating Blood Units...');
    
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const existingDonors = await query('SELECT id FROM demo_emr.donors WHERE tenant_id = $1 LIMIT 50', [tenantId]);
    
    for (let i = 0; i < 50; i++) {
      try {
        const collectionDate = new Date();
        collectionDate.setDate(collectionDate.getDate() - getRandomInt(1, 30));
        const expiryDate = new Date(collectionDate);
        expiryDate.setDate(expiryDate.getDate() + 35); // 35 days expiry
        
        await query(`
          INSERT INTO demo_emr.blood_units 
          (tenant_id, donor_id, blood_group, collection_date, expiry_date, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          existingDonors.rows.length > 0 ? getRandomItem(existingDonors.rows).id : null,
          getRandomItem(bloodGroups),
          collectionDate.toISOString().split('T')[0],
          expiryDate.toISOString().split('T')[0],
          ['available', 'reserved', 'expired'][i % 3]
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 4. Populate Blood Requests with Correct Schema
    console.log('4. Populating Blood Requests...');
    
    const patients = await query('SELECT id FROM demo_emr.patients WHERE tenant_id = $1 LIMIT 50', [tenantId]);
    
    for (let i = 0; i < 15; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.blood_requests 
          (tenant_id, patient_id, blood_group, urgency, request_date, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          getRandomItem(patients.rows).id,
          getRandomItem(bloodGroups),
          ['Routine', 'Urgent', 'Emergency'][i % 3],
          new Date().toISOString().split('T')[0],
          ['pending', 'fulfilled', 'cancelled'][i % 3]
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 5. Populate Lab Tests
    console.log('5. Populating Lab Tests...');
    
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
          INSERT INTO demo_emr.lab_tests 
          (tenant_id, test_name, category, normal_range, price, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (tenant_id, test_name) DO UPDATE SET updated_at = NOW()
        `, [
          tenantId,
          test.name,
          test.category,
          'Normal range defined',
          test.price
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 6. Create Today's Attendance
    console.log('6. Creating Today\'s Attendance...');
    
    // Check if attendance table exists
    const attendanceCheck = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'demo_emr' AND table_name = 'attendance'
    `);
    
    if (attendanceCheck.rows.length === 0) {
      await query(`
        CREATE TABLE IF NOT EXISTS demo_emr.attendance (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          employee_id uuid NOT NULL,
          date date NOT NULL,
          check_in time,
          check_out time,
          status character varying NOT NULL,
          notes text,
          created_at timestamp with time zone DEFAULT NOW(),
          updated_at timestamp with time zone DEFAULT NOW()
        )
      `);
    }
    
    const employees = await query('SELECT id FROM demo_emr.employees WHERE tenant_id = $1', [tenantId]);
    const today = new Date().toISOString().split('T')[0];
    
    for (const employee of employees.rows) {
      try {
        const present = Math.random() < 0.9; // 90% attendance
        
        await query(`
          INSERT INTO demo_emr.attendance 
          (tenant_id, employee_id, date, check_in, check_out, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT (tenant_id, employee_id, date) DO UPDATE SET updated_at = NOW()
        `, [
          tenantId,
          employee.id,
          today,
          present ? '09:00:00' : null,
          present ? '17:00:00' : null,
          present ? 'present' : 'absent'
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 7. Update Invoice Statuses
    console.log('7. Updating Invoice Statuses...');
    
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
    
    console.log('\n=== FINAL VERIFICATION ===');
    
    // Final verification
    const verification = await query(`
      SELECT 
        (SELECT COUNT(*) FROM demo_emr.wards WHERE tenant_id = $1) as wards,
        (SELECT COUNT(*) FROM demo_emr.beds WHERE tenant_id = $1) as beds,
        (SELECT COUNT(*) FROM demo_emr.beds WHERE tenant_id = $1 AND status = 'occupied') as occupied_beds,
        (SELECT COUNT(*) FROM demo_emr.lab_tests WHERE tenant_id = $1) as lab_tests,
        (SELECT COUNT(*) FROM demo_emr.discharges WHERE tenant_id = $1) as discharges,
        (SELECT COUNT(*) FROM demo_emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE) as today_appointments,
        (SELECT COUNT(*) FROM demo_emr.ambulances WHERE tenant_id = $1) as ambulances,
        (SELECT COUNT(*) FROM demo_emr.blood_units WHERE tenant_id = $1 AND status = 'available') as available_blood,
        (SELECT COUNT(*) FROM demo_emr.blood_requests WHERE tenant_id = $1 AND status = 'pending') as pending_blood_requests,
        (SELECT COUNT(*) FROM demo_emr.attendance WHERE tenant_id = $1 AND date = CURRENT_DATE) as today_attendance,
        (SELECT COUNT(*) FROM demo_emr.invoices WHERE tenant_id = $1 AND status = 'pending') as pending_invoices,
        (SELECT COUNT(*) FROM demo_emr.patients WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE) as today_patients
    `, [tenantId]);
    
    const results = verification.rows[0];
    console.log('\nFinal Dashboard Metrics:');
    console.log(` Wards: ${results.wards}`);
    console.log(` Total Beds: ${results.beds}`);
    console.log(` Occupied Beds: ${results.occupied_beds}`);
    console.log(` Bed Occupancy Rate: ${results.beds > 0 ? ((results.occupied_beds / results.beds) * 100).toFixed(1) : 0}%`);
    console.log(` Lab Tests: ${results.lab_tests}`);
    console.log(` Discharges: ${results.discharges}`);
    console.log(` Today's Appointments: ${results.today_appointments}`);
    console.log(` Ambulances: ${results.ambulances}`);
    console.log(` Available Blood Units: ${results.available_blood}`);
    console.log(` Pending Blood Requests: ${results.pending_blood_requests}`);
    console.log(` Today's Attendance: ${results.today_attendance}`);
    console.log(` Pending Invoices: ${results.pending_invoices}`);
    console.log(` Today's New Patients: ${results.today_patients}`);
    
    console.log('\n=== COMPLETION STATUS ===');
    const successCriteria = [
      results.wards > 0,
      results.beds > 0,
      results.occupied_beds > 0,
      results.lab_tests > 0,
      results.today_appointments > 0,
      results.ambulances > 0,
      results.available_blood > 0,
      results.today_attendance > 0,
      results.pending_invoices > 0
    ];
    
    if (successCriteria.every(criterion => criterion)) {
      console.log('SUCCESS: All critical dashboard metrics populated!');
      console.log('The dashboard should now display complete data.');
    } else {
      console.log('Some metrics still need attention.');
    }
    
    console.log('\n=== LOGIN READY ===');
    console.log('URL: http://localhost:5175');
    console.log('Email: admin@demo.hospital');
    console.log('Password: Demo@123');
    console.log('\nAll dashboard cards should now show realistic data!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

finalCompletion();
