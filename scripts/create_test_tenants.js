import { query } from '../server/db/connection.js';
import { hashPassword } from '../server/services/auth.service.js';

const testTenants = [
  {
    name: 'Basic Health Clinic',
    code: 'BHC',
    subdomain: 'basic',
    subscriptionTier: 'Basic',
    theme: { primary: '#6b7280', accent: '#9ca3af' },
    users: [
      { name: 'Dr. Sarah Basic', email: 'sarah@basic.health', role: 'Doctor' },
      { name: 'Nurse John Basic', email: 'john@basic.health', role: 'Nurse' },
      { name: 'Admin Mary Basic', email: 'mary@basic.health', role: 'Admin' }
    ]
  },
  {
    name: 'Professional Medical Center',
    code: 'PMC',
    subdomain: 'professional',
    subscriptionTier: 'Professional',
    theme: { primary: '#3b82f6', accent: '#60a5fa' },
    users: [
      { name: 'Dr. Robert Professional', email: 'robert@professional.med', role: 'Doctor' },
      { name: 'Nurse Lisa Professional', email: 'lisa@professional.med', role: 'Nurse' },
      { name: 'Admin James Professional', email: 'james@professional.med', role: 'Admin' },
      { name: 'Support Agent Anna', email: 'anna@professional.med', role: 'Support Staff' }
    ]
  },
  {
    name: 'Enterprise Hospital Systems',
    code: 'EHS',
    subdomain: 'enterprise',
    subscriptionTier: 'Enterprise',
    theme: { primary: '#10b981', accent: '#34d399' },
    users: [
      { name: 'Dr. Michael Enterprise', email: 'michael@enterprise.hos', role: 'Doctor' },
      { name: 'Nurse Jennifer Enterprise', email: 'jennifer@enterprise.hos', role: 'Nurse' },
      { name: 'Admin David Enterprise', email: 'david@enterprise.hos', role: 'Admin' },
      { name: 'HR Manager Susan', email: 'susan@enterprise.hos', role: 'Admin' },
      { name: 'Billing Agent Tom', email: 'tom@enterprise.hos', role: 'Billing' },
      { name: 'Support Agent Rachel', email: 'rachel@enterprise.hos', role: 'Support Staff' }
    ]
  }
];

async function createTestTenants() {
  console.log('🚀 Creating test tenants with different subscription tiers...\n');

  try {
    for (const tenantData of testTenants) {
      console.log(`📋 Creating tenant: ${tenantData.name} (${tenantData.subscriptionTier})`);

      // Insert tenant
      const tenantResult = await query(
        `INSERT INTO emr.tenants (name, code, subdomain, subscription_tier, theme, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
         RETURNING id`,
        [
          tenantData.name,
          tenantData.code,
          tenantData.subdomain,
          tenantData.subscriptionTier,
          JSON.stringify(tenantData.theme)
        ]
      );

      const tenantId = tenantResult.rows[0].id;
      console.log(`✅ Tenant created with ID: ${tenantId}`);

      // Create users for this tenant
      for (const userData of tenantData.users) {
        const passwordHash = await hashPassword('Test@123');

        const userResult = await query(
          `INSERT INTO emr.users (tenant_id, name, email, password_hash, role, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
           RETURNING id`,
          [tenantId, userData.name, userData.email, passwordHash, userData.role]
        );

        console.log(`  👤 Created user: ${userData.name} (${userData.email})`);
      }

      console.log(`\n🎯 ${tenantData.name} users can login with password: Test@123\n`);
    }

    console.log('✅ All test tenants created successfully!');
    console.log('\n📊 Expected Feature Access:');
    console.log('🟦 Basic: Core EMR only');
    console.log('🟦 Professional: Core EMR + Customer Support');
    console.log('🟦 Enterprise: All features (Core + HR + Accounts + Support)');

  } catch (error) {
    console.error('❌ Error creating test tenants:', error);
    process.exit(1);
  }
}

// Run the script
createTestTenants().then(() => {
  console.log('\n🎉 Test tenant setup completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
