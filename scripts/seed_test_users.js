
import { query } from '../server/db/connection.js';
import { hashPassword } from '../server/services/auth.service.js';

const TENANT_CODE = 'EHS';
const PASSWORD = 'Test@123';

const ROLES_TO_SEED = [
    { email: 'admin@ehs.local', name: 'EHS Administrator', role: 'Admin' },
    { email: 'doctor@ehs.local', name: 'Dr. Sarah Smith', role: 'Doctor' },
    { email: 'nurse@ehs.local', name: 'Nurse Jackie', role: 'Nurse' },
    { email: 'lab@ehs.local', name: 'Lab Technician', role: 'Lab' },
    { email: 'pharmacy@ehs.local', name: 'Pharmacist John', role: 'Pharmacy' },
    { email: 'support@ehs.local', name: 'Support Staff', role: 'Support Staff' },
    { email: 'front_office@ehs.local', name: 'Receptionist', role: 'Front Office' },
    { email: 'accounts@ehs.local', name: 'Accounts Manager', role: 'Billing' },
    { email: 'hr@ehs.local', name: 'HR Manager', role: 'HR' },
    { email: 'ops@ehs.local', name: 'Ops Manager', role: 'Operations' },
    { email: 'insurance@ehs.local', name: 'Insurance Rep', role: 'Insurance' },
    { email: 'management@ehs.local', name: 'Hospital Admin', role: 'Management' }
];

async function seedUsers() {
    try {
        console.log(`Seeding users for tenant: ${TENANT_CODE}...`);

        // 1. Get Tenant ID (UUID)
        let tenantId;
        const tenantCheck = await query('SELECT id FROM emr.tenants WHERE code = $1', [TENANT_CODE]);

        if (tenantCheck.rows.length === 0) {
            console.log('Creating EHS tenant...');
            const newTenant = await query(`
        INSERT INTO emr.tenants (name, code, subdomain, status, theme, features)
        VALUES ('Enterprise Hospital Systems', $1, 'ehs', 'active', '{}', '{}')
        RETURNING id
      `, [TENANT_CODE]);
            tenantId = newTenant.rows[0].id;
        } else {
            tenantId = tenantCheck.rows[0].id;
            console.log(`Found EHS tenant ID: ${tenantId}`);
        }

        const hashedPassword = await hashPassword(PASSWORD);

        // 2. Seed Users
        for (const user of ROLES_TO_SEED) {
            console.log(`Ensuring user: ${user.email} (${user.role})...`);

            const userCheck = await query('SELECT id FROM emr.users WHERE email = $1', [user.email]);

            if (userCheck.rows.length === 0) {
                await query(`
          INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
          VALUES ($1, $2, $3, $4, $5, true)
        `, [tenantId, user.email, hashedPassword, user.name, user.role]);
                console.log(`Created ${user.email}`);
            } else {
                // Correct role, password, and tenant mapping if needed
                await query('UPDATE emr.users SET password_hash = $1, role = $2, tenant_id = $3 WHERE email = $4', [hashedPassword, user.role, tenantId, user.email]);
                console.log(`Updated ${user.email}`);
            }
        }

        console.log('\n--- SEED COMPLETE ---');
        console.log('Login credentials for all roles:');
        console.log(`Tenant: ${TENANT_CODE}`);
        console.log(`Password: ${PASSWORD}`);
        ROLES_TO_SEED.forEach(u => console.log(`- ${u.role}: ${u.email}`));

    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        process.exit();
    }
}

seedUsers();
