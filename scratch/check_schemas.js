
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    const res = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('menu_header', 'menu_item', 'role_menu_access')
    `);
    console.log('Found tables:', res.rows);
    
    const schemas = await pool.query("SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'");
    console.log('Schemas:', schemas.rows.map(r => r.nspname));
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await pool.end();
  }
}

checkTables();
