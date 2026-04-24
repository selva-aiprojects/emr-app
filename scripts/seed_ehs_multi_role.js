import { query } from '../server/db/connection.js';
import { hashPassword } from '../server/services/auth.service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const EHS_TENANT = {
    name: 'EHS Hospital',
    code: 'EHS',
    subdomain: 'ehs',
    users: [
        { name: 'Admin User', email: 'admin@ehs.local', role: 'Admin' },
        { name: 'Dr. John Smith', email: 'doctor@ehs.local', role: 'Doctor' },
        { name: 'Nurse Mary Johnson', email: 'nurse@ehs.local', role: 'Nurse' },
        { name: 'Lab Technician', email: 'lab@ehs.local', role: 'Lab' },
        { name: 'Pharmacist Robert Lee', email: 'pharmacy@ehs.local', role: 'Pharmacy' },
        { name: 'Support Staff', email: 'support@ehs.local', role: 'Support Staff' },
        { name: 'Front Office', email: 'front_office@ehs.local', role: 'Front Office' },
        { name: 'Billing Officer', email: 'accounts@ehs.local', role: 'Billing' },
        { name: 'HR Manager', email: 'hr@ehs.local', role: 'HR' },
        { name: 'Operations Lead', email: 'ops@ehs.local', role: 'Operations' },
        { name: 'Insurance Coordinator', email: 'insurance@ehs.local', role: 'Insurance' },
        { name: 'Management Executive', email: 'management@ehs.local', role: 'Management' }
    ]
};

async function seed() {
    try {
        console.log('🌱 Seeding EHS Multi-Role Users...');
        const passwordHash = await hashPassword('Test@123');

        // Create/Get EHS Tenant
        let tenantId;
        const tenantRes = await query('SELECT id FROM emr.tenants WHERE code = $1', [EHS_TENANT.code]);

        if (tenantRes.rows.length > 0) {
            tenantId = tenantRes.rows[0].id;
            console.log(`   Existing Tenant: ${EHS_TENANT.name} (${tenantId})`);
        } else {
            const newTenant = await query(
                `INSERT INTO emr.tenants (name, code, subdomain, theme) 
                 VALUES ($1, $2, $3, '{"primary": "#007bff", "accent": "#6c757d"}') 
                 RETURNING id`,
                [EHS_TENANT.name, EHS_TENANT.code, EHS_TENANT.subdomain]
            );
            tenantId = newTenant.rows[0].id;
            console.log(`   Created Tenant: ${EHS_TENANT.name} (${tenantId})`);
        }

        // Create Users
        for (const u of EHS_TENANT.users) {
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

        console.log('✅ EHS Seeding Complete.');
        process.exit(0);
    } catch (error) {
        console.error('❌ EHS Seeding Failed:', error);
        process.exit(1);
    }
}

seed();

