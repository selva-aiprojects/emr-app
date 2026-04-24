const fetch = require('node-fetch');

(async () => {
  try {
    console.log('=== Testing Superadmin Dashboard API ===');
    
    // First login as superadmin
    const loginResponse = await fetch('http://127.0.0.1:4005/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@healthezee.com',
        password: 'Admin@123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login Status:', loginResponse.status);
    
    if (loginResponse.status === 200 && loginData.token) {
      console.log('\nSuperadmin Login Successful!');
      console.log('Token:', loginData.token.substring(0, 50) + '...');
      console.log('User:', loginData.user);
      console.log('Role:', loginData.role);
      
      // Test superadmin dashboard API
      console.log('\n=== Testing Superadmin Dashboard API ===');
      const dashboardResponse = await fetch('http://127.0.0.1:4005/api/superadmin/overview', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (dashboardResponse.status === 200) {
        const dashboardData = await dashboardResponse.json();
        console.log('Superadmin Dashboard Data:');
        console.log('Total Tenants:', dashboardData.totals.tenants);
        console.log('Total Doctors:', dashboardData.totals.doctors);
        console.log('Total Patients:', dashboardData.totals.patients);
        console.log('Available Beds:', dashboardData.totals.bedsAvailable);
        console.log('Available Ambulances:', dashboardData.totals.ambulancesAvailable);
        
        console.log('\nTenant Details:');
        dashboardData.tenants.forEach(tenant => {
          console.log(`- ${tenant.name}: ${tenant.patients} patients, ${tenant.doctors} doctors, ${tenant.bedsAvailable} beds`);
        });
      } else {
        console.log('Dashboard API Failed:', dashboardResponse.status);
        console.log('Error:', await dashboardResponse.text());
      }
    } else {
      console.log('Login Failed');
      console.log('Response:', loginData);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
