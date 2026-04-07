import { query } from './server/db/connection.js';

async function check() {
  try {
    const tenants = await query('SELECT id, code FROM emr.tenants');
    console.log('--- TENANTS ---');
    console.table(tenants.rows);

    const tables = ['patients', 'ambulances', 'service_requests'];
    for (const t of tables) {
      const emrCount = await query(`SELECT tenant_id, COUNT(*) FROM emr.${t} GROUP BY tenant_id`);
      console.log(`--- emr.${t} ---`);
      console.table(emrCount.rows);
      
      for (const tenant of tenants.rows) {
        if (!tenant.code) continue;
        const schema = tenant.code.toLowerCase();
        try {
          const shardCount = await query(`SELECT COUNT(*) FROM ${schema}.${t}`);
          console.log(`Shard ${schema}.${t}: ${shardCount.rows[0].count}`);
        } catch(e) {
          console.log(`Shard ${schema}.${t}: MISSING`);
        }
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
