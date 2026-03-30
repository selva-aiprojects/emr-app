import { query } from './server/db/connection.js';

async function checkAllTestVariations() {
  try {
    // Check for various "Test" variations
    const variations = ['%Test%', '%test%', '%TEST%'];
    
    for (const variation of variations) {
      const result = await query('SELECT * FROM emr.patients WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR mrn ILIKE $1', [variation]);
      if (result.rows.length > 0) {
        console.log(`Found patients with ${variation}:`, result.rows.length);
        result.rows.forEach(p => {
          console.log(`  ID: ${p.id}, Name: ${p.first_name} ${p.last_name}, MRN: ${p.mrn}, Tenant: ${p.tenant_id}`);
        });
      }
    }
    
    // Check for any patients created in the last hour
    const recent = await query('SELECT * FROM emr.patients WHERE created_at > NOW() - INTERVAL \'1 hour\'');
    console.log('\nPatients created in the last hour:', recent.rows.length);
    recent.rows.forEach(p => {
      console.log(`  ID: ${p.id}, Name: ${p.first_name} ${p.last_name}, MRN: ${p.mrn}, Created: ${p.created_at}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkAllTestVariations();
