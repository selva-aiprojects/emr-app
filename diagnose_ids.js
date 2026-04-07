import { query } from './server/db/connection.js';

async function diagnose() {
  console.log("--- CLEANING UP SUPREME HOSPITALS ---");
  try {
    // Search in all registry tables
    const results = await query("SELECT id, code, name FROM emr.tenants WHERE name ILIKE '%Supreme%' OR code ILIKE '%supreme%'");
    console.log(`\nFound ${results.rows.length} ghost records matching 'Supreme'.`);
    
    for (const row of results.rows) {
      console.log(`- Deleting: ${row.name} (Code: ${row.code}, ID: ${row.id})`);
      await query("DELETE FROM emr.tenants WHERE id = $1", [row.id]);
      await query("DELETE FROM emr.management_tenants WHERE id = $1", [row.id]);
    }
    
    console.log("\n--- CURRENT ACTIVE TENANTS ---");
    const active = await query("SELECT code, name FROM emr.tenants ORDER BY code");
    if (active.rows.length === 0) {
      console.log("No active tenants found.");
    } else {
      active.rows.forEach(r => console.log(`- ${r.code}: ${r.name}`));
    }

  } catch (err) {
    console.error("\nCleanup failed:", err.message);
  }
  process.exit(0);
}

diagnose();
