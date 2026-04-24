/**
 * Quick Database Connection Test
 * Run this to verify Neon connection is working
 */

import pkg from 'pg';
const { Pool } = pkg;

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing database connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found ✓' : 'Missing ✗');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  const client = await pool.connect();
  const result = await client.query('SELECT NOW() as now, current_database() as db');
  
  console.log('\n✅ Database connection successful!');
  console.log('Current time:', result.rows[0].now);
  console.log('Database:', result.rows[0].db);
  
  // Check if drug_master table exists
  const drugCount = await client.query('SELECT COUNT(*) FROM emr.drug_master');
  console.log('Drugs in database:', drugCount.rows[0].count);
  
  client.release();
  await pool.end();
  
} catch (error) {
  console.error('\n❌ Database connection failed!');
  console.error('Error:', error.message);
  process.exit(1);
}
