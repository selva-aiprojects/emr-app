const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Checking Tenant Metrics Triggers ===');
    
    // Check if the refresh function exists
    const functionCheck = await query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_schema = 'emr' 
      AND (routine_name ILIKE '%refresh%' OR routine_name ILIKE '%metrics%' OR routine_name ILIKE '%tenant%')
    `);
    
    console.log('Found functions:');
    functionCheck.rows.forEach(f => {
      console.log(`- ${f.routine_name} (${f.routine_type})`);
    });
    
    // Check if management_tenant_metrics table has triggers
    const triggerCheck = await query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_timing
      FROM information_schema.triggers
      WHERE trigger_schema = 'emr'
      AND event_object_table = 'management_tenant_metrics'
    `);
    
    console.log('\nFound triggers on management_tenant_metrics:');
    triggerCheck.rows.forEach(t => {
      console.log(`- ${t.trigger_name}: ${t.event_manipulation} ${t.action_timing}`);
    });
    
    // Check if NHSL and Starlight have metrics sync functions
    console.log('\n=== Checking Tenant-Specific Functions ===');
    const nhslCheck = await query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'nhsl' 
      AND (routine_name ILIKE '%metrics%' OR routine_name ILIKE '%sync%')
    `);
    
    console.log('NHSL functions:');
    nhslCheck.rows.forEach(f => {
      console.log(`- ${f.routine_name}`);
    });
    
    const smcmegaCheck = await query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'smcmega' 
      AND (routine_name ILIKE '%metrics%' OR routine_name ILIKE '%sync%')
    `);
    
    console.log('\nStarlight (SMCMega) functions:');
    smcmegaCheck.rows.forEach(f => {
      console.log(`- ${f.routine_name}`);
    });
    
    // Try to manually trigger the refresh function
    console.log('\n=== Testing Manual Refresh ===');
    try {
      const refreshResult = await query('SELECT emr.refresh_all_management_tenant_metrics()');
      console.log('Manual refresh result:', refreshResult.rows);
    } catch (e) {
      console.log('Manual refresh failed:', e.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
