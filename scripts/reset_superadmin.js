
import { query } from '../server/db/connection.js';
import { hashPassword } from '../server/services/auth.service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

async function resetSuperadmin() {
    try {
        console.log('🔄 Resetting Superadmin password...');
        const email = 'superadmin@emr.local';
        const password = 'Admin@123';
        const hashedPassword = await hashPassword(password);

        const res = await query(
            `UPDATE emr.users 
             SET password_hash = $1 
             WHERE email = $2 AND tenant_id IS NULL
             RETURNING id, email`,
            [hashedPassword, email]
        );

        if (res.rows.length === 0) {
            console.log('❌ Superadmin not found!');
        } else {
            console.log('✅ Superadmin password reset successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting password:', error);
        process.exit(1);
    }
}

resetSuperadmin();
