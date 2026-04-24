const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('Checking data in smcmega schema...');
    
    const tenantId = 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa'; // Starlight Mega Center
    const tables = ['patients', 'appointments', 'encounters', 'beds', 'blood_units', 'ambulances', 'inventory_items', 'invoices'];
    
    for (const table of tables) {
      try {
        const result = await query('SELECT COUNT(*) as count FROM smcmega.' + table + ' WHERE tenant_id::text = $1::text', [tenantId]);
        console.log(table + ':', result.rows[0]?.count || 0);
      } catch (error) {
        console.log(table + ': ERROR -', error.message);
      }
    }
    
    // Also check total records without tenant filter
    console.log('\nTotal records in smcmega schema:');
    for (const table of tables) {
      try {
        const result = await query('SELECT COUNT(*) as count FROM smcmega.' + table);
        console.log(table + ':', result.rows[0]?.count || 0);
      } catch (error) {
        console.log(table + ': ERROR -', error.message);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
