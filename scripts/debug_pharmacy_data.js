import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // 1. Get EHS Tenant
    const tenantRes = await client.query("SELECT id FROM emr.tenants WHERE code = 'EHS'");
    if (tenantRes.rows.length === 0) {
        console.log('EHS Tenant NOT FOUND!');
        return;
    }
    const tenantId = tenantRes.rows[0].id;
    console.log(`Checking Tenant EHS: ${tenantId}`);

    // 2. Count prescriptions
    const presResCurrent = await client.query("SELECT COUNT(*) FROM emr.prescriptions WHERE tenant_id = $1", [tenantId]);
    console.log(`Total Prescriptions for EHS: ${presResCurrent.rows[0].count}`);

    // 3. Count items
    const itemRes = await client.query(`
      SELECT COUNT(pi.item_id)
      FROM emr.prescription_items pi
      JOIN emr.prescriptions p ON pi.prescription_id = p.id
      WHERE p.tenant_id = $1
    `, [tenantId]);
    console.log(`Prescription Items for EHS: ${itemRes.rows[0].count}`);

    // 4. Test the full queue query used by the controller
    const joinRes = await client.query(`
      SELECT p.id, p.status as p_status, pi.status as pi_status, dm.generic_name
      FROM emr.prescriptions p
      JOIN emr.patients pt ON p.patient_id = pt.id
      JOIN emr.prescription_items pi ON p.id = pi.prescription_id
      JOIN emr.drug_master dm ON pi.drug_id = dm.drug_id
      WHERE p.tenant_id = $1
        AND p.status IN ('active', 'pending')
        AND pi.status IN ('pending', 'active', 'ready')
    `, [tenantId]);
    console.log(`Queue Eligible Count: ${joinRes.rows.length}`);
    if (joinRes.rows.length > 0) {
        console.log('Sample Row:', joinRes.rows[0]);
    }

  } catch (error) {
    console.error('Diagnostic error:', error);
  } finally {
    await client.end();
  }
}

check();
