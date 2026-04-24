
import { query } from '../server/db/connection.js';
import { hashPassword } from '../server/services/auth.service.js';

async function fixDb() {
    console.log('--- Starting DB Integrity Fix ---');

    try {
        // 1. Reset all passwords to 'password123'
        console.log('Resetting all passwords to password123...');
        const hashed = await hashPassword('password123');
        await query('UPDATE emr.users SET password_hash = $1', [hashed]);
        console.log('Done: All passwords reset.');

        // 2. Enable features for all tenants
        console.log('Enabling Pharmacy and Inpatient features for all tenants...');
        const tenants = await query('SELECT id, features FROM emr.tenants');
        for (const tenant of tenants.rows) {
            const features = {
                ...tenant.features,
                inventory: true,
                pharmacy: true,
                inpatient: true
            };
            await query('UPDATE emr.tenants SET features = $1 WHERE id = $2', [JSON.stringify(features), tenant.id]);
        }
        console.log('Done: Tenant features updated.');

        // 3. Create sample data for Kidz Clinic (10000000-0000-0000-0000-000000000001)
        const kidzTenantId = '10000000-0000-0000-0000-000000000001';

        // Find a patient and a doctor
        const patientResult = await query('SELECT id FROM emr.patients WHERE tenant_id = $1 LIMIT 1', [kidzTenantId]);
        const doctorResult = await query('SELECT id FROM emr.users WHERE tenant_id = $1 AND role = $2 LIMIT 1', [kidzTenantId, 'Doctor']);

        if (patientResult.rows.length > 0 && doctorResult.rows.length > 0) {
            const patientId = patientResult.rows[0].id;
            const doctorId = doctorResult.rows[0].id;

            console.log(`Found Patient (${patientId}) and Doctor (${doctorId}) in Kidz Clinic.`);

            // Create IPD Encounter if none exists
            const ipdCheck = await query('SELECT id FROM emr.encounters WHERE tenant_id = $1 AND encounter_type = $2', [kidzTenantId, 'IPD']);
            if (ipdCheck.rows.length === 0) {
                console.log('Creating sample IPD encounter...');
                await query(`
          INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, encounter_type, status, visit_date, chief_complaint)
          VALUES ($1, $2, $3, 'IPD', 'open', NOW(), 'Acute abdominal pain, admitted for observation.')
        `, [kidzTenantId, patientId, doctorId]);
            } else {
                console.log('IPD encounters already exist.');
            }

            // Create Prescriptions if none exist
            const rxCheck = await query('SELECT id FROM emr.clinical_records WHERE tenant_id = $1 AND section = $2', [kidzTenantId, 'prescriptions']);
            if (rxCheck.rows.length === 0) {
                console.log('Creating sample prescriptions...');
                const scripts = [
                    { text: 'Amoxicillin 500mg', instructions: '1 tablet three times daily for 7 days', status: 'Pending', dosage: '500mg' },
                    { text: 'Paracetamol 650mg', instructions: '1 tablet every 6 hours if fever > 100 F', status: 'Pending', dosage: '650mg' },
                    { text: 'Cetirizine 10mg', instructions: '1 tablet once daily at bedtime', status: 'Dispensed', dosage: '10mg' }
                ];

                for (const s of scripts) {
                    await query(`
            INSERT INTO emr.clinical_records (tenant_id, patient_id, created_by, section, content)
            VALUES ($1, $2, $3, 'prescriptions', $4)
          `, [kidzTenantId, patientId, doctorId, JSON.stringify(s)]);
                }
            } else {
                console.log('Prescription records already exist.');
            }
            console.log('Done: Sample IPD and Prescription data ensured.');
        } else {
            console.warn('Could not find patient/doctor to create sample data.');
        }

        console.log('--- DB Integrity Fix Completed Successfully ---');
    } catch (err) {
        console.error('Error during DB fix:', err);
    } finally {
        process.exit(0);
    }
}

fixDb();
