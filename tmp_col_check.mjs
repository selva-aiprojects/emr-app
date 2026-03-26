import { query } from './server/db/connection.js';
const r = await query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'invoice_items' ORDER BY ordinal_position`);
console.log('invoice_items cols:', r.rows.map(x => x.column_name).join(', '));
const r2 = await query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'lab_orders' ORDER BY ordinal_position`).catch(() => ({ rows: [] }));
console.log('lab_orders cols:', r2.rows.map(x => x.column_name).join(', ') || 'TABLE NOT FOUND');

// Also check ambulances / blood_bank_units alternatives
const checks = ['blood_units', 'blood_requests', 'ambulance_fleet', 'ambulances'];
for (const t of checks) {
  const c = await query(`SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = $1`, [t]);
  if (c.rows[0].cnt > 0) {
    const cols = await query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = $1 ORDER BY ordinal_position`, [t]);
    console.log(`${t}: ${cols.rows.map(x => x.column_name).join(', ')}`);
  } else {
    console.log(`${t}: MISSING`);
  }
}
process.exit(0);
