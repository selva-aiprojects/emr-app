const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('Checking if MGHPL data exists in different schemas...');
    
    const tenantId = '6dda48e1-51ea-4661-91c5-94a9c72f489c';
    
    // Check all schemas for MGHPL data
    const schemas = ['mgohl', 'mghpl', 'emr'];
    
    for (const schema of schemas) {
      console.log('\nChecking schema: ' + schema);
      try {
        const patientCount = await query('SELECT COUNT(*) as count FROM ' + schema + '.patients WHERE tenant_id::text = $1::text', [tenantId]);
        console.log('  Patients: ' + (patientCount.rows[0]?.count || 0));
        
        if (parseInt(patientCount.rows[0]?.count || 0) > 0) {
          console.log('  FOUND DATA in ' + schema + ' schema!');
          
          // Check other tables too
          const tables = ['encounters', 'beds', 'invoices'];
          for (const table of tables) {
            try {
              const count = await query('SELECT COUNT(*) as count FROM ' + schema + '.' + table + ' WHERE tenant_id::text = $1::text', [tenantId]);
              console.log('  ' + table + ': ' + (count.rows[0]?.count || 0));
            } catch (e) {
              console.log('  ' + table + ': N/A');
            }
          }
        }
      } catch (error) {
        console.log('  Schema ' + schema + ' not accessible');
      }
    }
    
    // Also check total records without tenant filter
    console.log('\nTotal records in each schema (all tenants):');
    for (const schema of schemas) {
      try {
        const patientCount = await query('SELECT COUNT(*) as count FROM ' + schema + '.patients');
        console.log('  ' + schema + '.patients: ' + (patientCount.rows[0]?.count || 0));
      } catch (error) {
        console.log('  ' + schema + '.patients: N/A');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
