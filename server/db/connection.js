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
    
    // 1. Context Resolution (Non-Recursive)
    let schemaName = 'emr';
    if (tenantId && tenantId !== 'SUPERADMIN_BYPASS') {
      // Direct pool query to avoid infinite recursion
      if (!tenantCodeCache.has(tenantId)) {
        try {
          // Check Management Plane (Newest)
          let res = await pool.query('SELECT schema_name FROM emr.management_tenants WHERE id = $1', [tenantId]);
          
          if (res.rows.length === 0) {
            // Check Legacy Tenants table (fallback to LOWER(code) as schema)
            res = await pool.query('SELECT code as schema_name FROM emr.tenants WHERE id = $1', [tenantId]);
            if (res.rows.length > 0) {
              res.rows[0].schema_name = res.rows[0].schema_name.toLowerCase();
            }
          }

          if (res.rows.length > 0) {
            tenantCodeCache.set(tenantId, res.rows[0].schema_name);
          } else {
            console.warn(`[DB_ROUTING_WARN] No schema found for tenantId: ${tenantId}`);
          }
        } catch (err) {
          console.error('[DB_ROUTING_ERROR] Database routing failed:', err.message);
        }
      }
      const schema = tenantCodeCache.get(tenantId);
      if (schema) schemaName = schema;
    }

    // 2. Session Configuration (Sequence-Harden)
    // IMPORTANT: Schema name must be quoted to handle names with periods (e.g. nah.healthezee.com)
    await client.query(`SET search_path TO "${schemaName}", emr, public`);
    
    if (tenantId === 'SUPERADMIN_BYPASS') {
      await client.query("SELECT set_config('app.bypass_rls', 'true', false)");
    } else if (tenantId) {
      await client.query("SELECT set_config('app.current_tenant', $1, false)", [tenantId]);
    }

    // 3. Execution Phase
    const res = await client.query(text, params);
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

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

export default pool;
