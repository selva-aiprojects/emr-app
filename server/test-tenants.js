import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'tenants'");
  console.log('COLUMNS:', res.rows.map(r => r.column_name));
  
  const res2 = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'patients'");
  console.log('PATIENT COLUMNS:', res2.rows.map(r => r.column_name));

  await client.end();
}
check();
