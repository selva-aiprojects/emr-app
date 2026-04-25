import dotenv from 'dotenv';
dotenv.config();
import pool, { query, testConnection } from './connection.js';

async function check() {
  console.log('🔍 [INTERNAL_DIAGNOSTIC] Checking schema health...');
  
  // Set shard context BEFORE testing connection to ensure migrations target the shard
  process.env.DB_SCHEMA = 'nhgl';
  console.log(`📡 [TEST_CONTEXT] Targeting shard: ${process.env.DB_SCHEMA}`);

  // Force migration check
  await testConnection();
  
  try {
    const schemas = await query("SELECT schema_name FROM information_schema.schemata");
    console.log('✅ Found schemas:', schemas.rows.map(r => r.schema_name).filter(s => !s.startsWith('pg_')));

    const tables = await query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('nexus')");
    console.log('✅ Found Nexus (Master Plane) tables:', tables.rows.map(r => r.table_name));

    // Check for clinical tables in the nhgl shard
    const shardName = 'nhgl';
    const clinicalTables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = $1", [shardName]);
    console.log(`✅ Found Clinical tables in ${shardName}:`, clinicalTables.rows.map(r => r.table_name));

    console.log('\n--- CORE COUNTS ---');
    const nexusUsers = await query("SELECT count(*) FROM nexus.users");
    console.log('✅ Master Plane (nexus) Users count:', nexusUsers.rows[0].count);

    const tenants = await query("SELECT count(*) FROM nexus.tenants");
    console.log('✅ Global Tenants count:', tenants.rows[0].count);

    const mgmtTenants = await query("SELECT count(*) FROM nexus.management_tenants");
    console.log('✅ Management Tenants count:', mgmtTenants.rows[0].count);

    if (clinicalTables.rows.find(r => r.table_name === 'patients')) {
      const patients = await query(`SELECT count(*) FROM ${shardName}.patients`);
      console.log(`✅ Clinical Shard (${shardName}) Patients count:`, patients.rows[0].count);
    } else {
      console.log(`⚠️  Patients table missing in ${shardName}`);
    }

  } catch (err) {
    console.error('❌ [DIAGNOSTIC_FAILURE]:', err.message);
  } finally {
    await pool.end();
  }
}

check();
