const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Checking Doctor Menu Access ===');
    
    // Get NHGL tenant info
    const nhglTenant = await query(`
      SELECT id, name, code, schema_name 
      FROM emr.management_tenants 
      WHERE code ILIKE '%nhgl%' OR name ILIKE '%nhgl%'
    `);
    
    if (nhglTenant.rows.length === 0) {
      console.log('NHGL tenant not found');
      process.exit(1);
    }
    
    const tenant = nhglTenant.rows[0];
    console.log(`Tenant: ${tenant.name} (Schema: ${tenant.schema_name})`);
    
    // Check doctor user in NHGL
    const doctorUser = await query(`
      SELECT email, name, role, tenant_id 
      FROM emr.users 
      WHERE email = 'doctor@nhgl.com' AND tenant_id = $1
    `, [tenant.id]);
    
    if (doctorUser.rows.length === 0) {
      console.log('Doctor user not found in global table');
      process.exit(1);
    }
    
    const doctor = doctorUser.rows[0];
    console.log(`Doctor: ${doctor.name} (${doctor.role})`);
    
    // Check menu access for doctor role
    console.log('\n=== Menu Access Check ===');
    
    // Check role_menu_access table
    const menuAccess = await query(`
      SELECT rma.role_name, mi.module_key, mi.display_name, mi.is_active
      FROM emr.role_menu_access rma
      JOIN emr.menu_item mi ON rma.menu_item_id = mi.id
      WHERE rma.role_name = 'doctor'
      ORDER BY mi.display_name
    `);
    
    console.log('Doctor menu access:');
    menuAccess.rows.forEach(access => {
      console.log(`- ${access.display_name} (${access.module_key}) - ${access.is_active ? '✅ Active' : '❌ Inactive'}`);
    });
    
    // Check if emr/clinical encounter modules exist
    console.log('\n=== EMR Module Check ===');
    
    const emrModules = await query(`
      SELECT mi.module_key, mi.display_name, mi.is_active, mi.parent_id
      FROM emr.menu_item mi
      WHERE mi.module_key ILIKE '%emr%' OR mi.display_name ILIKE '%clinical%' OR mi.display_name ILIKE '%encounter%'
      ORDER BY mi.display_name
    `);
    
    console.log('EMR/Clinical modules:');
    emrModules.rows.forEach(module => {
      console.log(`- ${module.display_name} (${module.module_key}) - ${module.is_active ? '✅ Active' : '❌ Inactive'}`);
    });
    
    // Check subscription plans for NHGL
    console.log('\n=== Subscription Plan Check ===');
    
    const subscription = await query(`
      SELECT ts.name, ts.code, ts.is_active
      FROM emr.tenant_subscriptions ts
      JOIN emr.management_tenants mt ON ts.tenant_id = mt.id
      WHERE mt.id = $1
    `, [tenant.id]);
    
    if (subscription.rows.length > 0) {
      const sub = subscription.rows[0];
      console.log(`Subscription: ${sub.name} (${sub.code}) - ${sub.is_active ? '✅ Active' : '❌ Inactive'}`);
      
      // Check plan module access
      const planModules = await query(`
        SELECT mi.module_key, mi.display_name, spma.is_enabled
        FROM emr.subscription_plan_module_access spma
        JOIN emr.menu_item mi ON spma.menu_item_id = mi.id
        JOIN emr.subscription_plans sp ON spma.plan_id = sp.id
        WHERE sp.code = $1
        ORDER BY mi.display_name
      `, [sub.code]);
      
      console.log(`\n${sub.name} module access:`);
      planModules.rows.forEach(module => {
        console.log(`- ${module.display_name} (${module.module_key}) - ${module.is_enabled ? '✅ Enabled' : '❌ Disabled'}`);
      });
    } else {
      console.log('No subscription found for NHGL');
    }
    
    // Check effective accessible modules
    console.log('\n=== Effective Module Calculation ===');
    
    const effectiveModules = await query(`
      SELECT DISTINCT mi.module_key, mi.display_name
      FROM emr.menu_item mi
      JOIN emr.role_menu_access rma ON mi.id = rma.menu_item_id
      LEFT JOIN emr.subscription_plan_module_access spma ON mi.id = spma.menu_item_id
      LEFT JOIN emr.tenant_subscriptions ts ON spma.plan_id = ts.plan_id
      LEFT JOIN emr.management_tenants mt ON ts.tenant_id = mt.id
      WHERE rma.role_name = 'doctor'
      AND mi.is_active = true
      AND (spma.is_enabled = true OR spma.is_enabled IS NULL)
      AND (mt.id = $1 OR spma.is_enabled IS NULL)
      ORDER BY mi.display_name
    `, [tenant.id]);
    
    console.log('Effective accessible modules for doctor:');
    effectiveModules.rows.forEach(module => {
      console.log(`- ${module.display_name} (${module.module_key})`);
    });
    
    console.log('\n=== TROUBLESHOOTING ===');
    if (effectiveModules.rows.length === 0) {
      console.log('❌ No modules accessible - check role_menu_access table');
    }
    
    const hasEmr = effectiveModules.rows.some(m => m.module_key === 'emr');
    if (!hasEmr) {
      console.log('❌ EMR module not accessible - check role_menu_access for doctor');
    }
    
    console.log('\n=== FIX RECOMMENDATIONS ===');
    console.log('1. Ensure doctor role has access to EMR module');
    console.log('2. Check subscription plan includes EMR module');
    console.log('3. Verify menu_item table has EMR module entry');
    console.log('4. Check role_menu_access table for doctor role');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
