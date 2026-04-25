
import { query } from './server/db/connection.js';

async function check() {
  try {
    const res = await query(`
      SELECT conname, contype, a.attname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'emr.patients'::regclass;
    `);
    console.log('Constraints:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
check();
