import pool from './server/db/connection.js';

async function checkPatients() {
  try {
    const tenantResult = await pool.query("SELECT id, name FROM emr.tenants WHERE code = 'NAH'");
    if (tenantResult.rows.length === 0) {
      console.log("Tenant NAH not found");
      process.exit(0);
    }
    const tenant = tenantResult.rows[0];
    console.log(`Checking patients for ${tenant.name} (${tenant.id})...`);

    const patientsResult = await pool.query("SELECT id, first_name, last_name, mrn FROM emr.patients WHERE tenant_id = $1", [tenant.id]);
    console.log(`Total Patients: ${patientsResult.rows.length}`);
    patientsResult.rows.forEach(p => {
      console.log(`- ${p.first_name} ${p.last_name} (${p.mrn})`);
    });

    // Check encounters/records to see if "resources are used across"
    const encountersResult = await pool.query("SELECT count(*) FROM emr.encounters WHERE tenant_id = $1", [tenant.id]);
    console.log(`Total Encounters: ${encountersResult.rows[0].count}`);

    const recordsResult = await pool.query("SELECT count(*) FROM emr.clinical_records WHERE tenant_id = $1", [tenant.id]);
    console.log(`Total Clinical Records: ${recordsResult.rows[0].count}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkPatients();
