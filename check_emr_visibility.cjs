const http = require('http');

(async () => {
  try {
    console.log('=== Checking EMR Visibility for Doctor ===');
    
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
      console.log('\n=== Testing Menu API ===');
      
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
          console.log(`Menu API Status: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            try {
              const menu = JSON.parse(menuData);
              console.log('Menu response type:', typeof menu);
              console.log('Menu is array:', Array.isArray(menu));
              
              // Look for EMR in the menu
              function findEMR(items, depth = 0) {
                if (depth > 3) return null;
                
                for (const item of items) {
                  if (item.code === 'emr') {
                    return item;
                  }
                  if (item.items && Array.isArray(item.items)) {
                    const found = findEMR(item.items, depth + 1);
                    if (found) return found;
                  }
                }
                return null;
              }
              
              const emrItem = findEMR(Array.isArray(menu) ? menu : [menu]);
              
              if (emrItem) {
                console.log('\n✅ EMR Module Found:');
                console.log(`- Name: ${emrItem.name}`);
                console.log(`- Code: ${emrItem.code}`);
                console.log(`- Route: ${emrItem.route}`);
                console.log(`- Active: ${emrItem.is_active}`);
                console.log(`- Visible: ${emrItem.is_visible}`);
                console.log(`- Requires Subscription: ${emrItem.requires_subscription}`);
                console.log(`- Subscription Plans: ${emrItem.subscription_plans || 'None'}`);
                
                // Check subscription requirements
                if (emrItem.requires_subscription && emrItem.subscription_plans.length > 0) {
                  console.log('\n⚠️  EMR requires subscription plans:', emrItem.subscription_plans.join(', '));
                  console.log('This might be why it\'s not visible to the doctor');
                } else {
                  console.log('\n✅ EMR has no subscription requirements');
                }
                
              } else {
                console.log('\n❌ EMR Module Not Found in Menu');
                console.log('Available modules:');
                
                function listModules(items, depth = 0) {
                  if (depth > 2) return;
                  
                  items.forEach(item => {
                    const indent = '  '.repeat(depth);
                    console.log(`${indent}- ${item.name} (${item.code})`);
                    if (item.items && Array.isArray(item.items)) {
                      listModules(item.items, depth + 1);
                    }
                  });
                }
                
                listModules(Array.isArray(menu) ? menu : [menu]);
              }
              
              console.log('\n=== RECOMMENDATIONS ===');
              console.log('1. Check if EMR requires subscription that doctor doesn\'t have');
              console.log('2. Clear browser cache (Ctrl+F5)');
              console.log('3. Restart the development server');
              console.log('4. Check browser console for JavaScript errors');
              console.log('5. Verify doctor role is correctly set');
              
            } catch (e) {
              console.log('Failed to parse menu response:', e.message);
              console.log('Raw response:', menuData.substring(0, 500) + '...');
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
