
import { query } from './server/db/connection.js';

async function checkSchema() {
  console.log('--- TABLE: emr.tenants ---');
  const tRes = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'emr' AND table_name = 'tenants'
  `);
  console.table(tRes.rows);

  console.log('--- TABLE: emr.management_tenants ---');
  const mRes = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'emr' AND table_name = 'management_tenants'
  `);
  console.table(mRes.rows);
  
  process.exit(0);
}

checkSchema().catch(err => {
  console.error(err);
  process.exit(1);
});
