// Trace the exact feature flag issue
import { query } from './server/db/connection.js';

async function traceFeatureFlagIssue() {
  console.log('=== TRACING FEATURE FLAG ISSUE ===\n');
  
  try {
    const tenantId = '1b13b360-1f8d-4a10-a2c7-bc10cc4cae37';
    const flag = 'core-engine-access';
    
    // Step 1: Check global kill switches
    console.log('1. Checking global kill switches:');
    try {
      const killSwitchesResult = await query(`
        SELECT feature_flag, enabled 
        FROM global_kill_switches 
        WHERE enabled = true
      `);
      
      console.log('✅ Active kill switches:', killSwitchesResult.rows);
      const hasKillSwitch = killSwitchesResult.rows.some(row => row.feature_flag === flag);
      console.log('✅ Kill switch for', flag, ':', hasKillSwitch ? 'ACTIVE' : 'INACTIVE');
      
    } catch (error) {
      console.log('❌ Kill switch check failed:', error.message);
    }
    
    // Step 2: Get tenant tier
    console.log('\n2. Getting tenant tier:');
    try {
      const tierResult = await query(`
        SELECT subscription_tier 
        FROM management_tenants 
        WHERE id::text = $1::text
      `, [tenantId]);
      
      const tier = tierResult.rows[0]?.subscription_tier;
      console.log('✅ Tenant tier:', tier);
      
      // Step 3: Get default features for tier
      console.log('\n3. Getting default features for tier:');
      const defaultFeaturesByTier = {
        'Free': ['core-engine-access'],
        'Basic': ['core-engine-access', 'pharmacy-lab-access', 'customer-support-access'],
        'Professional': ['core-engine-access', 'pharmacy-lab-access', 'customer-support-access', 'inpatient-access', 'accounts-access'],
        'Enterprise': ['core-engine-access', 'pharmacy-lab-access', 'customer-support-access', 'inpatient-access', 'accounts-access', 'hr-payroll-access']
      };
      
      const defaultFeatures = defaultFeaturesByTier[tier] || [];
      console.log('✅ Default features for', tier, ':', defaultFeatures);
      console.log('✅ Flag', flag, 'in defaults:', defaultFeatures.includes(flag));
      
      // Step 4: Get custom features
      console.log('\n4. Getting custom features:');
      try {
        const customFeaturesResult = await query(`
          SELECT feature_flag, enabled 
          FROM tenant_features 
          WHERE tenant_id::uuid = $1::uuid
        `, [tenantId]);
        
        console.log('✅ Custom features:', customFeaturesResult.rows);
        
        // Step 5: Combine features
        console.log('\n5. Combining features:');
        const enabled = new Set(defaultFeatures);
        customFeaturesResult.rows.forEach(({ feature_flag, enabled: isEnabled }) => {
          if (isEnabled) {
            enabled.add(feature_flag);
            console.log('✅ Added custom feature:', feature_flag);
          } else {
            enabled.delete(feature_flag);
            console.log('❌ Removed custom feature:', feature_flag);
          }
        });
        
        console.log('✅ Final enabled features:', Array.from(enabled));
        console.log('✅ Flag', flag, 'in final set:', enabled.has(flag));
        
      } catch (customError) {
        console.log('❌ Custom features check failed:', customError.message);
      }
      
    } catch (tierError) {
      console.log('❌ Tier check failed:', tierError.message);
    }
    
  } catch (error) {
    console.error('❌ Trace failed:', error.message);
  }
}

traceFeatureFlagIssue();
