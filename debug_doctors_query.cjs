const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Debugging Doctors Query ===');
    
    const tenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff'; // NHSL
    const schemaName = 'nhsl';
    
    console.log(`\n=== Testing NHSL Doctors Query ===`);
    console.log(`Tenant ID: ${tenantId}`);
    console.log(`Schema: ${schemaName}`);
    
    // Test the exact query from superadmin service
    const doctorsQuery = await query(`
      SELECT COUNT(*)::int as c FROM "${schemaName}".employees 
      WHERE tenant_id = $1 AND (lower(designation) LIKE '%doctor%' OR lower(designation) LIKE '%consultant%' OR lower(designation) LIKE '%physician%' OR lower(designation) LIKE '%surgeon%')
    `, [tenantId]);
    
    console.log('Doctors Count:', doctorsQuery.rows[0].c);
    
    // Check individual designations
    const designations = await query('SELECT DISTINCT designation FROM nhsl.employees WHERE tenant_id = $1 LIMIT 10', [tenantId]);
    console.log('\nNHSL Employee Designations:');
    designations.rows.forEach(d => {
      console.log(`- ${d.designation}`);
    });
    
    // Test a simpler query
    const allEmployees = await query('SELECT COUNT(*) as count FROM nhsl.employees WHERE tenant_id = $1', [tenantId]);
    console.log('\nTotal NHSL Employees:', allEmployees.rows[0].count);
    
    // Test with specific designations
    const specificDoctors = await query(`
      SELECT COUNT(*) as count FROM nhsl.employees 
      WHERE tenant_id = $1 AND lower(designation) LIKE '%consultant%'
    `, [tenantId]);
    console.log('NHSL Consultants:', specificDoctors.rows[0].count);
    
    // Test starlight too
    const starlightTenantId = 'd4a5b6c7-8e9f-0a1b-2c3d-4e5f6a7b8c9d'; // Starlight
    const starlightDoctors = await query(`
      SELECT COUNT(*)::int as c FROM "smcmega".employees 
      WHERE tenant_id = $1 AND (lower(designation) LIKE '%doctor%' OR lower(designation) LIKE '%consultant%' OR lower(designation) LIKE '%physician%' OR lower(designation) LIKE '%surgeon%')
    `, [starlightTenantId]);
    
    console.log('\nStarlight Doctors Count:', starlightDoctors.rows[0].c);
    
    const starlightDesignations = await query('SELECT DISTINCT designation FROM smcmega.employees WHERE tenant_id = $1 LIMIT 10', [starlightTenantId]);
    console.log('\nStarlight Employee Designations:');
    starlightDesignations.rows.forEach(d => {
      console.log(`- ${d.designation}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
