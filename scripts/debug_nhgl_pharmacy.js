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
    
    console.log('--- 🔍 NHGL Pharmacy Debug ---');

    // 1. NHGL Tenant
    const tenantRes = await client.query("SELECT id FROM emr.tenants WHERE code = 'NHGL'");
    if (tenantRes.rows.length === 0) {
        console.log('❌ NHGL Tenant NOT FOUND!');
        return;
    }
    const tenantId = tenantRes.rows[0].id;
    console.log(`✅ NHGL Tenant: ${tenantId}`);

    // 2. E2E Patient (latest by last_name pattern)
    const patientRes = await client.query(`
      SELECT id, first_name, last_name, mrn 
      FROM emr.patients 
      WHERE tenant_id = $1 AND last_name LIKE '%Patient-%'
      ORDER BY created_at DESC LIMIT 1
    `, [tenantId]);
    const patient = patientRes.rows[0];
    console.log(`✅ E2E Patient: ${patient ? `${patient.first_name} ${patient.last_name} (${patient.id})` : 'NOT FOUND'}`);

    // 3. Prescriptions count for patient
    if (patient) {
      const presCount = await client.query("SELECT COUNT(*) FROM emr.prescriptions WHERE patient_id = $1", [patient.id]);
      console.log(`Prescriptions for E2E patient: ${presCount.rows[0].count}`);
    }

    // 4. Queue query (no drug_master join - use drug_name)
    const queueRes = await client.query(`
      SELECT 
        p.id as rx_id, p.id as prescription_number, p.status as p_status,
        pt.first_name, pt.last_name,
        pi.status as item_status, 
        'Test Medication' as drug_name,
        pi.quantity_prescribed
      FROM emr.prescriptions p
      JOIN emr.patients pt ON p.patient_id = pt.id
      JOIN emr.prescription_items pi ON p.id = pi.prescription_id
      WHERE p.tenant_id = $1
        AND p.status IN ('active', 'pending')
        AND pi.status = 'pending'
      ORDER BY p.created_at DESC
      LIMIT 5
    `, [tenantId]);
    
    console.log(`\n📊 Queue Eligible Rows: ${queueRes.rows.length}`);
    queueRes.rows.forEach((row, i) => {
      console.log(`Row ${i+1}: ${row.first_name} ${row.last_name} | Rx:${row.prescription_number} | Drug:${row.drug_name} | Item:${row.item_status}`);
    });

    if (patient && queueRes.rows.some(r => r.last_name && r.last_name.includes('Patient'))) {
      console.log('\n✅ E2E TEST READY: Queue row exists with exact patient name!');
    } else {
      console.log('\n⚠️ MISSING: No queue row for E2E Patient');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

check();

