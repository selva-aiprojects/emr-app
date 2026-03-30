import { query } from './server/db/connection.js';

async function generateMRN(tenantId) {
  const tenantResult = await query('SELECT code FROM emr.tenants WHERE id = $1', [tenantId]);
  const tenantCode = tenantResult.rows[0]?.code || 'UNK';

  // Get the highest numeric MRN for this tenant
  const maxResult = await query(
    'SELECT MAX(CASE WHEN mrn ~ $2 THEN CAST(SUBSTRING(mrn, LENGTH($2) + 1) AS INTEGER) ELSE 0 END) as max_num FROM emr.patients WHERE tenant_id = $1 AND mrn LIKE $2',
    [tenantId, `${tenantCode}-%`]
  );

  const maxNum = parseInt(maxResult.rows[0].max_num) || 0;
  const nextNum = maxNum + 1;
  
  return `${tenantCode}-${nextNum}`;
}

async function testCreatePatient() {
  try {
    // Get New Age Hospital tenant ID
    const tenantResult = await query('SELECT id FROM emr.tenants WHERE name ILIKE $1', ['%New Age%']);
    if (tenantResult.rows.length === 0) {
      console.log('New Age Hospital tenant not found');
      process.exit(1);
    }
    const tenantId = tenantResult.rows[0].id;
    console.log('Using tenant ID:', tenantId);

    // Generate MRN using the fixed function
    const mrn = await generateMRN(tenantId);
    console.log('Generated MRN:', mrn);

    // Create test patient
    const patientData = {
      tenantId,
      userId: 'test-user-id',
      firstName: 'Test',
      lastName: 'Patient',
      phone: '1234567890',
      email: 'test@example.com',
      gender: 'Male',
      dob: '1990-01-01'
    };

    const sql = `
      INSERT INTO emr.patients (
        tenant_id, mrn, first_name, last_name, date_of_birth, gender, 
        phone, email, medical_history
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await query(sql, [
      patientData.tenantId,
      mrn,
      patientData.firstName,
      patientData.lastName,
      patientData.dob,
      patientData.gender,
      patientData.phone,
      patientData.email,
      JSON.stringify({})
    ]);

    console.log('Patient created successfully:');
    console.log('ID:', result.rows[0].id);
    console.log('Name:', result.rows[0].first_name, result.rows[0].last_name);
    console.log('MRN:', result.rows[0].mrn);
    
  } catch (error) {
    console.error('Error creating patient:', error.message);
    console.error('Full error:', error);
  }
  process.exit(0);
}

testCreatePatient();
