import { query } from './server/db/connection.js';
async function run() {
  const tId = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed';
  const queries = {
    depts: "SELECT COUNT(*) FROM emr.departments WHERE tenant_id = $1",
    wards: "SELECT COUNT(*) FROM emr.wards WHERE tenant_id = $1",
    beds: "SELECT COUNT(*) FROM emr.beds WHERE tenant_id = $1",
    services: "SELECT COUNT(*) FROM emr.services WHERE tenant_id = $1"
  };
  for (const [k, v] of Object.entries(queries)) {
    const { rows } = await query(v, [tId]);
    console.log(k, 'count:', rows[0].count);
  }
}
run().catch(console.error).finally(() => process.exit(0));
