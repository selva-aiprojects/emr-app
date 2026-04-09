import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function hardenSchemas() {
  try {
    console.log('--- CLINICAL SCHEMA HARDENING START ---');
    
    // 1. Ensure MRN sequences table exists in emr schema
    console.log('Ensuring infrastructure clinical counter: emr.mrn_sequences');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emr.mrn_sequences (
        tenant_id UUID PRIMARY KEY,
        sequence_value INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 2. Get all clinical shards
    const schemasRes = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public', 'emr')");
    const schemas = schemasRes.rows.map(r => r.schema_name);

    for (const schema of schemas) {
      console.log(`Auditing clinical shard [${schema}]...`);
      
      // Check if patients table exists first
      const tableCheck = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'patients'`, [schema]);
      if (tableCheck.rows.length === 0) {
        console.log(`  - No patients table. Skipping.`);
        continue;
      }

      // Add missing columns if they don't exist
      const columnsToAdd = [
        { name: 'is_archived', type: 'BOOLEAN', def: 'DEFAULT false' },
        { name: 'primary_doctor_id', type: 'UUID', def: '' }
      ];

      for (const col of columnsToAdd) {
        const colCheck = await pool.query(`SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'patients' AND column_name = $2`, [schema, col.name]);
        if (colCheck.rows.length === 0) {
          console.log(`  - Adding missing column: ${col.name} (${col.type})`);
          await pool.query(`ALTER TABLE "${schema}".patients ADD COLUMN ${col.name} ${col.type} ${col.def}`);
        }
      }
      
      console.log(`  - Shard [${schema}] is compliant.`);
    }

    console.log('--- HARDENING COMPLETE ---');
  } catch (err) {
    console.error('Hardening failed:', err.message);
  } finally {
    await pool.end();
  }
}

hardenSchemas();
