import { query } from './server/db/connection.js';

async function updateTiers() {
    try {
        console.log('Attempting to set Free tier for Demo Free Clinic v4...');
        const res = await query("UPDATE emr.tenants SET subscription_tier = 'Free' WHERE name = 'Demo Free Clinic v4' RETURNING subscription_tier");
        console.log('Update result:', res.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('Update failed. This might be due to a CHECK constraint in the DB.');
        console.error(err);
        process.exit(1);
    }
}

updateTiers();
