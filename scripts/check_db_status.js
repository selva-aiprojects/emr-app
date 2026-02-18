
import { testConnection } from '../server/db/connection.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

async function checkDB() {
    console.log('🔌 Testing Database Connection...');
    const success = await testConnection();
    if (success) {
        console.log('✅ DATABASE IS RUNNING AND ACCESSIBLE.');
        process.exit(0);
    } else {
        console.error('❌ DATABASE CONNECTION FAILED.');
        process.exit(1);
    }
}

checkDB();
