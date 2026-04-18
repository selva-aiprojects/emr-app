const fetch = require('node-fetch');

(async () => {
  try {
    console.log('=== Testing NHSL Login ===');
    
    const loginResponse = await fetch('http://127.0.0.1:4005/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@nitra-healthcare.com',
        password: 'Admin@123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login Status:', loginResponse.status);
    
    if (loginResponse.status === 200 && loginData.token) {
      console.log('\n✅ NHSL Login Successful!');
      console.log('Token:', loginData.token.substring(0, 50) + '...');
      console.log('User:', loginData.user);
      console.log('Tenant ID:', loginData.tenantId);
      console.log('Role:', loginData.role);
      
      // Test dashboard API
      console.log('\n=== Testing NHSL Dashboard API ===');
      const dashboardResponse = await fetch('http://127.0.0.1:4005/api/reports/dashboard/metrics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (dashboardResponse.status === 200) {
        const dashboardData = await dashboardResponse.json();
        console.log('✅ Dashboard API Working!');
        console.log('Dashboard Data:', dashboardData);
      } else {
        console.log('❌ Dashboard API Failed:', dashboardResponse.status);
        console.log('Error:', await dashboardResponse.text());
      }
    } else {
      console.log('❌ Login Failed');
      console.log('Response:', loginData);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
