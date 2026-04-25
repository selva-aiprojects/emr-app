import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function checkNexusRolesSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query(`
    SELECT column_name, is_nullable, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'nexus' AND table_name = 'roles'
  `);
  console.log('--- NEXUS.ROLES SCHEMA ---');
  res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));
  
  const pkRes = await client.query(`
    SELECT a.attname
    FROM   pg_index i
    JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE  i.indrelid = 'nexus.roles'::regclass
    AND    i.indisprimary;
  `);
  console.log('--- NEXUS.ROLES PK ---');
  pkRes.rows.forEach(r => console.log(r.attname));
  
  await client.end();
}
checkNexusRolesSchema();
