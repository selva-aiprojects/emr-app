import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { tenantContext } from '../lib/tenantContext.js';

dotenv.config();

// PostgreSQL connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 30000, // Increased timeout for Supabase Pooler
  query_timeout: 30000, // Query timeout
});

// Test database connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

// Cache for tenant code lookups to avoid repeated DB calls
let tenantCodeCache = new Map();

// Helper function to execute queries
export async function query(text, params) {
  const start = Date.now();
  let client;
  
  try {
    client = await pool.connect();
    const tenantId = tenantContext ? tenantContext.getStore() : null;
    
    // Default schema is Control Plane
    let schemaName = 'emr';
    
    if (tenantId && tenantId !== 'SUPERADMIN_BYPASS') {
      // Resolve tenantId to short code (cached)
      if (!tenantCodeCache.has(tenantId)) {
        const res = await client.query('SELECT code FROM emr.tenants WHERE id = $1', [tenantId]);
        if (res.rows.length > 0) {
          tenantCodeCache.set(tenantId, res.rows[0].code.toLowerCase());
        }
      }
      
      const code = tenantCodeCache.get(tenantId);
      if (code) {
        schemaName = code;
      }
    }
    
    // Set dynamic search_path for isolation
    if (schemaName && schemaName !== 'emr') {
      await client.query(`SET search_path TO ${schemaName}, emr, public`);
    } else {
      await client.query('SET search_path TO emr, public');
    }

    if (tenantId === 'SUPERADMIN_BYPASS') {
      await client.query(`SELECT set_config('app.bypass_rls', 'true', false)`);
    } else if (tenantId) {
      await client.query(`SELECT set_config('app.current_tenant', $1, false)`, [tenantId]);
    }

    const res = await client.query(text, params);
    
    if (process.env.NODE_ENV === 'development' && !text.includes('set_config')) {
      const duration = Date.now() - start;
      console.log('[DB_QUERY] Executed', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('[CRITICAL_DB_ERROR]', { text, params, error: error.message });
    throw error;
  } finally {
    if (client) {
      try {
        const tId = tenantContext ? tenantContext.getStore() : null;
        if (tId === 'SUPERADMIN_BYPASS') {
          await client.query(`SELECT set_config('app.bypass_rls', '', false)`);
        } else if (tId) {
          await client.query(`SELECT set_config('app.current_tenant', '', false)`);
        }
      } finally {
        client.release();
      }
    }
  }
}

// Test connection function with Forced Migration
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as now');
    console.log('✅ Database connection successful');

    // 🚀 [STARTUP] FORCE ONE-TIME ISOLATION & CLEANUP
    const toKeep = [
      { id: 'f998a8f5-95b9-4fd7-a583-63cf574d65ed', code: 'nah' },
      { id: '45cfe286-5469-457a-88b3-e998f4cdc7c6', code: 'ehs' }
    ];
    const tables = ['clinical_records', 'prescriptions', 'procedures', 'observations', 'diagnostic_reports', 'conditions', 'service_requests', 'frontdesk_visits', 'claims', 'documents', 'blood_requests', 'invoices', 'appointments', 'encounters', 'patients'];

    // 1. Create Infrastructure Table
    await pool.query(`CREATE TABLE IF NOT EXISTS emr.tenant_resources (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID UNIQUE REFERENCES emr.tenants(id) ON DELETE CASCADE)`);
    
    // 2. Provision & Migrate (Now using exact names)
    for (const tenant of toKeep) {
      const sc = tenant.code;
      await pool.query(`CREATE SCHEMA IF NOT EXISTS ${sc}`);
      for (const t of tables) {
        await pool.query(`CREATE TABLE IF NOT EXISTS ${sc}.${t} (LIKE emr.${t} INCLUDING ALL)`);
        // Move data from emr schema (and fallback from any legacy tenant_ schema)
        await pool.query(`
          INSERT INTO ${sc}.${t} 
          SELECT * FROM emr.${t} WHERE tenant_id = $1
          ON CONFLICT DO NOTHING
        `, [tenant.id]);
        
        // Also move from legacy if exist
        try {
          const legacy = `tenant_${sc}`;
          await pool.query(`INSERT INTO ${sc}.${t} SELECT * FROM ${legacy}.${t} ON CONFLICT DO NOTHING`);
        } catch (e) { /* ignore if legacy doesn't exist */ }
      }
    }

    // 3. Cleanup redundant tenants
    const keepIds = toKeep.map(t => t.id);
    const delRes = await pool.query('DELETE FROM emr.tenants WHERE id NOT IN ($1, $2)', keepIds);
    if (delRes.rowCount > 0) console.log(`✅ [ISOLATION] Cleaned up ${delRes.rowCount} redundant tenants.`);

    return true;
  } catch (error) {
    console.error('❌ Database connection/migration failed:', error.message);
    return false;
  }
}

export default pool;
