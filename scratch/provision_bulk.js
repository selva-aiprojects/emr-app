import { provisionNewTenant } from '../server/services/provisioning.service.js';
import dotenv from 'dotenv';
dotenv.config();

const tenants = [
  {
    tenant: {
      name: 'City Community Hospital',
      code: 'city-hosp',
      subdomain: 'city',
      subscriptionTier: 'Basic',
      contactEmail: 'admin@cityhosp.local'
    },
    admin: {
      email: 'admin@cityhosp.local',
      name: 'City Admin'
    }
  },
  {
    tenant: {
      name: 'Metro Diagnostic Clinic',
      code: 'metro-clinic',
      subdomain: 'metro',
      subscriptionTier: 'Standard',
      contactEmail: 'admin@metroclinic.local'
    },
    admin: {
      email: 'admin@metroclinic.local',
      name: 'Metro Admin'
    }
  },
  {
    tenant: {
      name: 'Wellness Specialty Center',
      code: 'wellness-ctr',
      subdomain: 'wellness',
      subscriptionTier: 'Professional',
      contactEmail: 'admin@wellness.local'
    },
    admin: {
      email: 'admin@wellness.local',
      name: 'Wellness Admin'
    }
  },
  {
    tenant: {
      name: 'Apollo Enterprise Shard',
      code: 'apollo-ent',
      subdomain: 'apollo',
      subscriptionTier: 'Enterprise',
      contactEmail: 'admin@apollo.local'
    },
    admin: {
      email: 'admin@apollo.local',
      name: 'Apollo Admin'
    }
  }
];

async function run() {
  console.log('🚀 Starting Bulk Tenant Provisioning (4 Tiers)...');
  
  for (const item of tenants) {
    try {
      console.log(`\n📦 Provisioning ${item.tenant.name} (${item.tenant.subscriptionTier})...`);
      const result = await provisionNewTenant(item.tenant, item.admin);
      console.log(`✅ Success: ${result.code} provisioned on schema ${result.schema_name}`);
      console.log(`🔑 Admin: ${result.adminLoginEmail} / Admin@123`);
    } catch (err) {
      console.error(`❌ Failed to provision ${item.tenant.code}:`, err.message);
    }
  }
  
  console.log('\n✨ Bulk provisioning complete.');
  process.exit(0);
}

run();
