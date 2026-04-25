
import { query } from './server/db/connection.js';

async function check() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'emr' AND table_name = 'patients'
    `);
    console.log('Columns:', res.rows);
    
    const constraints = await query(`
      SELECT
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          tc.constraint_type
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
      WHERE tc.table_name = 'patients' AND tc.table_schema = 'emr';
    `);
    console.log('Constraints:', constraints.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
check();
