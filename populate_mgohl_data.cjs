const { query } = require('./server/db/connection.js');

async function populateMgohlData() {
  try {
    console.log('Populating MGHPL tenant data in mgohl schema...');
    
    const tenantId = '6dda48e1-51ea-4661-91c5-94a9c72f489c';
    
    // 1. Add sample patients
    console.log('Adding patients...');
    for (let i = 1; i <= 10; i++) {
      await query(`
        INSERT INTO mgohl.patients (id, tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, 'MRN-' || LPAD(i::text, 6, '0'), 'Patient' || i, 'Test' || i, 
                '1990-01-01', 'M', '9876543' || i, 'patient' || i || '@test.com', NOW(), NOW())
      `, [tenantId]);
    }
    
    // 2. Add sample encounters
    console.log('Adding encounters...');
    for (let i = 1; i <= 8; i++) {
      await query(`
        INSERT INTO mgohl.encounters (id, tenant_id, patient_id, visit_date, encounter_type, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, 
                (SELECT id FROM mgohl.patients WHERE tenant_id = $1 AND mrn = 'MRN-' || LPAD($2::text, 6, '0') LIMIT 1),
                CURRENT_DATE - INTERVAL '1 day', 'consultation', 'completed', NOW(), NOW())
      `, [tenantId, i]);
    }
    
    // 3. Add sample beds
    console.log('Adding beds...');
    const wards = ['General Ward', 'ICU', 'Emergency', 'Maternity', 'Pediatrics'];
    for (let i = 1; i <= 5; i++) {
      await query(`
        INSERT INTO mgohl.beds (id, tenant_id, ward_id, bed_number, type, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, gen_random_uuid(), 'BED-' || LPAD(i::text, 2, '0'), 
                'Standard', CASE WHEN i <= 3 THEN 'occupied' ELSE 'available' END, NOW(), NOW())
      `, [tenantId]);
    }
    
    // 4. Add sample invoices
    console.log('Adding invoices...');
    for (let i = 1; i <= 6; i++) {
      await query(`
        INSERT INTO mgohl.invoices (id, tenant_id, patient_id, invoice_number, total, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, 
                (SELECT id FROM mgohl.patients WHERE tenant_id = $1 AND mrn = 'MRN-' || LPAD($2::text, 6, '0') LIMIT 1),
                'INV-' || LPAD(i::text, 4, '0'), 5000 + (i * 1000), 'paid', NOW(), NOW())
      `, [tenantId, i]);
    }
    
    // 5. Add sample appointments
    console.log('Adding appointments...');
    for (let i = 1; i <= 5; i++) {
      await query(`
        INSERT INTO mgohl.appointments (id, tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, 
                (SELECT id FROM mgohl.patients WHERE tenant_id = $1 AND mrn = 'MRN-' || LPAD($2::text, 6, '0') LIMIT 1),
                (SELECT id FROM emr.users WHERE tenant_id = $1 AND lower(role) = 'doctor' LIMIT 1),
                CURRENT_DATE + INTERVAL '1 hour', CURRENT_DATE + INTERVAL '2 hours', 'scheduled', NOW(), NOW())
      `, [tenantId, i]);
    }
    
    // Verify the data was added
    console.log('\nVerifying data insertion:');
    const tables = ['patients', 'encounters', 'beds', 'invoices', 'appointments'];
    
    for (const table of tables) {
      const countResult = await query('SELECT COUNT(*) as count FROM mgohl.' + table + ' WHERE tenant_id::text = $1::text', [tenantId]);
      console.log('  ' + table + ':', countResult.rows[0]?.count || 0);
    }
    
    console.log('\nMGHPL tenant data populated successfully!');
    
  } catch (error) {
    console.error('Error populating MGHPL data:', error);
  }
}

populateMgohlData();
