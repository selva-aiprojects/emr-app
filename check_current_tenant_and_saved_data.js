import { query } from './server/db/connection.js';

async function checkCurrentTenantAndSavedData() {
  try {
    console.log('=== Checking Current Tenant and Saved Data ===');
    
    // 1. Get all tenants to see which one has saved branding data
    console.log('\n--- All Tenants with Branding Data ---');
    const allTenants = await query(`
      SELECT id, name, code, logo_url, theme, features, billing_config, updated_at 
      FROM emr.tenants 
      ORDER BY updated_at DESC
    `);
    
    allTenants.rows.forEach((tenant, index) => {
      console.log(`\n${index + 1}. ${tenant.name} (${tenant.id})`);
      console.log(`   logo_url: ${tenant.logo_url}`);
      console.log(`   theme: ${JSON.stringify(tenant.theme)}`);
      console.log(`   features: ${JSON.stringify(tenant.features)}`);
      console.log(`   billing_config: ${JSON.stringify(tenant.billing_config)}`);
      console.log(`   updated_at: ${tenant.updated_at}`);
      
      // Check if this tenant has branding data
      const hasBranding = tenant.logo_url || 
        (tenant.theme && Object.keys(tenant.theme).length > 0) ||
        (tenant.features && Object.keys(tenant.features).length > 0) ||
        (tenant.billing_config && Object.keys(tenant.billing_config).length > 0);
      
      if (hasBranding) {
        console.log('   *** HAS BRANDING DATA ***');
      } else {
        console.log('   No branding data');
      }
    });
    
    // 2. Check which tenant the frontend is likely logged into
    console.log('\n--- Checking Frontend Login Flow ---');
    
    // The frontend likely gets the first tenant or a specific one
    const likelyTenant = await query(`
      SELECT id, name, code, subdomain, status, subscription_tier, logo_url, theme, features, billing_config 
      FROM emr.tenants 
      WHERE name ILIKE '%abhinand%' OR name ILIKE '%med-flow%'
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    
    if (likelyTenant.rows.length > 0) {
      const tenant = likelyTenant.rows[0];
      console.log('Likely logged-in tenant:');
      console.log(`  name: ${tenant.name}`);
      console.log(`  logo_url: ${tenant.logo_url}`);
      console.log(`  theme: ${JSON.stringify(tenant.theme)}`);
      console.log(`  features: ${JSON.stringify(tenant.features)}`);
      console.log(`  billing_config: ${JSON.stringify(tenant.billing_config)}`);
    }
    
    // 3. Check if there's a mismatch between saved data and what's being displayed
    console.log('\n--- Checking Data Flow Mismatch ---');
    
    // Find the tenant with branding data
    const tenantWithBranding = allTenants.rows.find(t => 
      t.logo_url || 
      (t.theme && Object.keys(t.theme).length > 0) ||
      (t.features && Object.keys(t.features).length > 0) ||
      (t.billing_config && Object.keys(t.billing_config).length > 0)
    );
    
    if (tenantWithBranding) {
      console.log(`Tenant with branding: ${tenantWithBranding.name}`);
      console.log(`This tenant has saved branding data but might not be the one you're logged into`);
      
      // Check if this is the same as the likely logged-in tenant
      if (likelyTenant.rows.length > 0 && likelyTenant.rows[0].id !== tenantWithBranding.id) {
        console.log('DIAGNOSIS: You have saved branding data in one tenant but are logged into a different tenant');
        console.log('Solution: Either log into the correct tenant or save branding data in your current tenant');
      }
    }
    
    // 4. Test the specific tenant that has the saved data
    if (tenantWithBranding) {
      console.log('\n--- Testing Saved Data in Correct Tenant ---');
      
      const managementData = await query(`
        SELECT id, name, logo_url, theme, features, billing_config, updated_at 
        FROM emr.management_tenants 
        WHERE id::text = $1::text
      `, [tenantWithBranding.id]);
      
      if (managementData.rows.length > 0) {
        const data = managementData.rows[0];
        console.log('Management table data for saved tenant:');
        console.log(`  name: ${data.name}`);
        console.log(`  logo_url: ${data.logo_url}`);
        console.log(`  theme: ${JSON.stringify(data.theme)}`);
        console.log(`  features: ${JSON.stringify(data.features)}`);
        console.log(`  billing_config: ${JSON.stringify(data.billing_config)}`);
      }
    }
    
    // 5. Check the current user session
    console.log('\n--- Checking User Session ---');
    
    // Try to get the current user (this might not work without proper auth context)
    try {
      const users = await query('SELECT id, name, email, tenant_id FROM emr.users WHERE is_active = true LIMIT 5');
      console.log('Active users:');
      users.rows.forEach(user => {
        console.log(`  ${user.name} (${user.email}) - tenant_id: ${user.tenant_id}`);
      });
    } catch (err) {
      console.log('Could not check user session');
    }
    
  } catch (error) {
    console.error('Error checking current tenant and saved data:', error.message);
  }
}

checkCurrentTenantAndSavedData().then(() => process.exit(0));
