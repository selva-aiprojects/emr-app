import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function checkTenants() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query('SELECT * FROM nexus.tenants');
  console.log('--- NEXUS TENANTS ---');
  res.rows.forEach(r => console.log(`${r.code} (${r.id})`));
  await client.end();
}
checkTenants();
