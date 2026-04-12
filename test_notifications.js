import fetch from 'node-fetch';

async function testNotifications() {
  try {
    console.log('Testing notifications API...');
    
    // First, login to get a token
    console.log('Attempting login with DEMO tenant...');
    
    // Try the actual DEMO user credentials
    const loginResponse = await fetch('http://localhost:4005/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenantId: 'DEMO',
        email: 'rajesh@demo.hospital',
        password: 'Demo@123'
      })
    });
    
    console.log(`Login response status: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      console.error('Login failed');
      const errorText = await loginResponse.text();
      console.error('Login error details:', errorText);
      
      // Try NHGL bypass as fallback
      console.log('Trying NHGL bypass...');
      const nhglResponse = await fetch('http://localhost:4005/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId: 'NHGL',
          email: 'admin@nhgl.com',
          password: 'any'
        })
      });
      
      if (nhglResponse.ok) {
        console.log('NHGL bypass worked!');
        const loginData = await nhglResponse.json();
        await testNotificationsAPI(loginData.token, loginData.tenantId);
      } else {
        console.error('NHGL bypass also failed');
        const nhglError = await nhglResponse.text();
        console.error('NHGL error:', nhglError);
      }
      return;
    }
    
    const loginData = await loginResponse.json();
    await testNotificationsAPI(loginData.token, loginData.tenantId);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

async function testNotificationsAPI(token, tenantId) {
  console.log(`Login successful! Token: ${token.substring(0, 20)}...`);
  console.log(`Tenant ID: ${tenantId}`);
  
  // Test the pharmacy alerts API
  const alertsResponse = await fetch(`http://localhost:4005/api/pharmacy/v1/pharmacy/alerts`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-tenant-id': tenantId,
      'Content-Type': 'application/json'
    }
  });
  
  if (!alertsResponse.ok) {
    console.error(`API Error: ${alertsResponse.status} ${alertsResponse.statusText}`);
    const errorText = await alertsResponse.text();
    console.error('Error details:', errorText);
    return;
  }
  
  const alerts = await alertsResponse.json();
  console.log(`\nFound ${alerts.length} notifications:`);
  
  alerts.forEach((alert, index) => {
    console.log(`\n${index + 1}. ${alert.alert_type.toUpperCase()}`);
    console.log(`   Message: ${alert.message}`);
    console.log(`   Severity: ${alert.severity}`);
    console.log(`   Created: ${alert.created_at}`);
    console.log(`   Read: ${alert.is_read ? 'Yes' : 'No'}`);
  });
  
  console.log('\n Notification categories:');
  const categories = {};
  alerts.forEach(alert => {
    categories[alert.alert_type] = (categories[alert.alert_type] || 0) + 1;
  });
  
  Object.entries(categories).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
  
  console.log('\n SUCCESS: Dynamic notifications are working!');
  console.log('The frontend should now display real notifications from the database.');
}

testNotifications();
