import { query } from './server/db/connection.js';

async function checkSchema() {
  const res = await query(`
    SELECT column_name, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'emr' AND table_name = 'prescriptions'
    ORDER BY ordinal_position
  `);
  console.log('Columns in emr.prescriptions:');
  console.table(res.rows);
  process.exit(0);
}

checkSchema().catch(err => {
  console.error(err);
  process.exit(1);
});
