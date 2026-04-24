const http = require('http');

(async () => {
  try {
    console.log('=== Testing Server Connection ===');
    
    // Test if server is running
    const options = {
      hostname: '127.0.0.1',
      port: 4005,
      path: '/api/tenants',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      console.log(`Server Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response:', data);
        
        if (res.statusCode === 200) {
          console.log('Server is running and responding');
          
          // Test superadmin endpoint
          testSuperadminEndpoint();
        } else {
          console.log('Server returned error status');
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('Server connection failed:', e.message);
      console.log('Server may not be running on port 4005');
    });
    
    req.on('timeout', () => {
      console.log('Request timeout - server may not be responding');
      req.destroy();
    });
    
    req.end();
    
    function testSuperadminEndpoint() {
      console.log('\n=== Testing Superadmin Endpoint ===');
      
      const superadminOptions = {
        hostname: '127.0.0.1',
        port: 4005,
        path: '/api/superadmin/overview',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      };
      
      const superadminReq = http.request(superadminOptions, (res) => {
        console.log(`Superadmin Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('Superadmin Response:', data);
          
          if (res.statusCode === 401) {
            console.log('Authentication required - this is expected');
            console.log('The endpoint exists but needs proper authentication');
          } else if (res.statusCode === 200) {
            try {
              const response = JSON.parse(data);
              console.log('Superadmin Data:', response.totals);
            } catch (e) {
              console.log('Failed to parse superadmin response');
            }
          } else {
            console.log('Superadmin endpoint returned error');
          }
        });
      });
      
      superadminReq.on('error', (e) => {
        console.error('Superadmin endpoint failed:', e.message);
      });
      
      superadminReq.on('timeout', () => {
        console.log('Superadmin request timeout');
        superadminReq.destroy();
      });
      
      superadminReq.end();
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
