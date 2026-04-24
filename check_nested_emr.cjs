const http = require('http');

(async () => {
  try {
    console.log('=== Checking Nested EMR ===');
    
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
          testNestedMenu(loginResult.token);
        } else {
          console.log('❌ Doctor login failed:', data);
        }
      });
    });
    
    loginReq.write(loginData);
    loginReq.end();
    
    function testNestedMenu(token) {
      console.log('\n=== Testing Nested Menu Structure ===');
      
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
              
              // Look for EMR in nested structure
              function findEMRInNested(items, depth = 0) {
                if (depth > 3) return null;
                
                for (const item of items) {
                  console.log(`${'  '.repeat(depth)}Checking: ${item.name} (${item.code})`);
                  
                  if (item.code === 'emr') {
                    console.log(`${'  '.repeat(depth)}✅ Found EMR!`);
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
                console.log('\n✅ EMR Module Found:');
                console.log(`- Name: ${emrItem.name}`);
                console.log(`- Code: ${emrItem.code}`);
                console.log(`- Route: ${emrItem.route}`);
                console.log(`- Active: ${emrItem.is_active}`);
                console.log(`- Visible: ${emrItem.is_visible}`);
                console.log(`- Requires Subscription: ${emrItem.requires_subscription}`);
                console.log(`- Subscription Plans: ${emrItem.subscription_plans || 'None'}`);
                
                // Check parent group
                function findParent(items, targetId, depth = 0) {
                  if (depth > 3) return null;
                  
                  for (const item of items) {
                    if (item.items && Array.isArray(item.items)) {
                      const child = item.items.find(child => child.id === targetId);
                      if (child) {
                        return item;
                      }
                      const found = findParent(item.items, targetId, depth + 1);
                      if (found) return found;
                    }
                  }
                  return null;
                }
                
                const parent = findParent(menu.data, emrItem.id);
                if (parent) {
                  console.log(`\n📁 Parent Group: ${parent.name} (${parent.code})`);
                  console.log(`Parent Route: ${parent.route}`);
                  console.log(`Parent Active: ${parent.is_active}`);
                }
                
              } else {
                console.log('\n❌ EMR Module Not Found in Nested Structure');
                
                // Show all nested items
                function showAllNested(items, depth = 0) {
                  if (depth > 2) return;
                  
                  items.forEach(item => {
                    const indent = '  '.repeat(depth);
                    console.log(`${indent}- ${item.name} (${item.code})`);
                    if (item.items && Array.isArray(item.items)) {
                      showAllNested(item.items, depth + 1);
                    }
                  });
                }
                
                console.log('\nAll nested items:');
                showAllNested(menu.data);
              }
              
              console.log('\n=== FRONTEND DEBUGGING ===');
              console.log('1. Check if "Bed & Patient Care" group is visible');
              console.log('2. Check if EMR is visible in the group');
              console.log('3. Check if the frontend is filtering correctly');
              console.log('4. Check browser console for JavaScript errors');
              
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
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
