const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Getting Starlight Tenant ID ===');
    const result = await query('SELECT id, name, code FROM emr.management_tenants WHERE name ILIKE \'%starlight%\' OR code ILIKE \'%starlight%\' OR code ILIKE \'%smc%\'');
    console.log('Starlight Tenants:');
    result.rows.forEach(t => {
      console.log(`- ${t.name} (${t.code}) - ID: ${t.id}`);
    });
    
    console.log('\n=== Checking Starlight Employees ===');
    const employees = await query('SELECT COUNT(*) as count FROM smcmega.employees');
    console.log('Total smcmega.employees:', employees.rows[0].count);
    
    const withTenant = await query('SELECT COUNT(*) as count FROM smcmega.employees WHERE tenant_id IS NOT NULL');
    console.log('With tenant_id:', withTenant.rows[0].count);
    
    const sample = await query('SELECT tenant_id, designation FROM smcmega.employees LIMIT 5');
    console.log('\nSample employees:');
    sample.rows.forEach(e => {
      console.log(`- Tenant: ${e.tenant_id}, Designation: ${e.designation}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
