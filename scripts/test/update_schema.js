import { query } from './server/db/connection.js';

async function updateSchema() {
    try {
        console.log('Updating DB schema to allow Free tier...');
        await query('ALTER TABLE emr.tenants DROP CONSTRAINT IF EXISTS tenants_subscription_tier_check');
        await query("ALTER TABLE emr.tenants ADD CONSTRAINT tenants_subscription_tier_check CHECK (subscription_tier IN ('Free', 'Basic', 'Professional', 'Enterprise'))");
        console.log('DB Schema updated successfully');

        console.log('Fixing demo tenant tiers...');
        await query("UPDATE emr.tenants SET subscription_tier = 'Free' WHERE name LIKE 'Demo Free Clinic%'");
        console.log('Demo Free Clinic tiers fixed');
        
        process.exit(0);
    } catch (err) {
        console.error('Schema update failed:', err);
        process.exit(1);
    }
}

updateSchema();
