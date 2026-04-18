const http = require('http');

// First login to get a token
const loginOptions = {
  hostname: 'localhost',
  port: 4005,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const loginData = JSON.stringify({
  email: 'admin@smcmega.local',
  password: 'Admin@123',
  tenantId: 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa'
});

const loginReq = http.request(loginOptions, (loginRes) => {
  console.log(`Login Status: ${loginRes.statusCode}`);
  
  let loginData = '';
  loginRes.on('data', (chunk) => {
    loginData += chunk;
  });
  
  loginRes.on('end', () => {
    try {
      const loginResponse = JSON.parse(loginData);
      console.log('\n=== Login Response ===');
      console.log(JSON.stringify(loginResponse, null, 2));
      
      if (loginResponse.token) {
        console.log('\n✅ Login successful! Testing dashboard...');
        
        // Now test the dashboard with the token
        const dashboardOptions = {
          hostname: 'localhost',
          port: 4005,
          path: '/api/reports/dashboard/metrics',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginResponse.token}`,
            'tenant-id': 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa'
          }
        };

        const dashboardReq = http.request(dashboardOptions, (dashboardRes) => {
          console.log(`\nDashboard Status: ${dashboardRes.statusCode}`);
          
          let dashboardData = '';
          dashboardRes.on('data', (chunk) => {
            dashboardData += chunk;
          });
          
          dashboardRes.on('end', () => {
            try {
              const response = JSON.parse(dashboardData);
              console.log('\n=== Dashboard API Response ===');
              console.log('Total Patients:', response.totalPatients || response.todayPatients);
              console.log('Total Revenue:', response.totalRevenue || response.todayRevenue);
              console.log('Occupied Beds:', response.occupiedBeds);
              console.log('Total Beds:', response.totalBeds);
              console.log('Appointments:', response.todayAppointments);
              
              if ((response.totalPatients || response.todayPatients) > 0 || (response.totalRevenue || response.todayRevenue) > 0) {
                console.log('\n✅ SUCCESS: Dashboard API is returning data!');
              } else {
                console.log('\n❌ ISSUE: Dashboard API still returning zeros');
              }
            } catch (error) {
              console.log('Raw Dashboard Response:', dashboardData);
            }
          });
        });

        dashboardReq.on('error', (error) => {
          console.error('Dashboard Error:', error.message);
        });

        dashboardReq.end();
      }
    } catch (error) {
      console.log('Login Error:', loginData);
    }
  });
});

loginReq.on('error', (error) => {
  console.error('Login Error:', error.message);
});

loginReq.write(loginData);
loginReq.end();
