const http = require('http');

(async () => {
  try {
    console.log('=== Debugging Doctor Sidebar Filtering ===');
    
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
          
          // Test menu filtering
          testMenuFiltering(loginResult.token);
        } else {
          console.log('❌ Doctor login failed:', data);
        }
      });
    });
    
    loginReq.write(loginData);
    loginReq.end();
    
    function testMenuFiltering(token) {
      console.log('\n=== Testing Menu Filtering Logic ===');
      
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
              
              // Simulate frontend filtering logic
              console.log('\n=== Simulating Frontend Filtering ===');
              
              // Extract all modules from menu
              const allModules = [];
              function extractModules(items) {
                items.forEach(item => {
                  if (item.items) {
                    extractModules(item.items);
                  } else {
                    allModules.push(item.code);
                  }
                });
              }
              
              extractModules(menu);
              console.log('All available modules:', allModules);
              
              // Doctor sidebar groups
              const SIDEBAR_GROUPS_DOCTOR = [
                { name: "My Workspace", modules: ["doctor_workspace", "find_doctor", "doctor_availability"] },
                { name: "Patient Care", modules: ["patients", "emr", "inpatient"] },
                { name: "Diagnostics", modules: ["lab", "lab_availability", "ai_vision"] },
                { name: "Emergency", modules: ["ambulance"] },
                { name: "Communication", modules: ["communication", "documents"] }
              ];
              
              console.log('\n=== Doctor Sidebar Groups ===');
              SIDEBAR_GROUPS_DOCTOR.forEach(group => {
                console.log(`${group.name}: ${group.modules.join(', ')}`);
                
                // Check which modules are available
                const availableModules = group.modules.filter(module => allModules.includes(module));
                console.log(`  Available: ${availableModules.join(', ')}`);
                
                if (group.name === "Patient Care") {
                  const hasEMR = availableModules.includes('emr');
                  console.log(`  ✅ EMR in Patient Care: ${hasEMR ? 'YES' : 'NO'}`);
                }
              });
              
              // Check if EMR is in the menu
              const emrInMenu = allModules.includes('emr');
              console.log(`\n✅ EMR in full menu: ${emrInMenu ? 'YES' : 'NO'}`);
              
              if (emrInMenu) {
                console.log('\n=== EMR Module Details ===');
                function findEMR(items) {
                  for (const item of items) {
                    if (item.code === 'emr') {
                      console.log('Found EMR:', item);
                      return item;
                    }
                    if (item.items) {
                      const found = findEMR(item.items);
                      if (found) return found;
                    }
                  }
                  return null;
                }
                
                const emrItem = findEMR(menu);
                if (emrItem) {
                  console.log(`- Name: ${emrItem.name}`);
                  console.log(`- Route: ${emrItem.route}`);
                  console.log(`- Active: ${emrItem.is_active}`);
                  console.log(`- Requires Subscription: ${emrItem.requires_subscription}`);
                  console.log(`- Subscription Plans: ${emrItem.subscription_plans?.join(', ') || 'None'}`);
                }
              }
              
              console.log('\n=== TROUBLESHOOTING ===');
              if (!emrInMenu) {
                console.log('❌ EMR not in menu - check role_menu_access table');
              } else {
                console.log('✅ EMR is in menu - check frontend rendering');
                console.log('Possible issues:');
                console.log('1. Frontend cache not cleared');
                console.log('2. Component not re-rendering');
                console.log('3. Sidebar filtering logic issue');
                console.log('4. CSS hiding the module');
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
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
