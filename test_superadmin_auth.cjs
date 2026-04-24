const http = require('http');

(async () => {
  try {
    console.log('=== Testing Superadmin Authentication Flow ===');
    
    // Step 1: Login as superadmin
    console.log('\n1. Logging in as superadmin...');
    
    const loginOptions = {
      hostname: '127.0.0.1',
      port: 4005,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginReq = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Login Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const loginData = JSON.parse(data);
            console.log('Login successful!');
            console.log('Token:', loginData.token ? 'Received' : 'Missing');
            console.log('Role:', loginData.role);
            
            if (loginData.token) {
              // Step 2: Test superadmin overview with token
              testSuperadminOverview(loginData.token);
            } else {
              console.log('No token received - authentication failed');
            }
          } catch (e) {
            console.log('Failed to parse login response:', data);
          }
        } else {
          console.log('Login failed:', data);
        }
      });
    });
    
    loginReq.on('error', (e) => {
      console.error('Login request failed:', e.message);
    });
    
    loginReq.write(JSON.stringify({
      email: 'admin@healthezee.com',
      password: 'Admin@123'
    }));
    
    loginReq.end();
    
    function testSuperadminOverview(token) {
      console.log('\n2. Testing superadmin overview with token...');
      
      const overviewOptions = {
        hostname: '127.0.0.1',
        port: 4005,
        path: '/api/superadmin/overview',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      const overviewReq = http.request(overviewOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.log(`Overview Status: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            try {
              const overviewData = JSON.parse(data);
              console.log('Superadmin Overview Success!');
              console.log('Totals:', overviewData.totals);
              console.log('Number of tenants:', overviewData.tenants?.length || 0);
              
              // Check for our target tenants
              const targetTenants = overviewData.tenants?.filter(t => 
                t.name?.toLowerCase().includes('nitra') || 
                t.name?.toLowerCase().includes('starlight')
              ) || [];
              
              console.log('\nTarget Tenants Found:');
              targetTenants.forEach(tenant => {
                console.log(`- ${tenant.name}: ${tenant.patients} patients, ${tenant.doctors} doctors, ${tenant.bedsAvailable} beds`);
              });
              
              if (targetTenants.length === 0) {
                console.log('WARNING: NHSL and Starlight tenants not found in response');
              }
              
            } catch (e) {
              console.log('Failed to parse overview response:', data);
            }
          } else {
            console.log('Overview failed:', data);
          }
        });
      });
      
      overviewReq.on('error', (e) => {
        console.error('Overview request failed:', e.message);
      });
      
      overviewReq.end();
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
