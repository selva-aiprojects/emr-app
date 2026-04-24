
import { query } from '../server/db/connection.js';
import { hashPassword } from '../server/services/auth.service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const TENANT_1 = {
    name: 'City General Hospital',
    code: 'city_general',
    subdomain: 'citygen',
    users: [
        { name: 'Dr. Emily Chen', email: 'emily.chen@citygen.local', role: 'Doctor' },
        { name: 'Nurse Sarah Jones', email: 'sarah.jones@citygen.local', role: 'Nurse' },
        { name: 'Lab Tech Michael Brown', email: 'michael.brown@citygen.local', role: 'Lab' },
        { name: 'Admin Lisa White', email: 'lisa.white@citygen.local', role: 'Admin' },
        { name: 'Staff Jessica Taylor', email: 'jessica.taylor@citygen.local', role: 'Front Office' }, // Support Staff
        { name: 'Billing Officer Robert', email: 'robert.billing@citygen.local', role: 'Billing' }
    ]
};

const TENANT_2 = {
    name: 'Valley Health Clinic',
    code: 'valley_health',
    subdomain: 'valley',
    users: [
        { name: 'Dr. Mark Davis', email: 'mark.davis@valley.local', role: 'Doctor' },
        { name: 'Nurse David Wilson', email: 'david.wilson@valley.local', role: 'Nurse' }
    ]
};

async function seed() {
    try {
        console.log('🌱 Seeding Multi-Role Users with Real Names...');
        const passwordHash = await hashPassword('Test@123'); // Common password

        for (const t of [TENANT_1, TENANT_2]) {
            // 1. Create/Get Tenant
            let tenantId;
            const tenantRes = await query('SELECT id FROM emr.tenants WHERE code = $1', [t.code]);

            if (tenantRes.rows.length > 0) {
                tenantId = tenantRes.rows[0].id;
                console.log(`   Existing Tenant: ${t.name} (${tenantId})`);
            } else {
                const newTenant = await query(
                    `INSERT INTO emr.tenants (name, code, subdomain, theme) 
                     VALUES ($1, $2, $3, '{"primary": "#007bff", "accent": "#6c757d"}') 
                     RETURNING id`,
                    [t.name, t.code, t.subdomain]
                );
                tenantId = newTenant.rows[0].id;
                console.log(`   Created Tenant: ${t.name} (${tenantId})`);
            }

            // 2. Create Users
            for (const u of t.users) {
                const userRes = await query(
                    'SELECT id FROM emr.users WHERE email = $1 AND tenant_id = $2',
                    [u.email, tenantId]
                );

                if (userRes.rows.length === 0) {
                    await query(
                        `INSERT INTO emr.users (tenant_id, name, email, password_hash, role, is_active)
                         VALUES ($1, $2, $3, $4, $5, true)`,
                        [tenantId, u.name, u.email, passwordHash, u.role]
                    );
                    console.log(`      + Created User: ${u.name} (${u.role})`);
                } else {
                    console.log(`      . Existing User: ${u.name}`);
                }
            }
        }

        console.log('✅ Seeding Complete.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
}

seed();
