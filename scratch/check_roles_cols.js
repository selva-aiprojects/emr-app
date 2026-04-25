import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function checkRolesColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema = 'nexus' AND table_name = 'roles'
  `);
  console.log('--- NEXUS.ROLES COLUMNS ---');
  res.rows.forEach(r => console.log(r.column_name));
  await client.end();
}
checkRolesColumns();
