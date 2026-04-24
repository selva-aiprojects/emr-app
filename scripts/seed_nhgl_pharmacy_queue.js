 import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    const client = await pool.connect();
    try {
        console.log('--- Seeding Pharmacy Queue for NHGL (E2E Patient) ---');

        // 1. Get NHGL Tenant ID
        const tenantRes = await client.query("SELECT id FROM emr.tenants WHERE code = 'NHGL'");
        if (tenantRes.rows.length === 0) throw new Error("NHGL Tenant not found");
        const tenantId = tenantRes.rows[0].id;
        console.log(`NHGL Tenant ID: ${tenantId}`);

        // 2. Get E2E Patient from localStorage vault (matches test pattern)
        const patientRes = await client.query(`
            SELECT id, first_name, last_name, mrn 
            FROM emr.patients 
            WHERE tenant_id = $1 
            AND last_name LIKE 'Patient-%' 
            ORDER BY created_at DESC LIMIT 1
        `, [tenantId]);
        
        if (patientRes.rows.length === 0) {
            console.log('No recent E2E Patient found. Creating test patient...');
            // Fallback create (but test already creates one)
            return;
        }
        const patient = patientRes.rows[0];
        console.log(`E2E Patient: ${patient.first_name} ${patient.last_name} (${patient.id})`);

        // 3. Get active drugs from master
        // Use fallback drug_name (no drug_master dependency)
        const testDrugNames = ['Paracetamol 500mg', 'Amoxicillin 500mg', 'Metformin 500mg'];

        // 4. Get provider
        const providerRes = await client.query("SELECT id FROM emr.users WHERE tenant_id = $1 LIMIT 1", [tenantId]);
        const providerId = providerRes.rows.length > 0 ? providerRes.rows[0].id : null;
        if (!providerId) throw new Error('No users found in NHGL');
        console.log(`Provider ID: ${providerId}`);

        // 5. Create encounter
        const encounterRes = await client.query("SELECT id FROM emr.encounters WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1", [patient.id]);
        let encounterId = encounterRes.rows[0]?.id;
        if (!encounterId) {
            const newEnc = await client.query(
                "INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, encounter_type, chief_complaint, status, visit_date) VALUES ($1, $2, $3, 'Out-patient', 'E2E Pharmacy Test', 'closed', NOW()) RETURNING id",
                [tenantId, patient.id, providerId]
            );
            encounterId = newEnc.rows[0].id;
            console.log(`Created encounter: ${encounterId}`);
        }

        // 6. Create Prescription 
        const rxNo = `RX-E2E-NHGL-${Date.now()}`;
        const pxRes = await client.query(
            "INSERT INTO emr.prescriptions (tenant_id, patient_id, encounter_id, provider_id, status, drug_name, created_at) VALUES ($1, $2, $3, $4, 'active', 'E2E Medications', NOW()) RETURNING id",
            [tenantId, patient.id, encounterId, providerId]
        );
        const pxId = pxRes.rows[0].id;
        console.log(`Created prescription E2E-NHGL (ID: ${pxId})`);

        // 7. Add 2 prescription items (using drug_name fallback)
        for (let j = 0; j < 2; j++) {
            const drugName = testDrugNames[j];
                await client.query(
                    `INSERT INTO emr.prescription_items 
                     (prescription_id, sequence, dose, dose_unit, frequency, route, quantity_prescribed, status, instructions, drug_name) 
                     VALUES ($1, $2, 1, 'tablet', 'BID', 'Oral', 10, 'pending', 'E2E test item ${j+1}', $3)`,
                    [pxId, j + 1, testDrugNames[j]])
            );
            await client.query(
                `INSERT INTO emr.prescription_items 
                 (prescription_id, sequence, dose, dose_unit, frequency, route, quantity_prescribed, status, instructions, tenant_id, drug_name) 
                 VALUES ($1, $2, 1, 'tablet', 'BID', 'Oral', 10, 'pending', 'E2E test item ${j+1}', $3, $4)`,
                [pxId, j + 1, tenantId, testDrugNames[j]]
            );
            console.log(`Added item ${j+1}`); 
        }

        console.log('✅ NHGL E2E Pharmacy Queue seeded successfully!');
        console.log(`Row will show patient name: "${patient.first_name} ${patient.last_name}"`);

        console.log('✅ NHGL E2E Pharmacy Queue seeded successfully!');
        console.log(`Row will show patient name: "${patient.first_name} ${patient.last_name}"`);

    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

seed();

