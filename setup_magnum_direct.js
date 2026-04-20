import { query } from './server/db/connection.js';
import fs from 'fs';

async function setupMagnumSchemaDirect() {
  console.log("🚀 Setting up MAGNUM schema with direct SQL execution...");

  try {
    // Read the direct SQL setup
    const sqlContent = fs.readFileSync('./database/MAGNUM_SCHEMA_SETUP.sql', 'utf8');

    // Split into statements and execute
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement && !statement.startsWith('--')) {
        try {
          await query(statement);
          successCount++;
        } catch (error) {
          // Log errors but continue
          console.log(`⚠️  Statement ${i + 1} error:`, error.message.substring(0, 100));
          errorCount++;
        }
      }
    }

    console.log(`✅ Completed: ${successCount} successful, ${errorCount} errors`);

    // Verify tables
    const tables = await query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'magnum'
    `);

    console.log(`📊 MAGNUM schema now has ${tables.rows[0].table_count} tables`);

    // List all tables
    const tableList = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'magnum'
      ORDER BY table_name
    `);

    console.log("📋 Tables in MAGNUM schema:");
    tableList.rows.forEach(row => console.log(`  - ${row.table_name}`));

  } catch (error) {
    console.error('❌ Error setting up MAGNUM schema:', error.message);
  }
}

setupMagnumSchemaDirect();