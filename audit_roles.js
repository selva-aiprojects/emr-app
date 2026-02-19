
import { query } from './server/db/connection.js';

async function checkRoles() {
    try {
        console.log('--- Database Role Audit ---');
        const dbInfo = await query('SELECT current_database(), current_user');
        console.log('Target DB:', dbInfo.rows[0].current_database);
        console.log('Target User:', dbInfo.rows[0].current_user);

        const roles = await query('SELECT DISTINCT role FROM emr.users');
        console.log('\nRoles found in DB:');
        roles.rows.forEach(r => {
            console.log(`- "${r.role}" (Length: ${r.role.length})`);
        });

        const doctorUser = await query("SELECT email, role FROM emr.users WHERE email = 'doctor@ehs.local'");
        if (doctorUser.rows.length > 0) {
            console.log('\nDoctor User Check:');
            console.log(`Email: ${doctorUser.rows[0].email}`);
            console.log(`Role: "${doctorUser.rows[0].role}"`);
        } else {
            console.log('\nDoctor user not found!');
        }

    } catch (error) {
        console.error('Audit failed:', error);
    } finally {
        process.exit();
    }
}

checkRoles();
