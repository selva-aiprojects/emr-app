import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { tenantContext } from '../lib/tenantContext.js';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000, 
  connectionTimeoutMillis: 10000, 
  statement_timeout: 15000, 
  query_timeout: 30000, 
});

pool.on('connect', () => console.log('✅ Connected to PostgreSQL database'));

// Prevent unhandled pool errors from crashing the process
pool.on('error', (err) => {
  console.error('[POOL_ERROR] Idle client error (non-fatal):', err.message);
});

let tenantCodeCache = new Map();

export async function query(text, params) {
  let client;
  try {
    client = await pool.connect();
    const tenantId = tenantContext ? tenantContext.getStore() : null;
    let schemaName = 'nexus';
    
    if (tenantId && tenantId !== 'SUPERADMIN_BYPASS') {
      if (!tenantCodeCache.has(tenantId)) {
        try {
          let res = await pool.query({
            text: 'SELECT schema_name FROM nexus.management_tenants WHERE id::text = $1 OR code = $1',
            values: [tenantId],
            timeout: 5000
          });
          if (res.rows.length === 0) {
            res = await pool.query({
              text: 'SELECT schema_name, code FROM nexus.tenants WHERE id::text = $1',
              values: [tenantId],
              timeout: 5000
            });
            if (res.rows.length > 0) {
              res.rows[0].schema_name = (res.rows[0].schema_name || res.rows[0].code).toLowerCase();
            }
          }
          if (res.rows.length > 0 && res.rows[0].schema_name) {
            tenantCodeCache.set(tenantId, res.rows[0].schema_name);
          }
        } catch (err) {
          console.error('[DB_ROUTING_ERROR] Database routing failed:', err.message);
        }
      }
      const schema = tenantCodeCache.get(tenantId);
      if (schema) schemaName = schema;
    }

    await client.query(`SET search_path TO "${schemaName}", nexus, public`);
    
    if (tenantId === 'SUPERADMIN_BYPASS') {
      await client.query("SELECT set_config('app.bypass_rls', 'true', false)");
    } else if (tenantId) {
      await client.query("SELECT set_config('app.current_tenant', $1, false)", [tenantId]);
    }

    const res = await client.query(text, params);
    console.log(`[DB_EXEC] Tenant: ${tenantId}, Schema: ${schemaName}, Query: ${text.slice(0, 100).replace(/\s+/g, ' ')}, Rows: ${res.rowCount}`);
    return res;
  } catch (error) {
    console.error(`[CRITICAL_DB_ERROR] Query: ${text}`);
    throw error;
  } finally {
    if (client) client.release();
  }
}

async function ensureMigrationRegistry() {
  try {
    await pool.query('CREATE SCHEMA IF NOT EXISTS nexus');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nexus.migrations_log (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
  } catch (err) {}
}

function robustSqlSplit(sql) {
    const statements = [];
    let current = '';
    let inDollarQuote = false;
    
    const lines = sql.split(/\r?\n/);
    for (let line of lines) {
        // Toggle dollar quote state if line contains $$
        if (line.includes('$$')) {
            inDollarQuote = !inDollarQuote;
        }
        
        current += line + '\n';
        
        // Only split if NOT in a dollar-quoted block and the line ends with a semicolon
        if (!inDollarQuote && line.trim().endsWith(';')) {
            statements.push(current.trim());
            current = '';
        }
    }
    
    if (current.trim()) {
        statements.push(current.trim());
    }
    return statements;
}

async function runPendingMigrations() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const migrationsPaths = [
    path.join(__dirname, 'migrations'),
    path.join(__dirname, '../../database/migrations')
  ];

  for (const migrationsDir of migrationsPaths) {
    if (!fs.existsSync(migrationsDir)) continue;
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    
    for (const file of files) {
      const checkRes = await pool.query('SELECT 1 FROM nexus.migrations_log WHERE filename = $1', [file]);
      if (checkRes.rowCount === 0) {
        console.log(`[DATABASE_MIGRATION] Running: ${file}`);
        const client = await pool.connect();
        try {
          const targetSchema = process.env.DB_SCHEMA || 'nexus';
          await client.query(`SET search_path TO "${targetSchema}", nexus, public`);
          console.log(`📡 [MIGRATION_CONTEXT] Target: ${targetSchema}, Path: ${targetSchema}, nexus, public`);
          
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          const statements = robustSqlSplit(sql);

          await client.query('BEGIN');
          try {
            for (const statement of statements) {
              try {
                console.log(`[DEBUG_MIGRATION] Executing: ${statement.slice(0, 50).replace(/\n/g, ' ')}...`);
                await client.query(statement);
              } catch (stmtErr) {
                // Skip already-exists / already-dropped errors silently
                if (
                  stmtErr.code === '42P07' || // duplicate table
                  stmtErr.code === '42710' || // duplicate object
                  (stmtErr.code === '42P01' && statement.toUpperCase().includes('DROP')) // DROP on missing table
                ) {
                  continue;
                }
                console.error(`[MIGRATION_STMT_FAIL] Filename: ${file}, Error: ${stmtErr.message}`);
                throw stmtErr;  // triggers ROLLBACK below
              }
            }
            await client.query('INSERT INTO nexus.migrations_log (filename) VALUES ($1)', [file]);
            await client.query('COMMIT');
            console.log(`[DATABASE_MIGRATION] ✅ Success: ${file}`);
          } catch (txErr) {
            await client.query('ROLLBACK');
            console.error(`[DATABASE_MIGRATION] ❌ Failed (rolled back): ${file} —`, txErr.message);
            // Mark permanently failed migrations as skipped so they don't block future runs
            try {
              await pool.query(
                'INSERT INTO nexus.migrations_log (filename) VALUES ($1) ON CONFLICT DO NOTHING',
                [`SKIP:${file}`]
              );
            } catch (_) {}
          }
        } finally {
          client.release();
        }
      }
    }
  }
}

export async function testConnection() {
  try {
    await pool.query('SELECT NOW() as now');
    console.log('✅ Database connection successful');
    await ensureMigrationRegistry();
    await runPendingMigrations();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

export { pool };
export default pool;
