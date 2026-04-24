import dotenv from 'dotenv';
import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pkg;
dotenv.config();

async function seedKidzHospital() {
    console.log('🚀 Seeding Kidz Hospital with realistic workflow data...\n');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Get Tenant ID for Kidz Clinic
        const tenantRes = await client.query("SELECT id FROM emr.tenants WHERE name = 'Kidz Clinic'");
        if (tenantRes.rows.length === 0) {
            console.log('❌ Kidz Clinic tenant not found.');
            return;
        }
        const tenantId = tenantRes.rows[0].id;
        console.log(`🏥 Kidz Clinic ID: ${tenantId}`);

        // 2. Get a doctor for Kidz Clinic
        const docRes = await client.query("SELECT id FROM emr.users WHERE tenant_id = $1 AND role = 'Doctor' LIMIT 1", [tenantId]);
        if (docRes.rows.length === 0) {
            console.log('❌ No doctor found for Kidz Clinic. Creating one...');
            const hp = await bcrypt.hash('Doctor@123', 10);
            const newDoc = await client.query(`
        INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
        VALUES ($1, 'doc.kidz@emr.local', $2, 'Dr. Sarah Johnson (Pediatrician)', 'Doctor', true)
        RETURNING id
      `, [tenantId, hp]);
            docRes.rows.push(newDoc.rows[0]);
        }
        const doctorId = docRes.rows[0].id;

        // 3. Seed Pediatric Inventory (Medicines)
        console.log('💊 Seeding Pediatric Pharmacy Stock...');
        const medicines = [
            { code: 'KIDZ-M-001', name: 'Calpol Paediatric Syrup 60ml', category: 'Medicines', stock: 100, unit: 'bottle' },
            { code: 'KIDZ-M-002', name: 'Augmentin Duo Dry Syrup', category: 'Medicines', stock: 50, unit: 'bottle' },
            { code: 'KIDZ-M-003', name: 'Ascoril LS Junior Syrup', category: 'Medicines', stock: 75, unit: 'bottle' },
            { code: 'KIDZ-M-004', name: 'Enterogermina Respules', category: 'Medicines', stock: 200, unit: 'unit' },
            { code: 'KIDZ-M-005', name: 'Cetirizine Syrup for Kids', category: 'Medicines', stock: 120, unit: 'bottle' }
        ];

        for (const med of medicines) {
            await client.query(`
        INSERT INTO emr.inventory_items (tenant_id, item_code, name, category, current_stock, reorder_level, unit)
        VALUES ($1, $2, $3, $4, $5, 10, $6)
        ON CONFLICT (tenant_id, item_code) DO UPDATE SET current_stock = EXCLUDED.current_stock
      `, [tenantId, med.code, med.name, med.category, med.stock, med.unit]);
        }

        // 4. Seed Patients
        console.log('👶 Seeding Patients...');
        const patients = [
            { mrn: 'KIDZ-P-101', fn: 'Arjun', ln: 'Nair', dob: '2019-05-12', gender: 'Male' },
            { mrn: 'KIDZ-P-102', fn: 'Sana', ln: 'Khan', dob: '2021-02-28', gender: 'Female' }
        ];

        const patientIds = [];
        for (const p of patients) {
            const res = await client.query(`
        INSERT INTO emr.patients (tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email)
        VALUES ($1, $2, $3, $4, $5, $6, '9876543210', $7)
        ON CONFLICT (tenant_id, mrn) DO UPDATE SET first_name = EXCLUDED.first_name
        RETURNING id
      `, [tenantId, p.mrn, p.fn, p.ln, p.dob, p.gender, `${p.fn.toLowerCase()}@example.com`]);
            patientIds.push(res.rows[0].id);
        }

        // 5. Create Outpatient Encounters
        console.log('📋 Creating Outpatient Encounters...');
        const encounterIds = [];
        for (const pId of patientIds) {
            const res = await client.query(`
        INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, encounter_type, visit_date, chief_complaint, diagnosis, status)
        VALUES ($1, $2, $3, 'Out-patient', CURRENT_DATE, 'Fever and Cough', 'Upper Respiratory Tract Infection', 'open')
        RETURNING id
      `, [tenantId, pId, doctorId]);
            encounterIds.push(res.rows[0].id);
        }

        // 6. Create Prescriptions (Specialized Table)
        console.log('✍️ Creating Prescriptions in specialized table...');
        const prescribedItems = [
            { name: 'Calpol Paediatric Syrup 60ml', dosage: '5ml', frequency: 'Thrice daily', duration: '3 days' },
            { name: 'Cetirizine Syrup for Kids', dosage: '2.5ml', frequency: 'At night', duration: '5 days' }
        ];

        for (let i = 0; i < encounterIds.length; i++) {
            for (const item of prescribedItems) {
                await client.query(`
          INSERT INTO emr.prescriptions (tenant_id, encounter_id, drug_name, dosage, frequency, duration, instructions, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'Take after food', 'Pending')
        `, [tenantId, encounterIds[i], item.name, item.dosage, item.frequency, item.duration]);
            }
        }

        console.log('\n✅ Kidz Hospital seeding complete!');
        console.log('   Workflow ready for testing:');
        console.log('   - 2 Active Encounters');
        console.log('   - 2 Pending Prescriptions');
        console.log('   - Stocked Pediatric Pharmacy');

    } catch (err) {
        console.error('❌ Error Seeding:', err.message);
    } finally {
        await client.end();
    }
}

seedKidzHospital();
