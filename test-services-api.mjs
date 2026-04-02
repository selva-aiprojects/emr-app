// Test script for /api/services endpoint
import fetch from 'node-fetch';

async function testServicesAPI() {
  try {
    console.log('🔍 Testing /api/services endpoint...');
    
    // Test health endpoint first
    console.log('📊 Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:4000/api/health');
    const healthData = await healthResponse.json();
    console.log('💚 Health Status:', healthData);
    
    // Test services endpoint
    console.log('📋 Testing services endpoint...');
    const servicesResponse = await fetch('http://localhost:4000/api/services', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail but show the error
      }
    });
    
    console.log('📊 Response Status:', servicesResponse.status);
    console.log('📊 Response Headers:', Object.fromEntries(servicesResponse.headers));
    
    if (servicesResponse.status === 500) {
      const errorText = await servicesResponse.text();
      console.log('❌ Error Response:', errorText);
    } else {
      const servicesData = await servicesResponse.json();
      console.log('✅ Services Data:', servicesData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testServicesAPI();
