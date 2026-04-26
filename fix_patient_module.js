// Fix patient module access
import { query } from './server/db/connection.js';

async function fixPatientModule() {
  console.log('=== FIXING PATIENT MODULE ACCESS ===\n');
  
  try {
    // 1. Add patients module to all tiers that should have it
    console.log('1. Adding patients module to appropriate tiers:');
    
    const tiers = ['basic', 'professional', 'enterprise'];
    
    for (const tier of tiers) {
      try {
        await query(`
          INSERT INTO nexus.features_tiers (tier_key, feature_key, module_keys, enabled)
          VALUES ($1, 'patients', '["patients"]', true)
          ON CONFLICT (tier_key, feature_key) 
          DO UPDATE SET 
            module_keys = '["patients"]',
            enabled = true
        `, [tier]);
        
        console.log(`✅ Added patients module to ${tier} tier`);
      } catch (error) {
        console.log(`❌ Failed to add patients to ${tier}:`, error.message);
      }
    }
    
    // 2. Verify the fix
    console.log('\n2. Verifying the fix:');
    try {
      const verifyResult = await query(`
        SELECT tier_key, feature_key, enabled 
        FROM nexus.features_tiers 
        WHERE feature_key = 'patients'
        ORDER BY tier_key
      `);
      
      console.log('Patients module status:');
      verifyResult.rows.forEach(row => {
        console.log(`  ${row.tier_key}: ${row.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      });
    } catch (error) {
      console.log('❌ Verification failed:', error.message);
    }
    
    console.log('\n✅ Patient module fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixPatientModule();
