const http = require('http');

(async () => {
  try {
    console.log('=== Checking Doctor Sidebar Menu ===');
    
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
              console.log('Menu items received:');
              
              // Look for EMR in menu
              const emrItems = menu.filter(item => 
                item.code === 'emr' || 
                item.name.toLowerCase().includes('emr') ||
                item.name.toLowerCase().includes('clinical')
              );
              
              if (emrItems.length > 0) {
                console.log('\n✅ EMR items found in menu:');
                emrItems.forEach(item => {
                  console.log(`- ${item.name} (${item.code}) - Route: ${item.route}`);
                });
              } else {
                console.log('\n❌ No EMR items found in menu');
                console.log('Available items:');
                menu.slice(0, 10).forEach(item => {
                  console.log(`- ${item.name} (${item.code})`);
                });
              }
              
              // Check all menu items
              console.log('\n=== All Menu Items ===');
              menu.forEach(item => {
                console.log(`- ${item.name} (${item.code}) - Active: ${item.is_active}`);
              });
              
            } catch (e) {
              console.log('Failed to parse menu response:', menuData);
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
