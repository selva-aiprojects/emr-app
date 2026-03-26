import { query } from './server/db/connection.js';
async function run() {
  try {
    const text = `
      SELECT description as name, SUM(total) as value
      FROM emr.invoices
      WHERE tenant_id = $1 AND description IS NOT NULL AND description != ''
      GROUP BY description
      ORDER BY value DESC
      LIMIT 10
    `;
    const { rows } = await query(text, ['f998a8f5-95b9-4fd7-a583-63cf574d65ed']);
    console.log('Result:', rows);
  } catch(e) {
    console.error('FAILED QUERY:', e.message);
  }
}
run().catch(console.error).finally(() => process.exit(0));
