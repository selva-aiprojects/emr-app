import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('--- SCHEMAS ---');
    const schemas = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'");
    console.log(schemas.rows.map(r => r.schema_name));

    console.log('\n--- NEXUS TABLES ---');
    const nexusTables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'nexus'");
    console.log(nexusTables.rows.map(r => r.table_name));

    console.log('\n--- NHGL TABLES ---');
    const nhglTables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'nhgl'");
    console.log(nhglTables.rows.map(r => r.table_name));

    console.log('\n--- EMR TABLES ---');
    const emrTables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'emr'");
    console.log(emrTables.rows.map(r => r.table_name));


    console.log('\n--- MIGRATION LOG ---');
    try {
        const migrations = await client.query("SELECT filename, executed_at FROM nexus.migrations_log ORDER BY executed_at DESC LIMIT 10");
        console.table(migrations.rows);
    } catch (e) {
        console.log('migrations_log missing or error:', e.message);
    }


    if (nexusTables.rows.find(r => r.table_name === 'users')) {
        console.log('\n--- NEXUS.USERS COLUMNS ---');
        const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'nexus' AND table_name = 'users'");
        console.table(cols.rows);
    } else {
        console.log('\n❌ nexus.users MISSING');
    }

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
