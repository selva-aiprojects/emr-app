import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'nexus' AND table_name = 'support_tickets'
    `);
    console.log('Columns in nexus.support_tickets:', res.rows.map(r => r.column_name));

    const res2 = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'nexus' AND table_name = 'users'
    `);
    console.log('Columns in nexus.users:', res2.rows.map(r => r.column_name));
    
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
