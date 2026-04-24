const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Fixing Doctor Menu Access ===');
    
    // Check menu_item table structure
    console.log('\n=== Menu Item Table Structure ===');
    const menuStructure = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'menu_item' 
      AND table_schema = 'emr'
      ORDER BY ordinal_position
    `);
    
    console.log('menu_item columns:');
    menuStructure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    // Check existing menu items
    console.log('\n=== Existing Menu Items ===');
    const menuItems = await query(`
      SELECT id, name, key, is_active, parent_id
      FROM emr.menu_item 
      ORDER BY name
    `);
    
    console.log('Available menu items:');
    menuItems.rows.forEach(item => {
      console.log(`- ${item.name} (${item.key}) - ${item.is_active ? '✅' : '❌'}`);
    });
    
    // Check if EMR/Clinical Encounter exists
    const emrItem = menuItems.rows.find(item => 
      item.key === 'emr' || 
      item.name.toLowerCase().includes('clinical') || 
      item.name.toLowerCase().includes('encounter')
    );
    
    if (!emrItem) {
      console.log('\n=== Creating EMR Menu Item ===');
      
      // Create EMR menu item
      const emrResult = await query(`
        INSERT INTO emr.menu_item (name, key, is_active, created_at, updated_at)
        VALUES ('Clinical EMR', 'emr', true, NOW(), NOW())
        RETURNING id, name, key
      `);
      
      const newEmrItem = emrResult.rows[0];
      console.log(`✅ Created EMR menu item: ${newEmrItem.name} (${newEmrItem.key})`);
      
      // Create sub-items for EMR
      const subItems = [
        { name: 'Clinical Encounters', key: 'clinical_encounters' },
        { name: 'New Encounter', key: 'new_encounter' },
        { name: 'Encounter List', key: 'encounter_list' },
        { name: 'Patient Details', key: 'patient_details' }
      ];
      
      for (const subItem of subItems) {
        try {
          await query(`
            INSERT INTO emr.menu_item (name, key, is_active, parent_id, created_at, updated_at)
            VALUES ($1, $2, true, $3, NOW(), NOW())
            ON CONFLICT (key) DO NOTHING
          `, [subItem.name, subItem.key, newEmrItem.id]);
          
          console.log(`✅ Created sub-item: ${subItem.name}`);
        } catch (error) {
          console.log(`⚠️  Failed to create ${subItem.name}: ${error.message}`);
        }
      }
    }
    
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
    
    // Get EMR menu item ID
    const emrMenuItem = await query(`
      SELECT id, name, key 
      FROM emr.menu_item 
      WHERE key = 'emr' OR name ILIKE '%emr%'
      LIMIT 1
    `);
    
    if (emrMenuItem.rows.length > 0) {
      const emrItem = emrMenuItem.rows[0];
      console.log(`\n=== Granting Doctor Access to EMR ===`);
      console.log(`EMR Menu Item: ${emrItem.name} (ID: ${emrItem.id})`);
      
      // Grant doctor access to EMR
      try {
        await query(`
          INSERT INTO emr.role_menu_access (role_name, menu_item_id, created_at, updated_at)
          VALUES ('doctor', $1, NOW(), NOW())
          ON CONFLICT (role_name, menu_item_id) DO UPDATE SET
            updated_at = NOW()
        `, [emrItem.id]);
        
        console.log('✅ Granted doctor access to EMR module');
      } catch (error) {
        console.log(`⚠️  Failed to grant access: ${error.message}`);
      }
    }
    
    // Check all doctor menu access
    console.log('\n=== Current Doctor Menu Access ===');
    const doctorAccess = await query(`
      SELECT rma.role_name, mi.name, mi.key, mi.is_active
      FROM emr.role_menu_access rma
      JOIN emr.menu_item mi ON rma.menu_item_id = mi.id
      WHERE rma.role_name = 'doctor'
      ORDER BY mi.name
    `);
    
    console.log('Doctor accessible modules:');
    doctorAccess.rows.forEach(access => {
      console.log(`- ${access.name} (${access.key}) - ${access.is_active ? '✅' : '❌'}`);
    });
    
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
    
    // Grant EMR access to all plans
    if (emrMenuItem.rows.length > 0) {
      const emrItem = emrMenuItem.rows[0];
      
      for (const plan of plans.rows) {
        try {
          await query(`
            INSERT INTO emr.subscription_plan_module_access (plan_id, menu_item_id, is_enabled, created_at, updated_at)
            VALUES ($1, $2, true, NOW(), NOW())
            ON CONFLICT (plan_id, menu_item_id) DO UPDATE SET
              is_enabled = true,
              updated_at = NOW()
          `, [plan.id, emrItem.id]);
          
          console.log(`✅ Enabled EMR in ${plan.name} plan`);
        } catch (error) {
          console.log(`⚠️  Failed to enable EMR in ${plan.name}: ${error.message}`);
        }
      }
    }
    
    console.log('\n=== FINAL VERIFICATION ===');
    
    // Check final doctor access
    const finalAccess = await query(`
      SELECT mi.name, mi.key
      FROM emr.menu_item mi
      JOIN emr.role_menu_access rma ON mi.id = rma.menu_item_id
      WHERE rma.role_name = 'doctor' AND mi.is_active = true
      ORDER BY mi.name
    `);
    
    console.log('Final doctor accessible modules:');
    finalAccess.rows.forEach(access => {
      console.log(`- ${access.name} (${access.key})`);
    });
    
    const hasEmr = finalAccess.rows.some(m => m.key === 'emr');
    if (hasEmr) {
      console.log('\n✅ SUCCESS: Doctor now has access to EMR/Clinical Encounter module');
    } else {
      console.log('\n❌ ISSUE: EMR module still not accessible');
    }
    
    console.log('\n=== TESTING INSTRUCTIONS ===');
    console.log('1. Restart the server');
    console.log('2. Clear browser cache');
    console.log('3. Login as doctor@nhgl.com');
    console.log('4. Check if "Clinical EMR" appears in sidebar');
    console.log('5. Click on it to access the module');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
