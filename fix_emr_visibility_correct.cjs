const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Fixing EMR Visibility (Corrected) ===');
    
    // Check menu_item structure
    const structure = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'menu_item' 
      AND table_schema = 'emr'
      ORDER BY ordinal_position
    `);
    
    console.log('menu_item columns:');
    structure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    // Find EMR menu item
    const emrItem = await query(`
      SELECT id, name, code, is_active
      FROM emr.menu_item 
      WHERE code = 'emr'
      LIMIT 1
    `);
    
    if (emrItem.rows.length === 0) {
      console.log('❌ EMR menu item not found');
      process.exit(1);
    }
    
    const emr = emrItem.rows[0];
    console.log(`Found EMR: ${emr.name} (ID: ${emr.id})`);
    console.log(`Current is_active: ${emr.is_active}`);
    
    // Update EMR to be active
    await query(`
      UPDATE emr.menu_item 
      SET is_active = true, updated_at = NOW()
      WHERE id = $1
    `, [emr.id]);
    
    console.log('✅ Updated EMR to be active');
    
    // Also update the parent group
    const parentGroup = await query(`
      SELECT id, name, code, is_active
      FROM emr.menu_item 
      WHERE code = 'patient_care'
      LIMIT 1
    `);
    
    if (parentGroup.rows.length > 0) {
      const parent = parentGroup.rows[0];
      console.log(`Found parent: ${parent.name} (ID: ${parent.id})`);
      
      await query(`
        UPDATE emr.menu_item 
        SET is_active = true, updated_at = NOW()
        WHERE id = $1
      `, [parent.id]);
      
      console.log('✅ Updated parent group to be active');
    }
    
    // Verify the updates
    console.log('\n=== Verification ===');
    
    const updatedEMR = await query(`
      SELECT id, name, code, is_active
      FROM emr.menu_item 
      WHERE code = 'emr'
      LIMIT 1
    `);
    
    const updatedParent = await query(`
      SELECT id, name, code, is_active
      FROM emr.menu_item 
      WHERE code = 'patient_care'
      LIMIT 1
    `);
    
    console.log('Updated EMR:', updatedEMR.rows[0]);
    if (updatedParent.rows.length > 0) {
      console.log('Updated Parent:', updatedParent.rows[0]);
    }
    
    // Test the menu API again
    console.log('\n=== Testing Updated Menu ===');
    
    const http = require('http');
    
    // Login as doctor
    const loginData = JSON.stringify({
      email: 'doctor@nhgl.com',
      password: 'Admin@123',
      tenantId: 'b01f0cdc-4e8b-4db5-ba71-e657a414695e'
    });
    
    const loginOptions = {
      hostname: '127.0.0.1',
      port: 4005,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginReq = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const loginResult = JSON.parse(data);
          console.log('✅ Doctor login successful');
          
          // Test menu API
          testMenuAPI(loginResult.token);
        } else {
          console.log('❌ Doctor login failed:', data);
        }
      });
    });
    
    loginReq.write(loginData);
    loginReq.end();
    
    function testMenuAPI(token) {
      const menuOptions = {
        hostname: '127.0.0.1',
        port: 4005,
        path: '/api/menu/user-menu',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const menuReq = http.request(menuOptions, (res) => {
        let menuData = '';
        res.on('data', (chunk) => { menuData += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const menu = JSON.parse(menuData);
              
              // Find EMR in nested structure
              function findEMRInNested(items, depth = 0) {
                if (depth > 3) return null;
                
                for (const item of items) {
                  if (item.code === 'emr') {
                    return item;
                  }
                  
                  if (item.items && Array.isArray(item.items)) {
                    const found = findEMRInNested(item.items, depth + 1);
                    if (found) return found;
                  }
                }
                return null;
              }
              
              const emrItem = findEMRInNested(menu.data);
              
              if (emrItem) {
                console.log('\n✅ EMR Module Now Active:');
                console.log(`- Name: ${emrItem.name}`);
                console.log(`- Code: ${emrItem.code}`);
                console.log(`- Route: ${emrItem.route}`);
                console.log(`- Active: ${emrItem.is_active}`);
                
                console.log('\n🎉 SUCCESS: EMR should now be visible to doctors!');
              } else {
                console.log('\n❌ EMR still not found');
              }
              
            } catch (e) {
              console.log('Failed to parse menu response:', e.message);
            }
          } else {
            console.log('Menu API failed:', menuData);
          }
        });
      });
      
      menuReq.on('error', (e) => {
        console.error('Menu API request failed:', e.message);
      });
      
      menuReq.end();
    }
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Clear browser cache (Ctrl+F5)');
    console.log('2. Restart the development server');
    console.log('3. Login as doctor@nhgl.com');
    console.log('4. Look for "Bed & Patient Care" in sidebar');
    console.log('5. Click on EMR to access clinical workflow');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
