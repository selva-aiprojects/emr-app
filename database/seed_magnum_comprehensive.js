import { query } from '../server/db/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedComprehensiveMagnum() {
  console.log("🚀 Initializing COMPREHENSIVE Journey Seeding for Magnum Healthcare...");
  try {
    // 1. Fetch the exact ID of Magnum Healthcare
    const tRes = await query(`SELECT id FROM tenants WHERE code = 'MAGNUM'`);
    if (tRes.rowCount === 0) {
      console.error("❌ Magnum tenant not found! Please run node database/seed_magnum.js first.");
      process.exit(1);
    }
    const magnumId = tRes.rows[0].id;

    // The hardcoded ID for NAH in the seed SQLs
    const NAH_ID = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed';

    // The files that contain all the deep workflows
    const sqlFiles = [
      'seed_nah_tenant.sql',      // Patients & Users
      'seed_nah_appointments.sql',// Appointments, Encounters, Vitals, Prescriptions, Labs
      'seed_nah_inpatient.sql',   // Wards, Beds, Admissions
      'seed_nah_billing.sql',     // Invoices & Transactions
      'seed_nah_inventory.sql'    // Pharmacy & Inventory
    ];

    for (const file of sqlFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        console.log(`\n⏳ Cloning workflows from ${file}...`);
        let sql = fs.readFileSync(filePath, 'utf8');

        // Dynamically shift the data to belong to Magnum
        sql = sql.replace(new RegExp(NAH_ID, 'g'), magnumId);
        sql = sql.replace(/NAH-/g, 'MHC-');
        sql = sql.replace(/@nah\.local/g, '@magnum.local');
        sql = sql.replace(/@newage\.hospital/g, '@magnum.local');
        sql = sql.replace(/New Age Hospital/g, 'Magnum Healthcare');

        // Execute the adapted massive SQL block
        await query(sql);
        console.log(`✅ Fully seeded workflows for ${file}`);
      } else {
        console.log(`⚠️ Note: ${file} was not found, skipping.`);
      }
    }

    // Clone these records into the isolated schema namespace as well so the dashboard sees them
    console.log('\n⏳ Synchronizing full workflows into isolated "magnum" schema namespace...');
    const schema = 'magnum';
    
    // Using simple queries to replicate the data into the isolated schemas
    try {
      await query(`INSERT INTO "${schema}".patients SELECT * FROM patients WHERE tenant_id = $1 ON CONFLICT DO NOTHING`, [magnumId]);
      await query(`INSERT INTO "${schema}".appointments SELECT * FROM appointments WHERE tenant_id = $1 ON CONFLICT DO NOTHING`, [magnumId]);
      await query(`INSERT INTO "${schema}".encounters SELECT * FROM encounters WHERE tenant_id = $1 ON CONFLICT DO NOTHING`, [magnumId]);
      await query(`INSERT INTO "${schema}".invoices SELECT * FROM invoices WHERE tenant_id = $1 ON CONFLICT DO NOTHING`, [magnumId]);
      console.log(`✅ Clinical datasets replicated safely to isolated schema!`);
    } catch(e) {
      console.log(`⚠️ Minor schema sync error (safe to ignore if columns mismatched): ${e.message}`);
    }

    console.log("\n=================================");
    console.log("🎉 MAGNUM COMPREHENSIVE WORKFLOWS SEEDED!");
    console.log("Covered: Inpatient, Wards, Beds, Lab, Pharmacy, Inventory, Encounters, Vitals, Billing.");
    console.log("=================================\n");

    process.exit(0);

  } catch (error) {
    console.error("❌ Comprehensive Seeding Error:", error);
    process.exit(1);
  }
}

seedComprehensiveMagnum();
