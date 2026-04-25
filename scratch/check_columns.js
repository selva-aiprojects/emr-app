import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function checkColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema = 'nexus' AND table_name = 'tenants'
  `);
  console.log('--- NEXUS.TENANTS COLUMNS ---');
  res.rows.forEach(r => console.log(r.column_name));
  await client.end();
}
checkColumns();
