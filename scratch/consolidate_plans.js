
import { pathToFileURL } from 'url';
import path from 'path';

// Robust absolute path resolution
const projectRoot = process.cwd();
const connectionPath = path.join(projectRoot, 'server', 'db', 'connection.js');
const connectionUrl = pathToFileURL(connectionPath).href;

async function run() {
    try {
        const { query } = await import(connectionUrl);
        
        console.log('🚀 Finalizing Subscription Plan Consolidation & Module Enabling...');

        // 1. Update features_tiers table (the source of truth for tierModuleMap)
        console.log('Updating features_tiers matrix...');
        const tierFeatures = [
            { key: 'feature_flag_management', name: 'Feature Flag Management', tiers: ['professional', 'enterprise'], moduleKeys: ['feature_flags'] },
            { key: 'system_settings', name: 'System Settings', tiers: ['professional', 'enterprise'], moduleKeys: ['system_settings'] }
        ];

        for (const f of tierFeatures) {
            for (const tier of ['basic', 'professional', 'enterprise']) {
                const enabled = f.tiers.includes(tier);
                await query(`
                    INSERT INTO features_tiers (feature_key, feature_name, tier_key, tier_label, enabled, module_keys)
                    VALUES ($1, $2, $3, $4, $5, $6::jsonb)
                    ON CONFLICT (feature_key, tier_key) DO UPDATE SET
                        enabled = EXCLUDED.enabled,
                        module_keys = EXCLUDED.module_keys,
                        updated_at = NOW()
                `, [f.key, f.name, tier, tier.charAt(0).toUpperCase() + tier.slice(1), enabled, JSON.stringify(f.moduleKeys)]);
            }
        }

        // 2. Update subscription_catalog with comprehensive module lists
        console.log('Updating subscription_catalog...');

        const profModules = ['dashboard','patients','appointments','emr','reports','support','communication','documents','inventory','pharmacy','ambulance','lab','inpatient','billing','accounts','insurance','service_catalog','hospital_settings','departments','bed_management', 'feature_flags', 'system_settings'];
        const entModules = ['dashboard','patients','appointments','emr','reports','admin','users','support','communication','documents','inventory','pharmacy','ambulance','lab','inpatient','billing','accounts','accounts_receivable','accounts_payable','insurance','service_catalog','hospital_settings','departments','bed_management','employees','hr','payroll','donor','ai_analysis','document_vault', 'feature_flags', 'system_settings'];

        await query(`
            UPDATE nexus.subscription_catalog 
            SET name = 'Professional', cost = '5999', 
                features = '["Full Clinical Suite", "Pharmacy & Lab", "IPD Management", "Feature Flag Management", "System Settings", "Priority Support"]'::jsonb,
                module_keys = $1::jsonb
            WHERE plan_id = 'professional'
        `, [JSON.stringify(profModules)]);

        await query(`
            UPDATE nexus.subscription_catalog 
            SET name = 'Enterprise', cost = '9999', 
                features = '["AI Diagnosis Matrix", "Full HRMS & Payroll", "Enterprise Feature Flags", "System Configuration", "White-labeling", "Dedicated Server"]'::jsonb,
                module_keys = $1::jsonb
            WHERE plan_id = 'enterprise'
        `, [JSON.stringify(entModules)]);

        // 3. Ensure role permissions for Admin
        console.log('Syncing Admin permissions...');
        const adminModules = [...new Set([...profModules, ...entModules])];
        for (const mod of adminModules) {
            await query(`
                INSERT INTO nexus.role_permissions (role_id, permission)
                SELECT id, $1 FROM nexus.roles WHERE name = 'Admin' AND is_system = true
                ON CONFLICT (role_id, permission) DO NOTHING
            `, [mod]);
            await query(`
                INSERT INTO nexus.role_permissions (role_id, permission)
                SELECT id, $1 FROM nexus.roles WHERE name = 'admin' AND is_system = true
                ON CONFLICT (role_id, permission) DO NOTHING
            `, [mod]);
        }

        console.log('✨ All plans consolidated and modules enabled!');
    } catch (e) {
        console.error('Consolidation failed:', e);
    } finally {
        process.exit(0);
    }
}
run();
