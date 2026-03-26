import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function verify() {
  await client.connect();
  const res = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM emr.departments WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed') as departments,
      (SELECT COUNT(*) FROM emr.wards WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed') as wards,
      (SELECT COUNT(*) FROM emr.beds WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed') as beds,
      (SELECT COUNT(*) FROM emr.services WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed') as services,
      (SELECT COUNT(*) FROM emr.employees WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed') as employees,
      (SELECT COUNT(*) FROM emr.appointments WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed') as appointments
  `);
  console.log('--- Verification ---');
  console.table(res.rows[0]);
  await client.end();
}

verify();
