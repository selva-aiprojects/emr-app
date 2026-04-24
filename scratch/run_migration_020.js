import { query } from '../server/db/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        console.log('🚀 Running 020_tier_realignment.sql...');
        const migrationPath = path.join(__dirname, '../database/migrations/020_tier_realignment.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await query(sql);
        console.log('✅ Tier realignment successful!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        process.exit();
    }
}

runMigration();
