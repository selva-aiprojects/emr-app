import { query } from './server/db/connection.js';
async function run() {
  const result = await query("SELECT * FROM emr.invoices LIMIT 0");
  console.log('Invoices columns:', result.fields.map(f => f.name).join(', '));
}
run().catch(console.error).finally(() => process.exit(0));
