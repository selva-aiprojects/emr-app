import { query } from './server/db/connection.js';

async function checkAllMagnumTables() {
  console.log("🔍 Checking all tables in MAGNUM schema...");

  try {
    const tables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'magnum'
      ORDER BY table_name
    `);

    console.log(`📊 MAGNUM schema has ${tables.rows.length} tables:`);
    tables.rows.forEach(row => console.log(`  ✅ ${row.table_name}`));

    // Check for specific billing tables
    const billingTables = [
      'billing_items', 'billing_invoices', 'billing_payments',
      'billing_concessions', 'billing_credit_notes', 'billing_approvals',
      'insurance_providers', 'insurance_pre_auth', 'patient_insurance',
      'corporate_clients', 'corporate_bills', 'corporate_bill_items'
    ];

    console.log("\n🔍 Checking for billing & insurance tables:");
    let missingTables = [];

    for (const tableName of billingTables) {
      const exists = tables.rows.some(row => row.table_name === tableName);
      if (exists) {
        console.log(`  ✅ ${tableName}`);
      } else {
        console.log(`  ❌ ${tableName} (MISSING)`);
        missingTables.push(tableName);
      }
    }

    if (missingTables.length === 0) {
      console.log("\n🎉 All billing and insurance tables are present!");
    } else {
      console.log(`\n⚠️  Missing ${missingTables.length} tables:`, missingTables.join(', '));
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  }
}

checkAllMagnumTables();