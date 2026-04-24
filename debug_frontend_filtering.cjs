const http = require('http');

(async () => {
  try {
    console.log('=== Debugging Frontend Filtering ===');
    
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
          
          // Get doctor's subscription info
          getDoctorSubscription(loginResult.token);
        } else {
          console.log('❌ Doctor login failed:', data);
        }
      });
    });
    
    loginReq.write(loginData);
    loginReq.end();
    
    function getDoctorSubscription(token) {
      console.log('\n=== Checking Doctor Subscription ===');
      
      const subOptions = {
        hostname: '127.0.0.1',
        port: 4005,
        path: '/api/tenant/subscription',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const subReq = http.request(subOptions, (res) => {
        let subData = '';
        res.on('data', (chunk) => { subData += chunk; });
        res.on('end', () => {
          console.log(`Subscription API Status: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            try {
              const subscription = JSON.parse(subData);
              console.log('Doctor subscription:', subscription);
              
              // Now test menu with subscription context
              testMenuWithSubscription(token, subscription);
            } catch (e) {
              console.log('Failed to parse subscription:', e.message);
              testMenuWithSubscription(token, null);
            }
          } else {
            console.log('Subscription API failed:', subData);
            testMenuWithSubscription(token, null);
          }
        });
      });
      
      subReq.on('error', (e) => {
        console.error('Subscription API request failed:', e.message);
        testMenuWithSubscription(token, null);
      });
      
      subReq.end();
    }
    
    function testMenuWithSubscription(token, subscription) {
      console.log('\n=== Testing Menu with Subscription Context ===');
      
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
              
              // Find EMR and check its subscription requirements
              function findEMRWithSubscription(items, depth = 0) {
                if (depth > 3) return null;
                
                for (const item of items) {
                  if (item.code === 'emr') {
                    return item;
                  }
                  
                  if (item.items && Array.isArray(item.items)) {
                    const found = findEMRWithSubscription(item.items, depth + 1);
                    if (found) return found;
                  }
                }
                return null;
              }
              
              const emrItem = findEMRWithSubscription(menu.data);
              
              if (emrItem) {
                console.log('\n✅ EMR Module Found:');
                console.log(`- Name: ${emrItem.name}`);
                console.log(`- Code: ${emrItem.code}`);
                console.log(`- Route: ${emrItem.route}`);
                console.log(`- Active: ${emrItem.is_active}`);
                console.log(`- Requires Subscription: ${emrItem.requires_subscription}`);
                console.log(`- Subscription Plans: ${JSON.stringify(emrItem.subscription_plans)}`);
                
                // Check subscription compatibility
                if (emrItem.requires_subscription) {
                  console.log('\n⚠️  EMR Requires Subscription!');
                  console.log('Required plans:', emrItem.subscription_plans);
                  
                  if (subscription && subscription.plan) {
                    const userPlan = subscription.plan.toLowerCase();
                    const requiredPlans = emrItem.subscription_plans.map(p => p.toLowerCase());
                    
                    console.log(`User plan: ${subscription.plan}`);
                    console.log(`Required plans: ${requiredPlans.join(', ')}`);
                    
                    if (requiredPlans.includes(userPlan)) {
                      console.log('✅ User has required subscription plan');
                    } else {
                      console.log('❌ User does not have required subscription plan');
                      console.log('This is likely why EMR is not visible!');
                    }
                  } else {
                    console.log('❌ No subscription info available');
                    console.log('This is likely why EMR is not visible!');
                  }
                } else {
                  console.log('\n✅ EMR does not require subscription');
                  console.log('Should be visible to all users');
                }
                
              } else {
                console.log('\n❌ EMR Module Not Found');
              }
              
              console.log('\n=== FRONTEND DEBUGGING ===');
              console.log('1. Check browser console for JavaScript errors');
              console.log('2. Check if there are CSS rules hiding EMR');
              console.log('3. Check if the sidebar component is filtering based on subscription');
              console.log('4. Check if the effectiveModules calculation is correct');
              
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
