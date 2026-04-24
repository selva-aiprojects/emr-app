import dotenv from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;
dotenv.config();

async function fixConstraint() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🔗 Connected to database. Updating constraints...');

        // Drop old constraint
        await client.query('ALTER TABLE emr.users DROP CONSTRAINT IF EXISTS users_role_check');
        console.log('✅ Dropped old users_role_check');

        // Add new constraint with all required roles
        await client.query(`
      ALTER TABLE emr.users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN (
        'Superadmin', 'Admin', 'Doctor', 'Nurse', 'Front Office', 
        'Billing', 'Inventory', 'Patient', 'Lab', 'Pharmacy', 'Support Staff'
      ))
    `);
        console.log('✅ Added new users_role_check with Lab, Pharmacy, and Support Staff');

    } catch (err) {
        console.error('❌ Error updating constraint:', err.message);
    } finally {
        await client.end();
    }
}

fixConstraint();
