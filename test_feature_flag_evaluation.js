// Test feature flag evaluation for patients module
import { query } from './server/db/connection.js';

async function testFeatureFlagEvaluation() {
  console.log('=== TESTING FEATURE FLAG EVALUATION ===\n');
  
  try {
    const tenantId = '1b13b360-1f8d-4a10-a2c7-bc10cc4cae37';
    
    // 1. Test the exact feature flag evaluation
    console.log('1. Testing feature flag evaluation:');
    try {
      const { evaluateFeatureFlag } = await import('./server/services/featureFlag.service.js');
      const hasCoreEngineAccess = await evaluateFeatureFlag(tenantId, 'core-engine-access');
      console.log('✅ Core engine access:', hasCoreEngineAccess);
      
    } catch (flagError) {
      console.log('❌ Feature flag evaluation failed:', flagError.message);
      console.log('Stack:', flagError.stack);
    }
    
    // 2. Test module accessibility
    console.log('\n2. Testing module accessibility:');
    try {
      const { isModuleAccessible } = await import('./server/services/featureFlag.service.js');
      const hasPatientsAccess = await isModuleAccessible(tenantId, 'patients');
      console.log('✅ Patients module access:', hasPatientsAccess);
      
    } catch (moduleError) {
      console.log('❌ Module accessibility test failed:', moduleError.message);
      console.log('Stack:', moduleError.stack);
    }
    
    // 3. Check tenant tier and expected features
    console.log('\n3. Checking tenant tier and expected features:');
    try {
      const { getTenantTier } = await import('./server/services/tenant.service.js');
      const tier = await getTenantTier(tenantId);
      console.log('✅ Tenant tier:', tier);
      
      // Expected features for this tier
      const expectedFeatures = {
        'Free': ['core-engine-access'],
        'Basic': ['core-engine-access', 'pharmacy-lab-access', 'customer-support-access'],
        'Professional': ['core-engine-access', 'pharmacy-lab-access', 'customer-support-access', 'inpatient-access', 'accounts-access'],
        'Enterprise': ['core-engine-access', 'pharmacy-lab-access', 'customer-support-access', 'inpatient-access', 'accounts-access', 'hr-payroll-access']
      };
      
      console.log('✅ Expected features for', tier, ':', expectedFeatures[tier]);
      
    } catch (tierError) {
      console.log('❌ Tier check failed:', tierError.message);
    }
    
    // 4. Check if there are any global kill switches
    console.log('\n4. Checking global kill switches:');
    try {
      const { getGlobalKillSwitches } = await import('./server/services/featureFlag.service.js');
      const killSwitches = await getGlobalKillSwitches();
      console.log('✅ Global kill switches:', killSwitches);
      
      if (killSwitches['core-engine-access']) {
        console.log('❌ Core engine access is disabled by global kill switch');
      } else {
        console.log('✅ Core engine access is NOT disabled by global kill switch');
      }
      
    } catch (killSwitchError) {
      console.log('❌ Kill switch check failed:', killSwitchError.message);
    }
    
    // 5. Check custom tenant features
    console.log('\n5. Checking custom tenant features:');
    try {
      const result = await query(`
        SELECT feature_flag, enabled 
        FROM tenant_features 
        WHERE tenant_id::text = $1::text
      `, [tenantId]);
      
      if (result.rows.length > 0) {
        console.log('✅ Custom tenant features:');
        result.rows.forEach(row => {
          console.log(`  - ${row.feature_flag}: ${row.enabled ? 'ENABLED' : 'DISABLED'}`);
        });
      } else {
        console.log('✅ No custom tenant features (using defaults)');
      }
      
    } catch (customError) {
      console.log('❌ Custom features check failed:', customError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFeatureFlagEvaluation();
