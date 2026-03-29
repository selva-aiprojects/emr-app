import dotenv from 'dotenv';
dotenv.config();
import { query } from './server/db/connection.js';

async function check() {
  try {
    const t = await query('SELECT count(*) FROM emr.tenants');
    const u = await query('SELECT count(*) FROM emr.users');
    const p = await query('SELECT count(*) FROM emr.patients');
    const i = await query('SELECT count(*) FROM emr.invoices WHERE status = \'paid\'');
    const rev = await query('SELECT sum(total) as rev FROM emr.invoices WHERE status = \'paid\'');

    console.log({
      tenants: t.rows[0].count,
      users: u.rows[0].count,
      patients: p.rows[0].count,
      paid_invoices: i.rows[0].count,
      total_revenue: rev.rows[0].rev || 0
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
