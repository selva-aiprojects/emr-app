const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Populating NHSL with 3 Months Comprehensive Data ===');
    
    const tenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
    const schemaName = 'nhsl';
    
    // Generate dates for the past 3 months
    const today = new Date();
    const threeMonthsAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    console.log(`Generating data from ${threeMonthsAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
    
    // 1. Add Departments
    console.log('\n=== Adding NHSL Departments ===');
    const departments = [
      { name: 'Emergency & Trauma Care', description: '24/7 emergency and trauma services', code: 'ER', head: 'Dr. Kumar' },
      { name: 'Intensive Care Unit', description: 'Critical care and ICU services', code: 'ICU', head: 'Dr. Sharma' },
      { name: 'Cardiology Department', description: 'Heart and cardiovascular care', code: 'CARD', head: 'Dr. Patel' },
      { name: 'Neurology Department', description: 'Brain and nervous system care', code: 'NEURO', head: 'Dr. Singh' },
      { name: 'Orthopedics Department', description: 'Bone and joint care', code: 'ORTHO', head: 'Dr. Gupta' },
      { name: 'Pediatrics Department', description: 'Child healthcare services', code: 'PED', head: 'Dr. Reddy' },
      { name: 'Maternity & Gynecology', description: 'Women and newborn care', code: 'GYNE', head: 'Dr. Verma' },
      { name: 'Surgical Department', description: 'Operating theaters and surgery', code: 'SURG', head: 'Dr. Joshi' },
      { name: 'Radiology & Imaging', description: 'Medical imaging and diagnostics', code: 'RAD', head: 'Dr. Mehta' },
      { name: 'Laboratory Services', description: 'Diagnostic testing and pathology', code: 'LAB', head: 'Dr. Shah' },
      { name: 'Pharmacy Department', description: 'Medication dispensing and management', code: 'PHARM', head: 'Dr. Desai' },
      { name: 'General Medicine', description: 'Primary and internal medicine', code: 'MED', head: 'Dr. Nair' },
      { name: 'Oncology Department', description: 'Cancer treatment and care', code: 'ONCO', head: 'Dr. Iyer' },
      { name: 'Nephrology Department', description: 'Kidney and dialysis services', code: 'NEPH', head: 'Dr. Rao' },
      { name: 'Physiotherapy & Rehab', description: 'Rehabilitation and physical therapy', code: 'REHAB', head: 'Dr. Pillai' }
    ];
    
    const departmentIds = [];
    for (const dept of departments) {
      const deptId = crypto.randomUUID();
      departmentIds.push(deptId);
      
      await query(`
        INSERT INTO ${schemaName}.departments (id, tenant_id, name, code, description, head_of_dept, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [deptId, tenantId, dept.name, dept.code, dept.description, dept.head, true, new Date(), new Date()]);
    }
    
    // 2. Add Comprehensive Staff (Doctors, Nurses, Admin, Support)
    console.log('\n=== Adding NHSL Staff ===');
    const staffIds = [];
    
    // Doctors (40 doctors)
    const doctorSpecializations = [
      'Cardiology', 'Interventional Cardiology', 'Electrophysiology', 'Neurology', 'Neurosurgery',
      'Orthopedics', 'Joint Replacement', 'Spine Surgery', 'Pediatrics', 'Neonatology',
      'Gynecology', 'Obstetrics', 'General Surgery', 'Laparoscopic Surgery', 'Cardiothoracic Surgery',
      'Anesthesiology', 'Radiology', 'Interventional Radiology', 'Pathology', 'Clinical Pathology',
      'Internal Medicine', 'Critical Care', 'Pulmonology', 'Gastroenterology', 'Hepatology',
      'Nephrology', 'Dialysis', 'Oncology', 'Radiation Oncology', 'Hematology',
      'Endocrinology', 'Diabetology', 'Rheumatology', 'Dermatology', 'Psychiatry',
      'Ophthalmology', 'ENT', 'Dentistry', 'Physiotherapy', 'Rehabilitation Medicine'
    ];
    
    for (let i = 0; i < 40; i++) {
      const staffId = crypto.randomUUID();
      staffIds.push(staffId);
      
      const specialization = doctorSpecializations[i % doctorSpecializations.length];
      const departmentIndex = Math.floor(Math.random() * departments.length);
      
      const staffData = {
        id: staffId,
        tenant_id: tenantId,
        code: `DOC${String(i + 1).padStart(4, '0')}`,
        name: `Dr. ${['Amit', 'Priya', 'Rahul', 'Anjali', 'Vikram', 'Kavita', 'Rajesh', 'Sunita', 'Deepak', 'Meena'][i % 10]} ${['Sharma', 'Gupta', 'Kumar', 'Verma', 'Singh', 'Joshi', 'Patel', 'Reddy', 'Nair', 'Iyer'][Math.floor(Math.random() * 10)]}`,
        email: `doctor${i + 1}@nhsl.local`,
        phone: `98765${String(i + 1000).padStart(4, '0')}`,
        department: departments[departmentIndex].name,
        designation: ['Senior Consultant', 'Consultant', 'Specialist', 'Chief Physician', 'Attending Physician', 'Associate Consultant', 'Junior Consultant', 'Specialist Registrar'][Math.floor(Math.random() * 8)],
        salary: 80000 + Math.floor(Math.random() * 200000), // 80k-280k salary
        join_date: new Date(2015 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        is_active: true,
        created_at: new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime())),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.employees (id, tenant_id, code, name, email, phone, department, designation, salary, join_date, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, Object.values(staffData));
    }
    
    // Nurses (60 nurses)
    for (let i = 0; i < 60; i++) {
      const staffId = crypto.randomUUID();
      staffIds.push(staffId);
      
      const departmentIndex = Math.floor(Math.random() * departments.length);
      
      const staffData = {
        id: staffId,
        tenant_id: tenantId,
        code: `NUR${String(i + 1).padStart(4, '0')}`,
        name: ['Anita', 'Pooja', 'Rashmi', 'Divya', 'Swati', 'Neha', 'Kavita', 'Priyanka', 'Sonia', 'Ritu'][i % 10] + ' ' + ['Sharma', 'Gupta', 'Kumari', 'Verma', 'Singh', 'Joshi', 'Patel', 'Reddy', 'Nair', 'Iyer'][Math.floor(Math.random() * 10)],
        email: `nurse${i + 1}@nhsl.local`,
        phone: `98766${String(i + 1000).padStart(4, '0')}`,
        department: departments[departmentIndex].name,
        designation: ['Senior Nurse', 'Nurse Manager', 'Head Nurse', 'Charge Nurse', 'Registered Nurse', 'Nurse Practitioner', 'Critical Care Nurse', 'ICU Nurse', 'OT Nurse', 'Ward Nurse'][Math.floor(Math.random() * 10)],
        salary: 35000 + Math.floor(Math.random() * 65000), // 35k-100k salary
        join_date: new Date(2017 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        is_active: true,
        created_at: new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime())),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.employees (id, tenant_id, code, name, email, phone, department, designation, salary, join_date, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, Object.values(staffData));
    }
    
    // Administrative Staff (30 staff)
    for (let i = 0; i < 30; i++) {
      const staffId = crypto.randomUUID();
      staffIds.push(staffId);
      
      const departmentIndex = Math.floor(Math.random() * departments.length);
      
      const staffData = {
        id: staffId,
        tenant_id: tenantId,
        code: `ADM${String(i + 1).padStart(4, '0')}`,
        name: ['Rohit', 'Amit', 'Vikas', 'Manish', 'Pankaj', 'Suresh', 'Anil', 'Rajesh', 'Deepak', 'Sanjay'][i % 10] + ' ' + ['Kumar', 'Sharma', 'Gupta', 'Verma', 'Singh', 'Joshi', 'Patel', 'Reddy', 'Nair', 'Iyer'][Math.floor(Math.random() * 10)],
        email: `admin${i + 1}@nhsl.local`,
        phone: `98767${String(i + 1000).padStart(4, '0')}`,
        department: departments[departmentIndex].name,
        designation: ['Hospital Administrator', 'Medical Records Officer', 'Billing Manager', 'Receptionist', 'Front Office Executive', 'Patient Coordinator', 'Ward Clerk', 'Medical Coder', 'Health Information Manager', 'Quality Assurance Manager'][Math.floor(Math.random() * 10)],
        salary: 25000 + Math.floor(Math.random() * 75000), // 25k-100k salary
        join_date: new Date(2016 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        is_active: true,
        created_at: new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime())),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.employees (id, tenant_id, code, name, email, phone, department, designation, salary, join_date, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, Object.values(staffData));
    }
    
    // Support Staff (25 staff)
    for (let i = 0; i < 25; i++) {
      const staffId = crypto.randomUUID();
      staffIds.push(staffId);
      
      const departmentIndex = Math.floor(Math.random() * departments.length);
      
      const staffData = {
        id: staffId,
        tenant_id: tenantId,
        code: `SUP${String(i + 1).padStart(4, '0')}`,
        name: ['Ramesh', 'Suresh', 'Mahesh', 'Dinesh', 'Ganesh', 'Rajesh', 'Mukesh', 'Jignesh', 'Hitesh', 'Nilesh'][i % 10] + ' ' + ['Kumar', 'Sharma', 'Gupta', 'Verma', 'Singh', 'Joshi', 'Patel', 'Reddy', 'Nair', 'Iyer'][Math.floor(Math.random() * 10)],
        email: `support${i + 1}@nhsl.local`,
        phone: `98768${String(i + 1000).padStart(4, '0')}`,
        department: departments[departmentIndex].name,
        designation: ['Lab Technician', 'Radiology Technician', 'Pharmacist', 'Medical Assistant', 'Security Officer', 'Housekeeping Supervisor', 'Dietitian', 'Social Worker', 'Supply Manager', 'Maintenance Engineer'][Math.floor(Math.random() * 10)],
        salary: 18000 + Math.floor(Math.random() * 42000), // 18k-60k salary
        join_date: new Date(2018 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        is_active: true,
        created_at: new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime())),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.employees (id, tenant_id, code, name, email, phone, department, designation, salary, join_date, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, Object.values(staffData));
    }
    
    // 3. Add Patients (150 patients over 3 months)
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
          conditions: [`Condition ${i + 1}`, `Condition ${i + 2}`], 
          medications: [`Med ${i + 1}`, `Med ${i + 2}`],
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, Object.values(patientData));
    }
    
    // 4. Add Appointments (450 appointments over 3 months)
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
        provider_id: staffIds[Math.floor(Math.random() * 40)], // Only doctors as providers
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
    
    // 5. Add Invoices (300 invoices over 3 months)
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
    
    // 6. Add Beds (40 beds)
    console.log('\n=== Adding NHSL Beds ===');
    const bedStatuses = ['occupied', 'available', 'maintenance', 'reserved'];
    const bedTypes = ['ICU', 'CCU', 'General', 'Private', 'Semi-Private', 'Deluxe', 'Suite', 'Emergency'];
    
    for (let i = 0; i < 40; i++) {
      const bedData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        ward_id: crypto.randomUUID(),
        bed_number: `NHSL-B${String(i + 1).padStart(3, '0')}`,
        type: bedTypes[Math.floor(Math.random() * bedTypes.length)],
        status: bedStatuses[Math.floor(Math.random() * bedStatuses.length)],
        patient_id: bedStatuses[Math.floor(Math.random() * bedStatuses.length)] === 'occupied' ? patientIds[Math.floor(Math.random() * patientIds.length)] : null,
        created_at: new Date(threeMonthsAgo.getTime() + Math.random() * (today.getTime() - threeMonthsAgo.getTime())),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.beds (id, tenant_id, ward_id, bed_number, type, status, patient_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, Object.values(bedData));
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
      const randomDoctor = staffIds[Math.floor(Math.random() * 40)]; // Only doctors
      const randomPatient = patientIds[Math.floor(Math.random() * patientIds.length)];
      
      const encounterData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        patient_id: randomPatient,
        provider_id: randomDoctor,
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
    
    // Check final counts
    const finalCounts = await Promise.all([
      query(`SELECT COUNT(*) as count FROM ${schemaName}.departments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.employees WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.patients WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.appointments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM ${schemaName}.invoices WHERE tenant_id = $1 AND status = 'paid'`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.beds WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.encounters WHERE tenant_id = $1`, [tenantId])
    ]);
    
    console.log('\n=== NHSL System Counts ===');
    console.log('Total Departments:', finalCounts[0].rows[0].count);
    console.log('Total Staff:', finalCounts[1].rows[0].count);
    console.log('Total Patients:', finalCounts[2].rows[0].count);
    console.log('Total Appointments:', finalCounts[3].rows[0].count);
    console.log('Total Revenue:', finalCounts[4].rows[0].total);
    console.log('Total Beds:', finalCounts[5].rows[0].count);
    console.log('Total Encounters:', finalCounts[6].rows[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
