import fs from 'fs';
import { query } from '../server/db/connection.js';

async function checkSchema() {
  console.log('🔍 Checking current database schema...');
  
  try {
    // Check if emr schema exists
    const schemaResult = await query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'emr'
    `);
    
    if (schemaResult.rows.length === 0) {
      console.log('❌ EMR schema does not exist. Creating it...');
      await query('CREATE SCHEMA emr');
      console.log('✅ EMR schema created');
    } else {
      console.log('✅ EMR schema exists');
    }

    // Check existing tables
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'emr'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check if tenants table exists and its structure
    const tenantsTable = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'emr' AND table_name = 'tenants'
      ORDER BY ordinal_position
    `);
    
    if (tenantsTable.rows.length > 0) {
      console.log('\n🏢 Tenants table structure:');
      tenantsTable.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });
    } else {
      console.log('\n❌ Tenants table does not exist');
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error);
  }
}

async function runMinimalMigration() {
  console.log('\n🔄 Running minimal feature flag migration...');
  
  try {
    // Add subscription_tier column to existing tenants table if it doesn't exist
    try {
      await query(`ALTER TABLE emr.tenants ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'Basic' CHECK (subscription_tier IN ('Basic', 'Professional', 'Enterprise'))`);
      console.log('✅ subscription_tier column added to tenants table');
    } catch (error) {
      console.log('ℹ️ subscription_tier column already exists or failed to add:', error.message);
    }

    // Create other feature flag tables
    await query(`
      CREATE TABLE IF NOT EXISTS emr.tenant_features (
        id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES emr.tenants(id) ON DELETE CASCADE,
        feature_flag VARCHAR(100) NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, feature_flag)
      )
    `);
    console.log('✅ Tenant features table created/verified');

    await query(`
      CREATE TABLE IF NOT EXISTS emr.global_kill_switches (
        id SERIAL PRIMARY KEY,
        feature_flag VARCHAR(100) NOT NULL UNIQUE,
        enabled BOOLEAN NOT NULL DEFAULT false,
        reason TEXT,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Global kill switches table created/verified');

    // Insert default kill switches
    await query(`
      INSERT INTO emr.global_kill_switches (feature_flag, enabled, reason)
      VALUES 
        ('permission-hr_payroll-access', false, 'Payroll module kill switch'),
        ('permission-accounts-access', false, 'Accounts module kill switch'),
        ('permission-core_engine-access', false, 'Core engine kill switch'),
        ('permission-customer_support-access', false, 'Customer support kill switch')
      ON CONFLICT (feature_flag) DO NOTHING
    `);
    console.log('✅ Default kill switches inserted');

    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant_id ON emr.tenant_features(tenant_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_tenant_features_feature_flag ON emr.tenant_features(feature_flag)');
    console.log('✅ Indexes created');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function createTestTenants() {
  console.log('\n🚀 Creating test tenants...');

  const testTenants = [
    {
      name: 'Basic Health Clinic',
      code: 'BHC',
      subdomain: 'basic',
      subscriptionTier: 'Basic',
      theme: { primary: '#6b7280', accent: '#9ca3af' }
    },
    {
      name: 'Professional Medical Center',
      code: 'PMC',
      subdomain: 'professional',
      subscriptionTier: 'Professional',
      theme: { primary: '#3b82f6', accent: '#60a5fa' }
    },
    {
      name: 'Enterprise Hospital Systems',
      code: 'EHS',
      subdomain: 'enterprise',
      subscriptionTier: 'Enterprise',
      theme: { primary: '#10b981', accent: '#34d399' }
    }
  ];

  try {
    for (const tenantData of testTenants) {
      console.log(`📋 Creating tenant: ${tenantData.name} (${tenantData.subscriptionTier})`);

      const tenantResult = await query(
        `INSERT INTO emr.tenants (name, code, subdomain, subscription_tier, theme, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           subscription_tier = EXCLUDED.subscription_tier,
           theme = EXCLUDED.theme,
           updated_at = NOW()
         RETURNING id, name, subscription_tier`,
        [
          tenantData.name,
          tenantData.code,
          tenantData.subdomain,
          tenantData.subscriptionTier,
          JSON.stringify(tenantData.theme)
        ]
      );

      const tenant = tenantResult.rows[0];
      console.log(`✅ Tenant ${tenant.name} (${tenant.subscription_tier}) created/updated with ID: ${tenant.id}`);
    }

    console.log('\n✅ All test tenants created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating test tenants:', error);
    throw error;
  }
}

async function main() {
  try {
    await checkSchema();
    await runMinimalMigration();
    await createTestTenants();
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📊 Expected Feature Access:');
    console.log('🟦 Basic: Core EMR only');
    console.log('🟦 Professional: Core EMR + Customer Support');
    console.log('🟦 Enterprise: All features (Core + HR + Accounts + Support)');
    console.log('\n🔑 Login credentials:');
    console.log('Use existing users or create new ones through the Superadmin panel');
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

main();
