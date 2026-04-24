
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
        let patientRes = await client.query("SELECT id, first_name, last_name FROM emr.patients WHERE tenant_id = $1 LIMIT 3", [tenantId]);
        if (patientRes.rows.length === 0) {
            console.log("No patients found for EHS. Creating test patients...");
            await client.query(`
                INSERT INTO emr.patients (tenant_id, first_name, last_name, mrn, gender, date_of_birth)
                VALUES 
                ($1, 'Alice', 'Wonder', 'EHS-P-001', 'Female', '1990-01-01'),
                ($1, 'Bob', 'Builder', 'EHS-P-002', 'Male', '1985-05-15'),
                ($1, 'Charlie', 'Brown', 'EHS-P-003', 'Male', '1992-11-20')
            `, [tenantId]);
            patientRes = await client.query("SELECT id, first_name, last_name FROM emr.patients WHERE tenant_id = $1 LIMIT 3", [tenantId]);
        }
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

                // IMPORTANT: Seed drug batches so substitution lookup finds them (requires quantity_remaining > 0)
                await client.query(`
                    INSERT INTO emr.drug_batches (drug_id, batch_number, quantity_received, quantity_remaining, expiry_date, status)
                    SELECT $1::uuid, $2::varchar, $3::numeric, $4::numeric, $5::date, 'active'
                    WHERE NOT EXISTS (SELECT 1 FROM emr.drug_batches WHERE drug_id = $1::uuid AND batch_number = $2::varchar)
                `, [drug.drug_id, `B-${drug.drug_id.slice(0, 8)}`, 500, 500, '2027-12-31']);
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
