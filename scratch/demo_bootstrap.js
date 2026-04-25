import dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function bootstrap() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🚀 [BOOTSTRAP] Starting institutional shard deployment...');

    // 1. PURGE
    console.log('🧹 Purging clinical pollution and resetting shard...');
    await client.query('DROP SCHEMA IF EXISTS "nhgl" CASCADE');
    await client.query('CREATE SCHEMA "nhgl"');
    await client.query('DELETE FROM nexus.migrations_log');
    
    // 2. RUN BASELINE
    console.log('🧱 Applying Shard Master Baseline...');
    const baselinePath = path.join(__dirname, '../database/SHARD_MASTER_BASELINE.sql');
    const baselineSql = fs.readFileSync(baselinePath, 'utf8');
    await client.query(`SET search_path TO "nhgl", nexus, public`);
    
    // Simple split for baseline (no dollar quotes expected in baseline)
    const baselineStmts = baselineSql.split(';').filter(s => s.trim());
    for (let stmt of baselineStmts) {
        await client.query(stmt + ';').catch(e => {
            if (!e.message.includes('already exists')) throw e;
        });
    }

    console.log('✅ Shard Baseline applied successfully.');
    await client.end();

    // 3. RUN MIGRATIONS
    console.log('⛓️  Executing clinical migration chain...');
    // We'll call the test_schemas script or just logic from it
    // For now, instruct user to run the standard scripts in sequence
    
    console.log('\n✨ [BOOTSTRAP] Baseline established. Now run migrations.');
  } catch (err) {
    console.error('❌ [BOOTSTRAP] Failed:', err.message);
  }
}

bootstrap();
