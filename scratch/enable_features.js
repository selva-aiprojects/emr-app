import { query } from '../server/db/connection.js';

async function enableAllFeatures() {
    try {
        const tenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e'; // NHGL
        const features = {
            inventory: true,
            telehealth: true,
            payroll: true,
            staff_governance: true,
            institutional_ledger: true,
            billing: true,
            emr: true
        };
        
        console.log('🚀 Explicitly enabling all features for NHGL...');
        await query("UPDATE emr.tenants SET features = $1 WHERE id = $2", [JSON.stringify(features), tenantId]);
        console.log('✅ NHGL Features enabled.');
    } catch (err) {
        console.error('❌ Update failed:', err.message);
    } finally {
        process.exit();
    }
}

enableAllFeatures();
