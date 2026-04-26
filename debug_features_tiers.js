// Debug script to check features_tiers data
import { query } from './server/db/connection.js';

async function debugFeaturesTiers() {
  console.log('=== DEBUGGING FEATURES TIERS ===\n');
  
  try {
    // Check features_tiers table
    console.log('1. Features Tiers Table:');
    const result = await query(`
      SELECT tier_key, feature_key, module_keys, enabled
      FROM nexus.features_tiers 
      WHERE enabled = true
      ORDER BY tier_key, feature_key
      LIMIT 50
    `);
    
    console.log('Features Tiers Records:');
    result.rows.forEach(row => {
      console.log(`  ${row.tier_key}: ${row.feature_key} - ${row.enabled ? 'Enabled' : 'Disabled'}`);
      if (row.module_keys) {
        console.log(`    Modules: ${row.module_keys}`);
      }
    });
    
    // Check unique tier keys
    console.log('\n2. Unique Tier Keys:');
    const tierResult = await query(`
      SELECT DISTINCT tier_key, COUNT(*) as feature_count
      FROM nexus.features_tiers 
      WHERE enabled = true
      GROUP BY tier_key
      ORDER BY tier_key
    `);
    
    tierResult.rows.forEach(row => {
      console.log(`  ${row.tier_key}: ${row.feature_count} features`);
    });
    
  } catch (error) {
    console.error('Debug Error:', error);
  }
}

debugFeaturesTiers();
