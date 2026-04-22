import { query } from '../server/db/connection.js';

async function checkDuplicates() {
    try {
        console.log('🔍 Checking for duplicate users (tenant_id, email)...');
        const userDupes = await query(`
            SELECT tenant_id, email, count(*) 
            FROM emr.users 
            GROUP BY tenant_id, email 
            HAVING count(*) > 1;
        `);
        console.log('User Duplicates:', userDupes.rows);

        console.log('\n🔍 Checking for duplicate patients (tenant_id, mrn)...');
        const patientDupes = await query(`
            SELECT tenant_id, mrn, count(*) 
            FROM emr.patients 
            GROUP BY tenant_id, mrn 
            HAVING count(*) > 1;
        `);
        console.log('Patient Duplicates:', patientDupes.rows);
    } catch (err) {
        console.error('❌ Duplicate check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkDuplicates();
