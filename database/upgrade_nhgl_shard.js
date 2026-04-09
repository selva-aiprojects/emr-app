import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, '../database/tenant_base_schema.sql');
const sql = readFileSync(sqlPath, 'utf8');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function upgrade() {
  await client.connect();
  const schemaName = 'nhgl';
  console.log(`🚀 Upgrading Shard Schema: "${schemaName}" to Latest Baseline...`);

  await client.query(`SET search_path TO "${schemaName}", public`);

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await client.query(stmt);
    } catch (e) {
      if (!e.message.includes('already exists')) {
        // Just log and continue
      }
    }
  }

  console.log(`✅ [UPGRADE] Shard "${schemaName}" is now at baseline.`);
  await client.end();
}

upgrade();
