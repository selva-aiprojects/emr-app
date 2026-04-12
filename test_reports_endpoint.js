import fetch from 'node-fetch';

async function testReportsEndpoint() {
  try {
    console.log('=== TESTING REPORTS API ENDPOINT ===\n');
    
    // First, login to get a token
    console.log('1. Logging in to get token...');
    const loginResponse = await fetch('http://localhost:4005/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantId: 'DEMO',
        email: 'admin@demo.hospital',
        password: 'Demo@123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Login successful, token received');
    
    // Test the reports summary endpoint
    console.log('\n2. Testing /api/reports/summary endpoint...');
    const reportsResponse = await fetch('http://localhost:4005/api/reports/summary', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`Response status: ${reportsResponse.status}`);
    
    if (!reportsResponse.ok) {
      const errorText = await reportsResponse.text();
      console.log('Error response:', errorText);
      throw new Error(`Reports endpoint failed: ${reportsResponse.status}`);
    }
    
    const reportsData = await reportsResponse.json();
    console.log('Reports API Response:');
    console.log(JSON.stringify(reportsData, null, 2));
    
    // Test the doctor payouts endpoint
    console.log('\n3. Testing /api/reports/payouts endpoint...');
    const payoutsResponse = await fetch('http://localhost:4005/api/reports/payouts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`Payouts response status: ${payoutsResponse.status}`);
    
    if (payoutsResponse.ok) {
      const payoutsData = await payoutsResponse.json();
      console.log('Doctor Payouts API Response:');
      console.log(JSON.stringify(payoutsData, null, 2));
    } else {
      const errorText = await payoutsResponse.text();
      console.log('Payouts error response:', errorText);
    }
    
    // Test the financials endpoint
    console.log('\n4. Testing /api/reports/financials endpoint...');
    const financialsResponse = await fetch('http://localhost:4005/api/reports/financials', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`Financials response status: ${financialsResponse.status}`);
    
    if (financialsResponse.ok) {
      const financialsData = await financialsResponse.json();
      console.log('Financials API Response:');
      console.log(JSON.stringify(financialsData, null, 2));
    } else {
      const errorText = await financialsResponse.text();
      console.log('Financials error response:', errorText);
    }
    
    console.log('\n=== ANALYSIS ===');
    
    if (reportsData && Object.keys(reportsData).length > 0) {
      console.log('SUCCESS: Reports API is returning data');
      console.log('The issue might be in the frontend component');
    } else {
      console.log('ISSUE: Reports API is not returning data');
      console.log('This explains why the Reports page is blank');
    }
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Check browser console for API errors');
    console.log('2. Verify the ReportsPage component is receiving props');
    console.log('3. Check if the frontend is making the API calls');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testReportsEndpoint();
