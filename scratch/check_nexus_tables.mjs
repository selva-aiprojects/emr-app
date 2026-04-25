
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const tablesToCheck = [
    'nexus.tenants',
    'nexus.management_tenants',
    'nexus.management_tenant_metrics',
    'nexus.users',
    'nexus.roles',
    'nexus.role_permissions',
    'nexus.tenant_features',
    'nexus.global_kill_switches',
    'nexus.tenant_feature_status'
  ];

  console.log('Checking tables:');
  for (const table of tablesToCheck) {
    try {
      const [schema, name] = table.split('.');
      const res = await pool.query('SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2', [schema, name]);
      if (res.rowCount > 0) {
        console.log(`✅ ${table} exists`);
      } else {
        console.log(`❌ ${table} MISSING`);
      }
    } catch (err) {
      console.log(`❌ ${table} ERROR: ${err.message}`);
    }
  }
  process.exit(0);
}

run();
