import dotenv from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;
dotenv.config();

async function unifyEncounters() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🔄 Unifying encounter types...');

        // 1. Update existing inconsistent data
        await client.query("UPDATE emr.encounters SET encounter_type = 'Out-patient' WHERE encounter_type IN ('OPD', 'outpatient')");
        await client.query("UPDATE emr.encounters SET encounter_type = 'In-patient' WHERE encounter_type IN ('IPD', 'inpatient')");
        await client.query("UPDATE emr.encounters SET encounter_type = 'Emergency' WHERE encounter_type IN ('emergency')");

        console.log('✅ Data unified.');

        // 2. Drop and Re-add constraint
        await client.query('ALTER TABLE emr.encounters DROP CONSTRAINT IF EXISTS encounters_encounter_type_check');
        await client.query(`
      ALTER TABLE emr.encounters 
      ADD CONSTRAINT encounters_encounter_type_check 
      CHECK (encounter_type IN ('Out-patient', 'In-patient', 'Emergency'))
    `);

        console.log('✅ Constraint updated to (Out-patient, In-patient, Emergency).');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

unifyEncounters();
