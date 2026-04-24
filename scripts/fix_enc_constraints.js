import dotenv from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;
dotenv.config();

async function fixEncConstraints() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🔗 Connected to database. Updating encounter constraints...');

        // Drop old constraint
        await client.query('ALTER TABLE emr.encounters DROP CONSTRAINT IF EXISTS encounters_encounter_type_check');
        console.log('✅ Dropped old encounters_encounter_type_check');

        // Add new constraint with UI-compatible values
        await client.query(`
      ALTER TABLE emr.encounters 
      ADD CONSTRAINT encounters_encounter_type_check 
      CHECK (encounter_type IN (
        'Out-patient', 'In-patient', 'Emergency',
        'outpatient', 'inpatient', 'emergency',
        'Outpatient', 'Inpatient'
      ))
    `);
        console.log('✅ Added new encounters_encounter_type_check');

    } catch (err) {
        console.error('❌ Error updating constraint:', err.message);
    } finally {
        await client.end();
    }
}

fixEncConstraints();
