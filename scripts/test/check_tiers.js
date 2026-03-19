import { query } from './server/db/connection.js';

async function checkTiers() {
    try {
        const res = await query("SELECT name, subscription_tier FROM emr.tenants WHERE name LIKE 'Demo%'");
        console.log('--- Current Demo Tenants ---');
        res.rows.forEach(r => {
            console.log(`${r.name}: ${r.subscription_tier}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTiers();
