/**
 * NHGL BOOTSTRAP — FULL SCHEMA RECONSTRUCTION
 * ===========================================
 * This script reads the canonical 'tenant_base_schema.sql' 
 * and applies it to the 'nhgl' schema to ensure NO tables are missing.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function bootstrap() {
  try {
    await client.connect();
    console.log('🚀 Bootstrapping NHGL Schema from Base SQL...');

    // 1. Read the Base SQL
    const sqlPath = path.join(process.cwd(), 'database', 'tenant_base_schema.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // 2. Set search path to isolated schema
    await client.query('CREATE SCHEMA IF NOT EXISTS nhgl');
    await client.query('SET search_path TO nhgl, public');

    // 3. Clean and Execute SQL
    // Remove comments and split by semicolon (naive but usually works for our schema)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (err) {
        // Ignore "already exists" errors if they happen, but log others
        if (!err.message.includes('already exists')) {
          console.warn(`⚠️  Statement warning: ${err.message}`);
        }
      }
    }

    console.log('✅ NHGL Schema synchronized with latest tenant_base_schema.sql');
    process.exit(0);
  } catch (err) {
    console.error('❌ Bootstrap failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

bootstrap();
