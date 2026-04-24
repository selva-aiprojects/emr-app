const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Checking Patient Query Issue ===');
    
    // Check the exact query being used for patients
    const patients = await query('SELECT COUNT(*) as count FROM smcmega.patients WHERE tenant_id = $1', ['fd0a2138-8abe-4a6d-af5b-c93765c5afaa']);
    console.log('Direct patient count:', patients.rows[0].count);
    
    // Check if there are any month-to-date patients
    const mtdPatients = await query('SELECT COUNT(*) as total FROM smcmega.patients WHERE tenant_id = $1 AND date_trunc(\'month\', created_at) = date_trunc(\'month\', CURRENT_DATE)', ['fd0a2138-8abe-4a6d-af5b-c93765c5afaa']);
    console.log('MTD patient count:', mtdPatients.rows[0].total);
    
    // Check patient dates
    const patientDates = await query('SELECT created_at::date as date FROM smcmega.patients LIMIT 3');
    console.log('Patient creation dates:');
    patientDates.rows.forEach(p => console.log('  ', p.date));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
