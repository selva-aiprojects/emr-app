
import { query } from './server/db/connection.js';

async function checkSubscription() {
    try {
        const res = await query(`
            SELECT t.name, t.code, t.subscription_tier, s.plan_name, s.limit_users, s.features
            FROM nexus.management_tenants t
            LEFT JOIN nexus.management_subscriptions s ON t.subscription_tier = s.tier
            WHERE UPPER(t.code) = 'NAH'
        `);
        console.log('--- NAH Subscription Info ---');
        console.table(res.rows);
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        process.exit(0);
    }
}
checkSubscription();
