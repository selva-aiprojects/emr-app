
import { provisionTenantSchema } from '../server/db/tenant.service.js';
import { query } from '../server/db/connection.js';

async function repair() {
    try {
        console.log('--- Starting NAH Shard Repair ---');
        
        // 1. Get the tenant ID for NAH
        const res = await query("SELECT id FROM nexus.management_tenants WHERE UPPER(code) = 'NAH'");
        if (res.rows.length === 0) {
            console.error('Tenant NAH not found!');
            return;
        }
        const tenantId = res.rows[0].id;
        
        // 2. Run the provisioning again (now with the fix)
        console.log(`Repairing tenant ${tenantId} (nah)...`);
        const result = await provisionTenantSchema(tenantId, 'nah');
        
        console.log('Repair result:', result.success ? 'SUCCESS' : 'FAILED');
        console.log('Log:', result.log.join('\n'));

    } catch (e) {
        console.error('Repair failed:', e);
    } finally {
        process.exit(0);
    }
}
repair();
