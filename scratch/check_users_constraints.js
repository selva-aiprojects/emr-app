import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  await client.connect();
  
  // Check unique constraints on nexus.users
  const res = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid) as def
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE n.nspname = 'nexus' AND t.relname = 'users'
    AND c.contype IN ('u', 'p')
  `);
  
  console.log('Constraints on nexus.users:');
  console.table(res.rows);
  
  // Also check columns
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'nexus' AND table_name = 'users'
    ORDER BY ordinal_position
  `);
  console.log('\nColumns in nexus.users:');
  console.table(cols.rows);
  
  await client.end();
}

check().catch(e => { console.error(e.message); process.exit(1); });
