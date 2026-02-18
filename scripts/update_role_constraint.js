import { query } from '../server/db/connection.js';

async function updateConstraint() {
    try {
        console.log('Updating users_role_check constraint...');

        // Drop existing constraint
        await query('ALTER TABLE emr.users DROP CONSTRAINT IF EXISTS users_role_check');

        // Add new constraint with all roles
        await query(`
      ALTER TABLE emr.users ADD CONSTRAINT users_role_check 
      CHECK (role IN (
        'Superadmin', 'Admin', 'Doctor', 'Nurse', 'Lab', 'Pharmacy', 
        'Support Staff', 'Front Office', 'Billing', 'Inventory', 'Patient',
        'HR', 'Operations', 'Insurance', 'Management'
      ))
    `);

        console.log('Constraint updated successfully!');
    } catch (err) {
        console.error('Update failed:', err.message);
    } finally {
        process.exit();
    }
}

updateConstraint();
