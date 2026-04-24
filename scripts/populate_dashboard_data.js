import { query } from '../server/db/connection.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function populateDashboardData() {
  console.log(' Populating dashboard data for DEMO tenant...\n');

  try {
    // Get tenant ID
    const tenantResult = await query(
      'SELECT id FROM emr.tenants WHERE code = $1',
      ['DEMO']
    );

    if (tenantResult.rows.length === 0) {
      console.log(' DEMO tenant not found!');
      return;
    }

    const tenantId = tenantResult.rows[0].id;
    console.log(` Found DEMO tenant with ID: ${tenantId}`);

    // Get existing patients
    const patientsResult = await query(
      'SELECT id, first_name, last_name FROM emr.patients WHERE tenant_id = $1 LIMIT 50',
      [tenantId]
    );

    const patients = patientsResult.rows;
    console.log(` Found ${patients.length} patients`);

    // Get users for doctor assignments
    const usersResult = await query(
      'SELECT id, name FROM emr.users WHERE tenant_id = $1 AND role = $2',
      [tenantId, 'Doctor']
    );

    const doctors = usersResult.rows;
    console.log(` Found ${doctors.length} doctors`);

    // 1. Create Appointments for today and recent dates
    console.log(' Creating appointments...');
    const appointmentStatuses = ['scheduled', 'completed', 'cancelled', 'checked_in', 'triaged'];
    const appointmentReasons = ['General Consultation', 'Follow-up', 'Emergency', 'Routine Checkup', 'Specialist Consultation'];
    
    for (let i = 0; i < 100; i++) {
      const patient = getRandomItem(patients);
      const doctor = getRandomItem(doctors);
      const appointmentDate = getRandomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date());
      
      try {
        await query(
          `INSERT INTO emr.appointments 
           (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            tenantId,
            patient.id,
            doctor.id,
            appointmentDate.toISOString(),
            new Date(appointmentDate.getTime() + 30 * 60 * 1000).toISOString(), // +30 minutes
            getRandomItem(appointmentStatuses),
            getRandomItem(appointmentReasons)
          ]
        );
      } catch (error) {
        // Ignore duplicate or constraint errors
      }
    }

    // 2. Create Invoices for revenue data
    console.log(' Creating invoices and billing data...');
    const invoiceStatuses = ['paid', 'pending', 'cancelled'];
    const services = ['Consultation Fee', 'Lab Tests', 'X-Ray', 'ECG', 'Blood Test', 'Ultrasound', 'CT Scan', 'Medication'];
    
    for (let i = 0; i < 200; i++) {
      const patient = getRandomItem(patients);
      const invoiceDate = getRandomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
      const serviceCount = getRandomInt(1, 4);
      let totalAmount = 0;
      
      // Calculate total based on services
      for (let j = 0; j < serviceCount; j++) {
        totalAmount += getRandomFloat(50, 500);
      }
      
      try {
        await query(
          `INSERT INTO emr.invoices 
           (tenant_id, patient_id, total, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            tenantId,
            patient.id,
            totalAmount,
            getRandomItem(invoiceStatuses),
            invoiceDate.toISOString()
          ]
        );
      } catch (error) {
        // Ignore duplicate or constraint errors
      }
    }

    // 3. Create Service Requests for lab data
    console.log(' Creating lab service requests...');
    const labTests = ['Complete Blood Count', 'X-Ray Chest', 'ECG', 'Ultrasound Abdomen', 'MRI Brain', 'CT Scan', 'Lipid Profile', 'Liver Function Test'];
    const serviceStatuses = ['pending', 'completed', 'cancelled'];
    
    for (let i = 0; i < 150; i++) {
      const patient = getRandomItem(patients);
      const requestDate = getRandomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date());
      const isCritical = Math.random() > 0.9; // 10% critical
      
      try {
        await query(
          `INSERT INTO emr.service_requests 
           (tenant_id, patient_id, category, test_name, status, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            tenantId,
            patient.id,
            'lab',
            getRandomItem(labTests),
            getRandomItem(serviceStatuses),
            JSON.stringify({
              criticalFlag: isCritical,
              priority: isCritical ? 'high' : 'normal',
              orderedBy: getRandomItem(doctors).name,
              testDate: requestDate.toISOString()
            }),
            requestDate.toISOString()
          ]
        );
      } catch (error) {
        // Ignore duplicate or constraint errors
      }
    }

    // 4. Create Blood Bank data
    console.log(' Creating blood bank data...');
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    
    for (let i = 0; i < 40; i++) {
      try {
        await query(
          `INSERT INTO emr.blood_units 
           (tenant_id, blood_group, status, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [
            tenantId,
            getRandomItem(bloodGroups),
            getRandomItem(['available', 'reserved', 'used'])
          ]
        );
      } catch (error) {
        // Ignore duplicate or constraint errors
      }
    }

    // 5. Create Ambulance data
    console.log(' Creating ambulance fleet data...');
    const ambulanceStatuses = ['available', 'ONLINE', 'busy', 'maintenance'];
    
    for (let i = 0; i < 8; i++) {
      try {
        await query(
          `INSERT INTO emr.ambulances 
           (tenant_id, vehicle_number, status, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [
            tenantId,
            `AMB-${String(i + 1).padStart(3, '0')}`,
            getRandomItem(ambulanceStatuses)
          ]
        );
      } catch (error) {
        // Ignore duplicate or constraint errors
      }
    }

    // 6. Create Inventory data for pharmacy
    console.log(' Creating pharmacy inventory data...');
    const medications = [
      'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Aspirin', 'Insulin', 'Metformin',
      'Amlodipine', 'Atorvastatin', 'Omeprazole', 'Albuterol', 'Lisinopril',
      'Metoprolol', 'Losartan', 'Gabapentin', 'Sertraline', 'Levothyroxine'
    ];
    
    for (const med of medications) {
      const currentStock = getRandomInt(5, 200);
      const reorderLevel = getRandomInt(10, 50);
      
      try {
        await query(
          `INSERT INTO emr.inventory_items 
           (tenant_id, item_name, current_stock, reorder_level, unit, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [
            tenantId,
            med,
            currentStock,
            reorderLevel,
            'tablets'
          ]
        );
      } catch (error) {
        // Ignore duplicate or constraint errors
      }
    }

    // 7. Create Employee attendance data
    console.log(' Creating employee attendance data...');
    const attendanceStatuses = ['Present', 'Absent', 'On Leave', 'Half Day'];
    
    for (let i = 0; i < 30; i++) { // Last 30 days
      const attendanceDate = new Date();
      attendanceDate.setDate(attendanceDate.getDate() - i);
      
      for (const doctor of doctors) {
        try {
          await query(
            `INSERT INTO emr.attendance 
             (tenant_id, employee_id, date, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [
              tenantId,
              doctor.id,
              attendanceDate.toISOString().split('T')[0],
              getRandomItem(attendanceStatuses)
            ]
          );
        } catch (error) {
          // Ignore duplicate or constraint errors
        }
      }
    }

    // 8. Update some bed statuses to show occupancy
    console.log(' Updating bed occupancy data...');
    const bedStatuses = ['occupied', 'available', 'maintenance', 'reserved'];
    
    const bedsResult = await query(
      'SELECT id FROM emr.beds WHERE tenant_id = $1',
      [tenantId]
    );

    for (const bed of bedsResult.rows) {
      try {
        await query(
          `UPDATE emr.beds 
           SET status = $1, updated_at = NOW()
           WHERE id = $2`,
          [
            getRandomItem(bedStatuses),
            bed.id
          ]
        );
      } catch (error) {
        // Ignore errors
      }
    }

    // 9. Create some departments if they don't exist
    console.log(' Ensuring departments exist...');
    const departments = [
      'General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics',
      'Gynecology', 'Emergency', 'Radiology', 'Pathology'
    ];
    
    for (const dept of departments) {
      try {
        await query(
          `INSERT INTO emr.departments 
           (tenant_id, name, code, status, created_at, updated_at)
           VALUES ($1, $2, $3, 'active', NOW(), NOW())
           ON CONFLICT (tenant_id, name) DO NOTHING`,
          [
            tenantId,
            dept,
            dept.substring(0, 3).toUpperCase()
          ]
        );
      } catch (error) {
        // Ignore errors
      }
    }

    console.log('\n Dashboard data population completed!');
    console.log('\n Data Summary:');
    console.log(` Patients: ${patients.length}`);
    console.log(` Doctors: ${doctors.length}`);
    console.log(` Appointments: ~100 created`);
    console.log(` Invoices: ~200 created`);
    console.log(` Lab Requests: ~150 created`);
    console.log(` Blood Units: 40 created`);
    console.log(` Ambulances: 8 created`);
    console.log(` Inventory Items: ${medications.length} medications`);
    console.log(` Attendance Records: ${doctors.length * 30} created`);
    console.log(` Bed Occupancy: Updated for all beds`);

  } catch (error) {
    console.error(' Error populating dashboard data:', error);
    process.exit(1);
  }
}

// Run the script
populateDashboardData().then(() => {
  console.log('\n Dashboard data population completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error(' Script failed:', error);
  process.exit(1);
});
