
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function forceSeed() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("--- Force Seeding & Verification ---");

        // 1. Get Tenant aligned with the test user
        const userRes = await client.query("SELECT tenant_id FROM emr.users WHERE email = 'pharmacy@ehs.local'");
        let tenantId;
        if (userRes.rows.length > 0) {
            tenantId = userRes.rows[0].tenant_id;
            console.log(`Aligned with test user's tenant: ${tenantId}`);
        } else {
            const tenantRes = await client.query("SELECT id FROM emr.tenants WHERE code = 'EHS'");
            if (tenantRes.rows.length === 0) throw new Error("EHS Tenant not found!");
            tenantId = tenantRes.rows[0].id;
            console.log(`User not found, falling back to EHS code ID: ${tenantId}`);
        }

        // 2. Clean Up Old Data to avoid duplicates/stale links
        await client.query("DELETE FROM emr.prescription_items WHERE prescription_id IN (SELECT id FROM emr.prescriptions WHERE tenant_id = $1)", [tenantId]);
        await client.query("DELETE FROM emr.prescriptions WHERE tenant_id = $1", [tenantId]);
        console.log("Cleaned old EHS queue data.");

        // 3. Get dependencies
        const patient = await client.query("SELECT id FROM emr.patients WHERE tenant_id = $1 LIMIT 1", [tenantId]);
        const drug = await client.query("SELECT drug_id FROM emr.drug_master LIMIT 1");
        const encounter = await client.query("SELECT id FROM emr.encounters WHERE tenant_id = $1 LIMIT 1", [tenantId]);

        if (!patient.rows[0] || !drug.rows[0] || !encounter.rows[0]) {
            throw new Error(`Missing dependencies! P: ${!!patient.rows[0]}, D: ${!!drug.rows[0]}, E: ${!!encounter.rows[0]}`);
        }

        // 4. Create Prescription
        const rxNo = `RX-FORCE-${Date.now()}`;
        const rxRes = await client.query(
            "INSERT INTO emr.prescriptions (tenant_id, patient_id, encounter_id, prescription_number, status, priority, drug_name) VALUES ($1, $2, $3, $4, 'active', 'stat', 'Force Seed Medication') RETURNING id",
            [tenantId, patient.rows[0].id, encounter.rows[0].id, rxNo]
        );
        const rxId = rxRes.rows[0].id;

        // 5. Detect valid columns to avoid "column does not exist" errors
        const colsRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = 'prescription_items'");
        const existingCols = colsRes.rows.map(r => r.column_name);
        console.log(`Detected Columns: ${existingCols.join(', ')}`);

        const insertData = {
            prescription_id: rxId,
            drug_id: drug.rows[0].drug_id,
            status: 'pending'
        };
        if (existingCols.includes('dose')) insertData.dose = 1;
        if (existingCols.includes('dose_unit')) insertData.dose_unit = 'tablet';
        if (existingCols.includes('frequency')) insertData.frequency = 'Daily';
        if (existingCols.includes('duration')) insertData.duration = '7 days';
        if (existingCols.includes('duration_days')) insertData.duration_days = 7;
        if (existingCols.includes('instructions')) insertData.instructions = 'Force Seed';
        if (existingCols.includes('sequence')) insertData.sequence = 1;
        if (existingCols.includes('substitution_allowed')) insertData.substitution_allowed = true;
        if (existingCols.includes('quantity_prescribed')) insertData.quantity_prescribed = 10;
        if (existingCols.includes('quantity_dispensed')) insertData.quantity_dispensed = 0;

        const keys = Object.keys(insertData);
        const values = Object.values(insertData);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

        await client.query(
            `INSERT INTO emr.prescription_items (${keys.join(', ')}) VALUES (${placeholders})`,
            values
        );

        console.log(`✅ Created Force Prescription: ${rxNo}`);

        // 6. IMMEDIATE VERIFICATION
        const verify = await client.query("SELECT count(*) FROM emr.prescriptions WHERE tenant_id = $1", [tenantId]);
        console.log(`📊 Verified Database Count for ${tenantId}: ${verify.rows[0].count}`);

    } catch (err) {
        console.error("❌ Force seed failed:", err.message);
    } finally {
        await client.end();
    }
}

forceSeed();
