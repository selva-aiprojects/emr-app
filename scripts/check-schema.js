import { query, testConnection } from './server/db/connection.js';

async function checkSchema() {
  await testConnection();
  const res = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'emr' AND table_name = 'patients'
  `);
  console.log('--- emr.patients columns ---');
  res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
  process.exit(0);
}

checkSchema().catch(err => {
  console.error(err);
  process.exit(1);
});
