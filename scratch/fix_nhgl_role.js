import { query } from '../server/db/connection.js';

async function fixNHGLRole() {
    try {
        console.log('🚀 Fixing NHGL role to lowercase...');
        await query("UPDATE emr.users SET role = 'admin' WHERE email = 'admin@nhgl.com'");
        console.log('✅ NHGL Admin role updated to lowercase.');
    } catch (err) {
        console.error('❌ Update failed:', err.message);
    } finally {
        process.exit();
    }
}

fixNHGLRole();
