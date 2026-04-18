const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Final Starlight Dashboard Data Population ===');
    
    const tenantId = 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa';
    const schemaName = 'smcmega';
    
    // Generate dates for the past month
    const today = new Date();
    const oneMonthAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    console.log(`Generating data from ${oneMonthAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
    
    // Get existing patient IDs
    const existingPatients = await query(`SELECT id FROM ${schemaName}.patients WHERE tenant_id = $1`, [tenantId]);
    console.log(`Found ${existingPatients.rows.length} existing patients`);
    
    // 1. Add more patients (total 100 patients)
    console.log('\n=== Adding 50 more patients ===');
    const newPatientIds = [];
    for (let i = 0; i < 50; i++) {
      const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime()));
      const patientId = crypto.randomUUID();
      newPatientIds.push(patientId);
      
      const patientData = {
        id: patientId,
        tenant_id: tenantId,
        mrn: `MRN${Date.now()}${String(i).padStart(3, '0')}`,
        first_name: `Patient${i + 51}`,
        last_name: `Test${i + 51}`,
        date_of_birth: new Date(1980 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)],
        phone: `9876543${String(i + 51).padStart(4, '0')}`,
        email: `patient${i + 51}@test.com`,
        address: `Address ${i + 51}, Test City`,
        blood_group: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)],
        emergency_contact: `Emergency ${i + 51} - 9876543${String(i + 150).padStart(4, '0')}`,
        insurance: `Insurance ${i + 51}`,
        medical_history: JSON.stringify({ conditions: [`Condition ${i + 1}`], medications: [`Med ${i + 1}`] }),
        ethnicity: ['Asian', 'Caucasian', 'African', 'Hispanic', 'Other'][Math.floor(Math.random() * 5)],
        language: 'English',
        birth_place: `City ${i + 51}`,
        is_archived: false,
        created_at: randomDate,
        updated_at: randomDate
      };
      
      await query(`
        INSERT INTO ${schemaName}.patients (id, tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact, insurance, medical_history, ethnicity, language, birth_place, is_archived, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, Object.values(patientData));
    }
    
    // Combine all patient IDs
    const allPatientIds = [...existingPatients.rows.map(p => p.id), ...newPatientIds];
    console.log(`Total patients available: ${allPatientIds.length}`);
    
    // 2. Add more appointments (total 200 appointments)
    console.log('\n=== Adding 150 more appointments ===');
    const statuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
    
    for (let i = 0; i < 150; i++) {
      const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime()));
      const scheduledStart = new Date(randomDate);
      scheduledStart.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
      const scheduledEnd = new Date(scheduledStart.getTime() + (30 + Math.floor(Math.random() * 60)) * 60000);
      
      const appointmentData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        patient_id: allPatientIds[Math.floor(Math.random() * allPatientIds.length)],
        provider_id: crypto.randomUUID(),
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
    
    // 3. Add more invoices (total 150 invoices)
    console.log('\n=== Adding 140 more invoices ===');
    const invoiceStatuses = ['paid', 'pending', 'partially_paid', 'cancelled'];
    
    for (let i = 0; i < 140; i++) {
      const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime()));
      const amount = 1000 + Math.floor(Math.random() * 20000); // Random amount between 1000-21000
      
      const invoiceData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        patient_id: allPatientIds[Math.floor(Math.random() * allPatientIds.length)],
        invoice_number: `INV-${Date.now()}${String(i).padStart(3, '0')}`,
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
    
    // 4. Add more encounters (total 80 encounters)
    console.log('\n=== Adding 70 more encounters ===');
    const encounterTypes = ['admission', 'discharge', 'transfer', 'consultation', 'emergency'];
    const encounterStatuses = ['active', 'completed', 'cancelled'];
    
    for (let i = 0; i < 70; i++) {
      const randomDate = new Date(oneMonthAgo.getTime() + Math.random() * (today.getTime() - oneMonthAgo.getTime()));
      
      const encounterData = {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        patient_id: allPatientIds[Math.floor(Math.random() * allPatientIds.length)],
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
    
    console.log('\n=== Final Data Population Complete! ===');
    
    // Check final counts
    const finalCounts = await Promise.all([
      query(`SELECT COUNT(*) as count FROM ${schemaName}.patients WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.appointments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM ${schemaName}.invoices WHERE tenant_id = $1 AND status = 'paid'`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.beds WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.beds WHERE tenant_id = $1 AND status = 'occupied'`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.encounters WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.encounters WHERE tenant_id = $1 AND encounter_type = 'admission'`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.encounters WHERE tenant_id = $1 AND encounter_type = 'discharge'`, [tenantId])
    ]);
    
    console.log('\n=== Updated Dashboard Counts ===');
    console.log('Total Patients:', finalCounts[0].rows[0].count);
    console.log('Total Appointments:', finalCounts[1].rows[0].count);
    console.log('Total Revenue:', finalCounts[2].rows[0].total);
    console.log('Total Beds:', finalCounts[3].rows[0].count);
    console.log('Occupied Beds:', finalCounts[4].rows[0].count);
    console.log('Total Encounters:', finalCounts[5].rows[0].count);
    console.log('Total Admissions:', finalCounts[6].rows[0].count);
    console.log('Total Discharges:', finalCounts[7].rows[0].count);
    
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
