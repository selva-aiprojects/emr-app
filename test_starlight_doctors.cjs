const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Testing Starlight Doctors with Correct Tenant ID ===');
    const starlightTenantId = 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa';
    
    const doctorsQuery = await query(`
      SELECT COUNT(*)::int as c FROM "smcmega".employees 
      WHERE tenant_id = $1 AND (lower(designation) LIKE '%doctor%' OR lower(designation) LIKE '%consultant%' OR lower(designation) LIKE '%physician%' OR lower(designation) LIKE '%surgeon%')
    `, [starlightTenantId]);
    
    console.log('Starlight Doctors Count:', doctorsQuery.rows[0].c);
    
    const designations = await query('SELECT DISTINCT designation FROM smcmega.employees WHERE tenant_id = $1 LIMIT 10', [starlightTenantId]);
    console.log('\nStarlight Employee Designations:');
    designations.rows.forEach(d => {
      console.log(`- ${d.designation}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
