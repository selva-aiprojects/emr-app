import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function clear() {
  await client.connect();
  try {
    await client.query("DELETE FROM emr.migrations_log WHERE filename = '08_fix_types_once_and_for_all.sql'");
    console.log('Cleared migration 08 from log.');
  } finally {
    await client.end();
  }
}

clear();
