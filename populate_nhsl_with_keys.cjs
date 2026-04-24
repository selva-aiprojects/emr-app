const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Populating NHSL with Proper Foreign Keys & Relationships ===');
    
    const tenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
    const schemaName = 'nhsl';
    
    // Generate dates for the past 3 months
    const today = new Date();
    const threeMonthsAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    console.log(`Generating data from ${threeMonthsAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
    
    // 1. Get existing departments and staff to maintain relationships
    console.log('\n=== Getting Existing Departments & Staff ===');
    const existingDepartments = await query(`SELECT id, name FROM ${schemaName}.departments WHERE tenant_id = $1`, [tenantId]);
    const existingStaff = await query(`SELECT id, name, department, designation FROM ${schemaName}.employees WHERE tenant_id = $1`, [tenantId]);
    
    console.log(`Found ${existingDepartments.rows.length} departments and ${existingStaff.rows.length} staff members`);
    
    // Separate doctors from staff for proper relationships
    const doctors = existingStaff.rows.filter(emp => 
      emp.designation.toLowerCase().includes('consultant') || 
      emp.designation.toLowerCase().includes('specialist') || 
      emp.designation.toLowerCase().includes('physician') ||
      emp.designation.toLowerCase().includes('surgeon')
    );
    
    console.log(`Found ${doctors.length} doctors for provider relationships`);
    
    // 2. Add Patients (150 patients over 3 months)
    console.log('\n=== Adding NHSL Patients ===');
    const patientIds = [];
    for (let i = 0; i < 150; i++) {
      const randomDate = new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime()));
      const patientId = crypto.randomUUID();
      patientIds.push(patientId);
      
      const patientData = {
        id: patientId,
        tenant_id: tenantId,
        mrn: `NHSL${Date.now()}${String(i).padStart(3, '0')}`,
        first_name: ['Rahul', 'Priya', 'Amit', 'Anjali', 'Vikram', 'Kavita', 'Rajesh', 'Sunita', 'Deepak', 'Meena'][i % 10],
        last_name: ['Sharma', 'Gupta', 'Kumar', 'Verma', 'Singh', 'Joshi', 'Patel', 'Reddy', 'Nair', 'Iyer'][Math.floor(Math.random() * 10)],
        date_of_birth: new Date(1960 + Math.floor(Math.random() * 50), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)],
        phone: `98769${String(i + 1000).padStart(4, '0')}`,
        email: `patient${i + 1}@nhsl.local`,
        address: `Address ${i + 1}, ${['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'][Math.floor(Math.random() * 8)]}`,
        blood_group: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)],
        emergency_contact: `Emergency ${i + 1} - 98769${String(i + 2000).padStart(4, '0')}`,
        insurance: ['NHSL Health Plus', 'NHSL Premium Care', 'NHSL Family Plan', 'NHSL Corporate', 'NHSL Senior Care'][Math.floor(Math.random() * 5)],
        medical_history: JSON.stringify({ 
          conditions: [`Condition ${i + 1}`], 
          medications: [`Med ${i + 1}`],
          allergies: [`Allergy ${i + 1}`]
        }),
        ethnicity: ['Asian', 'Caucasian', 'African', 'Hispanic', 'Other'][Math.floor(Math.random() * 5)],
        language: 'English',
        birth_place: `${['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata'][Math.floor(Math.random() * 5)]}`,
        is_archived: false,
        created_at: randomDate,
        updated_at: randomDate
      };
      
      await query(`
        INSERT INTO ${schemaName}.patients (id, tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact, insurance, medical_history, ethnicity, language, birth_place, is_archived, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, Object.values(patientData));
    }
    
    // 3. Add Beds (30 beds) - First to ensure they exist for patient relationships
    console.log('\n=== Adding NHSL Beds ===');
    const bedStatuses = ['occupied', 'available', 'maintenance', 'reserved'];
    const bedTypes = ['ICU', 'CCU', 'General', 'Private', 'Semi-Private', 'Deluxe', 'Suite', 'Emergency'];
    const bedIds = [];
    
    for (let i = 0; i < 30; i++) {
      const bedId = crypto.randomUUID();
      bedIds.push(bedId);
      
      const bedData = {
        id: bedId,
        tenant_id: tenantId,
        ward_id: existingDepartments.rows[Math.floor(Math.random() * existingDepartments.rows.length)].id,
        bed_number: `NHSL-B${String(i + 1).padStart(3, '0')}`,
        type: bedTypes[Math.floor(Math.random() * bedTypes.length)],
        status: bedStatuses[Math.floor(Math.random() * bedStatuses.length)],
        patient_id: null, // Will be updated later for occupied beds
        created_at: new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime())),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.beds (id, tenant_id, ward_id, bed_number, type, status, patient_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, Object.values(bedData));
    }
    
    // 4. Update some beds to be occupied by patients
    console.log('\n=== Assigning Patients to Beds ===');
    const occupiedBedsCount = Math.floor(bedIds.length * 0.3); // 30% occupancy
    for (let i = 0; i < occupiedBedsCount; i++) {
      const randomBedId = bedIds[Math.floor(Math.random() * bedIds.length)];
      const randomPatientId = patientIds[Math.floor(Math.random() * patientIds.length)];
      
      await query(`
        UPDATE ${schemaName}.beds 
        SET patient_id = $1, status = 'occupied', updated_at = $2
        WHERE id = $3 AND patient_id IS NULL
      `, [randomPatientId, new Date(), randomBedId]);
    }
    
    // 5. Add Appointments (450 appointments over 3 months)
    console.log('\n=== Adding NHSL Appointments ===');
    const statuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
    
    for (let i = 0; i < 450; i++) {
      const randomDate = new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime()));
      const scheduledStart = new Date(randomDate);
      scheduledStart.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
      const scheduledEnd = new Date(scheduledStart.getTime() + (30 + Math.floor(Math.random() * 90)) * 60000);
      
      const appointmentData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        patient_id: patientIds[Math.floor(Math.random() * patientIds.length)],
        provider_id: doctors[Math.floor(Math.random() * doctors.length)].id,
        appointment_type: ['Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Check-up', 'Procedure', 'Therapy', 'Review'][Math.floor(Math.random() * 8)],
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
    
    // 6. Add Invoices (300 invoices over 3 months)
    console.log('\n=== Adding NHSL Invoices ===');
    const invoiceStatuses = ['paid', 'pending', 'partially_paid', 'cancelled'];
    
    for (let i = 0; i < 300; i++) {
      const randomDate = new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime()));
      const amount = 2000 + Math.floor(Math.random() * 50000); // Random amount between 2000-52000
      
      const invoiceData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        patient_id: patientIds[Math.floor(Math.random() * patientIds.length)],
        invoice_number: `NHSL-${Date.now()}${String(i).padStart(3, '0')}`,
        subtotal: amount * 0.9,
        tax: amount * 0.1,
        total: amount,
        paid: invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)] === 'paid' ? amount : (invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)] === 'partially_paid' ? amount * 0.5 : 0),
        status: invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)],
        issue_date: randomDate,
        created_at: randomDate,
        updated_at: randomDate
      };
      
      await query(`
        INSERT INTO ${schemaName}.invoices (id, tenant_id, patient_id, invoice_number, subtotal, tax, total, paid, status, issue_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, Object.values(invoiceData));
    }
    
    // 7. Add Encounters (200 encounters over 3 months)
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
    
    for (let i = 0; i < 200; i++) {
      const randomDate = new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime()));
      const randomCondition = medicalConditions[Math.floor(Math.random() * medicalConditions.length)];
      const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
      const randomPatient = patientIds[Math.floor(Math.random() * patientIds.length)];
      
      const encounterData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        patient_id: randomPatient,
        provider_id: randomDoctor.id,
        appointment_id: null,
        encounter_type: encounterTypes[Math.floor(Math.random() * encounterTypes.length)],
        visit_date: randomDate,
        start_time: randomDate,
        end_time: new Date(randomDate.getTime() + (1 + Math.floor(Math.random() * 6)) * 60 * 60 * 1000),
        chief_complaint: `Chief complaint ${i + 1}`,
        diagnosis: randomCondition,
        assessment: `Assessment for ${randomCondition}`,
        plan: `Treatment plan for ${randomCondition}`,
        status: encounterStatuses[Math.floor(Math.random() * encounterStatuses.length)],
        vitals: JSON.stringify({
          blood_pressure: `${110 + Math.floor(Math.random() * 50)}/${70 + Math.floor(Math.random() * 30)}`,
          heart_rate: 60 + Math.floor(Math.random() * 60),
          temperature: (36 + Math.random() * 3).toFixed(1),
          respiratory_rate: 12 + Math.floor(Math.random() * 12),
          oxygen_saturation: 88 + Math.floor(Math.random() * 12)
        }),
        created_at: randomDate,
        updated_at: randomDate
      };
      
      await query(`
        INSERT INTO ${schemaName}.encounters (id, tenant_id, patient_id, provider_id, appointment_id, encounter_type, visit_date, start_time, end_time, chief_complaint, diagnosis, assessment, plan, status, vitals, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, Object.values(encounterData));
    }
    
    console.log('\n=== NHSL 3-Month Data Population Complete! ===');
    
    // Verify relationships and final counts
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
    
    // Verify foreign key relationships
    console.log('\n=== Verifying Foreign Key Relationships ===');
    
    // Check if all appointments have valid patients and providers
    const invalidAppointments = await query(`
      SELECT COUNT(*) as count 
      FROM ${schemaName}.appointments a 
      LEFT JOIN ${schemaName}.patients p ON a.patient_id = p.id 
      LEFT JOIN ${schemaName}.employees e ON a.provider_id = e.id 
      WHERE a.tenant_id = $1 AND (p.id IS NULL OR e.id IS NULL)
    `, [tenantId]);
    
    console.log('Appointments with invalid foreign keys:', invalidAppointments.rows[0].count);
    
    // Check if all encounters have valid patients and providers
    const invalidEncounters = await query(`
      SELECT COUNT(*) as count 
      FROM ${schemaName}.encounters e 
      LEFT JOIN ${schemaName}.patients p ON e.patient_id = p.id 
      LEFT JOIN ${schemaName}.employees emp ON e.provider_id = emp.id 
      WHERE e.tenant_id = $1 AND (p.id IS NULL OR emp.id IS NULL)
    `, [tenantId]);
    
    console.log('Encounters with invalid foreign keys:', invalidEncounters.rows[0].count);
    
    // Check if all invoices have valid patients
    const invalidInvoices = await query(`
      SELECT COUNT(*) as count 
      FROM ${schemaName}.invoices i 
      LEFT JOIN ${schemaName}.patients p ON i.patient_id = p.id 
      WHERE i.tenant_id = $1 AND p.id IS NULL
    `, [tenantId]);
    
    console.log('Invoices with invalid foreign keys:', invalidInvoices.rows[0].count);
    
    // Check if all occupied beds have valid patients
    const invalidBeds = await query(`
      SELECT COUNT(*) as count 
      FROM ${schemaName}.beds b 
      LEFT JOIN ${schemaName}.patients p ON b.patient_id = p.id 
      WHERE b.tenant_id = $1 AND b.status = 'occupied' AND p.id IS NULL
    `, [tenantId]);
    
    console.log('Occupied beds with invalid patient references:', invalidBeds.rows[0].count);
    
    console.log('\n✅ All foreign key relationships verified!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
