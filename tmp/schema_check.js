import { query } from './server/db/connection.js';

async function checkSchema() {
  try {
    const res = await query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'emr' 
      AND column_name IN ('id', 'tenant_id') 
      AND table_name IN ('users', 'tenants', 'patients', 'appointments', 'ambulances', 'blood_units')
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
