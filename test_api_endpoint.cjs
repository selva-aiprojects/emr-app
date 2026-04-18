const http = require('http');

(async () => {
  try {
    console.log('=== Testing Superadmin API Endpoint ===');
    
    // Test the superadmin overview endpoint directly
    const options = {
      hostname: '127.0.0.1',
      port: 4005,
      path: '/api/superadmin/overview',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing'
      }
    };
    
    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response Body:', data);
        
        try {
          const response = JSON.parse(data);
          console.log('\n=== Parsed Response ===');
          console.log('Total Doctors:', response.totals?.doctors);
          console.log('Total Patients:', response.totals?.patients);
          console.log('Available Beds:', response.totals?.bedsAvailable);
          
          console.log('\n=== Tenant Details ===');
          response.tenants?.forEach(tenant => {
            if (tenant.name?.toLowerCase().includes('nitra') || tenant.name?.toLowerCase().includes('starlight')) {
              console.log(`- ${tenant.name}: ${tenant.patients} patients, ${tenant.doctors} doctors, ${tenant.bedsAvailable} beds`);
            }
          });
        } catch (e) {
          console.log('Failed to parse JSON:', e.message);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`Request error: ${e.message}`);
    });
    
    req.end();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
