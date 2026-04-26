// Debug script to check subscription catalog data
import { query } from './server/db/connection.js';
import { getSubscriptionCatalog, ALL_MODULES } from './server/db/subscriptionCatalog.service.js';

async function debugSubscriptions() {
  console.log('=== DEBUGGING SUBSCRIPTION CATALOG ===\n');
  
  try {
    // Check database directly
    console.log('1. Database Query Results:');
    const dbResult = await query(`
      SELECT plan_id, name, cost, period, color, 
             jsonb_pretty(features) as features,
             jsonb_pretty(module_keys) as modules
      FROM nexus.subscription_catalog 
      ORDER BY 
        CASE plan_id
          WHEN 'free' THEN 0
          WHEN 'basic' THEN 1
          WHEN 'standard' THEN 2
          WHEN 'professional' THEN 3
          WHEN 'enterprise' THEN 4
          ELSE 5
        END
    `);
    
    console.log('Database Records:');
    dbResult.rows.forEach(row => {
      console.log(`  ${row.plan_id}: ${row.name} - $${row.cost}/${row.period}`);
      console.log(`    Features: ${row.features}`);
      console.log(`    Modules: ${row.modules}`);
      console.log('');
    });
    
    // Check service function
    console.log('2. Service Function Results:');
    const catalog = await getSubscriptionCatalog();
    console.log('Service Catalog:');
    catalog.forEach(plan => {
      console.log(`  ${plan.id}: ${plan.name} - $${plan.cost}/${plan.period}`);
      console.log(`    Features: ${JSON.stringify(plan.features)}`);
      console.log(`    Modules: ${JSON.stringify(plan.moduleKeys)}`);
      console.log('');
    });
    
    // Check modules
    console.log('3. Available Modules:');
    console.log(ALL_MODULES);
    
  } catch (error) {
    console.error('Debug Error:', error);
  }
}

debugSubscriptions();
