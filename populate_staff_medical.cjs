const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Populating Starlight with Staff, Departments & Medical Data ===');
    
    const tenantId = 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa';
    const schemaName = 'smcmega';
    
    // Generate dates for the past month
    const today = new Date();
    const oneMonthAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    console.log(`Generating data from ${oneMonthAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
    
    // 1. Add Departments
    console.log('\n=== Adding Departments ===');
    const departments = [
      { name: 'Emergency Department', description: '24/7 emergency care services', floor: 'Ground Floor' },
      { name: 'Intensive Care Unit (ICU)', description: 'Critical care monitoring', floor: '2nd Floor' },
      { name: 'General Ward', description: 'General patient care', floor: '3rd Floor' },
      { name: 'Maternity Ward', description: 'Maternal and newborn care', floor: '4th Floor' },
      { name: 'Pediatric Department', description: 'Child healthcare services', floor: '1st Floor' },
      { name: 'Surgical Department', description: 'Operating theaters and surgery', floor: '2nd Floor' },
      { name: 'Radiology Department', description: 'Medical imaging services', floor: 'Ground Floor' },
      { name: 'Laboratory Department', description: 'Diagnostic testing services', floor: 'Ground Floor' },
      { name: 'Pharmacy Department', description: 'Medication dispensing', floor: 'Ground Floor' },
      { name: 'Outpatient Department', description: 'Consultation services', floor: '1st Floor' }
    ];
    
    const departmentIds = [];
    for (const dept of departments) {
      const deptId = crypto.randomUUID();
      departmentIds.push(deptId);
      
      await query(`
        INSERT INTO ${schemaName}.departments (id, tenant_id, name, description, floor, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [deptId, tenantId, dept.name, dept.description, dept.floor, new Date(), new Date()]);
    }
    
    // 2. Add Doctors
    console.log('\n=== Adding Doctors ===');
    const doctorSpecializations = [
      'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Gynecology', 
      'General Surgery', 'Internal Medicine', 'Emergency Medicine', 'Anesthesiology',
      'Radiology', 'Pathology', 'Psychiatry', 'Dermatology', 'Ophthalmology', 'ENT'
    ];
    
    const doctorIds = [];
    for (let i = 0; i < 25; i++) {
      const doctorId = crypto.randomUUID();
      doctorIds.push(doctorId);
      
      const specialization = doctorSpecializations[Math.floor(Math.random() * doctorSpecializations.length)];
      const departmentIndex = Math.floor(Math.random() * departments.length);
      
      const doctorData = {
        id: doctorId,
        tenant_id: tenantId,
        department_id: departmentIds[departmentIndex],
        first_name: `Dr. ${['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary'][i % 10]}`,
        last_name: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'][Math.floor(Math.random() * 10)],
        email: `doctor${i + 1}@smcmega.local`,
        phone: `9876543${String(i + 200).padStart(4, '0')}`,
        specialization: specialization,
        designation: ['Senior Doctor', 'Consultant', 'Specialist', 'Chief Physician'][Math.floor(Math.random() * 4)],
        qualification: ['MBBS', 'MD', 'MS', 'DM'][Math.floor(Math.random() * 4)],
        experience_years: 5 + Math.floor(Math.random() * 25),
        license_number: `LIC${String(10000 + i).padStart(8, '0')}`,
        availability: ['Available', 'On Call', 'Busy', 'On Leave'][Math.floor(Math.random() * 4)],
        consultation_fee: 500 + Math.floor(Math.random() * 2000),
        created_at: new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime())),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.employees (id, tenant_id, department_id, first_name, last_name, email, phone, designation, specialization, qualification, experience_years, license_number, availability, consultation_fee, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, Object.values(doctorData));
    }
    
    // 3. Add Nurses
    console.log('\n=== Adding Nurses ===');
    const nurseIds = [];
    for (let i = 0; i < 35; i++) {
      const nurseId = crypto.randomUUID();
      nurseIds.push(nurseId);
      
      const departmentIndex = Math.floor(Math.random() * departments.length);
      
      const nurseData = {
        id: nurseId,
        tenant_id: tenantId,
        department_id: departmentIds[departmentIndex],
        first_name: ['Nurse', 'Senior Nurse', 'Head Nurse', 'Staff Nurse'][Math.floor(Math.random() * 4)] + ' ' + ['Alice', 'Betty', 'Carol', 'Diana', 'Eva', 'Fiona', 'Grace', 'Helen'][i % 8],
        last_name: ['Wilson', 'Taylor', 'Moore', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris'][Math.floor(Math.random() * 8)],
        email: `nurse${i + 1}@smcmega.local`,
        phone: `9876543${String(i + 300).padStart(4, '0')}`,
        designation: ['Registered Nurse', 'Senior Nurse', 'Nurse Practitioner', 'Head Nurse'][Math.floor(Math.random() * 4)],
        specialization: ['Critical Care', 'Emergency', 'Surgical', 'Pediatric', 'General'][Math.floor(Math.random() * 5)],
        qualification: ['BSc Nursing', 'MSc Nursing', 'Post Basic BSc'][Math.floor(Math.random() * 3)],
        experience_years: 2 + Math.floor(Math.random() * 20),
        license_number: `NUR${String(20000 + i).padStart(8, '0')}`,
        availability: ['Available', 'On Call', 'Busy', 'On Leave'][Math.floor(Math.random() * 4)],
        shift_type: ['Day', 'Night', 'Rotating'][Math.floor(Math.random() * 3)],
        created_at: new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime())),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.employees (id, tenant_id, department_id, first_name, last_name, email, phone, designation, specialization, qualification, experience_years, license_number, availability, shift_type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, Object.values(nurseData));
    }
    
    // 4. Add Other Staff (Administrative, Support, etc.)
    console.log('\n=== Adding Administrative & Support Staff ===');
    const staffRoles = [
      'Hospital Administrator', 'Medical Records Officer', 'Billing Specialist', 'Receptionist',
      'Lab Technician', 'Radiology Technician', 'Pharmacist', 'Medical Coder',
      'Health Information Manager', 'Patient Coordinator', 'Ward Clerk', 'Supply Manager'
    ];
    
    const staffIds = [];
    for (let i = 0; i < 20; i++) {
      const staffId = crypto.randomUUID();
      staffIds.push(staffId);
      
      const departmentIndex = Math.floor(Math.random() * departments.length);
      
      const staffData = {
        id: staffId,
        tenant_id: tenantId,
        department_id: departmentIds[departmentIndex],
        first_name: ['Admin', 'Staff', 'Officer', 'Coordinator', 'Manager', 'Specialist', 'Clerk', 'Assistant'][Math.floor(Math.random() * 8)] + ' ' + ['Alex', 'Ben', 'Chris', 'Diana', 'Eric', 'Frank', 'Grace', 'Henry'][i % 8],
        last_name: ['Clark', 'Lewis', 'Walker', 'Hall', 'Young', 'King', 'Wright', 'Lopez'][Math.floor(Math.random() * 8)],
        email: `staff${i + 1}@smcmega.local`,
        phone: `9876543${String(i + 400).padStart(4, '0')}`,
        designation: staffRoles[Math.floor(Math.random() * staffRoles.length)],
        specialization: 'Healthcare Administration',
        qualification: ['BHA', 'MHA', 'MBA', 'BCom', 'BSc'][Math.floor(Math.random() * 5)],
        experience_years: 1 + Math.floor(Math.random() * 15),
        license_number: `STF${String(30000 + i).padStart(8, '0')}`,
        availability: ['Available', 'Busy', 'On Leave'][Math.floor(Math.random() * 3)],
        created_at: new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime())),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.employees (id, tenant_id, department_id, first_name, last_name, email, phone, designation, specialization, qualification, experience_years, license_number, availability, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, Object.values(staffData));
    }
    
    // 5. Add Diseases/Medical Conditions
    console.log('\n=== Adding Diseases/Medical Conditions ===');
    const diseases = [
      // Common diseases
      { name: 'Hypertension', category: 'Cardiovascular', severity: 'Chronic', icd_code: 'I10' },
      { name: 'Diabetes Mellitus Type 2', category: 'Endocrine', severity: 'Chronic', icd_code: 'E11' },
      { name: 'Coronary Artery Disease', category: 'Cardiovascular', severity: 'Chronic', icd_code: 'I25' },
      { name: 'Asthma', category: 'Respiratory', severity: 'Chronic', icd_code: 'J45' },
      { name: 'COPD', category: 'Respiratory', severity: 'Chronic', icd_code: 'J44' },
      { name: 'Pneumonia', category: 'Respiratory', severity: 'Acute', icd_code: 'J18' },
      { name: 'Gastroenteritis', category: 'Gastrointestinal', severity: 'Acute', icd_code: 'K09' },
      { name: 'Peptic Ulcer', category: 'Gastrointestinal', severity: 'Chronic', icd_code: 'K27' },
      { name: 'Migraine', category: 'Neurological', severity: 'Chronic', icd_code: 'G43' },
      { name: 'Epilepsy', category: 'Neurological', severity: 'Chronic', icd_code: 'G40' },
      { name: 'Depression', category: 'Mental Health', severity: 'Chronic', icd_code: 'F32' },
      { name: 'Anxiety Disorder', category: 'Mental Health', severity: 'Chronic', icd_code: 'F41' },
      { name: 'Osteoarthritis', category: 'Musculoskeletal', severity: 'Chronic', icd_code: 'M19' },
      { name: 'Rheumatoid Arthritis', category: 'Musculoskeletal', severity: 'Chronic', icd_code: 'M06' },
      { name: 'Fracture', category: 'Musculoskeletal', severity: 'Acute', icd_code: 'S72' },
      { name: 'UTI', category: 'Urological', severity: 'Acute', icd_code: 'N39' },
      { name: 'Kidney Disease', category: 'Urological', severity: 'Chronic', icd_code: 'N18' },
      { name: 'Thyroid Disorder', category: 'Endocrine', severity: 'Chronic', icd_code: 'E03' },
      { name: 'Anemia', category: 'Hematological', severity: 'Chronic', icd_code: 'D64' },
      { name: 'Skin Allergy', category: 'Dermatological', severity: 'Acute', icd_code: 'L23' },
      // Emergency conditions
      { name: 'Myocardial Infarction', category: 'Cardiovascular', severity: 'Emergency', icd_code: 'I21' },
      { name: 'Stroke', category: 'Neurological', severity: 'Emergency', icd_code: 'I63' },
      { name: 'Sepsis', category: 'Infectious', severity: 'Emergency', icd_code: 'A41' },
      { name: 'Trauma', category: 'Injury', severity: 'Emergency', icd_code: 'T07' },
      { name: 'Cardiac Arrest', category: 'Cardiovascular', severity: 'Emergency', icd_code: 'I46' },
      // Pediatric conditions
      { name: 'Common Cold', category: 'Respiratory', severity: 'Acute', icd_code: 'J00' },
      { name: 'Chickenpox', category: 'Infectious', severity: 'Acute', icd_code: 'B01' },
      { name: 'Measles', category: 'Infectious', severity: 'Acute', icd_code: 'B06' },
      { name: 'Mumps', category: 'Infectious', severity: 'Acute', icd_code: 'B26' },
      { name: 'Rubella', category: 'Infectious', severity: 'Acute', icd_code: 'B06' }
    ];
    
    const diseaseIds = [];
    for (const disease of diseases) {
      const diseaseId = crypto.randomUUID();
      diseaseIds.push(diseaseId);
      
      await query(`
        INSERT INTO ${schemaName}.diseases (id, tenant_id, name, category, severity, icd_code, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [diseaseId, tenantId, disease.name, disease.category, disease.severity, disease.icd_code, new Date(), new Date()]);
    }
    
    // 6. Update existing encounters with diseases and doctors
    console.log('\n=== Updating Encounters with Diseases and Doctors ===');
    const existingPatients = await query(`SELECT id FROM ${schemaName}.patients WHERE tenant_id = $1`, [tenantId]);
    const allPatientIds = existingPatients.rows.map(p => p.id);
    
    // Get existing encounters
    const existingEncounters = await query(`SELECT id, patient_id FROM ${schemaName}.encounters WHERE tenant_id = $1`, [tenantId]);
    
    for (const encounter of existingEncounters.rows) {
      const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
      const randomDoctor = doctorIds[Math.floor(Math.random() * doctorIds.length)];
      
      await query(`
        UPDATE ${schemaName}.encounters 
        SET diagnosis = $1, 
            provider_id = $2,
            visit_date = $3,
            start_time = $4,
            end_time = $5,
            updated_at = $6
        WHERE id = $7
      `, [
        randomDisease.name,
        randomDoctor,
        new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime())),
        new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime())),
        new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime()) + (2 * 60 * 60 * 1000)), // +2 hours
        new Date(),
        encounter.id
      ]);
    }
    
    // 7. Add new encounters with diseases
    console.log('\n=== Adding New Medical Encounters ===');
    for (let i = 0; i < 50; i++) {
      const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime()));
      const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
      const randomDoctor = doctorIds[Math.floor(Math.random() * doctorIds.length)];
      const randomPatient = allPatientIds[Math.floor(Math.random() * allPatientIds.length)];
      
      const encounterData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        patient_id: randomPatient,
        provider_id: randomDoctor,
        appointment_id: null,
        encounter_type: ['consultation', 'admission', 'emergency', 'follow-up'][Math.floor(Math.random() * 4)],
        visit_date: randomDate,
        start_time: randomDate,
        end_time: new Date(randomDate.getTime() + (1 + Math.floor(Math.random() * 4)) * 60 * 60 * 1000),
        chief_complaint: `Chief complaint ${i + 1}`,
        diagnosis: randomDisease.name,
        assessment: `Assessment for ${randomDisease.name}`,
        plan: `Treatment plan for ${randomDisease.name}`,
        status: ['completed', 'active', 'cancelled'][Math.floor(Math.random() * 3)],
        vitals: JSON.stringify({
          blood_pressure: `${120 + Math.floor(Math.random() * 40)}/${80 + Math.floor(Math.random() * 20)}`,
          heart_rate: 60 + Math.floor(Math.random() * 40),
          temperature: (36 + Math.random() * 2).toFixed(1),
          respiratory_rate: 12 + Math.floor(Math.random() * 8),
          oxygen_saturation: 95 + Math.floor(Math.random() * 5)
        }),
        created_at: randomDate,
        updated_at: randomDate
      };
      
      await query(`
        INSERT INTO ${schemaName}.encounters (id, tenant_id, patient_id, provider_id, appointment_id, encounter_type, visit_date, start_time, end_time, chief_complaint, diagnosis, assessment, plan, status, vitals, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, Object.values(encounterData));
    }
    
    console.log('\n=== Staff & Medical Data Population Complete! ===');
    
    // Check final counts
    const finalCounts = await Promise.all([
      query(`SELECT COUNT(*) as count FROM ${schemaName}.departments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.employees WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.employees WHERE tenant_id = $1 AND designation ILIKE '%Dr%' OR designation ILIKE '%Doctor%'`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.employees WHERE tenant_id = $1 AND designation ILIKE '%Nurse%'`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.diseases WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.encounters WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(DISTINCT provider_id) as count FROM ${schemaName}.encounters WHERE tenant_id = $1 AND provider_id IS NOT NULL`, [tenantId])
    ]);
    
    console.log('\n=== Updated System Counts ===');
    console.log('Total Departments:', finalCounts[0].rows[0].count);
    console.log('Total Staff:', finalCounts[1].rows[0].count);
    console.log('Total Doctors:', finalCounts[2].rows[0].count);
    console.log('Total Nurses:', finalCounts[3].rows[0].count);
    console.log('Total Diseases:', finalCounts[4].rows[0].count);
    console.log('Total Encounters:', finalCounts[5].rows[0].count);
    console.log('Active Doctors in Encounters:', finalCounts[6].rows[0].count);
    
    console.log('\n=== Staff Breakdown ===');
    const staffBreakdown = await query(`
      SELECT designation, COUNT(*) as count 
      FROM ${schemaName}.employees 
      WHERE tenant_id = $1 
      GROUP BY designation 
      ORDER BY count DESC
    `, [tenantId]);
    
    staffBreakdown.rows.forEach(row => {
      console.log(`${row.designation}: ${row.count}`);
    });
    
    console.log('\n=== Disease Categories ===');
    const diseaseBreakdown = await query(`
      SELECT category, COUNT(*) as count 
      FROM ${schemaName}.diseases 
      WHERE tenant_id = $1 
      GROUP BY category 
      ORDER BY count DESC
    `, [tenantId]);
    
    diseaseBreakdown.rows.forEach(row => {
      console.log(`${row.category}: ${row.count} diseases`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
