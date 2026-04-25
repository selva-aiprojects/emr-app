import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function ensureFeatureTables() {
  await client.connect();
  console.log('🔧 Ensuring feature flag tables exist in nexus schema...');

  await client.query(`SET search_path TO nexus, public`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS global_kill_switches (
      id          SERIAL PRIMARY KEY,
      feature_flag TEXT NOT NULL UNIQUE,
      enabled     BOOLEAN NOT NULL DEFAULT false,
      reason      TEXT,
      created_by  TEXT,
      updated_by  TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('  ✅ global_kill_switches');

  await client.query(`
    CREATE TABLE IF NOT EXISTS tenant_features (
      id           SERIAL PRIMARY KEY,
      tenant_id    TEXT NOT NULL,
      feature_flag TEXT NOT NULL,
      enabled      BOOLEAN NOT NULL DEFAULT true,
      updated_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(tenant_id, feature_flag)
    )
  `);
  console.log('  ✅ tenant_features');

  // Also ensure mrn_sequences and invoice_sequences exist (used by generateMRN)
  await client.query(`
    CREATE TABLE IF NOT EXISTS mrn_sequences (
      tenant_id      TEXT PRIMARY KEY,
      sequence_value INTEGER NOT NULL DEFAULT 0
    )
  `);
  console.log('  ✅ mrn_sequences');

  await client.query(`
    CREATE TABLE IF NOT EXISTS invoice_sequences (
      tenant_id      TEXT PRIMARY KEY,
      sequence_value INTEGER NOT NULL DEFAULT 0
    )
  `);
  console.log('  ✅ invoice_sequences');

  console.log('\n🎉 All feature tables are ready.');
  await client.end();
}

ensureFeatureTables().catch(e => { console.error('❌', e.message); process.exit(1); });
