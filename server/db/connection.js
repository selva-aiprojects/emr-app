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
  connectionTimeoutMillis: 30000, // Increased timeout for Neon
  query_timeout: 30000, // Query timeout
});

// Test database connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
export async function query(text, params) {
  const start = Date.now();
  const client = await pool.connect();
  const tenantId = tenantContext ? tenantContext.getStore() : null;
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB_QUERY]', { text, params, tenantId });
  }

  try {
    if (tenantId === 'SUPERADMIN_BYPASS') {
      await client.query(`SELECT set_config('app.bypass_rls', 'true', false)`);
    } else if (tenantId) {
      await client.query(`SELECT set_config('app.current_tenant', $1, false)`, [tenantId]);
    }
    const res = await client.query(text, params);
    const duration = Date.now() - (start || Date.now());
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('[CRITICAL_DB_ERROR]', { text, params, error: error.message });
    throw error;
  } finally {
    if (tenantId === 'SUPERADMIN_BYPASS') {
      await client.query(`SELECT set_config('app.bypass_rls', '', false)`);
    } else if (tenantId) {
      // Clear the session variable before returning to pool
      await client.query(`SELECT set_config('app.current_tenant', '', false)`);
    }
    client.release(); // Always release the connection back to the pool
  }
}

// Helper function to get a client for transactions
export async function getClient() {
  return await pool.query('client');
}

// Test connection function
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as now, current_database() as database');
    console.log('✅ Database connection test successful');
    console.log(`   Database: ${result.rows[0].database}`);
    console.log(`   Server time: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

export default pool;
