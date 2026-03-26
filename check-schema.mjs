import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('--- List of Tables in emr schema ---');
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'emr'");
  console.log(res.rows.map(r => r.table_name).join(', '));

  for (const table of ['patients', 'beds', 'encounters', 'appointments']) {
    try {
        const columns = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = '${table}'`);
        console.log(`\n--- Columns for ${table} ---`);
        console.log(columns.rows.map(r => r.column_name).join(', '));
    } catch(e) {
        console.log(`Table ${table} probably doesn't exist`);
    }
  }

  await client.end();
}
run();
