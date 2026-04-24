
import fs from 'fs';
import path from 'path';
import { query } from '../server/db/connection.js';

const MIGRATION_PATH = path.resolve('database/migrations/004_feature_flags.sql');

async function runMigration() {
    try {
        console.log('--- Neon Database Migration: Feature Flag Consolidation ---');

        // Check connection
        const dbInfo = await query('SELECT current_database(), current_schema()');
        console.log(`Targeting Database: ${dbInfo.rows[0].current_database}`);
        console.log(`Current Schema: ${dbInfo.rows[0].current_schema}`);

        // Read SQL file
        const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

        console.log('Applying consolidated feature flag schema to emr namespace...');

        // Split by semicolons for better error reporting if needed, 
        // but here we can try running it as one block inside a BEGIN/COMMIT
        await query('BEGIN');
        await query(sql);
        await query('COMMIT');

        console.log('✅ Migration successful! emr.tenant_feature_status view is now live.');

        // Quick verification
        const verify = await query("SELECT count(*) FROM information_schema.views WHERE table_schema = 'emr' AND table_name = 'tenant_feature_status'");
        if (verify.rows[0].count === '1') {
            console.log('✅ Verification: emr.tenant_feature_status confirmed.');
        } else {
            console.warn('⚠️ Warning: View not found in information_schema after migration.');
        }

    } catch (error) {
        await query('ROLLBACK').catch(() => { });
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        process.exit();
    }
}

runMigration();
