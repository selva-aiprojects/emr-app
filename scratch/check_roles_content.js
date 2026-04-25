import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function checkNexusRolesContent() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query('SELECT * FROM nexus.roles');
  console.log('--- NEXUS.ROLES CONTENT ---');
  res.rows.forEach(r => console.log(JSON.stringify(r)));
  await client.end();
}
checkNexusRolesContent();
