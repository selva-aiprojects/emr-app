
import { query } from './server/db/connection.js';

async function listPlans() {
    try {
        const res = await query(`
            SELECT tier, plan_name as name, price, limit_users as users, features 
            FROM nexus.management_subscriptions 
            ORDER BY limit_users ASC
        `);
        console.log('--- NEXUS SUBSCRIPTION CATALOG ---');
        console.table(res.rows);
    } catch (e) {
        console.error('Failed to fetch catalog:', e);
    } finally {
        process.exit(0);
    }
}
listPlans();
