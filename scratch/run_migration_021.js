import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: "postgresql://postgres.vfmnjnwcorlqwxqdklfi:hms-app%402020@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    const sql = fs.readFileSync('d:/Training/working/emr-app/database/migrations/021_emr_workflows.sql', 'utf8');
    await pool.query(sql);
    console.log('Migration 021 applied successfully');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await pool.end();
  }
}

run();
