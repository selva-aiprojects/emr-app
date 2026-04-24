import { getTenants, getUsers } from '../server/db/repository.js';
import pool from '../server/db/connection.js';
import fs from 'fs';

async function listUsers() {
    try {
        const tenants = await getTenants();
        const result = [];

        for (const tenant of tenants) {
            const users = await getUsers(tenant.id);
            result.push({
                tenant: { name: tenant.name, code: tenant.code, id: tenant.id },
                users: users.map(u => ({ name: u.name, email: u.email, role: u.role }))
            });
        }
        fs.writeFileSync('scripts/users.json', JSON.stringify(result, null, 2));
        console.log('Users written to scripts/users.json');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

listUsers();
