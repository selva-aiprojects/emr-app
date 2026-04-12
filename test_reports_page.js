import fetch from 'node-fetch';

async function testReportsPage() {
  try {
    console.log('=== TESTING REPORTS PAGE DIRECTLY ===\n');
    
    // Test if the frontend can access the page
    console.log('1. Testing frontend accessibility...');
    const frontendResponse = await fetch('http://localhost:5175');
    console.log(`Frontend status: ${frontendResponse.status}`);
    
    // Test the reports API directly without authentication first
    console.log('\n2. Testing reports API without auth...');
    const reportsResponse = await fetch('http://localhost:4005/api/reports/summary');
    console.log(`Reports API status: ${reportsResponse.status}`);
    
    if (reportsResponse.status === 401 || reportsResponse.status === 403) {
      console.log('Reports API requires authentication (expected)');
      
      // Try to get a session cookie by simulating browser login
      console.log('\n3. Testing browser-based login...');
      
      // Create a simple session test
      const sessionTest = await fetch('http://localhost:4005/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: 'DEMO',
          email: 'admin@demo.hospital',
          password: 'Demo@123'
        }),
        redirect: 'manual' // Don't follow redirects
      });
      
      console.log(`Login response status: ${sessionTest.status}`);
      
      if (sessionTest.status === 200) {
        const loginData = await sessionTest.json();
        console.log('Login successful!');
        console.log('Token received:', loginData.token ? 'YES' : 'NO');
        
        // Now test the reports API with the token
        console.log('\n4. Testing reports API with token...');
        const authReportsResponse = await fetch('http://localhost:4005/api/reports/summary', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json',
          }
        });
        
        console.log(`Authenticated reports API status: ${authReportsResponse.status}`);
        
        if (authReportsResponse.ok) {
          const reportsData = await authReportsResponse.json();
          console.log('SUCCESS: Reports API returned data');
          console.log('Data keys:', Object.keys(reportsData));
          
          // Check if data has content
          const hasData = Object.keys(reportsData).some(key => {
            const value = reportsData[key];
            return value && typeof value === 'object' ? Object.keys(value).length > 0 : value !== null && value !== undefined;
          });
          
          console.log('Data has content:', hasData ? 'YES' : 'NO');
          
          if (hasData) {
            console.log('\nReports API Data Summary:');
            Object.entries(reportsData).forEach(([key, value]) => {
              if (value && typeof value === 'object') {
                console.log(` ${key}: ${JSON.stringify(value).substring(0, 100)}...`);
              } else {
                console.log(` ${key}: ${value}`);
              }
            });
          }
        } else {
          const errorText = await authReportsResponse.text();
          console.log('Authenticated reports API error:', errorText);
        }
      } else {
        const errorText = await sessionTest.text();
        console.log('Login failed:', errorText);
      }
    } else {
      const reportsData = await reportsResponse.json();
      console.log('Reports API returned data without authentication:');
      console.log(JSON.stringify(reportsData, null, 2));
    }
    
    console.log('\n=== CONCLUSION ===');
    console.log('If the Reports API works but the page is still blank, the issue is likely:');
    console.log('1. Frontend component not receiving props correctly');
    console.log('2. Frontend not making API calls');
    console.log('3. JavaScript errors in the browser');
    console.log('4. Component rendering issues');
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Open browser developer tools');
    console.log('2. Navigate to Reports & Analysis page');
    console.log('3. Check Console tab for JavaScript errors');
    console.log('4. Check Network tab for API calls');
    console.log('5. Check if the ReportsPage component is rendering');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testReportsPage();
