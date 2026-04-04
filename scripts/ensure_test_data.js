
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function createFoundation() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("--- Building Test Foundation (Standardized & Wiped) ---");

        // 1. Ensure Tenant
        const tenantCode = 'EHS';
        let tenantRes = await client.query("SELECT id FROM emr.tenants WHERE code = $1", [tenantCode]);
        let tenantId;
        if (tenantRes.rows.length === 0) {
            tenantRes = await client.query("INSERT INTO emr.tenants (name, code, subdomain, status) VALUES ('Enterprise Hospital Systems', $1, 'ehs', 'active') RETURNING id", [tenantCode]);
        }
        tenantId = tenantRes.rows[0].id;

        // --- Data Wipe for Tenant ---
        console.log(`🧹 Wiping existing clinical data for tenant ${tenantId}...`);
        await client.query("DELETE FROM emr.prescription_items WHERE prescription_id IN (SELECT id FROM emr.prescriptions WHERE tenant_id = $1)", [tenantId]);
        await client.query("DELETE FROM emr.prescriptions WHERE tenant_id = $1", [tenantId]);
        await client.query("DELETE FROM emr.encounters WHERE tenant_id = $1", [tenantId]);
        await client.query("DELETE FROM emr.patients WHERE tenant_id = $1", [tenantId]);

        // 2. Ensure Test User (Pharmacist)
        const userEmail = 'pharmacy@ehs.local';
        let userRes = await client.query("SELECT id FROM emr.users WHERE email = $1", [userEmail]);
        let providerId;
        if (userRes.rows.length === 0) {
            userRes = await client.query("INSERT INTO emr.users (email, name, role, tenant_id, password_hash) VALUES ($1, 'Pharmacist John', 'pharmacy', $2, '$2b$10$YourHashHere') RETURNING id", [userEmail, tenantId]);
        }
        providerId = userRes.rows[0].id;
        console.log(`✅ Foundation Core Ready (${tenantId})`);

        // 3. Ensure Patient
        const mrn = 'MRN-EHS-001';
        let patientRes = await client.query("SELECT id FROM emr.patients WHERE mrn = $1", [mrn]);
        let patientId;
        if (patientRes.rows.length === 0) {
            patientRes = await client.query("INSERT INTO emr.patients (first_name, last_name, mrn, gender, tenant_id) VALUES ('Alice', 'Wonder', $1, 'Female', $2) RETURNING id", [mrn, tenantId]);
        }
        patientId = patientRes.rows[0].id;

        // 4. Ensure Encounter
        const encRes = await client.query("INSERT INTO emr.encounters (patient_id, tenant_id, status, encounter_type, chief_complaint, provider_id) VALUES ($1, $2, 'active', 'outpatient', 'Diagnostic Check', $3) RETURNING id", [patientId, tenantId, providerId]);
        const encounterId = encRes.rows[0].id;

        // 5. Ensure Drugs in Master
        const drug1Id = '77777777-7777-7777-7777-777777777777';
        const drug2Id = '88888888-8888-8888-8888-888888888888';
        
        await client.query(`
            INSERT INTO emr.drug_master (drug_id, brand_names, generic_name, strength, dosage_form, tenant_id, status) 
            SELECT $2::uuid, ARRAY['Panadol'], 'Paracetamol', '500mg', 'Tablet', $1, 'active' 
            WHERE NOT EXISTS (SELECT 1 FROM emr.drug_master WHERE drug_id = $2::uuid)
        `, [tenantId, drug1Id]);
        
        await client.query(`
            INSERT INTO emr.drug_master (drug_id, brand_names, generic_name, strength, dosage_form, tenant_id, status) 
            SELECT $2::uuid, ARRAY['Tylenol'], 'Paracetamol', '500mg', 'Tablet', $1, 'active' 
            WHERE NOT EXISTS (SELECT 1 FROM emr.drug_master WHERE drug_id = $2::uuid)
        `, [tenantId, drug2Id]);
        console.log(`✅ Drugs/Clinical Ready`);

        // 6. Create Prescription
        const rxNo = `RX-${Date.now()}`;
        const rxRes = await client.query("INSERT INTO emr.prescriptions (tenant_id, patient_id, encounter_id, provider_id, prescription_number, status, drug_name) VALUES ($1, $2, $3, $4, $5, 'active', 'Paracetamol 500mg') RETURNING id", [tenantId, patientId, encounterId, providerId, rxNo]);
        const rxId = rxRes.rows[0].id;

        // 7. Add Prescription Item with ALL mandatory fields
        await client.query(`
            INSERT INTO emr.prescription_items 
            (prescription_id, drug_id, sequence, dose, dose_unit, frequency, route, administration_timing, duration_days, quantity_prescribed, status, substitution_allowed)
            VALUES ($1, $2::uuid, 1, '500', 'mg', 'Once Daily', 'Oral', 'After Meals', 7, 10, 'pending', true)
        `, [rxId, drug1Id]);

        console.log(`✅ ALL DATA SYNCED: Prescription ${rxNo} is now LIVE!`);

        // Final Global Audit for the Model
        const globalCheck = await client.query("SELECT id, tenant_id, prescription_number FROM emr.prescriptions LIMIT 10");
        console.log(`📊 Current DB Total: ${globalCheck.rows.length}`);
        globalCheck.rows.forEach(r => console.log(` - Rx: ${r.prescription_number} (Tenant: ${r.tenant_id})`));

    } catch (err) {
        console.error("Foundation Build Failed:", err.message);
    } finally {
        await client.end();
    }
}

createFoundation();
