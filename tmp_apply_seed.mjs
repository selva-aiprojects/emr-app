import fs from 'fs';
import { query } from './server/db/connection.js';

async function run() {
  const sql = fs.readFileSync('d:/Training/working/EMR-Application/database/seed_nah_inpatient.sql', 'utf8');
  console.log('Applying Inpatient Seed...');
  await query(sql);
  console.log('Seed applied successfully!');
}

run().catch(console.error).finally(() => process.exit(0));
