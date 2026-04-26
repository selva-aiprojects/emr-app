// Check features_tiers table structure
import { query } from './server/db/connection.js';

async function checkFeaturesTiersStructure() {
  console.log('=== CHECKING FEATURES_TIERS STRUCTURE ===\n');
  
  try {
    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'features_tiers' 
      AND table_schema = 'nexus'
      ORDER BY ordinal_position
    `);
    
    console.log('features_tiers table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check existing data
    console.log('\nExisting data sample:');
    const sampleResult = await query(`
      SELECT * 
      FROM nexus.features_tiers 
      WHERE tier_key = 'basic' 
      LIMIT 3
    `);
    
    sampleResult.rows.forEach(row => {
      console.log(`  ${row.tier_key}: ${row.feature_key} -> ${row.feature_name}`);
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkFeaturesTiersStructure();
