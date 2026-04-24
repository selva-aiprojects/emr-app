import { query } from './server/db/connection.js';
import fs from 'fs';

async function applyExtensionsToMagnum() {
  console.log("🚀 Applying billing & insurance extensions to MAGNUM schema...");

  try {
    // First check if magnum schema exists
    const schemaCheck = await query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'magnum'");
    if (schemaCheck.rows.length === 0) {
      console.log("❌ MAGNUM schema does not exist. Please run the seed script first.");
      return;
    }

    // Read the extensions SQL file
    const sql = fs.readFileSync('./database/billing_insurance_extensions.sql', 'utf8');

    // Replace 'emr.' with 'magnum.' in the SQL
    const magnumSql = sql.replace(/emr\./g, 'magnum.');

    // Split the SQL into individual statements and execute them
    const statements = magnumSql.split(';').filter(stmt => stmt.trim().length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        try {
          await query(statement);
        } catch (error) {
          // Skip errors for already existing objects
          if (!error.message.includes('already exists') && !error.message.includes('does not exist')) {
            console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
          }
        }
      }
    }

    console.log("✅ Successfully applied billing & insurance extensions to MAGNUM schema!");

    // Verify the tables were created
    const tables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'magnum'
      AND table_name IN ('concessions', 'credit_notes', 'bill_approvals', 'insurance_providers', 'corporate_clients')
      ORDER BY table_name
    `);

    console.log("📋 Created tables in MAGNUM schema:");
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error applying extensions:', error.message);
  }
}

applyExtensionsToMagnum();