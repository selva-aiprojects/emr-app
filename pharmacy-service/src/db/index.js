/**
 * Database Connection Pool - MedFlow EMR
 * PostgreSQL connection pool configuration
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Database connection configuration
const pool = new Pool({
  // Using DATABASE_URL (Pooler) - Direct connection failed to resolve
  connectionString: process.env.DATABASE_URL,
  
  // SSL configuration (required for cloud databases like Supabase)
  ssl: {
    rejectUnauthorized: false
  },
  
  // PgBouncer optimization (Disabling prepared statements)
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // This is the key for PgBouncer transaction mode
  statement_timeout: 10000,
});

// Test connection on startup
pool.on('connect', (client) => {
  client.query("SET search_path TO emr, extensions");
  console.log('✅ Connected to PostgreSQL database (Pharmacy Service)');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔌 Shutting down database pool...');
  await pool.end();
  process.exit(0);
});

export { pool };
export default pool;
