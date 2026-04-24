import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Test data from E2E_TEST_REPORT.md
const TEST_TENANTS = [
    { code: 'citygen', name: 'City General Hospital' },
    { code: 'valley', name: 'Valley Health Clinic' }
];

const TEST_USERS = [
    { email: 'jessica.taylor@citygen.local', role: 'Support Staff', tenant_code: 'citygen' },
    { email: 'sarah.jones@citygen.local', role: 'Nurse', tenant_code: 'citygen' },
    { email: 'emily.chen@citygen.local', role: 'Doctor', tenant_code: 'citygen' },
    { email: 'michael.brown@citygen.local', role: 'Lab Tech', tenant_code: 'citygen' },
    { email: 'lisa.white@citygen.local', role: 'Admin', tenant_code: 'citygen' },
    { email: 'robert.billing@citygen.local', role: 'Billing', tenant_code: 'citygen' },
    { email: 'mark.davis@valley.local', role: 'Doctor', tenant_code: 'valley' }
];

async function seed() {
    const client = await pool.connect();
    try {
        console.log('--- Seeding Test Data for E2E Tests ---');

        // 1. Ensure tenants exist
        for (const tenant of TEST_TENANTS) {
            const tenantCheck = await client.query("SELECT id FROM emr.tenants WHERE code = $1", [tenant.code]);
            if (tenantCheck.rows.length === 0) {
                const res = await client.query(
                    "INSERT INTO emr.tenants (code, name, status, created_at) VALUES ($1, $2, 'active', NOW()) RETURNING id",
                    [tenant.code, tenant.name]
                );
                console.log(`✅ Created tenant ${tenant.name} (${tenant.code})`);
            } else {
                console.log(`ℹ️ Tenant ${tenant.name} already exists`);
            }
        }

        // 2. Create users
        for (const user of TEST_USERS) {
            const tenantRes = await client.query("SELECT id FROM emr.tenants WHERE code = $1", [user.tenant_code]);
            const tenantId = tenantRes.rows[0]?.id;
            if (!tenantId) continue;

            const userCheck = await client.query(
                "SELECT id FROM emr.users WHERE email = $1 AND tenant_id = $2",
                [user.email, tenantId]
            );
            if (userCheck.rows.length === 0) {
                await client.query(
                    `INSERT INTO emr.users (tenant_id, email, role, password_hash, name, status, created_at)
                     VALUES ($1, $2, $3, crypt('Test@123', gen_salt('bf')), $4, 'active', NOW())`,
                    [tenantId, user.email, user.role, user.email.split('@')[0]]
                );
                console.log(`✅ Created user ${user.email} (${user.role})`);
            } else {
                console.log(`ℹ️ User ${user.email} already exists`);
            }
        }

        // 3. Seed pharmacy queue data (extend existing)
        await client.query("DELETE FROM emr.prescription_items WHERE instructions LIKE '%E2E test%'");
        await client.query("DELETE FROM emr.prescriptions WHERE drug_name = 'E2E Medications'");

        // Re-run NHGL pharmacy seed logic for consistency
        const nhglRes = await client.query("SELECT id FROM emr.tenants WHERE code = 'NHGL'");
        if (nhglRes.rows.length > 0) {
            const nhglTenantId = nhglRes.rows[0].id;
            // Insert sample pending prescription for NHGL (matches test)
            await client.query(
                `INSERT INTO emr.prescriptions (tenant_id, patient_id, status, drug_name, created_at)
                 SELECT $1, id, 'active', 'E2E Test Rx', NOW() FROM emr.patients WHERE tenant_id = $1 LIMIT 1`,
                [nhglTenantId]
            );
            console.log('✅ Seeded NHGL pharmacy queue');
        }

        // 4. Sample workflow data: invoices, lab reports etc.
        // Billing sample
        await client.query(
            `INSERT INTO emr.invoices (tenant_id, patient_id, total_amount, status, created_at)
             SELECT id, (SELECT id FROM emr.patients WHERE tenant_id = emr.tenants.id LIMIT 1), 1500, 'pending', NOW()
             FROM emr.tenants WHERE code IN ('citygen', 'valley', 'NHGL') ON CONFLICT DO NOTHING`
        );
        console.log('✅ Seeded sample invoices');

        // Lab sample
        await client.query(
            `INSERT INTO emr.lab_results (tenant_id, patient_id, test_name, result_value, status, created_at)
             SELECT id, (SELECT id FROM emr.patients WHERE tenant_id = emr.tenants.id LIMIT 1), 'CBC', '14.5', 'pending', NOW()
             FROM emr.tenants WHERE code IN ('citygen', 'valley', 'NHGL') ON CONFLICT DO NOTHING`
        );
        console.log('✅ Seeded sample lab results');

        console.log('✅ All test data seeded! Run: npx playwright test');
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
