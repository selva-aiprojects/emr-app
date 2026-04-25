import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debug() {
  console.log('🔍 [DB_DEBUG] Starting deep diagnostic...');
  try {
    // 1. Check migrations log
    const logs = await pool.query("SELECT * FROM nexus.migrations_log");
    console.log('✅ Migration Logs:', logs.rows);

    // 2. Check tables in nexus
    const nexusTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'nexus'");
    console.log('✅ Tables in nexus:', nexusTables.rows.map(r => r.table_name));

    // 3. Check tables in public
    const publicTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'management_%'");
    console.log('✅ Management tables in public:', publicTables.rows.map(r => r.table_name));

    // 4. Check if nexus.tenants exists
    const tenantsExist = await pool.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'nexus' AND table_name = 'tenants')");
    console.log('❓ Does nexus.tenants exist?', tenantsExist.rows[0].exists);

  } catch (err) {
    console.error('❌ Debug failed:', err.message);
  } finally {
    await pool.end();
  }
}

debug();
