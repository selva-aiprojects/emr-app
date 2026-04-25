import dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Client } = pkg;

async function purgeOtherTenants() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🚀 [PURGE] Connected to database...');

    // 1. DROP all non-standard tenant schemas
    const keepSchemas = [
      'nexus', 'nhgl', 'public', 'auth', 'storage', 'vault', 
      'realtime', 'information_schema', 'pgbouncer', 'graphql', 'graphql_public'
    ];

    const schemasRes = await client.query(`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'
    `);

    for (const schema of schemasRes.rows.map(r => r.schema_name)) {
      if (!keepSchemas.includes(schema)) {
        console.log(`🗑️  Dropping legacy tenant schema: ${schema}...`);
        await client.query(`DROP SCHEMA "${schema}" CASCADE`).catch(e => console.error(e.message));
      }
    }

    // 2. RESET NHGL for a fresh start
    console.log('🧹 Resetting NHGL schema...');
    await client.query('DROP SCHEMA IF EXISTS "nhgl" CASCADE');
    await client.query('CREATE SCHEMA "nhgl"');

    // 3. CLEAN NEXUS POLLUTION
    console.log('🧹 Purging clinical pollution from nexus Master Plane...');
    const keepNexusTables = [
      'roles', 'users', 'tenants', 'management_tenants', 'migrations_log',
      'management_subscriptions', 'management_tenant_metrics', 'communication_templates',
      'management_dashboard_summary', 'management_offers', 'management_system_logs'
    ];

    const nexusTablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'nexus' 
      AND table_name NOT IN (${keepNexusTables.map(t => `'${t}'`).join(',')})
    `);

    for (const row of nexusTablesRes.rows) {
       console.log(`🗑️  Dropping misplaced clinical table from nexus: ${row.table_name}...`);
       await client.query(`DROP TABLE IF EXISTS nexus."${row.table_name}" CASCADE`);
    }

    // 4. RESET MIGRATION LOG
    console.log('🧹 Resetting all migration logs...');
    await client.query("DELETE FROM nexus.migrations_log");

    console.log('\n✅ [PURGE] Success. Nexus is clean. NHGL is empty. Ready for deployment.');
  } catch (err) {
    console.error('❌ [PURGE] Fatal Error:', err.message);
  } finally {
    await client.end();
  }
}

purgeOtherTenants();
