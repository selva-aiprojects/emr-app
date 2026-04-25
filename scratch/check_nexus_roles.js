import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function checkNexusRoles() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query('SELECT role_name FROM nexus.roles');
  console.log('--- NEXUS ROLES ---');
  res.rows.forEach(r => console.log(r.role_name));
  await client.end();
}
checkNexusRoles();
