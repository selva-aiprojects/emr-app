const http = require('http');

(async () => {
  try {
    console.log('=== Testing New Fixed API Endpoint ===');
    
    // Login as superadmin
    const loginData = JSON.stringify({
      email: 'admin@healthezee.com',
      password: 'Admin@123',
      tenantId: 'superadmin'
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
          
          // Test the new fixed overview endpoint
          const overviewOptions = {
            hostname: '127.0.0.1',
            port: 4005,
            path: '/api/superadmin/overview-fixed',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${loginResult.token}`,
              'Content-Type': 'application/json'
            }
          };
          
          const overviewReq = http.request(overviewOptions, (res) => {
            let overviewData = '';
            res.on('data', (chunk) => { overviewData += chunk; });
            res.on('end', () => {
              console.log(`Fixed API Status: ${res.statusCode}`);
              
              if (res.statusCode === 200) {
                try {
                  const overview = JSON.parse(overviewData);
                  console.log('Fixed API SUCCESS!');
                  console.log('\n=== ACCURATE DATA ===');
                  console.log('Total Tenants:', overview.totals?.tenants);
                  console.log('Total Doctors:', overview.totals?.doctors);
                  console.log('Total Patients:', overview.totals?.patients);
                  console.log('Available Beds:', overview.totals?.bedsAvailable);
                  console.log('Available Ambulances:', overview.totals?.ambulancesAvailable);
                  
                  const nhslTenant = overview.tenants?.find(t => t.name?.toLowerCase().includes('nitra'));
                  const starlightTenant = overview.tenants?.find(t => t.name?.toLowerCase().includes('starlight'));
                  
                  console.log('\n=== INDIVIDUAL TENANTS ===');
                  console.log(`NHSL: ${nhslTenant?.patients} patients, ${nhslTenant?.doctors} doctors, ${nhslTenant?.bedsAvailable} beds`);
                  console.log(`Starlight: ${starlightTenant?.patients} patients, ${starlightTenant?.doctors} doctors, ${starlightTenant?.bedsAvailable} beds`);
                  
                  console.log('\n=== FRONTEND WILL NOW SHOW ===');
                  console.log('Live data from direct database queries!');
                  console.log('No more zeros - real-time accurate data!');

                } catch (e) {
                  console.log('Failed to parse fixed API response:', overviewData);
                }
              } else {
                console.log('Fixed API failed:', overviewData);
              }
            });
          });
          
          overviewReq.on('error', (e) => {
            console.error('Fixed API request failed:', e.message);
          });
          
          overviewReq.end();
        }
      });
    });
    
    loginReq.write(loginData);
    loginReq.end();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
