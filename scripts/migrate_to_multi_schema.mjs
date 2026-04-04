import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CLINICAL_TABLES = [
  'patients', 'appointments', 'encounters', 'clinical_records',
  'billing', 'invoices', 'accounts_receivable', 'accounts_payable',
  'expenses', 'revenue', 'inventory', 'services', 'departments',
  'employees', 'salary', 'attendance', 'payroll', 'fhir_resources'
];

async function migrate() {
  const client = await pool.connect();
  try {
    // 1. Get all tenants
    const tenantsResult = await client.query('SELECT id, name, code FROM emr.tenants');
    const tenants = tenantsResult.rows;
    console.log(`🚀 Starting migration for ${tenants.length} tenants...`);

    for (const tenant of tenants) {
      const sanitizedId = tenant.id.replace(/-/g, '');
      const schemaName = `tenant_${sanitizedId.substring(0, 16)}`;
      console.log(`\n📦 Processing tenant: ${tenant.name} (${tenant.code}) -> Schema: ${schemaName}`);

      // 2. Create schema
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
      console.log(`   ✅ Schema ${schemaName} created/verified`);

      // 3. Replicate tables and migrate data
      for (const table of CLINICAL_TABLES) {
        try {
          // Check if table exists in emr schema
          const tableExists = await client.query(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = $1)",
            [table]
          );

          if (!tableExists.rows[0].exists) {
            console.log(`   ⚠️ Table emr.${table} does not exist, skipping.`);
            continue;
          }

          // Create table in new schema by copying structure (including constraints/defaults where possible)
          // Simplified: CREATE TABLE LIKE. Note: This doesn't copy indexes/triggers in some DBs without extra flags.
          await client.query(`CREATE TABLE IF NOT EXISTS ${schemaName}.${table} (LIKE emr.${table} INCLUDING ALL)`);
          
          // Move data
          const moveResult = await client.query(`
            INSERT INTO ${schemaName}.${table} 
            SELECT * FROM emr.${table} 
            WHERE tenant_id = $1
            ON CONFLICT DO NOTHING
          `, [tenant.id]);

          console.log(`   ✅ Migrated ${moveResult.rowCount} rows to ${schemaName}.${table}`);
        } catch (err) {
          console.error(`   ❌ Error migrating table ${table}:`, err.message);
        }
      }
    }

    console.log('\n✨ Multi-schema migration completed successfully!');
  } catch (error) {
    console.error('\n💥 Critical migration failure:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
