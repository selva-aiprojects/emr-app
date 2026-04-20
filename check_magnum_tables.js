import { query } from './server/db/connection.js';

async function checkMagnumTables() {
  try {
    const tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'magnum' ORDER BY table_name");
    console.log('Tables in MAGNUM schema:', tables.rows.length);
    tables.rows.forEach(row => console.log(' -', row.table_name));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMagnumTables();