
import { query } from '../server/db/connection.js';
import { hashPassword } from '../server/services/auth.service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

async function recreateSuperadmin() {
    try {
        console.log('🔄 Recreating Superadmin user...');
        const email = 'superadmin@emr.local';
        const password = 'Admin@123';
        const hashedPassword = await hashPassword(password);

        // Delete existing
        await query('DELETE FROM emr.users WHERE email = $1', [email]);
        console.log('🗑️  Deleted existing superadmin (if any).');

        // Create new
        const res = await query(
            `INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active, created_at)
             VALUES (NULL, $1, $2, 'Platform Superadmin', 'Superadmin', true, NOW())
             RETURNING id, email`,
            [email, hashedPassword]
        );

        console.log('✅ Superadmin recreated successfully:', res.rows[0]);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error recreating superadmin:', error);
        process.exit(1);
    }
}

recreateSuperadmin();
