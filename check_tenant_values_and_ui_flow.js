import { query } from './server/db/connection.js';

async function checkTenantValuesAndUIFlow() {
  try {
    console.log('=== Checking Tenant Values and UI Flow ===');
    
    // 1. Get a test tenant
    const tenant = await query('SELECT id, name, code FROM emr.management_tenants LIMIT 1');
    if (tenant.rows.length === 0) {
      console.log('No tenants found');
      return;
    }
    
    const testTenant = tenant.rows[0];
    console.log(`Checking tenant: ${testTenant.name} (${testTenant.id})`);
    
    // 2. Check NEXUS (management_tenants) table values
    console.log('\n--- NEXUS (management_tenants) Table ---');
    const nexusData = await query(`
      SELECT id, name, logo_url, theme, features, billing_config, updated_at 
      FROM emr.management_tenants 
      WHERE id::text = $1::text
    `, [testTenant.id]);
    
    if (nexusData.rows.length > 0) {
      const data = nexusData.rows[0];
      console.log('NEXUS Data:');
      console.log(`  name: ${data.name}`);
      console.log(`  logo_url: ${data.logo_url}`);
      console.log(`  theme: ${JSON.stringify(data.theme)}`);
      console.log(`  features: ${JSON.stringify(data.features)}`);
      console.log(`  billing_config: ${JSON.stringify(data.billing_config)}`);
      console.log(`  updated_at: ${data.updated_at}`);
    }
    
    // 3. Check SHARD (tenants) table values
    console.log('\n--- SHARD (tenants) Table ---');
    const shardData = await query(`
      SELECT id, name, logo_url, theme, features, billing_config, updated_at 
      FROM emr.tenants 
      WHERE id::text = $1::text
    `, [testTenant.id]);
    
    if (shardData.rows.length > 0) {
      const data = shardData.rows[0];
      console.log('SHARD Data:');
      console.log(`  name: ${data.name}`);
      console.log(`  logo_url: ${data.logo_url}`);
      console.log(`  theme: ${JSON.stringify(data.theme)}`);
      console.log(`  features: ${JSON.stringify(data.features)}`);
      console.log(`  billing_config: ${JSON.stringify(data.billing_config)}`);
      console.log(`  updated_at: ${data.updated_at}`);
    }
    
    // 4. Check if there are any differences
    console.log('\n--- Data Consistency Check ---');
    if (nexusData.rows.length > 0 && shardData.rows.length > 0) {
      const nexus = nexusData.rows[0];
      const shard = shardData.rows[0];
      
      let isConsistent = true;
      
      if (nexus.name !== shard.name) {
        console.log('NAME MISMATCH');
        isConsistent = false;
      }
      if (nexus.logo_url !== shard.logo_url) {
        console.log('LOGO_URL MISMATCH');
        isConsistent = false;
      }
      if (JSON.stringify(nexus.theme) !== JSON.stringify(shard.theme)) {
        console.log('THEME MISMATCH');
        isConsistent = false;
      }
      if (JSON.stringify(nexus.features) !== JSON.stringify(shard.features)) {
        console.log('FEATURES MISMATCH');
        isConsistent = false;
      }
      if (JSON.stringify(nexus.billing_config) !== JSON.stringify(shard.billing_config)) {
        console.log('BILLING_CONFIG MISMATCH');
        isConsistent = false;
      }
      
      if (isConsistent) {
        console.log('Tables are CONSISTENT');
      } else {
        console.log('Tables are INCONSISTENT - this could cause UI issues');
      }
    }
    
    // 5. Check what the login API returns
    console.log('\n--- Login API Data Flow ---');
    
    // Simulate the login API endpoint that returns tenant data
    const loginResponse = await query(`
      SELECT id, name, code, subdomain, status, subscription_tier, logo_url, theme, features, billing_config 
      FROM emr.tenants 
      WHERE id::text = $1::text
    `, [testTenant.id]);
    
    if (loginResponse.rows.length > 0) {
      const data = loginResponse.rows[0];
      console.log('Login API returns (from emr.tenants):');
      console.log(`  name: ${data.name}`);
      console.log(`  logo_url: ${data.logo_url}`);
      console.log(`  theme: ${JSON.stringify(data.theme)}`);
      console.log(`  features: ${JSON.stringify(data.features)}`);
      console.log(`  billing_config: ${JSON.stringify(data.billing_config)}`);
    }
    
    // 6. Check what the frontend expects vs what it gets
    console.log('\n--- Frontend Data Expectation ---');
    
    // This is what the frontend expects in the tenant prop
    const expectedFrontendData = {
      name: testTenant.name,
      logo_url: nexusData.rows[0]?.logo_url || null,
      theme: nexusData.rows[0]?.theme || {},
      features: nexusData.rows[0]?.features || {},
      billingConfig: nexusData.rows[0]?.billing_config || {}
    };
    
    console.log('Frontend expects:');
    console.log(JSON.stringify(expectedFrontendData, null, 2));
    
    const actualFrontendData = loginResponse.rows[0];
    console.log('Frontend actually gets:');
    console.log(JSON.stringify(actualFrontendData, null, 2));
    
    // 7. Check if there's a mismatch
    console.log('\n--- Frontend Data Mismatch Check ---');
    
    if (JSON.stringify(expectedFrontendData.theme) !== JSON.stringify(actualFrontendData.theme)) {
      console.log('THEME DATA MISMATCH - UI will show old theme');
    }
    if (JSON.stringify(expectedFrontendData.features) !== JSON.stringify(actualFrontendData.features)) {
      console.log('FEATURES DATA MISMATCH - UI will show old features');
    }
    if (JSON.stringify(expectedFrontendData.billingConfig) !== JSON.stringify(actualFrontendData.billing_config)) {
      console.log('BILLING_CONFIG DATA MISMATCH - UI will show old billing config');
    }
    
    // 8. Check the actual API endpoint that the frontend calls
    console.log('\n--- Testing Actual API Endpoint ---');
    
    // This simulates what the frontend calls: GET /api/tenants
    const apiEndpointData = await query(`
      SELECT id, name, code, subdomain, status, subscription_tier, logo_url, theme, features, billing_config 
      FROM emr.tenants 
      ORDER BY name
      LIMIT 1
    `);
    
    if (apiEndpointData.rows.length > 0) {
      const data = apiEndpointData.rows[0];
      console.log('API Endpoint /api/tenants returns:');
      console.log(`  name: ${data.name}`);
      console.log(`  logo_url: ${data.logo_url}`);
      console.log(`  theme: ${JSON.stringify(data.theme)}`);
      console.log(`  features: ${JSON.stringify(data.features)}`);
      console.log(`  billing_config: ${JSON.stringify(data.billing_config)}`);
    }
    
    // 9. Check if the issue is in the frontend initialization
    console.log('\n--- Frontend Initialization Check ---');
    
    // This is what the frontend useEffect does
    const frontendInitialization = {
      displayName: actualFrontendData?.name || '',
      primaryColor: actualFrontendData?.theme?.primary || '#0f5a6e',
      accentColor: actualFrontendData?.theme?.accent || '#f57f17',
      heroColor: actualFrontendData?.theme?.hero || '#1e293b',
      textColor: actualFrontendData?.theme?.text || '#334155',
      logo_url: actualFrontendData?.logo_url || '',
      features: {
        inventory: actualFrontendData?.features?.inventory ?? true,
        telehealth: actualFrontendData?.features?.telehealth ?? false,
        payroll: actualFrontendData?.features?.payroll ?? true,
        staff_governance: actualFrontendData?.features?.staff_governance ?? true,
        institutional_ledger: actualFrontendData?.features?.institutional_ledger ?? true
      },
      billingConfig: {
        provider: actualFrontendData?.billing_config?.provider || 'Stripe',
        currency: actualFrontendData?.billing_config?.currency || 'INR',
        gatewayKey: actualFrontendData?.billing_config?.gatewayKey || '',
        accountStatus: actualFrontendData?.billing_config?.accountStatus || 'unlinked'
      }
    };
    
    console.log('Frontend form initialization:');
    console.log(JSON.stringify(frontendInitialization, null, 2));
    
    // 10. Final diagnosis
    console.log('\n--- DIAGNOSIS ---');
    
    const nexusTheme = nexusData.rows[0]?.theme || {};
    const shardTheme = shardData.rows[0]?.theme || {};
    const loginTheme = actualFrontendData?.theme || {};
    
    console.log('Theme comparison:');
    console.log(`  NEXUS (management_tenants): ${JSON.stringify(nexusTheme)}`);
    console.log(`  SHARD (tenants): ${JSON.stringify(shardTheme)}`);
    console.log(`  Login API returns: ${JSON.stringify(loginTheme)}`);
    
    if (JSON.stringify(nexusTheme) !== JSON.stringify(shardTheme)) {
      console.log('DIAGNOSIS: Tables are out of sync - need to synchronize');
    } else if (JSON.stringify(nexusTheme) !== JSON.stringify(loginTheme)) {
      console.log('DIAGNOSIS: Login API is returning old data - need to check API endpoint');
    } else {
      console.log('DIAGNOSIS: Data is consistent in all places - issue might be in frontend state management');
    }
    
  } catch (error) {
    console.error('Error checking tenant values and UI flow:', error.message);
  }
}

checkTenantValuesAndUIFlow().then(() => process.exit(0));
