const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('Checking MGHPL data in emr schema...');
    
    const tenantId = '6dda48e1-51ea-4661-91c5-94a9c72f489c';
    
    // Check patient data specifically
    const patientResult = await query('SELECT COUNT(*) as count FROM emr.patients WHERE tenant_id::text = $1::text', [tenantId]);
    console.log('MGHPL Patients in emr schema:', patientResult.rows[0]?.count || 0);
    
    // Check if there are any invoices, beds, etc. in smcmega schema (we know this has data)
    console.log('\nChecking if we should use smcmega schema instead...');
    const smcPatientResult = await query('SELECT COUNT(*) as count FROM smcmega.patients WHERE tenant_id::text = $1::text', ['fd0a2138-8abe-4a6d-af5b-c93765c5afaa']);
    console.log('Starlight Mega Center patients in smcmega schema:', smcPatientResult.rows[0]?.count || 0);
    
    // Check if smcmega has the tables we need
    const tables = ['beds', 'invoices', 'encounters', 'ambulances'];
    console.log('\nStarlight Mega Center data in smcmega schema:');
    for (const table of tables) {
      try {
        const count = await query('SELECT COUNT(*) as count FROM smcmega.' + table + ' WHERE tenant_id::text = $1::text', ['fd0a2138-8abe-4a6d-af5b-c93765c5afaa']);
        console.log('  ' + table + ': ' + (count.rows[0]?.count || 0));
      } catch (e) {
        console.log('  ' + table + ': N/A');
      }
    }
    
    console.log('\n=== SOLUTION ===');
    console.log('The issue is that MGHPL data is in emr schema but emr schema lacks the tables needed for dashboard.');
    console.log('Option 1: Move MGHPL to use a complete tenant schema like smcmega');
    console.log('Option 2: Create the missing tables in emr schema for MGHPL');
    console.log('Option 3: Point MGHPL to smcmega schema temporarily for testing');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
