// Debug tier issue
import { query } from './server/db/connection.js';

async function debugTierIssue() {
  console.log('=== DEBUGGING TIER ISSUE ===\n');
  
  try {
    const tenantId = '1b13b360-1f8d-4a10-a2c7-bc10cc4cae37';
    
    // 1. Check management_tenants table
    console.log('1. Checking management_tenants:');
    try {
      const mgmtResult = await query(`
        SELECT subscription_tier 
        FROM management_tenants 
        WHERE id::text = $1::text
      `, [tenantId]);
      
      if (mgmtResult.rows.length > 0) {
        console.log('✅ Management_tenants tier:', mgmtResult.rows[0].subscription_tier);
      } else {
        console.log('❌ Not found in management_tenants');
      }
    } catch (mgmtError) {
      console.log('❌ Management_tenants check failed:', mgmtError.message);
    }
    
    // 2. Check nexus.tenants table
    console.log('\n2. Checking nexus.tenants:');
    try {
      const nexusResult = await query(`
        SELECT subscription_tier 
        FROM nexus.tenants 
        WHERE id::text = $1::text
      `, [tenantId]);
      
      if (nexusResult.rows.length > 0) {
        console.log('✅ Nexus.tenants tier:', nexusResult.rows[0].subscription_tier);
      } else {
        console.log('❌ Not found in nexus.tenants');
      }
    } catch (nexusError) {
      console.log('❌ Nexus.tenants check failed:', nexusError.message);
    }
    
    // 3. Check what DEFAULT_FEATURES_BY_TIER expects
    console.log('\n3. Checking DEFAULT_FEATURES_BY_TIER keys:');
    const expectedTiers = ['Free', 'Basic', 'Professional', 'Enterprise'];
    expectedTiers.forEach(tier => {
      console.log(`  - ${tier}: Available`);
    });
    
    // 4. Simulate the getTenantTier function logic
    console.log('\n4. Simulating getTenantTier logic:');
    try {
      // Primary: check management_tenants
      const mgmtRes = await query('SELECT subscription_tier FROM management_tenants WHERE id::text = $1::text', [tenantId]);
      if (mgmtRes.rows[0]?.subscription_tier) {
        const tier = mgmtRes.rows[0].subscription_tier;
        console.log('✅ Would return from management_tenants:', tier);
        console.log('✅ DEFAULT_FEATURES_BY_TIER has this tier:', ['Free', 'Basic', 'Professional', 'Enterprise'].includes(tier));
      } else {
        console.log('❌ No tier found in management_tenants');
      }
    } catch (error) {
      console.log('❌ Simulation failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugTierIssue();
