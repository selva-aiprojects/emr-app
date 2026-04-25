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
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'nexus' AND table_name = 'roles'
  `);
  console.log('--- NEXUS.ROLES COLUMNS ---');
  res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));
  
  const pkRes = await client.query(`
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc 
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name 
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' 
      AND tc.table_schema = 'nexus' 
      AND tc.table_name = 'roles'
  `);
  console.log('--- NEXUS.ROLES PK ---');
  pkRes.rows.forEach(r => console.log(r.column_name));
  
  await client.end();
}
checkNexusRolesSchema();
