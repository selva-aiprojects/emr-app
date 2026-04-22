import { query } from '../server/db/connection.js';

async function checkDrugMaster() {
    try {
        console.log('🔍 Checking drug_master columns...');
        const drugs = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'emr' AND table_name = 'drug_master';
        `);
        console.table(drugs.rows);

        console.log('\n🔍 Checking prescriptions columns...');
        const rx = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'emr' AND table_name = 'prescriptions';
        `);
        console.table(rx.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkDrugMaster();
