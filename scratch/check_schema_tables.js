import pool from './server/db/connection.js';

async function checkSchemaTables() {
  const schemaName = 'vhspl';
  try {
    const { rows: tables } = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1`,
      [schemaName]
    );
    console.log(`Tables in ${schemaName} (${tables.length}):`);
    tables.forEach(t => console.log(t.table_name));
    
    // Also parse SHARD_MASTER_BASELINE and tenant_base_schema_comprehensive_v2 to see how many tables they aim to create
    const fs = await import('fs');
    const path = await import('path');
    const shardContent = fs.readFileSync(path.resolve('./database/SHARD_MASTER_BASELINE.sql'), 'utf8');
    const compContent = fs.readFileSync(path.resolve('./database/tenant_base_schema_comprehensive_v2.sql'), 'utf8');
    
    const shardMatches = shardContent.match(/CREATE TABLE\s+(IF NOT EXISTS\s+)?([a-zA-Z0-9_]+)/g);
    const compMatches = compContent.match(/CREATE TABLE\s+(IF NOT EXISTS\s+)?([a-zA-Z0-9_]+)/g);
    
    console.log(`\nCREATE TABLE statements in SHARD_MASTER_BASELINE.sql: ${shardMatches ? shardMatches.length : 0}`);
    console.log(`CREATE TABLE statements in tenant_base_schema_comprehensive_v2.sql: ${compMatches ? compMatches.length : 0}`);
    
    // Check which ones are in comp but not shard
    const shardTables = shardMatches ? shardMatches.map(m => m.split(' ').pop()) : [];
    const compTables = compMatches ? compMatches.map(m => m.split(' ').pop()) : [];
    
    const missing = compTables.filter(t => !shardTables.includes(t));
    console.log(`\nMissing in SHARD_MASTER: ${missing.join(', ')}`);
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkSchemaTables();
