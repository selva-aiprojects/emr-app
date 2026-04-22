import { query } from '../server/db/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        console.log('🚀 Running 017_billing_infrastructure_fix.sql...');
        const migrationPath = path.join(__dirname, '../database/migrations/017_billing_infrastructure_fix.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await query(sql);
        console.log('✅ Migration successful!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        process.exit();
    }
}

runMigration();
