import { query } from '../server/db/connection.js';

async function inspectConstraints() {
    try {
        console.log('🔍 Inspecting constraints for emr.users...');
        const usersConstraints = await query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            JOIN pg_class t ON t.oid = c.conrelid
            WHERE n.nspname = 'emr' AND t.relname = 'users';
        `);
        console.log(JSON.stringify(usersConstraints.rows, null, 2));

        console.log('\n🔍 Inspecting constraints for emr.patients...');
        const patientsConstraints = await query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            JOIN pg_class t ON t.oid = c.conrelid
            WHERE n.nspname = 'emr' AND t.relname = 'patients';
        `);
        console.log(JSON.stringify(patientsConstraints.rows, null, 2));
    } catch (err) {
        console.error('❌ Inspection failed:', err);
    } finally {
        process.exit();
    }
}

inspectConstraints();
