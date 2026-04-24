const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Populating Starlight Dashboard with Monthly Data ===');
    
    const tenantId = 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa';
    const schemaName = 'smcmega';
    
    // Generate dates for the past month
    const today = new Date();
    const oneMonthAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    console.log(`Generating data from ${oneMonthAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
    
    // 1. Add more patients (total 50 patients)
    console.log('\n=== Adding 40 more patients ===');
    for (let i = 0; i < 40; i++) {
      const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime()));
      const patientData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        mrn: `MRN${String(i + 11).padStart(6, '0')}`,
        first_name: `Patient${i + 11}`,
        last_name: `Test${i + 11}`,
        date_of_birth: new Date(1980 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)],
        phone: `9876543${String(i + 11).padStart(4, '0')}`,
        email: `patient${i + 11}@test.com`,
        address: `Address ${i + 11}, Test City`,
        blood_group: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)],
        emergency_contact: `Emergency ${i + 11} - 9876543${String(i + 100).padStart(4, '0')}`,
        insurance: `Insurance ${i + 11}`,
        medical_history: JSON.stringify({ conditions: [`Condition ${i + 1}`], medications: [`Med ${i + 1}`] }),
        ethnicity: ['Asian', 'Caucasian', 'African', 'Hispanic', 'Other'][Math.floor(Math.random() * 5)],
        language: 'English',
        birth_place: `City ${i + 11}`,
        is_archived: false,
        created_at: randomDate,
        updated_at: randomDate
      };
      
      await query(`
        INSERT INTO ${schemaName}.patients (id, tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact, insurance, medical_history, ethnicity, language, birth_place, is_archived, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, Object.values(patientData));
    }
    
    // 2. Add more appointments (total 100 appointments)
    console.log('\n=== Adding 90 more appointments ===');
    const statuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
    const doctors = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Davis'];
    
    for (let i = 0; i < 90; i++) {
      const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime()));
      const scheduledStart = new Date(randomDate);
      scheduledStart.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
      const scheduledEnd = new Date(scheduledStart.getTime() + (30 + Math.floor(Math.random() * 60)) * 60000);
      
      const appointmentData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        patient_id: `patient-${Math.floor(Math.random() * 50) + 1}`,
        provider_id: `doctor-${Math.floor(Math.random() * 5) + 1}`,
        appointment_type: ['Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Check-up'][Math.floor(Math.random() * 5)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        notes: `Appointment notes ${i + 1}`,
        created_at: randomDate,
        updated_at: randomDate
      };
      
      await query(`
        INSERT INTO ${schemaName}.appointments (id, tenant_id, patient_id, provider_id, appointment_type, status, scheduled_start, scheduled_end, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, Object.values(appointmentData));
    }
    
    // 3. Add more invoices (total 80 invoices with varying amounts)
    console.log('\n=== Adding 70 more invoices ===');
    const invoiceStatuses = ['paid', 'pending', 'partially_paid', 'cancelled'];
    
    for (let i = 0; i < 70; i++) {
      const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime()));
      const amount = 1000 + Math.floor(Math.random() * 15000); // Random amount between 1000-16000
      
      const invoiceData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        patient_id: `patient-${Math.floor(Math.random() * 50) + 1}`,
        invoice_number: `INV-${String(1000 + i).padStart(6, '0')}`,
        total: amount,
        status: invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)],
        due_date: new Date(randomDate.getTime() + (7 + Math.floor(Math.random() * 30)) * 24 * 60 * 60 * 1000),
        created_at: randomDate,
        updated_at: randomDate
      };
      
      await query(`
        INSERT INTO ${schemaName}.invoices (id, tenant_id, patient_id, invoice_number, total, status, due_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, Object.values(invoiceData));
    }
    
    // 4. Add more beds (total 20 beds)
    console.log('\n=== Adding 15 more beds ===');
    const bedStatuses = ['occupied', 'available', 'maintenance', 'reserved'];
    const bedTypes = ['ICU', 'General', 'Private', 'Semi-Private', 'Emergency'];
    
    for (let i = 0; i < 15; i++) {
      const bedData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        bed_number: `B${String(i + 6).padStart(3, '0')}`,
        ward_id: `ward-${Math.floor(Math.random() * 5) + 1}`,
        bed_type: bedTypes[Math.floor(Math.random() * bedTypes.length)],
        status: bedStatuses[Math.floor(Math.random() * bedStatuses.length)],
        hourly_rate: 500 + Math.floor(Math.random() * 2000),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.beds (id, tenant_id, bed_number, ward_id, bed_type, status, hourly_rate, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, Object.values(bedData));
    }
    
    // 5. Add encounters/admissions
    console.log('\n=== Adding 30 encounters ===');
    const encounterTypes = ['admission', 'discharge', 'transfer', 'consultation', 'emergency'];
    const encounterStatuses = ['active', 'completed', 'cancelled'];
    
    for (let i = 0; i < 30; i++) {
      const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime()));
      
      const encounterData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        patient_id: `patient-${Math.floor(Math.random() * 50) + 1}`,
        encounter_type: encounterTypes[Math.floor(Math.random() * encounterTypes.length)],
        status: encounterStatuses[Math.floor(Math.random() * encounterStatuses.length)],
        diagnosis: `Diagnosis ${i + 1}`,
        created_at: randomDate,
        updated_at: randomDate
      };
      
      await query(`
        INSERT INTO ${schemaName}.encounters (id, tenant_id, patient_id, encounter_type, status, diagnosis, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, Object.values(encounterData));
    }
    
    // 6. Add lab service requests
    console.log('\n=== Adding 50 lab service requests ===');
    const labCategories = ['lab', 'radiology', 'pathology'];
    const labStatuses = ['pending', 'completed', 'cancelled'];
    
    for (let i = 0; i < 50; i++) {
      const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime()));
      
      const serviceData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        patient_id: `patient-${Math.floor(Math.random() * 50) + 1}`,
        category: 'lab',
        service_type: `Lab Test ${i + 1}`,
        status: labStatuses[Math.floor(Math.random() * labStatuses.length)],
        requested_by: `doctor-${Math.floor(Math.random() * 5) + 1}`,
        created_at: randomDate,
        updated_at: randomDate
      };
      
      await query(`
        INSERT INTO ${schemaName}.service_requests (id, tenant_id, patient_id, category, service_type, status, requested_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, Object.values(serviceData));
    }
    
    // 7. Add ambulances
    console.log('\n=== Adding 5 ambulances ===');
    const ambulanceStatuses = ['available', 'busy', 'maintenance', 'out_of_service'];
    
    for (let i = 0; i < 5; i++) {
      const ambulanceData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        vehicle_number: `AMB-${String(i + 1).padStart(3, '0')}`,
        driver_name: `Driver ${i + 1}`,
        status: ambulanceStatuses[Math.floor(Math.random() * ambulanceStatuses.length)],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.ambulances (id, tenant_id, vehicle_number, driver_name, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, Object.values(ambulanceData));
    }
    
    // 8. Add blood bank inventory
    console.log('\n=== Adding blood bank inventory ===');
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    
    for (let i = 0; i < bloodGroups.length; i++) {
      const bloodData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        blood_group: bloodGroups[i],
        units: Math.floor(Math.random() * 50) + 10, // 10-60 units
        expiry_date: new Date(today.getTime() + (30 + Math.floor(Math.random() * 60)) * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.blood_bank (id, tenant_id, blood_group, units, expiry_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, Object.values(bloodData));
    }
    
    console.log('\n=== Monthly Data Population Complete! ===');
    
    // Check final counts
    const finalCounts = await Promise.all([
      query(`SELECT COUNT(*) as count FROM ${schemaName}.patients WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.appointments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM ${schemaName}.invoices WHERE tenant_id = $1 AND status = 'paid'`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.beds WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.beds WHERE tenant_id = $1 AND status = 'occupied'`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.encounters WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.service_requests WHERE tenant_id = $1 AND category = 'lab' AND status = 'pending'`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.ambulances WHERE tenant_id = $1 AND status = 'available'`, [tenantId]),
      query(`SELECT COALESCE(SUM(units), 0) as total FROM ${schemaName}.blood_bank WHERE tenant_id = $1`, [tenantId])
    ]);
    
    console.log('\n=== Updated Dashboard Counts ===');
    console.log('Total Patients:', finalCounts[0].rows[0].count);
    console.log('Total Appointments:', finalCounts[1].rows[0].count);
    console.log('Total Revenue:', finalCounts[2].rows[0].total);
    console.log('Total Beds:', finalCounts[3].rows[0].count);
    console.log('Occupied Beds:', finalCounts[4].rows[0].count);
    console.log('Total Encounters:', finalCounts[5].rows[0].count);
    console.log('Pending Lab Tests:', finalCounts[6].rows[0].count);
    console.log('Available Ambulances:', finalCounts[7].rows[0].count);
    console.log('Blood Bank Units:', finalCounts[8].rows[0].total);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
