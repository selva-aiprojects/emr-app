// Fix patient module access properly
import { query } from './server/db/connection.js';

async function fixPatientModuleProperly() {
  console.log('=== FIXING PATIENT MODULE ACCESS PROPERLY ===\n');
  
  try {
    // 1. Add patients module to all tiers that should have it
    console.log('1. Adding patients module to appropriate tiers:');
    
    const tiers = [
      { tier: 'basic', label: 'Basic' },
      { tier: 'professional', label: 'Professional' },
      { tier: 'enterprise', label: 'Enterprise' }
    ];
    
    for (const tierInfo of tiers) {
      try {
        await query(`
          INSERT INTO nexus.features_tiers (tier_key, tier_label, feature_key, feature_name, module_keys, enabled, source_order)
          VALUES ($1, $2, 'patients', 'Patient Management', '["patients"]', true, 100)
          ON CONFLICT (tier_key, feature_key) 
          DO UPDATE SET 
            feature_name = 'Patient Management',
            module_keys = '["patients"]',
            enabled = true,
            updated_at = now()
        `, [tierInfo.tier, tierInfo.label]);
        
        console.log(`✅ Added patients module to ${tierInfo.tier} tier`);
      } catch (error) {
        console.log(`❌ Failed to add patients to ${tierInfo.tier}:`, error.message);
      }
    }
    
    // 2. Verify the fix
    console.log('\n2. Verifying the fix:');
    try {
      const verifyResult = await query(`
        SELECT tier_key, feature_key, feature_name, enabled 
        FROM nexus.features_tiers 
        WHERE feature_key = 'patients'
        ORDER BY tier_key
      `);
      
      console.log('Patients module status:');
      verifyResult.rows.forEach(row => {
        console.log(`  ${row.tier_key}: ${row.enabled ? '✅ Enabled' : '❌ Disabled'} (${row.feature_name})`);
      });
    } catch (error) {
      console.log('❌ Verification failed:', error.message);
    }
    
    // 3. Check if the middleware will now work
    console.log('\n3. Testing middleware logic:');
    try {
      const testResult = await query(`
        SELECT tier_key, feature_key, enabled 
        FROM nexus.features_tiers 
        WHERE tier_key = 'professional' 
        AND feature_key = 'patients' 
        AND enabled = true
      `);
      
      if (testResult.rows.length > 0) {
        console.log('✅ Professional tier has patients module enabled - middleware should pass');
      } else {
        console.log('❌ Professional tier still missing patients module');
      }
    } catch (error) {
      console.log('❌ Middleware test failed:', error.message);
    }
    
    console.log('\n✅ Patient module fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixPatientModuleProperly();
