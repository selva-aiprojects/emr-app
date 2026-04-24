const http = require('http');

(async () => {
  try {
    console.log('=== Debugging Menu Structure ===');
    
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
      console.log('\n=== Testing Menu API Structure ===');
      
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
              console.log('Menu keys:', Object.keys(menu));
              
              // Check if it has a data property
              if (menu.data) {
                console.log('✅ Found menu.data property');
                console.log('menu.data type:', typeof menu.data);
                console.log('menu.data is array:', Array.isArray(menu.data));
                
                if (Array.isArray(menu.data)) {
                  console.log('Menu items count:', menu.data.length);
                  
                  // Look for EMR in menu.data
                  const emrItem = menu.data.find(item => item.code === 'emr');
                  if (emrItem) {
                    console.log('\n✅ EMR Module Found:');
                    console.log(`- Name: ${emrItem.name}`);
                    console.log(`- Code: ${emrItem.code}`);
                    console.log(`- Route: ${emrItem.route}`);
                    console.log(`- Active: ${emrItem.is_active}`);
                    console.log(`- Requires Subscription: ${emrItem.requires_subscription}`);
                    console.log(`- Subscription Plans: ${emrItem.subscription_plans || 'None'}`);
                  } else {
                    console.log('\n❌ EMR Module Not Found in menu.data');
                    console.log('Available items:');
                    menu.data.slice(0, 10).forEach(item => {
                      console.log(`- ${item.name} (${item.code})`);
                    });
                  }
                }
              } else {
                console.log('❌ menu.data is not an array');
              }
              
              // Check other properties
              console.log('\n=== All Menu Properties ===');
              Object.keys(menu).forEach(key => {
                console.log(`- ${key}: ${typeof menu[key]} - ${Array.isArray(menu[key]) ? 'Array' : 'Not Array'}`);
              });
              
            } catch (e) {
              console.log('Failed to parse menu response:', e.message);
              console.log('Raw response (first 1000 chars):', menuData.substring(0, 1000));
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
