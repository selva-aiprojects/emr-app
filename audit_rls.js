import { query } from './server/db/connection.js';

async function audit() {
  console.log("--- CLINICAL DATA AUDIT ---");
  try {
    const rls = await query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'nah'
    `);
    console.log("\nRLS Status in 'nah':");
    rls.rows.forEach(r => console.log(`- ${r.tablename}: ${r.rowsecurity ? 'ON' : 'OFF'}`));

    const counts = await query(`
      SELECT 
        (SELECT count(*) FROM nah.patients) as patients,
        (SELECT count(*) FROM nah.appointments) as appointments,
        (SELECT count(*) FROM nah.invoices) as invoices,
        (SELECT count(*) FROM nah.service_requests) as alerts
    `);
    console.log("\nRaw Counts in 'nah' (No Tenant Filter):");
    console.log(counts.rows[0]);

    const tenantId = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed';
    const filtered = await query(`
      SELECT 
        (SELECT count(*) FROM nah.patients WHERE tenant_id = $1) as patients,
        (SELECT count(*) FROM nah.service_requests WHERE tenant_id = $1) as alerts
    `, [tenantId]);
    console.log(`\nFiltered Counts for tenant ${tenantId}:`);
    console.log(filtered.rows[0]);

    const session = await query("SELECT current_setting('app.current_tenant', true) as tenant, current_setting('search_path') as path");
    console.log("\nCurrent Session Context:");
    console.log(session.rows[0]);

  } catch (err) {
    console.error("Audit failed:", err.message);
  }
  process.exit(0);
}

audit();
