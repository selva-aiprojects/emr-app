import { query } from '../db/connection.js';
import { hashPassword } from '../services/auth.service.js';
import { provisionNewTenant } from '../services/provisioning.service.js';

export async function runMegaSeed() {
    console.log('🚀 [MEGA_SEED] Initiating Full Institutional Lifecycle Simulation...');

    try {
        // 1. Provision New Tenant (Control Plane + Shard Initialization)
        const tenantName = "Starlight Mega Center";
        const tenantCode = "SMC-MEGA";
        const tenantSubdomain = "smcmega";
        const adminEmail = "admin@smcmega.local";
        
        console.log(`[MEGA_SEED] Provisioning tenant ${tenantCode}...`);
        const result = await provisionNewTenant(
            { name: tenantName, code: tenantCode, subdomain: tenantSubdomain, contactEmail: adminEmail, subscriptionTier: 'Enterprise' },
            { email: adminEmail, name: 'Mega Admin', password: 'Admin@123' }
        );

        const tenantId = result.id;
        const schema = tenantCode.toLowerCase().replace(/[^a-z0-9]/g, '');
        console.log(`[MEGA_SEED] Tenant Provisioned. ID: ${tenantId}, Schema: ${schema}`);

        // 2. Setup Master Data (Departments & Services)
        console.log('[MEGA_SEED] Setting up Institutional Masters...');
        const deptIds = [];
        const departments = ['Cardiology', 'Emergency', 'General Medicine', 'Inpatient Ward', 'Laboratory', 'Pharmacy'];
        for (const name of departments) {
            const res = await query(`INSERT INTO "${schema}"."departments" (tenant_id, name, code, status) VALUES ($1, $2, $3, 'active') RETURNING id`, 
                [tenantId, name, name.substring(0, 3).toUpperCase()]);
            deptIds.push(res.rows[0].id);
        }

        const serIds = [];
        const services = [
            { name: 'OPD Consultation', cat: 'Clinical', price: 500 },
            { name: 'CBC Test', cat: 'Laboratory', price: 350 },
            { name: 'Standard Ward Bed', cat: 'Inpatient', price: 1500 },
            { name: 'X-Ray Chest', cat: 'Radiology', price: 1200 }
        ];
        for (const s of services) {
            const res = await query(`INSERT INTO "${schema}"."services" (tenant_id, name, category, base_price, status) VALUES ($1, $2, $3, $4, 'active') RETURNING id`,
                [tenantId, s.name, s.cat, s.price]);
            serIds.push(res.rows[0].id);
        }

        // 3. Setup Staff (Employees & Users)
        console.log('[MEGA_SEED] Authorizing Clinical Identities...');
        const docRes = await query(`SELECT id FROM "${schema}"."roles" WHERE name = 'Doctor' LIMIT 1`);
        const nurseRes = await query(`SELECT id FROM "${schema}"."roles" WHERE name = 'Nurse' LIMIT 1`);
        const docRoleId = docRes.rows[0].id;
        const nurseRoleId = nurseRes.rows[0].id;

        const hp = await hashPassword('Admin@123');
        const doctorRes = await query(`INSERT INTO "${schema}"."users" (tenant_id, email, password_hash, name, role, role_id) VALUES ($1, $2, $3, $4, 'Doctor', $5) RETURNING id`,
            [tenantId, 'doctor@smcmega.local', hp, 'Dr. Aris Thorne', docRoleId]);
        const nurseRes2 = await query(`INSERT INTO "${schema}"."users" (tenant_id, email, password_hash, name, role, role_id) VALUES ($1, $2, $3, $4, 'Nurse', $5) RETURNING id`,
            [tenantId, 'nurse@smcmega.local', hp, 'Nurse Elara', nurseRoleId]);
        
        const doctorId = doctorRes.rows[0].id;

        // 4. Patient Journeys (10 Patients)
        console.log('[MEGA_SEED] Simulating 10 Patient Lifecycles...');
        for (let i = 1; i <= 10; i++) {
            const suffix = i.toString().padStart(2, '0');
            const firstName = `Patient`;
            const lastName = `Mega${suffix}`;
            
            // A. Patient Creation
            const pRes = await query(`INSERT INTO "${schema}"."patients" (tenant_id, mrn, first_name, last_name, gender, date_of_birth, phone) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [tenantId, `MRN-${suffix}`, firstName, lastName, i % 2 === 0 ? 'Female' : 'Male', '1990-01-01', `99000000${suffix}`]);
            const patientId = pRes.rows[0].id;

            // B. Encounter
            const eRes = await query(`INSERT INTO "${schema}"."encounters" (tenant_id, patient_id, provider_id, encounter_type, visit_date, chief_complaint, status) VALUES ($1, $2, $3, 'OPD', NOW(), 'Mega Checkup', 'active') RETURNING id`,
                [tenantId, patientId, doctorId]);
            const encId = eRes.rows[0].id;

            // C. Clinical Records (Vitals)
            await query(`INSERT INTO "${schema}"."clinical_records" (tenant_id, patient_id, encounter_id, record_type, content) VALUES ($1, $2, $3, 'vitals', $4)`,
                [tenantId, patientId, encId, JSON.stringify({ bp: "120/80", heartRate: 72, temp: 98.4 })]);

            // D. Inpatient Management (for every second patient)
            if (i % 2 === 0) {
                const wardRes = await query(`INSERT INTO "${schema}"."wards" (tenant_id, name, type, capacity, status) VALUES ($1, $2, 'General', 10, 'active') RETURNING id`,
                    [tenantId, `Ward ${suffix}`]);
                const wardId = wardRes.rows[0].id;
                
                const bedRes = await query(`INSERT INTO "${schema}"."beds" (tenant_id, ward_id, bed_number, status) VALUES ($1, $2, $3, 'occupied') RETURNING id`,
                    [tenantId, wardId, `BED-${suffix}`]);
                const bedId = bedRes.rows[0].id;

                await query(`INSERT INTO "${schema}"."admissions" (tenant_id, patient_id, encounter_id, ward_id, bed_id, admission_date, status) VALUES ($1, $2, $3, $4, $5, NOW(), 'admitted')`,
                    [tenantId, patientId, encId, wardId, bedId]);
                
                await query(`UPDATE "${schema}"."beds" SET patient_id = $1 WHERE id = $2`, [patientId, bedId]);
            }

            // E. Diagnostics
            const testRes = await query(`INSERT INTO "${schema}"."lab_tests" (tenant_id, test_name, category, price) VALUES ($1, 'Mega Panel', 'Laboratory', 1000) RETURNING id`, [tenantId]);
            const testId = testRes.rows[0].id;
            
            const reqRes = await query(`INSERT INTO "${schema}"."service_requests" (tenant_id, patient_id, encounter_id, category, display, status) VALUES ($1, $2, $3, 'lab', 'Mega Panel', 'completed') RETURNING id`,
                [tenantId, patientId, encId]);
            
            await query(`INSERT INTO "${schema}"."diagnostic_reports" (tenant_id, patient_id, test_id, encounter_id, status, results, conclusion) VALUES ($1, $2, $3, $4, 'final', $5, 'Healthy simulation state')`,
                [tenantId, patientId, testId, encId, JSON.stringify({ score: 100, health: "Optimal" })]);

            // F. Billing
            const invNum = `INV-MEGA-${suffix}`;
            const invRes = await query(`INSERT INTO "${schema}"."invoices" (tenant_id, patient_id, invoice_number, total, paid, status) VALUES ($1, $2, $3, 2500, 2500, 'paid') RETURNING id`,
                [tenantId, patientId, invNum]);
            const invId = invRes.rows[0].id;
            
            await query(`INSERT INTO "${schema}"."invoice_items" (tenant_id, invoice_id, item_description, amount) VALUES ($1, $2, 'Comprehensive Medical Package', 2500)`,
                [tenantId, invId]);
        }

        console.log('[MEGA_SEED] ✅ Institutional node fully hydrated with 10 patient journeys.');
        return { success: true, tenantId, tenantCode };

    } catch (error) {
        console.error('[MEGA_SEED] ❌ Simulation failed:', error.message);
        throw error;
    }
}
