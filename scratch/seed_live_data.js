import { query } from '../server/db/connection.js';

async function seedLiveData() {
    try {
        const tenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e'; // NHGL
        
        console.log('🚀 Seeding operational heartbeats for NHGL...');

        // 1. Create a Department
        const deptId = 'd0000000-0000-0000-0000-000000000001';
        await query(`
            INSERT INTO emr.departments (id, tenant_id, name, code, status)
            VALUES ($1, $2, 'General Medicine', 'GEN', 'active')
            ON CONFLICT (id) DO NOTHING
        `, [deptId, tenantId]);

        // 2. Create an Employee (The Admin)
        await query(`
            INSERT INTO emr.employees (tenant_id, name, designation, department_id, employee_id, status)
            VALUES ($1, 'Institutional Administrator', 'Administrator', $2, 'EMP-001', 'Active')
            ON CONFLICT DO NOTHING
        `, [tenantId, deptId]);

        // 3. Create a Patient
        await query(`
            INSERT INTO emr.patients (tenant_id, first_name, last_name, gender, date_of_birth, phone)
            VALUES ($1, 'Test', 'Patient', 'Male', '1990-01-01', '9999999999')
            ON CONFLICT DO NOTHING
        `, [tenantId]);

        console.log('✅ Operational heartbeats seeded.');
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    } finally {
        process.exit();
    }
}

seedLiveData();
