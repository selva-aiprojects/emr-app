const dotenv = require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const url = require('url');

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL not set in .env');
  }
  const parsed = url.parse(dbUrl, true);
  const pool = new Pool({
    host: parsed.hostname,
    port: parsed.port || 5432,
    database: parsed.pathname?.slice(1) || 'postgres',
    user: parsed.auth?.split(':')[0],
    password: parsed.auth?.split(':')[1],
    ssl: { rejectUnauthorized: false }
  });
  console.log(`Connected to ${parsed.hostname}:${parsed.port || 5432}/${parsed.pathname?.slice(1)}`);

  try {
    const client = await pool.connect();
    
    // 1. Get active tenants
    const tenantsRes = await client.query(
      `SELECT code, COALESCE(schema_name, code) as schema_name FROM emr.tenants WHERE status = 'active' ORDER BY code`
    );
    const tenants = tenantsRes.rows;
    console.log(`Found ${tenants.length} active tenants:`, tenants.map(t => t.code).join(', '));

    // 2. Read migration SQL
    const migrationPath = path.join(__dirname, '../database/migrations/0015-missing_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // 3. Run per tenant
    for (const tenant of tenants) {
      console.log(`\\n=== Migrating ${tenant.code} (${tenant.schema_name}) ===`);
      
      const safeSchema = tenant.schema_name.replace(/-/g, '_lowercase_');
      await client.query(`SET search_path TO ${safeSchema}, emr, public;`);
      
      try {
        await client.query(sql);
        console.log(`✅ ${tenant.code}: Migration complete`);
        
        // Verify one table
        const verify = await client.query('SELECT count(*) FROM employee_leaves');
        console.log(`   Employee leaves table OK: ${verify.rows[0].count}`);
      } catch (err) {
        console.error(`❌ ${tenant.code} error:`, err.message);
      }
    }
    
    console.log('\\n🎉 Migration 0015 complete for all tenants!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
