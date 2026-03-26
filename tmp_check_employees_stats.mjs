import { query } from './server/db/connection.js';
async function run() {
  const { rows } = await query("SELECT department, designation, COUNT(*) FROM emr.employees GROUP BY department, designation");
  console.log('Employees Stats:', rows);
}
run().catch(console.error).finally(() => process.exit(0));
