import { query } from './server/db/connection.js';
import fs from 'fs';

async function setupMagnumSchema() {
  console.log("🚀 Setting up complete MAGNUM schema with billing & insurance extensions...");

  try {
    // Read the SHARD baseline SQL
    const shardSql = fs.readFileSync('./database/SHARD_MASTER_BASELINE.sql', 'utf8');

    // Replace schema references to use magnum instead of current schema
    let magnumSql = shardSql.replace(/CREATE SCHEMA IF NOT EXISTS emr;/g, '-- Schema already exists');
    magnumSql = magnumSql.replace(/emr\./g, 'magnum.');
    magnumSql = magnumSql.replace(/current_schema\(\)/g, "'magnum'");

    // Split into statements and execute
    const statements = magnumSql.split(';').filter(stmt => stmt.trim().length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement && !statement.startsWith('--')) {
        try {
          await query(statement);
        } catch (error) {
          // Skip errors for already existing objects or dependencies
          if (!error.message.includes('already exists') &&
              !error.message.includes('does not exist') &&
              !error.message.includes('duplicate key')) {
            console.log(`⚠️  Statement ${i + 1} warning:`, error.message.substring(0, 100));
          }
        }
      }
    }

    console.log("✅ MAGNUM schema setup completed!");

    // Verify tables
    const tables = await query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'magnum'
    `);

    console.log(`📊 MAGNUM schema now has ${tables.rows[0].table_count} tables`);

  } catch (error) {
    console.error('❌ Error setting up MAGNUM schema:', error.message);
  }
}

setupMagnumSchema();