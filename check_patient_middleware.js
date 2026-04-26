// Check patient middleware issues
import { query } from './server/db/connection.js';

async function checkPatientMiddleware() {
  console.log('=== CHECKING PATIENT MIDDLEWARE ISSUES ===\n');
  
  try {
    const tenantId = '1b13b360-1f8d-4a10-a2c7-bc10cc4cae37';
    
    // 1. Check if tenant has patients module enabled
    console.log('1. Checking tenant module access:');
    try {
      const moduleResult = await query(`
        SELECT feature_key, enabled 
        FROM nexus.features_tiers 
        WHERE tier_key = 'basic' 
        AND feature_key = 'patients'
        AND enabled = true
      `);
      
      if (moduleResult.rows.length > 0) {
        console.log('✅ Patients module enabled for basic tier');
      } else {
        console.log('❌ Patients module NOT enabled for basic tier');
        console.log('Available features for basic tier:');
        const allFeatures = await query(`
          SELECT feature_key, enabled 
          FROM nexus.features_tiers 
          WHERE tier_key = 'basic' 
          AND enabled = true
        `);
        allFeatures.rows.forEach(row => {
          console.log(`  - ${row.feature_key}`);
        });
      }
    } catch (error) {
      console.log('❌ Module check failed:', error.message);
    }
    
    // 2. Check tenant subscription tier
    console.log('\n2. Checking tenant subscription:');
    try {
      const tierResult = await query(`
        SELECT subscription_tier 
        FROM nexus.tenants 
        WHERE id::text = $1::text
      `, [tenantId]);
      
      if (tierResult.rows.length > 0) {
        console.log('✅ Tenant tier:', tierResult.rows[0].subscription_tier);
      } else {
        console.log('❌ No subscription tier found');
      }
    } catch (error) {
      console.log('❌ Tier check failed:', error.message);
    }
    
    // 3. Check if tenant has proper schema
    console.log('\n3. Checking tenant schema:');
    try {
      const schemaResult = await query(`
        SELECT schema_name 
        FROM nexus.tenants 
        WHERE id::text = $1::text
      `, [tenantId]);
      
      if (schemaResult.rows.length > 0) {
        const schemaName = schemaResult.rows[0].schema_name;
        console.log('✅ Tenant schema:', schemaName);
        
        // Check if schema has patients table
        try {
          const tableCheck = await query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = $1 
              AND table_name = 'patients'
            ) as exists
          `, [schemaName]);
          
          if (tableCheck.rows[0].exists) {
            console.log('✅ Patients table exists in tenant schema');
          } else {
            console.log('❌ Patients table missing in tenant schema');
          }
        } catch (schemaError) {
          console.log('❌ Schema table check failed:', schemaError.message);
        }
      } else {
        console.log('❌ No schema found for tenant');
      }
    } catch (error) {
      console.log('❌ Schema check failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkPatientMiddleware();
