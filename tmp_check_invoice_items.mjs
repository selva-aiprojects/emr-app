import { query } from './server/db/connection.js';
async function run() {
  const { rows } = await query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'invoice_items'");
  console.log('Invoice items columns:', rows.map(r => r.column_name).join(', '));
}
run().catch(console.error).finally(() => process.exit(0));
