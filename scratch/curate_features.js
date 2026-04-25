
import { query } from '../server/db/connection.js';

async function curateFeatures() {
    try {
        console.log('🔧 Re-curating plan features...');

        // 1. Basic Plan - Focused on Essentials
        await query(`
            UPDATE nexus.subscription_catalog 
            SET features = '["Standard EMR", "OPD Scheduler", "Basic Billing", "Email Support", "Secure SSO"]'::jsonb,
                module_keys = '["dashboard", "patients", "appointments", "emr", "billing"]'::jsonb
            WHERE plan_id = 'basic_starter'
        `);

        // 2. Professional Plan - Adding Feature Flag Management
        await query(`
            UPDATE nexus.subscription_catalog 
            SET features = '["Full Clinical Suite", "Pharmacy & Lab", "IPD Management", "Feature Flag Management (Standard)", "Priority Support"]'::jsonb,
                module_keys = '["dashboard", "patients", "appointments", "emr", "billing", "inventory", "pharmacy", "lab", "inpatient", "feature_flags"]'::jsonb
            WHERE plan_id = 'professional'
        `);

        // 3. Enterprise Plan - Full Control
        await query(`
            UPDATE nexus.subscription_catalog 
            SET features = '["AI Diagnosis Matrix", "Full HRMS & Payroll", "Enterprise Feature Flags", "White-labeling", "Dedicated Server"]'::jsonb,
                module_keys = '["dashboard", "patients", "appointments", "emr", "billing", "inventory", "pharmacy", "lab", "inpatient", "feature_flags", "employees", "hr", "payroll", "ai_analysis"]'::jsonb
            WHERE plan_id = 'enterprise'
        `);

        console.log('✅ Features curated and Feature Flag module enabled!');
    } catch (e) {
        console.error('Curate failed:', e);
    } finally {
        process.exit(0);
    }
}
curateFeatures();
