import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTenants() {
  await client.connect();
  const res = await client.query('SELECT name, features, theme FROM emr.tenants');
  console.log('📋 Tenant Data Audit (Neon):');
  res.rows.forEach(r => {
    console.log(`- ${r.name}: features=${r.features}, theme=${r.theme}`);
  });
  await client.end();
}

checkTenants();
