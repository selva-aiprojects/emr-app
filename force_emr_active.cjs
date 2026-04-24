const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Force EMR Active State ===');
    
    // Check current EMR state
    const currentEMR = await query(`
      SELECT id, name, code, is_active, updated_at
      FROM emr.menu_item 
      WHERE code = 'emr'
    `);
    
    console.log('Current EMR state:');
    currentEMR.rows.forEach(row => {
      console.log(`- ${row.name}: is_active=${row.is_active}, updated_at=${row.updated_at}`);
    });
    
    // Force update EMR to be active
    const updateResult = await query(`
      UPDATE emr.menu_item 
      SET is_active = true, updated_at = NOW()
      WHERE code = 'emr'
    `);
    
    console.log(`Update result: ${updateResult.rowCount} rows affected`);
    
    // Verify the update
    const updatedEMR = await query(`
      SELECT id, name, code, is_active, updated_at
      FROM emr.menu_item 
      WHERE code = 'emr'
    `);
    
    console.log('Updated EMR state:');
    updatedEMR.rows.forEach(row => {
      console.log(`- ${row.name}: is_active=${row.is_active}, updated_at=${row.updated_at}`);
    });
    
    // Also check the parent group
    const parentGroup = await query(`
      SELECT id, name, code, is_active
      FROM emr.menu_item 
      WHERE code = 'patient_care'
    `);
    
    if (parentGroup.rows.length > 0) {
      console.log('\nParent group state:');
      parentGroup.rows.forEach(row => {
        console.log(`- ${row.name}: is_active=${row.is_active}`);
      });
      
      // Force update parent group
      await query(`
        UPDATE emr.menu_item 
        SET is_active = true, updated_at = NOW()
        WHERE code = 'patient_care'
      `);
      
      console.log('✅ Updated parent group to be active');
    }
    
    // Test the menu API immediately
    console.log('\n=== Testing Menu API After Fix ===');
    
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
                console.log('\n✅ EMR Module After Fix:');
                console.log(`- Name: ${emrItem.name}`);
                console.log(`- Code: ${emrItem.code}`);
                console.log(`- Route: ${emrItem.route}`);
                console.log(`- Active: ${emrItem.is_active}`);
                
                if (emrItem.is_active) {
                  console.log('\n🎉 SUCCESS: EMR is now active and should be visible!');
                  console.log('If still not visible, the issue is in the frontend component.');
                } else {
                  console.log('\n❌ EMR is still not active in API response');
                }
                
              } else {
                console.log('\n❌ EMR still not found in API response');
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
    
    console.log('\n=== FINAL RECOMMENDATIONS ===');
    console.log('1. Force refresh browser cache (Ctrl+Shift+R)');
    console.log('2. Restart the development server completely');
    console.log('3. Check browser console for any JavaScript errors');
    console.log('4. Check if the sidebar component has caching issues');
    console.log('5. Look at the AppLayout.jsx component for filtering logic');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
