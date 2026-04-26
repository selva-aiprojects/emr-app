
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkMenu() {
  try {
    console.log('--- MENU HEADERS ---');
    const headers = await pool.query('SELECT * FROM nexus.menu_header');
    console.table(headers.rows);

    console.log('\n--- MENU ITEMS ---');
    const items = await pool.query('SELECT * FROM nexus.menu_item');
    console.table(items.rows);

    console.log('\n--- ROLE MENU ACCESS ---');
    const access = await pool.query('SELECT * FROM nexus.role_menu_access');
    console.table(access.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkMenu();
