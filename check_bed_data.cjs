const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('Checking bed data structure in smcmega...');
    
    const tenantId = 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa';
    
    // Check bed records and their structure
    const bedResult = await query('SELECT * FROM smcmega.beds WHERE tenant_id::text = $1::text LIMIT 5', [tenantId]);
    console.log('\nBed records:');
    console.log(bedResult.rows);
    
    // Check bed status values
    const statusResult = await query('SELECT status, COUNT(*) as count FROM smcmega.beds WHERE tenant_id::text = $1::text GROUP BY status', [tenantId]);
    console.log('\nBed status distribution:');
    console.log(statusResult.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
