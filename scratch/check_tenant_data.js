import { query } from './server/db/connection.js';

async function checkData() {
  const tenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
  const tables = [
    'emr.patients',
    'emr.appointments',
    'emr.invoices',
    'emr.beds',
    'emr.wards',
    'emr.ambulances',
    'emr.blood_units'
  ];

  console.log(`Checking data for tenant: ${tenantId}`);
  for (const table of tables) {
    try {
      // Some tables might use id instead of tenant_id if they are system tables, 
      // but these should all have tenant_id based on previous views.
      const result = await query(`SELECT COUNT(*) as count FROM ${table} WHERE tenant_id::text = $1`, [tenantId]);
      console.log(`${table}: ${result.rows[0].count} rows`);
    } catch (err) {
      console.log(`${table}: ERROR - ${err.message}`);
    }
  }
}

checkData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
