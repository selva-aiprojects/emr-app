const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Fixing Doctor Menu Access (Corrected) ===');
    
    // Check existing menu items
    console.log('\n=== Existing Menu Items ===');
    const menuItems = await query(`
      SELECT id, name, code, is_active, route
      FROM emr.menu_item 
      ORDER BY name
    `);
    
    console.log('Available menu items:');
    menuItems.rows.forEach(item => {
      console.log(`- ${item.name} (${item.code}) - Route: ${item.route} - ${item.is_active ? '✅' : '❌'}`);
    });
    
    // Check if EMR/Clinical Encounter exists
    const emrItem = menuItems.rows.find(item => 
      item.code === 'emr' || 
      item.route === '/emr' ||
      item.name.toLowerCase().includes('clinical') || 
      item.name.toLowerCase().includes('encounter')
    );
    
    if (!emrItem) {
      console.log('\n=== Creating EMR Menu Item ===');
      
      // Create EMR menu item
      const emrResult = await query(`
        INSERT INTO emr.menu_item (name, code, route, is_active, created_at, updated_at)
        VALUES ('Clinical EMR', 'emr', '/emr', true, NOW(), NOW())
        RETURNING id, name, code, route
      `);
      
      const newEmrItem = emrResult.rows[0];
      console.log(`✅ Created EMR menu item: ${newEmrItem.name} (${newEmrItem.code})`);
    } else {
      console.log(`\n✅ EMR menu item exists: ${emrItem.name} (${emrItem.code})`);
    }
    
    // Get EMR menu item ID
    const emrMenuItem = await query(`
      SELECT id, name, code, route
      FROM emr.menu_item 
      WHERE code = 'emr' OR route = '/emr' OR name ILIKE '%emr%'
      LIMIT 1
    `);
    
    if (emrMenuItem.rows.length === 0) {
      console.log('❌ EMR menu item not found after creation');
      process.exit(1);
    }
    
    const emrMenuItemData = emrMenuItem.rows[0];
    console.log(`\n=== Granting Doctor Access to EMR ===`);
    console.log(`EMR Menu Item: ${emrMenuItemData.name} (ID: ${emrMenuItemData.id})`);
    
    // Check role_menu_access structure
    console.log('\n=== Role Menu Access Structure ===');
    const roleAccessStructure = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'role_menu_access' 
      AND table_schema = 'emr'
      ORDER BY ordinal_position
    `);
    
    console.log('role_menu_access columns:');
    roleAccessStructure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    // Grant doctor access to EMR
    try {
      await query(`
        INSERT INTO emr.role_menu_access (role_name, menu_item_id, created_at, updated_at)
        VALUES ('doctor', $1, NOW(), NOW())
        ON CONFLICT (role_name, menu_item_id) DO UPDATE SET
          updated_at = NOW()
      `, [emrMenuItemData.id]);
      
      console.log('✅ Granted doctor access to EMR module');
    } catch (error) {
      console.log(`⚠️  Failed to grant access: ${error.message}`);
    }
    
    // Check all doctor menu access
    console.log('\n=== Current Doctor Menu Access ===');
    const doctorAccess = await query(`
      SELECT rma.role_name, mi.name, mi.code, mi.route, mi.is_active
      FROM emr.role_menu_access rma
      JOIN emr.menu_item mi ON rma.menu_item_id = mi.id
      WHERE rma.role_name = 'doctor'
      ORDER BY mi.name
    `);
    
    console.log('Doctor accessible modules:');
    doctorAccess.rows.forEach(access => {
      console.log(`- ${access.name} (${access.code}) - Route: ${access.route} - ${access.is_active ? '✅' : '❌'}`);
    });
    
    // Check if doctor has EMR access
    const hasEmrAccess = doctorAccess.rows.some(access => access.code === 'emr');
    
    if (!hasEmrAccess) {
      console.log('\n=== Manual EMR Access Fix ===');
      
      // Try to insert directly
      try {
        await query(`
          INSERT INTO emr.role_menu_access (role_name, menu_item_id, created_at, updated_at)
          VALUES ('doctor', $1, NOW(), NOW())
        `, [emrMenuItemData.id]);
        
        console.log('✅ Manually granted EMR access to doctor');
      } catch (error) {
        console.log(`❌ Manual insert failed: ${error.message}`);
        
        // Try to update existing
        try {
          await query(`
            UPDATE emr.role_menu_access 
            SET menu_item_id = $1, updated_at = NOW()
            WHERE role_name = 'doctor' AND menu_item_id IS NULL
          `, [emrItem.id]);
          
          console.log('✅ Updated existing doctor access with EMR');
        } catch (updateError) {
          console.log(`❌ Update failed: ${updateError.message}`);
        }
      }
    }
    
    // Check subscription plans
    console.log('\n=== Subscription Plans ===');
    const plans = await query(`
      SELECT id, name, code, is_active
      FROM emr.subscription_plans
      ORDER BY name
    `);
    
    console.log('Available plans:');
    plans.rows.forEach(plan => {
      console.log(`- ${plan.name} (${plan.code}) - ${plan.is_active ? '✅' : '❌'}`);
    });
    
    // Enable EMR in all plans
    console.log('\n=== Enabling EMR in All Plans ===');
    for (const plan of plans.rows) {
      try {
        await query(`
          INSERT INTO emr.subscription_plan_module_access (plan_id, menu_item_id, is_enabled, created_at, updated_at)
          VALUES ($1, $2, true, NOW(), NOW())
          ON CONFLICT (plan_id, menu_item_id) DO UPDATE SET
            is_enabled = true,
            updated_at = NOW()
        `, [plan.id, emrMenuItemData.id]);
        
        console.log(`✅ Enabled EMR in ${plan.name} plan`);
      } catch (error) {
        console.log(`⚠️  Failed to enable EMR in ${plan.name}: ${error.message}`);
      }
    }
    
    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    
    const finalAccess = await query(`
      SELECT mi.name, mi.code, mi.route
      FROM emr.menu_item mi
      JOIN emr.role_menu_access rma ON mi.id = rma.menu_item_id
      WHERE rma.role_name = 'doctor' AND mi.is_active = true
      ORDER BY mi.name
    `);
    
    console.log('Final doctor accessible modules:');
    finalAccess.rows.forEach(access => {
      console.log(`- ${access.name} (${access.code}) - ${access.route}`);
    });
    
    const hasEmr = finalAccess.rows.some(m => m.code === 'emr');
    
    if (hasEmr) {
      console.log('\n✅ SUCCESS: Doctor now has access to EMR/Clinical Encounter module');
      console.log('\n=== NEXT STEPS ===');
      console.log('1. Restart the server to reload menu configuration');
      console.log('2. Clear browser cache (Ctrl+F5)');
      console.log('3. Login as doctor@nhgl.com');
      console.log('4. Check sidebar for "Clinical EMR" module');
      console.log('5. Click on it to access the clinical workflow');
    } else {
      console.log('\n❌ ISSUE: EMR module still not accessible');
      console.log('Manual database intervention may be required');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
