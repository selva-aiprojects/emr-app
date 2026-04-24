import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ 
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/emr',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  await client.connect();
  console.log('Connected to database');
  try {
    // 1. Ensure extension exists (Global)
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    console.log('✅ Extension pg_trgm verified');

    // 2. Fetch all tenant schemas
    const res = await client.query('SELECT schema_name FROM emr.management_tenants');
    const schemas = res.rows.map(r => r.schema_name);
    
    // Add public and emr to the list for good measure
    if (!schemas.includes('public')) schemas.push('public');
    if (!schemas.includes('emr')) schemas.push('emr');

    for (const schema of schemas) {
      console.log(`\n📦 Provisioning schema: ${schema}`);
      
      try {
        // Create table in this schema
        await client.query(`
          CREATE TABLE IF NOT EXISTS "${schema}".doctor_schedules (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id uuid NOT NULL,
            provider_id uuid NOT NULL,
            day_of_week integer NOT NULL,
            start_time time NOT NULL,
            end_time time NOT NULL,
            slot_duration integer DEFAULT 30,
            is_active boolean DEFAULT true,
            created_at timestamp with time zone DEFAULT now()
          );
        `);
        console.log(`  ✅ doctor_schedules table verified`);

        // Check if patients table exists in this schema before indexing
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'patients'
          );
        `, [schema]);

        if (tableCheck.rows[0].exists) {
          await client.query(`CREATE INDEX IF NOT EXISTS idx_patients_name_trgm ON "${schema}".patients USING gin ((first_name || ' ' || last_name) gin_trgm_ops);`);
          await client.query(`CREATE INDEX IF NOT EXISTS idx_patients_fname_trgm ON "${schema}".patients USING gin (first_name gin_trgm_ops);`);
          await client.query(`CREATE INDEX IF NOT EXISTS idx_patients_lname_trgm ON "${schema}".patients USING gin (last_name gin_trgm_ops);`);
          await client.query(`CREATE INDEX IF NOT EXISTS idx_patients_mrn_trgm ON "${schema}".patients USING gin (mrn gin_trgm_ops);`);
          console.log(`  ✅ Patient search indexes verified`);
        } else {
          console.log(`  ⚠️  Table "patients" not found in schema "${schema}", skipping indexes.`);
        }

        // Index for doctor_schedules
        await client.query(`CREATE INDEX IF NOT EXISTS idx_dr_schedule_provider ON "${schema}".doctor_schedules(provider_id, tenant_id);`);
        console.log(`  ✅ Schedule performance index verified`);

      } catch (schemaErr) {
        console.error(`  ❌ Failed to provision schema "${schema}":`, schemaErr.message);
      }
    }

    console.log('\n🎉 Migration completed across all tenant shards.');
    
  } catch (err) {
    console.error('❌ Critical migration failure:', err);
  } finally {
    await client.end();
  }
}

run();
