import { query } from '../server/db/connection.js';
import bcrypt from 'bcryptjs';

async function seedNHGL() {
    try {
        console.log('🚀 Seeding NHGL Stabilization Data...');
        const passwordHash = await bcrypt.hash('Test@123', 10);
        
        // 1. Create NHGL Tenant
        const tenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e'; // From connection.js override
        await query(`
            INSERT INTO emr.tenants (id, name, code, subdomain, subscription_tier, status)
            VALUES ($1, 'NHGL Healthcare Institute', 'NHGL', 'nhgl', 'Enterprise', 'active')
            ON CONFLICT (code) DO UPDATE SET status = 'active'
        `, [tenantId]);
        console.log('✅ NHGL Tenant ready.');

        // 2. Create Management Plane Record
        await query(`
            INSERT INTO emr.management_tenants (id, name, code, subdomain, schema_name, status)
            VALUES ($1, 'NHGL Healthcare Institute', 'NHGL', 'nhgl', 'nhgl', 'active')
            ON CONFLICT (id) DO UPDATE SET status = 'active'
        `, [tenantId]);

        // 3. Create Admin User
        await query(`
            INSERT INTO emr.users (tenant_id, email, password_hash, role, name, is_active)
            VALUES ($1, 'admin@nhgl.com', $2, 'Admin', 'Institutional Administrator', true)
            ON CONFLICT (tenant_id, email) DO UPDATE SET is_active = true
        `, [tenantId, passwordHash]);
        console.log('👤 NHGL Admin ready.');

        // 4. Seed basic data for Branding/Governance tests
        // Note: admin_stabilization.spec.js expects "Institutional Control Plane" text on dashboard
        // This is likely a dashboard widget or header.
        
        console.log('🎉 NHGL Stabilization Seed Complete!');
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    } finally {
        process.exit();
    }
}

seedNHGL();
