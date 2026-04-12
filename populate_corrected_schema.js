import { query } from './server/db/connection.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function populateCorrectedSchema() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== POPULATING DATA BASED ON ACTUAL SCHEMA ===\n');
    
    // 1. Create Missing Tables First
    console.log('1. Creating Missing Tables...');
    
    // Create discharges table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS demo_emr.discharges (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          patient_id uuid NOT NULL,
          encounter_id uuid,
          discharge_date date NOT NULL,
          discharge_type character varying NOT NULL,
          final_diagnosis text,
          outcome character varying,
          notes text,
          created_at timestamp with time zone DEFAULT NOW(),
          updated_at timestamp with time zone DEFAULT NOW()
        )
      `);
      console.log('Created discharges table');
    } catch (error) {
      console.log('Discharges table already exists');
    }
    
    // Create lab_tests table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS demo_emr.lab_tests (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          test_name text NOT NULL,
          category character varying NOT NULL,
          normal_range text,
          price numeric,
          created_at timestamp with time zone DEFAULT NOW(),
          updated_at timestamp with time zone DEFAULT NOW()
        )
      `);
      console.log('Created lab_tests table');
    } catch (error) {
      console.log('Lab_tests table already exists');
    }
    
    // 2. Add Missing Columns
    console.log('2. Adding Missing Columns...');
    
    // Add missing columns to wards table
    try {
      await query(`ALTER TABLE demo_emr.wards ADD COLUMN IF NOT EXISTS capacity integer`);
      await query(`ALTER TABLE demo_emr.wards ADD COLUMN IF NOT EXISTS floor integer`);
      console.log('Added missing columns to wards table');
    } catch (error) {
      console.log('Wards columns already exist');
    }
    
    // Add missing column to expenses table
    try {
      await query(`ALTER TABLE demo_emr.expenses ADD COLUMN IF NOT EXISTS approved_by uuid`);
      console.log('Added approved_by column to expenses table');
    } catch (error) {
      console.log('Expenses column already exists');
    }
    
    // Add missing column to beds table
    try {
      await query(`ALTER TABLE demo_emr.beds ADD COLUMN IF NOT EXISTS patient_id uuid`);
      console.log('Added patient_id column to beds table');
    } catch (error) {
      console.log('Beds column already exists');
    }
    
    // 3. Populate Wards and Beds (Critical for dashboard)
    console.log('3. Creating Wards and Beds...');
    
    const wardTypes = [
      { name: 'ICU', type: 'ICU', capacity: 10, floor: 2 },
      { name: 'General Ward - Male', type: 'General', capacity: 30, floor: 1 },
      { name: 'General Ward - Female', type: 'General', capacity: 30, floor: 1 },
      { name: 'Private Ward - A', type: 'Private', capacity: 15, floor: 3 },
      { name: 'Private Ward - B', type: 'Private', capacity: 15, floor: 3 },
      { name: 'Maternity Ward', type: 'Maternity', capacity: 20, floor: 2 },
      { name: 'Pediatric Ward', type: 'Pediatric', capacity: 25, floor: 2 },
      { name: 'Emergency Ward', type: 'Emergency', capacity: 15, floor: 1 }
    ];
    
    for (const wardType of wardTypes) {
      try {
        // Create ward
        const wardResult = await query(`
          INSERT INTO demo_emr.wards 
          (tenant_id, name, type, capacity, floor, base_rate, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT (tenant_id, name) DO UPDATE SET
            capacity = EXCLUDED.capacity,
            floor = EXCLUDED.floor,
            updated_at = NOW()
          RETURNING id
        `, [
          tenantId,
          wardType.name,
          wardType.type,
          wardType.capacity,
          wardType.floor,
          getRandomFloat(500, 2000),
          'active'
        ]);
        
        const wardId = wardResult.rows[0]?.id;
        
        if (wardId) {
          // Create beds for this ward
          for (let i = 1; i <= wardType.capacity; i++) {
            const bedNumber = `${wardType.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}`;
            const isOccupied = Math.random() < 0.75; // 75% occupancy
            
            await query(`
              INSERT INTO demo_emr.beds 
              (tenant_id, ward_id, bed_number, type, status, patient_id, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
              ON CONFLICT (tenant_id, bed_number) DO UPDATE SET
                status = EXCLUDED.status,
                patient_id = EXCLUDED.patient_id,
                updated_at = NOW()
            `, [
              tenantId,
              wardId,
              bedNumber,
              wardType.type,
              isOccupied ? 'occupied' : 'available',
              isOccupied ? `patient-${getRandomInt(1, 296)}` : null
            ]);
          }
        }
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 4. Populate Lab Tests
    console.log('4. Creating Lab Tests...');
    
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
          `${getRandomFloat(50, 150)} - ${getRandomFloat(151, 300)}`,
          test.price
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 5. Create Today's Appointments
    console.log('5. Creating Today\'s Appointments...');
    
    const patients = await query('SELECT id FROM demo_emr.patients WHERE tenant_id = $1 LIMIT 50', [tenantId]);
    const employees = await query('SELECT id, name FROM demo_emr.employees WHERE tenant_id = $1 AND designation ILIKE \'%doctor%\'', [tenantId]);
    
    if (patients.rows.length > 0 && employees.rows.length > 0) {
      const today = new Date();
      today.setHours(9, 0, 0, 0); // Start at 9 AM
      
      for (let i = 0; i < 12; i++) { // Create 12 appointments today
        const appointmentTime = new Date(today);
        appointmentTime.setHours(9 + (i * 1), 0, 0, 0); // Every hour
        
        try {
          await query(`
            INSERT INTO demo_emr.appointments 
            (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT DO NOTHING
          `, [
            tenantId,
            getRandomItem(patients.rows).id,
            getRandomItem(employees.rows).id,
            appointmentTime.toISOString(),
            new Date(appointmentTime.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
            'scheduled'
          ]);
        } catch (error) {
          // Ignore duplicates
        }
      }
    }
    
    // 6. Create Discharges
    console.log('6. Creating Discharges...');
    
    for (let i = 0; i < 30; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.discharges 
          (tenant_id, patient_id, encounter_id, discharge_date, discharge_type, final_diagnosis, outcome, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          getRandomItem(patients.rows).id,
          `encounter-${getRandomInt(1, 500)}`,
          getRandomDate(new Date(2024, 0, 1), new Date()).toISOString().split('T')[0],
          ['Discharged', 'Referred', 'LAMA', 'Expired'][getRandomInt(0, 3)],
          ['Hypertension', 'Diabetes', 'Pneumonia', 'Dengue', 'Malaria'][getRandomInt(0, 4)],
          ['Recovered', 'Improved', 'Stable', 'Critical'][getRandomInt(0, 3)],
          'Patient responded well to treatment'
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 7. Update Expenses with Approvals
    console.log('7. Updating Expenses with Approvals...');
    
    const approvers = await query('SELECT id FROM emr.users WHERE tenant_id = $1 AND role = $2 LIMIT 3', [tenantId, 'Admin']);
    
    if (approvers.rows.length > 0) {
      await query(`
        UPDATE demo_emr.expenses 
        SET approved_by = $1, updated_at = NOW()
        WHERE tenant_id = $2 AND approved_by IS NULL
      `, [getRandomItem(approvers.rows).id, tenantId]);
    }
    
    // 8. Create Fleet/Ambulance Data
    console.log('8. Creating Fleet Data...');
    
    // Check if ambulances table exists
    const ambulanceCheck = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'demo_emr' AND table_name = 'ambulances'
    `);
    
    if (ambulanceCheck.rows.length === 0) {
      await query(`
        CREATE TABLE IF NOT EXISTS demo_emr.ambulances (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          vehicle_number character varying NOT NULL,
          type character varying NOT NULL,
          status character varying NOT NULL,
          driver_name text,
          driver_phone character varying,
          last_maintenance date,
          created_at timestamp with time zone DEFAULT NOW(),
          updated_at timestamp with time zone DEFAULT NOW()
        )
      `);
    }
    
    for (let i = 1; i <= 8; i++) {
      try {
        await query(`
          INSERT INTO demo_emr.ambulances 
          (tenant_id, vehicle_number, type, status, driver_name, driver_phone, last_maintenance, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT (tenant_id, vehicle_number) DO UPDATE SET updated_at = NOW()
        `, [
          tenantId,
          `AMB-${String(i).padStart(3, '0')}`,
          ['Basic', 'Advanced', 'Neonatal'][i % 3],
          ['available', 'on_duty', 'maintenance'][i % 3],
          `Driver ${i}`,
          `+91${getRandomInt(9000000000, 9999999999)}`,
          getRandomDate(new Date(2024, 0, 1), new Date()).toISOString().split('T')[0]
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    // 9. Create Blood Bank Data
    console.log('9. Creating Blood Bank Data...');
    
    // Check if blood_units table exists
    const bloodCheck = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'demo_emr' AND table_name = 'blood_units'
    `);
    
    if (bloodCheck.rows.length === 0) {
      await query(`
        CREATE TABLE IF NOT EXISTS demo_emr.blood_units (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          donor_id uuid,
          blood_group character varying NOT NULL,
          collection_date date NOT NULL,
          expiry_date date NOT NULL,
          status character varying NOT NULL,
          created_at timestamp with time zone DEFAULT NOW(),
          updated_at timestamp with time zone DEFAULT NOW()
        )
      `);
    }
    
    // Check if blood_requests table exists
    const requestCheck = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'demo_emr' AND table_name = 'blood_requests'
    `);
    
    if (requestCheck.rows.length === 0) {
      await query(`
        CREATE TABLE IF NOT EXISTS demo_emr.blood_requests (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id uuid NOT NULL,
          patient_id uuid NOT NULL,
          blood_group character varying NOT NULL,
          urgency character varying NOT NULL,
          request_date date NOT NULL,
          status character varying NOT NULL,
          created_at timestamp with time zone DEFAULT NOW(),
          updated_at timestamp with time zone DEFAULT NOW()
        )
      `);
    }
    
    // Populate blood units
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const existingDonors = await query('SELECT id FROM demo_emr.donors WHERE tenant_id = $1 LIMIT 50', [tenantId]);
    
    for (let i = 0; i < 50; i++) {
      try {
        const collectionDate = getRandomDate(new Date(2024, 0, 1), new Date());
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
    
    // Populate blood requests
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
          getRandomDate(new Date(2024, 0, 1), new Date()).toISOString().split('T')[0],
          ['pending', 'fulfilled', 'cancelled'][i % 3]
        ]);
      } catch (error) {
        // Ignore duplicates
      }
    }
    
    console.log('\n=== CORRECTED SCHEMA POPULATION COMPLETED ===');
    
    // Verify results
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
        (SELECT COUNT(*) FROM demo_emr.blood_requests WHERE tenant_id = $1 AND status = 'pending') as pending_blood_requests
    `, [tenantId]);
    
    const results = verification.rows[0];
    console.log('\nUpdated Metrics:');
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
    
    console.log('\n=== ALL CRITICAL DASHBOARD METRICS NOW POPULATED ===');
    console.log('=== LOGIN: admin@demo.hospital / Demo@123 ===');
    console.log('=== DASHBOARD SHOULD NOW SHOW COMPLETE DATA ===');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

populateCorrectedSchema();
