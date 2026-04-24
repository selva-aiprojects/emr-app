const http = require('http');

(async () => {
  try {
    console.log('=== Testing Patient Search ===');
    
    // First login as NHSL tenant
    const loginData = JSON.stringify({
      email: 'admin@nitra-healthcare.com',
      password: 'Admin@123',
      tenantId: 'a730192d-efe3-4fd8-82a3-829ad905acff'
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
          console.log('Login successful!');
          
          // Test patient search
          testPatientSearch(loginResult.token);
        } else {
          console.log('Login failed:', data);
        }
      });
    });
    
    loginReq.write(loginData);
    loginReq.end();
    
    function testPatientSearch(token) {
      console.log('\n=== Testing Patient Search ===');
      
      // Test 1: Get all patients
      const patientsOptions = {
        hostname: '127.0.0.1',
        port: 4005,
        path: '/api/patients?limit=10',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const patientsReq = http.request(patientsOptions, (res) => {
        let patientsData = '';
        res.on('data', (chunk) => { patientsData += chunk; });
        res.on('end', () => {
          console.log(`Patients Status: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            try {
              const patients = JSON.parse(patientsData);
              console.log(`Found ${patients.length} patients`);
              if (patients.length > 0) {
                console.log('Sample patient:', patients[0].first_name, patients[0].last_name);
              }
            } catch (e) {
              console.log('Failed to parse patients response');
            }
          } else {
            console.log('Patients fetch failed:', patientsData);
          }
          
          // Test 2: Search patients
          testSearchEndpoint(token);
        });
      });
      
      patientsReq.end();
    }
    
    function testSearchEndpoint(token) {
      console.log('\n=== Testing Search Endpoint ===');
      
      const searchOptions = {
        hostname: '127.0.0.1',
        port: 4005,
        path: '/api/patients/search?text=john&tenantId=a730192d-efe3-4fd8-82a3-829ad905acff',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const searchReq = http.request(searchOptions, (res) => {
        let searchData = '';
        res.on('data', (chunk) => { searchData += chunk; });
        res.on('end', () => {
          console.log(`Search Status: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            try {
              const searchResults = JSON.parse(searchData);
              console.log(`Search found ${searchResults.length} results`);
              if (searchResults.length > 0) {
                console.log('Search sample:', searchResults[0].first_name, searchResults[0].last_name);
              }
            } catch (e) {
              console.log('Failed to parse search response:', searchData);
            }
          } else {
            console.log('Search failed:', searchData);
          }
          
          console.log('\n=== PATIENT PICKER DIAGNOSIS ===');
          console.log('If both endpoints work, the issue might be:');
          console.log('1. Frontend not calling the right API');
          console.log('2. Tenant ID not passed correctly');
          console.log('3. PatientPicker component not receiving data');
        });
      });
      
      searchReq.end();
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
