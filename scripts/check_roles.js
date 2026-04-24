
import { query } from '../server/db/connection.js';

async function checkRoles() {
    try {
        console.log('Checking existing roles in emr.users...');
        const result = await query('SELECT DISTINCT role FROM emr.users ORDER BY role');
        console.log('Found roles:', result.rows.map(r => r.role));

        const requiredRoles = ['Superadmin', 'Admin', 'Doctor', 'Nurse', 'Lab', 'Pharmacy', 'Support Staff', 'front_office', 'Billing', 'Inventory', 'Patient']; // Based on auth.middleware.js

        // Check for missing roles from user request
        const requestedRoles = ['Superadmin', 'Admin', 'Doctor', 'Nurse', 'Lab', 'Pharmacy', 'Support Staff', 'Accounts', 'Insurance', 'Management'];

        console.log('\nChecking specifically for requested roles:');
        for (const role of requestedRoles) {
            // Mapping: Accounts -> Billing likely
            let dbRole = role;
            if (role === 'Accounts') dbRole = 'Billing';
            if (role === 'Insurance') dbRole = 'Billing'; // Assuming for now, or maybe Front Office?
            if (role === 'Management') dbRole = 'Admin';

            const check = await query('SELECT count(*) FROM emr.users WHERE role = $1', [dbRole]);
            const count = parseInt(check.rows[0].count);
            console.log(`- ${role} (mapped to ${dbRole}): ${count > 0 ? 'EXISTS (' + count + ')' : 'MISSING'}`);
        }

    } catch (error) {
        console.error('Error checking roles:', error);
    } finally {
        process.exit();
    }
}

checkRoles();
