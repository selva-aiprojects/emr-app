import { query } from './server/db/connection.js';

async function checkPatient() {
  try {
    const result = await query('SELECT * FROM emr.patients WHERE first_name ILIKE $1 OR last_name ILIKE $1', ['%Test%']);
    console.log('Found patients with Test:', result.rows.length);
    result.rows.forEach(p => {
      console.log(`ID: ${p.id}, Name: ${p.first_name} ${p.last_name}, MRN: ${p.mrn}, Tenant: ${p.tenant_id}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkPatient();
