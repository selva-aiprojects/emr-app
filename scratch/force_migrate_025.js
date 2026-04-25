
import { query, pool } from './server/db/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function forceMigrate() {
    const client = await pool.connect();
    try {
        console.log('Force running migration 025...');
        const sqlPath = path.join(__dirname, 'server/db/migrations/025_comprehensive_menu_system.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await client.query('BEGIN');
        // Split by ; but handle $$ blocks
        const statements = sql.split(';').filter(s => s.trim());
        
        for (let stmt of statements) {
            console.log('Executing statement...');
            await client.query(stmt + ';');
        }
        
        await client.query("INSERT INTO nexus.migrations_log (filename) VALUES ('025_comprehensive_menu_system.sql') ON CONFLICT (filename) DO UPDATE SET executed_at = NOW()");
        await client.query('COMMIT');
        console.log('✅ Migration 025 completed successfully!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', e.message);
    } finally {
        client.release();
        process.exit(0);
    }
}
forceMigrate();
