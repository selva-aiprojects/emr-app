const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('Checking data in mgohl schema...');
    
    const tenantId = '6dda48e1-51ea-4661-91c5-94a9c72f489c';
    const tables = ['patients', 'appointments', 'encounters', 'beds', 'blood_units', 'ambulances', 'inventory_items', 'invoices'];
    
    for (const table of tables) {
      try {
        const result = await query('SELECT COUNT(*) as count FROM mgohl.' + table + ' WHERE tenant_id::text = $1::text', [tenantId]);
        console.log(table + ':', result.rows[0]?.count || 0);
      } catch (error) {
        console.log(table + ': ERROR -', error.message);
      }
    }
    
    // Also check total records without tenant filter
    console.log('\nTotal records in mgohl schema:');
    for (const table of tables) {
      try {
        const result = await query('SELECT COUNT(*) as count FROM mgohl.' + table);
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
