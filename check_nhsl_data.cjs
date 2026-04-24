const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Checking NHSL Existing Data ===');
    const tenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
    const schemaName = 'nhsl';
    
    const counts = await Promise.all([
      query(`SELECT COUNT(*) as count FROM ${schemaName}.departments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.employees WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.patients WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.appointments WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT COUNT(*) as count FROM ${schemaName}.invoices WHERE tenant_id = $1`, [tenantId])
    ]);
    
    console.log('Existing NHSL Data:');
    console.log('Departments:', counts[0].rows[0].count);
    console.log('Staff:', counts[1].rows[0].count);
    console.log('Patients:', counts[2].rows[0].count);
    console.log('Appointments:', counts[3].rows[0].count);
    console.log('Invoices:', counts[4].rows[0].count);
    
    const departments = await query(`SELECT name FROM ${schemaName}.departments WHERE tenant_id = $1`, [tenantId]);
    console.log('\nExisting Departments:');
    departments.rows.forEach(d => console.log('  -', d.name));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
