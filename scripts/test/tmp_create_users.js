import bcrypt from 'bcryptjs';
import { query } from './server/db/connection.js';

async function createUsers() {
    try {
        const hash = bcrypt.hashSync('Admin@123', 10);
        const users = [
            { tenantId: '3b040eb2-618a-42d2-aa56-b56024636520', email: 'admin@free.medflow', name: 'Free Admin', role: 'Doctor' },
            { tenantId: 'bc907199-0d62-4d6c-ae59-ec4714c5a115', email: 'admin@basic.medflow', name: 'Basic Admin', role: 'Doctor' },
            { tenantId: '82f59918-e525-44bf-89c1-3f2070a6dfbc', email: 'admin@pro.medflow', name: 'Pro Admin', role: 'Doctor' },
            { tenantId: 'e2489494-ff71-45bf-acfc-11e7a5914560', email: 'admin@enterprise.medflow', name: 'Enterprise Admin', role: 'Doctor' }
        ];

        for (const u of users) {
             // Check if user already exists
            const check = await query('SELECT * FROM emr.users WHERE email = $1 AND tenant_id = $2', [u.email, u.tenantId]);
            if (check.rows.length === 0) {
                await query(
                    'INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active) VALUES ($1, $2, $3, $4, $5, true)',
                    [u.tenantId, u.email, hash, u.name, u.role]
                );
                console.log(`User ${u.email} created successfully`);
            } else {
                console.log(`User ${u.email} already exists`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error('Error creating users:', err);
        process.exit(1);
    }
}

createUsers();
