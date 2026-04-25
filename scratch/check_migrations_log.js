import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function checkLog() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query('SELECT filename FROM nexus.migrations_log ORDER BY filename');
  console.log('--- MIGRATIONS LOG ---');
  res.rows.forEach(r => console.log(r.filename));
  await client.end();
}
checkLog();
