const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Populating Starlight with Staff & Departments ===');
    
    const tenantId = 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa';
    const schemaName = 'smcmega';
    
    // Generate dates for the past month
    const today = new Date();
    const oneMonthAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    console.log(`Generating data from ${oneMonthAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
    
    // 1. Add Departments
    console.log('\n=== Adding Departments ===');
    const departments = [
      { name: 'Emergency Department', description: '24/7 emergency care services', code: 'ER', head: 'Dr. Smith' },
      { name: 'Intensive Care Unit', description: 'Critical care monitoring', code: 'ICU', head: 'Dr. Johnson' },
      { name: 'General Ward', description: 'General patient care', code: 'GW', head: 'Dr. Williams' },
      { name: 'Maternity Ward', description: 'Maternal and newborn care', code: 'MW', head: 'Dr. Brown' },
      { name: 'Pediatric Department', description: 'Child healthcare services', code: 'PED', head: 'Dr. Davis' },
      { name: 'Surgical Department', description: 'Operating theaters and surgery', code: 'SURG', head: 'Dr. Miller' },
      { name: 'Radiology Department', description: 'Medical imaging services', code: 'RAD', head: 'Dr. Wilson' },
      { name: 'Laboratory Department', description: 'Diagnostic testing services', code: 'LAB', head: 'Dr. Moore' },
      { name: 'Pharmacy Department', description: 'Medication dispensing', code: 'PHARM', head: 'Dr. Taylor' },
      { name: 'Outpatient Department', description: 'Consultation services', code: 'OPD', head: 'Dr. Anderson' }
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
        code: `DOC${String(i + 1).padStart(4, '0')}`,
        name: `Dr. ${['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary'][i % 10]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'][Math.floor(Math.random() * 10)]}`,
        email: `doctor${i + 1}@smcmega.local`,
        phone: `9876543${String(i + 200).padStart(4, '0')}`,
        department: departments[departmentIndex].name,
        designation: ['Senior Doctor', 'Consultant', 'Specialist', 'Chief Physician', 'Attending Physician'][Math.floor(Math.random() * 5)],
        salary: 80000 + Math.floor(Math.random() * 120000), // 80k-200k salary
        join_date: new Date(2015 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        is_active: true,
        created_at: new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime())),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.employees (id, tenant_id, code, name, email, phone, department, designation, salary, join_date, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
        code: `NUR${String(i + 1).padStart(4, '0')}`,
        name: ['Alice', 'Betty', 'Carol', 'Diana', 'Eva', 'Fiona', 'Grace', 'Helen'][i % 8] + ' ' + ['Wilson', 'Taylor', 'Moore', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris'][Math.floor(Math.random() * 8)],
        email: `nurse${i + 1}@smcmega.local`,
        phone: `9876543${String(i + 300).padStart(4, '0')}`,
        department: departments[departmentIndex].name,
        designation: ['Registered Nurse', 'Senior Nurse', 'Nurse Practitioner', 'Head Nurse', 'Charge Nurse'][Math.floor(Math.random() * 5)],
        salary: 35000 + Math.floor(Math.random() * 45000), // 35k-80k salary
        join_date: new Date(2018 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        is_active: true,
        created_at: new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime())),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.employees (id, tenant_id, code, name, email, phone, department, designation, salary, join_date, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, Object.values(nurseData));
    }
    
    // 4. Add Other Staff (Administrative, Support, etc.)
    console.log('\n=== Adding Administrative & Support Staff ===');
    const staffRoles = [
      'Hospital Administrator', 'Medical Records Officer', 'Billing Specialist', 'Receptionist',
      'Lab Technician', 'Radiology Technician', 'Pharmacist', 'Medical Coder',
      'Health Information Manager', 'Patient Coordinator', 'Ward Clerk', 'Supply Manager',
      'Security Officer', 'Housekeeping Supervisor', 'Dietitian', 'Social Worker'
    ];
    
    const staffIds = [];
    for (let i = 0; i < 20; i++) {
      const staffId = crypto.randomUUID();
      staffIds.push(staffId);
      
      const departmentIndex = Math.floor(Math.random() * departments.length);
      
      const staffData = {
        id: staffId,
        tenant_id: tenantId,
        code: `STF${String(i + 1).padStart(4, '0')}`,
        name: ['Alex', 'Ben', 'Chris', 'Diana', 'Eric', 'Frank', 'Grace', 'Henry'][i % 8] + ' ' + ['Clark', 'Lewis', 'Walker', 'Hall', 'Young', 'King', 'Wright', 'Lopez'][Math.floor(Math.random() * 8)],
        email: `staff${i + 1}@smcmega.local`,
        phone: `9876543${String(i + 400).padStart(4, '0')}`,
        department: departments[departmentIndex].name,
        designation: staffRoles[Math.floor(Math.random() * staffRoles.length)],
        salary: 25000 + Math.floor(Math.random() * 55000), // 25k-80k salary
        join_date: new Date(2017 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        is_active: true,
        created_at: new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime())),
        updated_at: new Date()
      };
      
      await query(`
        INSERT INTO ${schemaName}.employees (id, tenant_id, code, name, email, phone, department, designation, salary, join_date, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, Object.values(staffData));
    }
    
    // 5. Update existing encounters with doctors
    console.log('\n=== Updating Encounters with Doctors ===');
    const existingEncounters = await query(`SELECT id FROM ${schemaName}.encounters WHERE tenant_id = $1 AND provider_id IS NULL`, [tenantId]);
    
    for (const encounter of existingEncounters.rows) {
      const randomDoctor = doctorIds[Math.floor(Math.random() * doctorIds.length)];
      
      await query(`
        UPDATE ${schemaName}.encounters 
        SET provider_id = $1,
            updated_at = $2
        WHERE id = $3
      `, [randomDoctor, new Date(), encounter.id]);
    }
    
    // 6. Add medical conditions through encounters (since we don't have a diseases table)
    console.log('\n=== Adding Medical Conditions through Encounters ===');
    const medicalConditions = [
      'Hypertension', 'Diabetes Mellitus Type 2', 'Coronary Artery Disease', 'Asthma', 'COPD',
      'Pneumonia', 'Gastroenteritis', 'Peptic Ulcer', 'Migraine', 'Epilepsy',
      'Depression', 'Anxiety Disorder', 'Osteoarthritis', 'Rheumatoid Arthritis', 'Fracture',
      'UTI', 'Kidney Disease', 'Thyroid Disorder', 'Anemia', 'Skin Allergy',
      'Myocardial Infarction', 'Stroke', 'Sepsis', 'Trauma', 'Cardiac Arrest',
      'Common Cold', 'Chickenpox', 'Measles', 'Mumps', 'Rubella'
    ];
    
    // Update existing encounters with medical conditions
    const allEncounters = await query(`SELECT id FROM ${schemaName}.encounters WHERE tenant_id = $1`, [tenantId]);
    
    for (const encounter of allEncounters.rows) {
      const randomCondition = medicalConditions[Math.floor(Math.random() * medicalConditions.length)];
      
      await query(`
        UPDATE ${schemaName}.encounters 
        SET diagnosis = $1,
            updated_at = $2
        WHERE id = $3
      `, [randomCondition, new Date(), encounter.id]);
    }
    
    // 7. Add new encounters with medical conditions
    console.log('\n=== Adding New Medical Encounters ===');
    const existingPatients = await query(`SELECT id FROM ${schemaName}.patients WHERE tenant_id = $1`, [tenantId]);
    const allPatientIds = existingPatients.rows.map(p => p.id);
    
    for (let i = 0; i < 30; i++) {
      const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime()));
      const randomCondition = medicalConditions[Math.floor(Math.random() * medicalConditions.length)];
      const randomDoctor = doctorIds[Math.floor(Math.random() * doctorIds.length)];
      const randomPatient = allPatientIds[Math.floor(Math.random() * allPatientIds.length)];
      
      const encounterData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        patient_id: randomPatient,
        provider_id: randomDoctor,
        appointment_id: null,
        encounter_type: ['consultation', 'admission', 'emergency', 'follow-up', 'discharge'][Math.floor(Math.random() * 5)],
        visit_date: randomDate,
        start_time: randomDate,
        end_time: new Date(randomDate.getTime() + (1 + Math.floor(Math.random() * 4)) * 60 * 60 * 1000),
        chief_complaint: `Chief complaint ${i + 1}`,
        diagnosis: randomCondition,
        assessment: `Assessment for ${randomCondition}`,
        plan: `Treatment plan for ${randomCondition}`,
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
      query(`SELECT COUNT(*) as count FROM ${schemaName}.employees WHERE tenant_id = $1 AND designation ILIKE '%Dr%' OR designation ILIKE '%Doctor%' OR designation ILIKE '%Consultant%' OR designation ILIKE '%Specialist%'`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.employees WHERE tenant_id = $1 AND designation ILIKE '%Nurse%'`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.encounters WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(DISTINCT provider_id) as count FROM ${schemaName}.encounters WHERE tenant_id = $1 AND provider_id IS NOT NULL`, [tenantId]),
      query(`SELECT COUNT(DISTINCT diagnosis) as count FROM ${schemaName}.encounters WHERE tenant_id = $1 AND diagnosis IS NOT NULL`, [tenantId])
    ]);
    
    console.log('\n=== Updated System Counts ===');
    console.log('Total Departments:', finalCounts[0].rows[0].count);
    console.log('Total Staff:', finalCounts[1].rows[0].count);
    console.log('Total Doctors:', finalCounts[2].rows[0].count);
    console.log('Total Nurses:', finalCounts[3].rows[0].count);
    console.log('Total Encounters:', finalCounts[4].rows[0].count);
    console.log('Active Doctors in Encounters:', finalCounts[5].rows[0].count);
    console.log('Unique Medical Conditions:', finalCounts[6].rows[0].count);
    
    console.log('\n=== Staff Breakdown ===');
    const staffBreakdown = await query(`
      SELECT designation, COUNT(*) as count 
      FROM ${schemaName}.employees 
      WHERE tenant_id = $1 
      GROUP BY designation 
      ORDER BY count DESC
      LIMIT 15
    `, [tenantId]);
    
    staffBreakdown.rows.forEach(row => {
      console.log(`${row.designation}: ${row.count}`);
    });
    
    console.log('\n=== Department Breakdown ===');
    const deptBreakdown = await query(`
      SELECT d.name, COUNT(e.id) as staff_count
      FROM ${schemaName}.departments d
      LEFT JOIN ${schemaName}.employees e ON d.name = e.department AND e.tenant_id = d.tenant_id
      WHERE d.tenant_id = $1
      GROUP BY d.name, d.id
      ORDER BY staff_count DESC
    `, [tenantId]);
    
    deptBreakdown.rows.forEach(row => {
      console.log(`${row.name}: ${row.staff_count} staff`);
    });
    
    console.log('\n=== Testing Dashboard API ===');
    
    // Test the dashboard API
    const { getRealtimeDashboardMetrics } = require('./server/enhanced_dashboard_metrics_fixed.mjs');
    const metrics = await getRealtimeDashboardMetrics(tenantId);
    
    console.log('\n=== Live Dashboard Metrics ===');
    console.log('Total Income:', metrics.todayRevenue);
    console.log('Total Patients:', metrics.todayPatients);
    console.log('Total Appointments:', metrics.todayAppointments);
    console.log('Occupied Beds:', metrics.occupiedBeds);
    console.log('Total Beds:', metrics.totalBeds);
    console.log('Total Admissions:', metrics.todayAdmissions);
    console.log('Total Discharges:', metrics.todayDischarges);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
