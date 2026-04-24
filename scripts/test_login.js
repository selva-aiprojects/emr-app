
import * as repo from '../server/db/repository.js';
import { comparePassword } from '../server/services/auth.service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

async function testLogin() {
    try {
        console.log('🔄 Testing logic for Superadmin login...');
        const email = 'superadmin@emr.local';
        const password = 'Admin@123';
        const tenantId = 'superadmin';

        let user;

        if (tenantId === 'superadmin') {
            console.log('Attempting to fetch superadmin user...');
            user = await repo.getUserByEmail(email, null);

            if (!user) {
                console.error('❌ User NOT FOUND by email.');
                process.exit(1);
            }

            console.log('User found:', user.email, 'Role:', user.role);

            if (user.role !== 'Superadmin') {
                console.error('❌ Role mismatch. Expected Superadmin, got:', user.role);
                process.exit(1);
            }

            console.log('Verifying password...');
            const isValidPassword = await comparePassword(password, user.password_hash);
            if (!isValidPassword) {
                console.error('❌ Password INVALID.');
                process.exit(1);
            }

            console.log('✅ LOGIN SUCCESSFUL! Logic is valid.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    }
}

testLogin();
