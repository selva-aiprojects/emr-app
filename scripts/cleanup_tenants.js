import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const toKeep = ['f998a8f5-95b9-4fd7-a583-63cf574d65ed', '45cfe286-5469-457a-88b3-e998f4cdc7c6'];
  
  try {
    console.log('--- CLEANING UP TENANTS ---');
    
    // 1. Resource Monitor table in emr schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emr.tenant_resources (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          tenant_id TEXT NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
          cpu_cores_limit DECIMAL(4,2) DEFAULT 1.0,
          ram_gb_limit INTEGER DEFAULT 2,
          storage_gb_limit INTEGER DEFAULT 10,
          scaling_tier TEXT DEFAULT 'Auto-Scale',
          peak_demand_threshold INTEGER DEFAULT 80,
          current_status TEXT DEFAULT 'Healthy',
          last_resource_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(tenant_id)
      );
    `);
    console.log('✅ Infrastructure table ready.');

    // 2. Identify redundant tenants
    const res = await pool.query('SELECT id, name, code FROM emr.tenants WHERE id NOT IN ($1, $2)', toKeep);
    
    for (const tenant of res.rows) {
      console.log(`🗑 Removing ${tenant.name} (${tenant.id})...`);
      
      // Delete from emr.tenants (foreign keys should cascade)
      await pool.query('DELETE FROM emr.tenants WHERE id = $1', [tenant.id]);
      
      // Clean up its schema by code
      if (tenant.code) {
        const schemaName = `tenant_${tenant.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        await pool.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
      }
      
      // Also clean up UUID-based schemas if they exist
      const uuidSchema = `tenant_${tenant.id.replace(/-/g, '').toLowerCase().substring(0, 16)}`;
      await pool.query(`DROP SCHEMA IF EXISTS ${uuidSchema} CASCADE`);
    }

    console.log('✅ Cleanup complete. Retained: New Age Hospital & Enterprise Hospital Systems.');
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  } finally {
    await pool.end();
  }
}

run();
