import { query } from './server/db/connection.js';
import fs from 'fs';

async function addMissingTables() {
  console.log("🔧 Adding missing billing and insurance tables to MAGNUM schema...");

  try {
    // Read the missing tables SQL
    const sqlContent = fs.readFileSync('./database/MAGNUM_MISSING_TABLES.sql', 'utf8');

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
          console.log(`⚠️  Statement ${i + 1} error:`, error.message.substring(0, 100));
          errorCount++;
        }
      }
    }

    console.log(`✅ Completed: ${successCount} successful, ${errorCount} errors`);

  } catch (error) {
    console.error('❌ Error adding missing tables:', error.message);
  }
}

addMissingTables();