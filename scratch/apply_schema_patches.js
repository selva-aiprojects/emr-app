import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Applying nexus.support_tickets fix...');
    await pool.query(`
      ALTER TABLE nexus.support_tickets ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
    `);
    
    console.log('Applying nexus.users fix...');
    // Ensure nexus.users has the correct columns
    await pool.query(`
      ALTER TABLE nexus.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      ALTER TABLE nexus.users ADD COLUMN IF NOT EXISTS role VARCHAR(255);
    `);
    
    console.log('Fixes applied successfully.');
    await pool.end();
  } catch (err) {
    console.error('Error applying fixes:', err.message);
    process.exit(1);
  }
}
run();
