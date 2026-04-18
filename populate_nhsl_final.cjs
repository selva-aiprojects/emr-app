const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Populating NHSL with 3 Months Data (Final Version) ===');
    
    const tenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
    const schemaName = 'nhsl';
    
    // Generate dates for the past 3 months
    const today = new Date();
    const threeMonthsAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    console.log(`Generating data from ${threeMonthsAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
    
    // 1. Get existing departments and staff
    console.log('\n=== Getting Existing Departments & Staff ===');
    const existingDepartments = await query(`SELECT id, name FROM ${schemaName}.departments WHERE tenant_id = $1`, [tenantId]);
    const existingStaff = await query(`SELECT id, name, department, designation FROM ${schemaName}.employees WHERE tenant_id = $1`, [tenantId]);
    
    console.log(`Found ${existingDepartments.rows.length} departments and ${existingStaff.rows.length} staff members`);
    
    // Separate doctors from staff
    const doctors = existingStaff.rows.filter(emp => 
      emp.designation.toLowerCase().includes('consultant') || 
      emp.designation.toLowerCase().includes('specialist') || 
      emp.designation.toLowerCase().includes('physician') ||
      emp.designation.toLowerCase().includes('surgeon')
    );
    
    console.log(`Found ${doctors.length} doctors for provider relationships`);
    
    // 2. Add Wards first (required for beds foreign key)
    console.log('\n=== Adding NHSL Wards ===');
    const wardIds = [];
    for (let i = 0; i < existingDepartments.rows.length; i++) {
      const wardId = crypto.randomUUID();
      wardIds.push(wardId);
      
      await query(`
        INSERT INTO ${schemaName}.wards (id, tenant_id, name, type, capacity, floor, base_rate, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        wardId,
        tenantId,
        `${existingDepartments.rows[i].name} Ward`,
        'General',
        20 + Math.floor(Math.random() * 30), // 20-50 beds per ward
        i + 1,
        1000 + Math.floor(Math.random() * 2000), // Base rate 1000-3000
        'active',
        new Date(),
        new Date()
      ]);
    }
    
    // 3. Add Patients (120 patients)
    console.log('\n=== Adding NHSL Patients ===');
    const patientIds = [];
    for (let i = 0; i < 120; i++) {
      const randomDate = new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime()));
      const patientId = crypto.randomUUID();
      patientIds.push(patientId);
      
      await query(`
        INSERT INTO ${schemaName}.patients (id, tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact, insurance, medical_history, ethnicity, language, birth_place, is_archived, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [
        patientId,
        tenantId,
        `NHSL${Date.now()}${String(i).padStart(3, '0')}`,
        ['Rahul', 'Priya', 'Amit', 'Anjali', 'Vikram', 'Kavita', 'Rajesh', 'Sunita', 'Deepak', 'Meena'][i % 10],
        ['Sharma', 'Gupta', 'Kumar', 'Verma', 'Singh', 'Joshi', 'Patel', 'Reddy', 'Nair', 'Iyer'][Math.floor(Math.random() * 10)],
        new Date(1960 + Math.floor(Math.random() * 50), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)],
        `98769${String(i + 1000).padStart(4, '0')}`,
        `patient${i + 1}@nhsl.local`,
        `Address ${i + 1}, ${['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'][Math.floor(Math.random() * 8)]}`,
        ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)],
        `Emergency ${i + 1} - 98769${String(i + 2000).padStart(4, '0')}`,
        ['NHSL Health Plus', 'NHSL Premium Care', 'NHSL Family Plan', 'NHSL Corporate', 'NHSL Senior Care'][Math.floor(Math.random() * 5)],
        JSON.stringify({ 
          conditions: [`Condition ${i + 1}`], 
          medications: [`Med ${i + 1}`],
          allergies: [`Allergy ${i + 1}`]
        }),
        ['Asian', 'Caucasian', 'African', 'Hispanic', 'Other'][Math.floor(Math.random() * 5)],
        'English',
        `${['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata'][Math.floor(Math.random() * 5)]}`,
        false,
        randomDate,
        randomDate
      ]);
    }
    
    // 4. Add Beds (25 beds)
    console.log('\n=== Adding NHSL Beds ===');
    const bedStatuses = ['occupied', 'available', 'maintenance', 'reserved'];
    const bedTypes = ['ICU', 'CCU', 'General', 'Private', 'Semi-Private', 'Deluxe', 'Suite', 'Emergency'];
    const bedIds = [];
    
    for (let i = 0; i < 25; i++) {
      const bedId = crypto.randomUUID();
      bedIds.push(bedId);
      
      await query(`
        INSERT INTO ${schemaName}.beds (id, tenant_id, ward_id, bed_number, type, status, patient_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        bedId,
        tenantId,
        wardIds[Math.floor(Math.random() * wardIds.length)],
        `NHSL-B${String(i + 1).padStart(3, '0')}`,
        bedTypes[Math.floor(Math.random() * bedTypes.length)],
        bedStatuses[Math.floor(Math.random() * bedStatuses.length)],
        null, // Will be updated for occupied beds
        new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime())),
        new Date()
      ]);
    }
    
    // 5. Update some beds to be occupied by patients
    console.log('\n=== Assigning Patients to Beds ===');
    const occupiedBedsCount = Math.floor(bedIds.length * 0.4); // 40% occupancy
    for (let i = 0; i < occupiedBedsCount; i++) {
      const randomBedId = bedIds[Math.floor(Math.random() * bedIds.length)];
      const randomPatientId = patientIds[Math.floor(Math.random() * patientIds.length)];
      
      await query(`
        UPDATE ${schemaName}.beds 
        SET patient_id = $1, status = 'occupied', updated_at = $2
        WHERE id = $3 AND patient_id IS NULL
      `, [randomPatientId, new Date(), randomBedId]);
    }
    
    // 6. Add Appointments (360 appointments)
    console.log('\n=== Adding NHSL Appointments ===');
    const statuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
    
    for (let i = 0; i < 360; i++) {
      const randomDate = new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime()));
      const scheduledStart = new Date(randomDate);
      scheduledStart.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
      const scheduledEnd = new Date(scheduledStart.getTime() + (30 + Math.floor(Math.random() * 90)) * 60000);
      
      await query(`
        INSERT INTO ${schemaName}.appointments (id, tenant_id, patient_id, provider_id, appointment_type, status, scheduled_start, scheduled_end, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        crypto.randomUUID(),
        tenantId,
        patientIds[Math.floor(Math.random() * patientIds.length)],
        doctors[Math.floor(Math.random() * doctors.length)].id,
        ['Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Check-up', 'Procedure', 'Therapy', 'Review'][Math.floor(Math.random() * 8)],
        statuses[Math.floor(Math.random() * statuses.length)],
        scheduledStart,
        scheduledEnd,
        `Appointment notes ${i + 1}`,
        randomDate,
        randomDate
      ]);
    }
    
    // 7. Add Invoices (240 invoices)
    console.log('\n=== Adding NHSL Invoices ===');
    const invoiceStatuses = ['paid', 'pending', 'partially_paid', 'cancelled'];
    
    for (let i = 0; i < 240; i++) {
      const randomDate = new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime()));
      const amount = 2000 + Math.floor(Math.random() * 50000); // Random amount between 2000-52000
      
      await query(`
        INSERT INTO ${schemaName}.invoices (id, tenant_id, patient_id, invoice_number, subtotal, tax, total, paid, status, issue_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        crypto.randomUUID(),
        tenantId,
        patientIds[Math.floor(Math.random() * patientIds.length)],
        `NHSL-${Date.now()}${String(i).padStart(3, '0')}`,
        amount * 0.9,
        amount * 0.1,
        amount,
        invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)] === 'paid' ? amount : (invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)] === 'partially_paid' ? amount * 0.5 : 0),
        invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)],
        randomDate,
        randomDate,
        randomDate
      ]);
    }
    
    // 8. Add Encounters (160 encounters)
    console.log('\n=== Adding NHSL Encounters ===');
    const encounterTypes = ['admission', 'discharge', 'transfer', 'consultation', 'emergency', 'surgery', 'procedure'];
    const encounterStatuses = ['active', 'completed', 'cancelled'];
    const medicalConditions = [
      'Hypertension', 'Diabetes Mellitus Type 2', 'Coronary Artery Disease', 'Asthma', 'COPD',
      'Pneumonia', 'Gastroenteritis', 'Peptic Ulcer', 'Migraine', 'Epilepsy',
      'Depression', 'Anxiety Disorder', 'Osteoarthritis', 'Rheumatoid Arthritis', 'Fracture',
      'UTI', 'Kidney Disease', 'Thyroid Disorder', 'Anemia', 'Skin Allergy',
      'Myocardial Infarction', 'Stroke', 'Sepsis', 'Trauma', 'Cardiac Arrest',
      'Cancer', 'Liver Disease', 'Pancreatitis', 'Gallstones', 'Appendicitis'
    ];
    
    for (let i = 0; i < 160; i++) {
      const randomDate = new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime()));
      const randomCondition = medicalConditions[Math.floor(Math.random() * medicalConditions.length)];
      const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
      const randomPatient = patientIds[Math.floor(Math.random() * patientIds.length)];
      
      await query(`
        INSERT INTO ${schemaName}.encounters (id, tenant_id, patient_id, provider_id, appointment_id, encounter_type, visit_date, start_time, end_time, chief_complaint, diagnosis, assessment, plan, status, vitals, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        crypto.randomUUID(),
        tenantId,
        randomPatient,
        randomDoctor.id,
        null,
        encounterTypes[Math.floor(Math.random() * encounterTypes.length)],
        randomDate,
        randomDate,
        new Date(randomDate.getTime() + (1 + Math.floor(Math.random() * 6)) * 60 * 60 * 1000),
        `Chief complaint ${i + 1}`,
        randomCondition,
        `Assessment for ${randomCondition}`,
        `Treatment plan for ${randomCondition}`,
        encounterStatuses[Math.floor(Math.random() * encounterStatuses.length)],
        JSON.stringify({
          blood_pressure: `${110 + Math.floor(Math.random() * 50)}/${70 + Math.floor(Math.random() * 30)}`,
          heart_rate: 60 + Math.floor(Math.random() * 60),
          temperature: (36 + Math.random() * 3).toFixed(1),
          respiratory_rate: 12 + Math.floor(Math.random() * 12),
          oxygen_saturation: 88 + Math.floor(Math.random() * 12)
        }),
        randomDate,
        randomDate
      ]);
    }
    
    console.log('\n=== NHSL 3-Month Data Population Complete! ===');
    
    // Final verification
    const finalCounts = await Promise.all([
      query(`SELECT COUNT(*) as count FROM ${schemaName}.departments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.employees WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.patients WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.appointments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM ${schemaName}.invoices WHERE tenant_id = $1 AND status = 'paid'`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.beds WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.beds WHERE tenant_id = $1 AND status = 'occupied'`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.encounters WHERE tenant_id = $1`, [tenantId])
    ]);
    
    console.log('\n=== NHSL Final System Counts ===');
    console.log('Total Departments:', finalCounts[0].rows[0].count);
    console.log('Total Staff:', finalCounts[1].rows[0].count);
    console.log('Total Patients:', finalCounts[2].rows[0].count);
    console.log('Total Appointments:', finalCounts[3].rows[0].count);
    console.log('Total Revenue:', finalCounts[4].rows[0].total);
    console.log('Total Beds:', finalCounts[5].rows[0].count);
    console.log('Occupied Beds:', finalCounts[6].rows[0].count);
    console.log('Total Encounters:', finalCounts[7].rows[0].count);
    
    console.log('\n✅ NHSL Healthcare System is now fully populated with 3 months of comprehensive data!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
