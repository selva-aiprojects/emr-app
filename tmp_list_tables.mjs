import { query } from './server/db/connection.js';
async function run() {
  const { rows } = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'emr'");
  console.log('Tables:', rows.map(r => r.table_name).join(', '));
}
run().catch(console.error).finally(() => process.exit(0));
