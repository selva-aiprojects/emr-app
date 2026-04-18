/**
 * DIAGNOSTIC TO FIND ACTUAL DATA 
 * Run with: node scratch/find_data.js
 */
import pool from '../server/db/connection.js';

async function main() {
  console.log('Searching for where your data actually lives...\n');

  // get all schemas
  const { rows } = await pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name NOT IN ('information_schema')`);
  
  for (const { schema_name } of rows) {
    try {
      // Check if schema has patients table
      const hasPatients = await pool.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'patients'`,
        [schema_name]
      );

      if (hasPatients.rowCount > 0) {
        const count = await pool.query(`SELECT COUNT(*) as c FROM "${schema_name}".patients`);
        const doctors = await pool.query(`SELECT COUNT(*) as c FROM emr.users WHERE role = 'Doctor'`);
        
        console.log(`Schema [${schema_name}]: Patients = ${count.rows[0].c}`);
      }
    } catch (e) {
      // Schema may not be accessible or have different structure
    }
  }

  console.log('\nChecking tenant mapping:');
  const tMap = await pool.query(`SELECT code, schema_name FROM emr.tenants`);
  console.log('emr.tenants: ', tMap.rows);
  
  const mMap = await pool.query(`SELECT code, schema_name FROM emr.management_tenants`);
  console.log('emr.management_tenants: ', mMap.rows);

  await pool.end();
}

main().catch(console.error);
