const http = require('http');

(async () => {
  try {
    console.log('=== Testing Correct Superadmin Login ===');
    
    // Login with tenantId: 'superadmin'
    const loginData = JSON.stringify({
      email: 'admin@healthezee.com',
      password: 'Admin@123',
      tenantId: 'superadmin'
    });
    
    const options = {
      hostname: '127.0.0.1',
      port: 4005,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Login Status: ${res.statusCode}`);
        console.log('Login Response:', data);
        
        if (res.statusCode === 200) {
          try {
            const loginResult = JSON.parse(data);
            if (loginResult.token) {
              console.log('Superadmin login successful!');
              console.log('Token received:', loginResult.token.substring(0, 50) + '...');
              console.log('Role:', loginResult.role);
              
              // Test the superadmin overview
              testSuperadminOverview(loginResult.token);
            } else {
              console.log('No token received');
            }
          } catch (e) {
            console.log('Failed to parse login response');
          }
        } else {
          console.log('Superadmin login failed');
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('Login request failed:', e.message);
    });
    
    req.write(loginData);
    req.end();
    
    function testSuperadminOverview(token) {
      console.log('\n=== Testing Superadmin Overview ===');
      
      const overviewOptions = {
        hostname: '127.0.0.1',
        port: 4005,
        path: '/api/superadmin/overview',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
              console.log('Superadmin Overview SUCCESS!');
              console.log('\n=== DASHBOARD DATA ===');
              console.log('Total Tenants:', overviewData.totals?.tenants);
              console.log('Total Doctors:', overviewData.totals?.doctors);
              console.log('Total Patients:', overviewData.totals?.patients);
              console.log('Available Beds:', overviewData.totals?.bedsAvailable);
              console.log('Available Ambulances:', overviewData.totals?.ambulancesAvailable);
              
              console.log('\n=== TARGET TENANTS ===');
              const targetTenants = overviewData.tenants?.filter(t => 
                t.name?.toLowerCase().includes('nitra') || 
                t.name?.toLowerCase().includes('starlight')
              ) || [];
              
              if (targetTenants.length > 0) {
                targetTenants.forEach(tenant => {
                  console.log(`- ${tenant.name}: ${tenant.patients} patients, ${tenant.doctors} doctors, ${tenant.bedsAvailable} beds`);
                });
              } else {
                console.log('NHSL and Starlight tenants not found in response');
                console.log('All tenants:', overviewData.tenants?.map(t => t.name).slice(0, 5));
              }
              
              console.log('\n=== FRONTEND SHOULD NOW SHOW ===');
              console.log('Instead of zeros, the dashboard should display:');
              console.log(`- Total Patients: ${overviewData.totals?.patients}`);
              console.log(`- Total Doctors: ${overviewData.totals?.doctors}`);
              console.log(`- Available Beds: ${overviewData.totals?.bedsAvailable}`);
              
            } catch (e) {
              console.log('Failed to parse overview response:', data);
            }
          } else {
            console.log('Overview failed:', data);
            console.log('This might indicate a permissions or API issue');
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
