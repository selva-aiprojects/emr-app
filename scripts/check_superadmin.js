
import { query } from '../server/db/connection.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

async function checkSuperadmin() {
    try {
        console.log('🔍 Checking Superadmin user...');
        const email = 'superadmin@emr.local';

        const res = await query(
            `SELECT id, email, role, tenant_id, is_active 
             FROM emr.users 
             WHERE email = $1`,
            [email]
        );

        if (res.rows.length === 0) {
            console.log('❌ Superadmin NOT found in database!');
        } else {
            console.log('✅ Superadmin found:', res.rows[0]);
            if (res.rows[0].role !== 'Superadmin') {
                console.warn('⚠️ WARNING: Role mismatch! Expected "Superadmin", got "' + res.rows[0].role + '"');
            }
            if (res.rows[0].tenant_id !== null) {
                console.warn('⚠️ WARNING: Tenant ID mismatch! Expected null, got "' + res.rows[0].tenant_id + '"');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking superadmin:', error);
        process.exit(1);
    }
}

checkSuperadmin();
