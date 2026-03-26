import { query } from './server/db/connection.js';
async function run() {
  const tenantId = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed';
  const { rows } = await query("SELECT status, COUNT(*) FROM emr.encounters WHERE tenant_id = $1 GROUP BY status", [tenantId]);
  console.log('Encounters Stats:', rows);
}
run().catch(console.error).finally(() => process.exit(0));
