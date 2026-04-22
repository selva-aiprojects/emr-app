const { query } = require('../server/db/connection.js');
const { generateMRN } = require('../server/db/tenant.service.js');

(async () => {
  const tenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e'; // fresh or magnum?
  
  try {
    // Test MRN gen
    const mrn = await generateMRN(tenantId);
    console.log('Generated MRN:', mrn);
    
    // Test create patient
    const createRes = await query(`
      INSERT INTO patients (tenant_id, first_name, last_name, mrn, created_at)
      VALUES ($1, 'Test', 'Patient E2E', $2, NOW())
      RETURNING id, mrn
    `, [tenantId, mrn]);
    
    console.log('✅ Patient created:', createRes.rows[0]);
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Test failed:', e.message);
    process.exit(1);
  }
})();

