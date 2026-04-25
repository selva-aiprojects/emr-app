
import { query } from './server/db/connection.js';
import fs from 'fs';

async function check() {
    try {
        const res = await query(`
            SELECT t.name, t.code, t.subscription_tier, s.plan_name, s.limit_users
            FROM nexus.management_tenants t
            LEFT JOIN nexus.management_subscriptions s ON t.subscription_tier = s.tier
            WHERE UPPER(t.code) = 'NAH'
        `);
        fs.writeFileSync('scratch/nah_sub.json', JSON.stringify(res.rows, null, 2));
    } catch (e) {
        fs.writeFileSync('scratch/nah_sub.json', JSON.stringify({ error: e.message }));
    } finally {
        process.exit(0);
    }
}
check();
