const http = require('http');

// Test the dashboard API endpoint
const options = {
  hostname: 'localhost',
  port: 4005,
  path: '/api/dashboard/metrics',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'tenant-id': 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa' // Starlight tenant ID
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('\n=== Dashboard API Response ===');
      console.log('Total Patients:', response.totalPatients || response.todayPatients);
      console.log('Total Revenue:', response.totalRevenue || response.todayRevenue);
      console.log('Occupied Beds:', response.occupiedBeds);
      console.log('Total Beds:', response.totalBeds);
      console.log('\nFull Response:', JSON.stringify(response, null, 2));
    } catch (error) {
      console.log('Raw Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
