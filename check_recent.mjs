import { query } from './server/db/connection.js';

async function checkRecentPatients() {
  try {
    // Check all patients for New Age Hospital
    const result = await query('SELECT * FROM emr.patients WHERE tenant_id = (SELECT id FROM emr.tenants WHERE name ILIKE $1) ORDER BY created_at DESC LIMIT 10', ['%New Age%']);
    console.log('Recent patients for New Age Hospital:', result.rows.length);
    result.rows.forEach(p => {
      console.log(`ID: ${p.id}, Name: ${p.first_name} ${p.last_name}, MRN: ${p.mrn}, Created: ${p.created_at}`);
    });
    
    // Also check all recent patients across all tenants
    const allRecent = await query('SELECT p.*, t.name as tenant_name FROM emr.patients p JOIN emr.tenants t ON p.tenant_id = t.id ORDER BY p.created_at DESC LIMIT 5');
    console.log('\nMost recent patients across all tenants:');
    allRecent.rows.forEach(p => {
      console.log(`ID: ${p.id}, Name: ${p.first_name} ${p.last_name}, Tenant: ${p.tenant_name}, Created: ${p.created_at}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkRecentPatients();
