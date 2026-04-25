
import { query } from './server/db/connection.js';

async function checkUsers() {
    try {
        const res = await query("SELECT id, name, role, tenant_id FROM nexus.users");
        console.log('Users in nexus:', res.rows);
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        process.exit(0);
    }
}
checkUsers();
