import { query } from './server/db/connection.js';
async function run() {
  const { rows } = await query("SELECT * FROM emr.departments");
  console.log('Departments:', rows);
}
run().catch(console.error).finally(() => process.exit(0));
