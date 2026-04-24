import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { tenantContext } from '../lib/tenantContext.js';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.warn('⚠️ [DB_CONFIG] DATABASE_URL is not defined in environment variables!');
} else {
  const maskedUrl = dbUrl.replace(/\/\/.*@/, '//****:****@');
  console.log(`📡 [DB_CONFIG] DATABASE_URL loaded: ${maskedUrl}`);
}

// PostgreSQL connection pool configuration
const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5, // Extremely conservative to stay within Supabase Session Mode limits
  idleTimeoutMillis: 30000, 
  connectionTimeoutMillis: 10000, 
  statement_timeout: 15000, 
  query_timeout: 30000, 
});

// Telemetry for pool occupancy
setInterval(() => {
  if (pool.totalCount > 0) {
    console.log(`[POOL_STATS] Active: ${pool.totalCount - pool.idleCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
  }
}, 5000);

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
    
    // EMERGENCY OVERRIDE for E2E Testing stability
    if (tenantId === 'b01f0cdc-4e8b-4db5-ba71-e657a414695e' || tenantId === 'nhgl') {
       schemaName = 'emr';
    } else if (tenantId && tenantId !== 'SUPERADMIN_BYPASS') {
      // Direct pool query to avoid infinite recursion
      if (!tenantCodeCache.has(tenantId)) {
        try {
          // Check Management Plane (Newest)
          let res = await pool.query({
            text: 'SELECT schema_name FROM emr.management_tenants WHERE id::text = $1 OR code = $1',
            values: [tenantId],
            timeout: 5000 // Short timeout for routing lookup to avoid hanging
          });
          
          if (res.rows.length === 0) {
            // Check Legacy Tenants table (fallback to schema_name or LOWER(code) as schema)
            res = await pool.query({
              text: 'SELECT schema_name, code FROM emr.tenants WHERE id::text = $1',
              values: [tenantId],
              timeout: 5000
            });
            if (res.rows.length > 0) {
              res.rows[0].schema_name = (res.rows[0].schema_name || res.rows[0].code).toLowerCase();
            }
          }

          if (res.rows.length > 0 && res.rows[0].schema_name) {
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
    try {
      await client.query(`SET search_path TO "${schemaName}", emr, public`);
    } catch (sessionErr) {
      console.error(`[DB_SESSION_ERROR] Failed to set search_path to ${schemaName}:`, sessionErr.message);
      throw sessionErr;
    }
    
    if (tenantId === 'SUPERADMIN_BYPASS') {
      await client.query("SELECT set_config('app.bypass_rls', 'true', false)");
    } else if (tenantId) {
      await client.query("SELECT set_config('app.current_tenant', $1, false)", [tenantId]);
    }

    // Execution Phase
    const res = await client.query(text, params);
    
    // Console logging for E2E visibility
    console.log(`[DB_EXEC] Tenant: ${tenantId}, Schema: ${schemaName}, Query: ${text.slice(0, 100).replace(/\s+/g, ' ')}, Rows: ${res.rowCount}`);

    return res;
  } catch (error) {
    console.error(`[CRITICAL_DB_ERROR] Query: ${text}`);
    console.error('Error Details:', error);
    throw error;
  } finally {
      if (client) {
        try {
          const tId = tenantContext ? tenantContext.getStore() : null;
          if (tId === 'SUPERADMIN_BYPASS') {
            await client.query(`SELECT set_config('app.bypass_rls', '', false)`).catch(() => {});
          } else if (tId) {
            await client.query(`SELECT set_config('app.current_tenant', '', false)`).catch(() => {});
          }
        } finally {
          client.release();
        }
      }
    }
}

// Migration Registry to ensure scripts run only once
async function ensureMigrationRegistry() {
  try {
    await pool.query('CREATE SCHEMA IF NOT EXISTS emr');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emr.migrations_log (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.warn('[MIGRATION_REGISTRY] Warning:', err.message);
  }
}

async function runPendingMigrations() {
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const migrationsPaths = [
    path.join(__dirname, 'migrations'),
    path.join(__dirname, '../../database/migrations')
  ];

  // A. ENSURE NEXUS MASTER BASELINE FIRST
  const nexusBaseline = path.join(__dirname, '../../database/NEXUS_MASTER_BASELINE.sql');
  if (fs.existsSync(nexusBaseline)) {
    const baselineCheck = await pool.query('SELECT 1 FROM emr.migrations_log WHERE filename = $1', ['baseline/nexus_master']);
    if (baselineCheck.rowCount === 0) {
      console.log('[DATABASE_BASELINE] Applying Nexus Master Baseline...');
      try {
        const sql = fs.readFileSync(nexusBaseline, 'utf8');
        await pool.query(sql);
        await pool.query('INSERT INTO emr.migrations_log (filename) VALUES ($1)', ['baseline/nexus_master']);
        console.log('[DATABASE_BASELINE] ✅ Nexus Master Baseline Success.');
      } catch (err) {
        console.error('[DATABASE_BASELINE] ❌ Nexus Master Baseline Failed:', err.message);
      }
    }
  }

  for (const migrationsDir of migrationsPaths) {
    const absolutePath = path.resolve(migrationsDir);
    console.log(`📂 Checking migrations directory: ${absolutePath}`);
    if (!fs.existsSync(migrationsDir)) {
      console.warn(`⚠️ Directory missing: ${absolutePath}`);
      continue;
    }
    
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    console.log(`📄 Found ${files.length} SQL files in ${absolutePath}`);
    
    for (const file of files) {
      const checkRes = await pool.query('SELECT 1 FROM emr.migrations_log WHERE filename = $1', [file]);
    if (checkRes.rowCount === 0) {
      console.log(`[DATABASE_MIGRATION] Running: ${file}`);
      try {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        // Smarter split that respects $$ blocks for functions and triggers
        const statements = sql
          .split(/;(?=(?:[^$]*\$\$[^$]*\$\$)*[^$]*$)/)
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
          try {
            await pool.query(statement);
          } catch (stmtErr) {
            // Ignore "already exists" errors for idempotency
            if (stmtErr.code === '42P07' || stmtErr.code === '42710' || stmtErr.code === '42P01' && statement.toUpperCase().includes('DROP')) {
              // Skip: relation already exists or index already exists or drop failed on non-existent
              continue;
            }
            throw stmtErr; // Re-throw other errors
          }
        }
        
        await pool.query('INSERT INTO emr.migrations_log (filename) VALUES ($1)', [file]);
        console.log(`[DATABASE_MIGRATION] \u2705 Success: ${file}`);
      } catch (err) {
        console.error(`[DATABASE_MIGRATION] \u274c Failed: ${file}`, err.message);
      }
    }
  }
}
}

// Test connection function with Forced Migration
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() as now');
    console.log('✅ Database connection successful');
    
    // Auto-run migrations on startup
    await ensureMigrationRegistry();
    await runPendingMigrations();

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

export default pool;
