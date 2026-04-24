import fs from 'fs';
import { query } from '../server/db/connection.js';

async function runMigration() {
  console.log('🔄 Running feature flag migration...');
  
  try {
    const migrationSQL = fs.readFileSync('database/migrations/004_feature_flags.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('📝 Executing:', statement.substring(0, 50) + '...');
        await query(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function createTestTenants() {
  console.log('🚀 Creating test tenants...\n');

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
        `INSERT INTO emr.tenants (name, code, subdomain, subscription_tier, theme, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
         ON CONFLICT (code) DO NOTHING
         RETURNING id`,
        [
          tenantData.name,
          tenantData.code,
          tenantData.subdomain,
          tenantData.subscriptionTier,
          JSON.stringify(tenantData.theme)
        ]
      );

      if (tenantResult.rows.length > 0) {
        const tenantId = tenantResult.rows[0].id;
        console.log(`✅ Tenant created with ID: ${tenantId}`);
      } else {
        console.log(`⚠️ Tenant ${tenantData.code} already exists, skipping...`);
      }
    }

    console.log('\n✅ All test tenants created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating test tenants:', error);
    throw error;
  }
}

async function main() {
  try {
    await runMigration();
    await createTestTenants();
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📊 Expected Feature Access:');
    console.log('🟦 Basic: Core EMR only');
    console.log('🟦 Professional: Core EMR + Customer Support');
    console.log('🟦 Enterprise: All features (Core + HR + Accounts + Support)');
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

main();
