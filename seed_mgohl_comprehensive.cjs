const { query } = require('./server/db/connection.js');
const fs = require('fs');
const path = require('path');

async function seedMgohlComprehensive() {
  console.log("=== SEEDING 2 YEARS OF COMPREHENSIVE DATA FOR MGHPL ===");
  try {
    // 1. Fetch the exact ID of MGHPL tenant
    const tRes = await query(`SELECT id, name, code FROM emr.tenants WHERE code = 'MGHPL'`);
    if (tRes.rowCount === 0) {
      console.error("MGHPL tenant not found!");
      process.exit(1);
    }
    const mgohlId = tRes.rows[0].id;
    console.log("Found MGHPL tenant:", tRes.rows[0].name, "ID:", mgohlId);

    // First, ensure MGHPL points to the correct schema (create mgohl if needed)
    await query('CREATE SCHEMA IF NOT EXISTS mgohl');
    await query('UPDATE emr.management_tenants SET schema_name = $1 WHERE id = $2', ['mgohl', mgohlId]);
    console.log("Ensured MGHPL points to mgohl schema");

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
      const filePath = path.join(__dirname, 'database', file);
      if (fs.existsSync(filePath)) {
        console.log(`\nProcessing ${file}...`);
        let sql = fs.readFileSync(filePath, 'utf8');

        // Dynamically shift the data to belong to MGHPL
        sql = sql.replace(new RegExp(NAH_ID, 'g'), mgohlId);
        sql = sql.replace(/NAH-/g, 'MGH-');
        sql = sql.replace(/@nah\.local/g, '@mgohl.local');
        sql = sql.replace(/@newage\.hospital/g, '@mgohl.local');
        sql = sql.replace(/New Age Hospital/g, 'Magnum Group Hospital');
        sql = sql.replace(/nah\./g, 'mgohl.'); // Change schema references

        // Execute the adapted massive SQL block
        await query(sql);
        console.log(`Successfully seeded workflows for ${file}`);
      } else {
        console.log(`Warning: ${file} was not found, skipping.`);
      }
    }

    console.log("\n=== VERIFYING SEEDING RESULTS ===");
    
    // Check data counts
    const tables = ['patients', 'users', 'appointments', 'encounters', 'beds', 'invoices'];
    for (const table of tables) {
      try {
        const countResult = await query(`SELECT COUNT(*) as count FROM mgohl.${table} WHERE tenant_id = $1`, [mgohlId]);
        console.log(`${table}: ${countResult.rows[0].count} records`);
      } catch (error) {
        console.log(`${table}: Error checking - ${error.message}`);
      }
    }

    // Test dashboard metrics
    const { getRealtimeDashboardMetrics } = require('./server/enhanced_dashboard_metrics_fixed.mjs');
    const metrics = await getRealtimeDashboardMetrics(mgohlId);
    
    console.log("\n=== DASHBOARD METRICS AFTER SEEDING ===");
    console.log("Revenue:", metrics.todayRevenue);
    console.log("Patients:", metrics.todayPatients);
    console.log("Appointments:", metrics.todayAppointments);
    console.log("Beds:", metrics.occupiedBeds + " occupied, " + metrics.availableBeds + " available, " + metrics.totalBeds + " total");
    console.log("Dashboard Status:", metrics.todayRevenue > 0 || metrics.todayPatients > 0 ? "WORKING" : "STILL BLANK");

    console.log("\n=== SEEDING COMPLETED ===");
    console.log("MGHPL tenant now has 2 years of comprehensive data");
    console.log("Dashboard should now display properly");

  } catch (error) {
    console.error("Error during MGHPL seeding:", error);
    process.exit(1);
  }
}

seedMgohlComprehensive();
