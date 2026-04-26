// Check if standard tier exists in features_tiers
import { query } from './server/db/connection.js';

async function checkStandardTier() {
  try {
    const result = await query('SELECT tier_key FROM nexus.features_tiers WHERE tier_key = \'standard\'');
    console.log('Standard tier in features_tiers:', result.rows.length > 0 ? 'YES' : 'NO');
    if (result.rows.length > 0) {
      console.log('Rows:', result.rows);
    }
    
    // Check all tier keys
    const allTiers = await query('SELECT DISTINCT tier_key FROM nexus.features_tiers WHERE enabled = true');
    console.log('All available tiers:', allTiers.rows.map(r => r.tier_key));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStandardTier();
