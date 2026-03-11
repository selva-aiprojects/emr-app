
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
        console.log('--- Seeding Pharmacy Queue for EHS ---');

        // 1. Get EHS Tenant ID
        const tenantRes = await client.query("SELECT id FROM emr.tenants WHERE code = 'EHS'");
        if (tenantRes.rows.length === 0) throw new Error("EHS Tenant not found");
        const tenantId = tenantRes.rows[0].id;
        console.log(`EHS Tenant ID: ${tenantId}`);

        // 2. Get a few patients for EHS
        const patientRes = await client.query("SELECT id, first_name, last_name FROM emr.patients WHERE tenant_id = $1 LIMIT 3", [tenantId]);
        if (patientRes.rows.length === 0) throw new Error("No patients found for EHS");
        const patients = patientRes.rows;
        console.log(`Found ${patients.length} patients for EHS`);

        // 3. Get a few drugs
        const drugRes = await client.query("SELECT drug_id, generic_name FROM emr.drug_master WHERE status = 'active' LIMIT 5");
        if (drugRes.rows.length === 0) throw new Error("No active drugs found in master");
        const drugs = drugRes.rows;
        console.log(`Found ${drugs.length} drugs in master`);

        // 4. Get a provider (Doctor) for EHS
        const providerRes = await client.query("SELECT id FROM emr.users WHERE tenant_id = $1 AND role IN ('Admin', 'admin', 'Doctor', 'doctor') LIMIT 1", [tenantId]);
        const providerId = providerRes.rows.length > 0 ? providerRes.rows[0].id : null;
        console.log(`Provider ID: ${providerId}`);

        // 5. Create 3 prescriptions
        for (let i = 0; i < patients.length; i++) {
            const patient = patients[i];

            // Create a dummy encounter first if needed, or just find one
            const encounterRes = await client.query("SELECT id FROM emr.encounters WHERE patient_id = $1 LIMIT 1", [patient.id]);
            let encounterId;

            if (encounterRes.rows.length === 0) {
                const newEnc = await client.query(
                    "INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, encounter_type, chief_complaint, status) VALUES ($1, $2, $3, 'Out-patient', 'Routine Pharmacy Seed', 'open') RETURNING id",
                    [tenantId, patient.id, providerId]
                );
                encounterId = newEnc.rows[0].id;
            } else {
                encounterId = encounterRes.rows[0].id;
            }

            // Create Prescription Head
            const rxNo = `RX-EHS-${Date.now()}-${i}`;
            const pxRes = await client.query(
                "INSERT INTO emr.prescriptions (tenant_id, patient_id, encounter_id, provider_id, prescription_number, status, priority, drug_name) VALUES ($1, $2, $3, $4, $5, 'active', $6, $7) RETURNING id",
                [tenantId, patient.id, encounterId, providerId, rxNo, i === 0 ? 'stat' : 'routine', 'Multiple Medications']
            );
            const pxId = pxRes.rows[0].id;

            // Add 2 items to each prescription
            for (let j = 0; j < 2; j++) {
                const drug = drugs[(i + j) % drugs.length];
                await client.query(
                    `INSERT INTO emr.prescription_items 
           (prescription_id, drug_id, sequence, dose, dose_unit, frequency, route, quantity_prescribed, status, instructions) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)`,
                    [pxId, drug.drug_id, j + 1, 1, 'tablet', 'BID', 'Oral', 10, `Seed item ${j + 1} for ${patient.first_name}`]
                );
            }

            console.log(`✅ Created prescription ${rxNo} for ${patient.first_name} ${patient.last_name}`);
        }

        console.log('--- Seeding Complete ---');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
