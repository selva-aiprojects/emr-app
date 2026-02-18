const axios = require('axios');

// Integration Test Script for EMR Application
// Tests Enterprise tenant with all features

const BASE_URL = 'http://localhost:4000';

// Test configurations
const tenants = [
  {
    id: 'EHS',
    name: 'Enterprise Hospital Systems',
    email: 'michael@enterprise.hos',
    password: 'Test@123',
    expectedModules: ['dashboard', 'patients', 'appointments', 'emr', 'pharmacy', 'inventory', 'reports', 'employees', 'accounts', 'support']
  },
  {
    id: 'BHC',
    name: 'Basic Health Clinic',
    email: 'sarah@basic.health',
    password: 'Test@123',
    expectedModules: ['dashboard', 'patients', 'appointments', 'emr', 'pharmacy', 'inventory', 'reports']
  },
  {
    id: 'PMC',
    name: 'Professional Medical Center',
    email: 'robert@professional.med',
    password: 'Test@123',
    expectedModules: ['dashboard', 'patients', 'appointments', 'emr', 'pharmacy', 'inventory', 'reports', 'support']
  }
];

const allModules = [
  '/api/dashboard',
  '/api/patients',
  '/api/appointments',
  '/api/emr',
  '/api/pharmacy',
  '/api/inventory',
  '/api/reports',
  '/api/employees',      // Enterprise only
  '/api/accounts',       // Enterprise only
  '/api/support'         // Professional + Enterprise
];

async function login(tenant) {
  try {
    console.log(`\n🔑 Logging into ${tenant.name}...`);
    const response = await axios.post(`${BASE_URL}/api/login`, {
      tenantId: tenant.id,
      email: tenant.email,
      password: tenant.password
    });
    
    console.log(`✅ Login successful - Role: ${response.data.user.role}`);
    return response.data.token;
  } catch (error) {
    console.error(`❌ Login failed for ${tenant.name}:`, error.response?.data || error.message);
    return null;
  }
}

async function testModule(token, module, tenantName) {
  try {
    const response = await axios.get(`${BASE_URL}${module}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`✅ ${tenantName} ${module} - ${response.status}`);
    return { success: true, status: response.status };
  } catch (error) {
    const status = error.response?.status || 'Network Error';
    console.log(`❌ ${tenantName} ${module} - ${status}`);
    return { success: false, status };
  }
}

async function testTenantFeatures(tenant) {
  const token = await login(tenant);
  if (!token) return;

  console.log(`\n🧪 Testing ${tenant.name} Features:`);
  console.log('=' .repeat(50));

  const results = [];
  
  for (const module of allModules) {
    const result = await testModule(token, module, tenant.name);
    results.push({ module, ...result });
  }

  // Summary
  console.log(`\n📊 ${tenant.name} Summary:`);
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  console.log(`✅ Successful: ${successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log(`🎉 ${tenant.name} has FULL ACCESS to all modules!`);
  } else {
    console.log(`⚠️  ${tenant.name} has LIMITED access (${totalCount - successCount} modules blocked)`);
  }

  return results;
}

async function testFeatureFlags(tenant) {
  const token = await login(tenant);
  if (!token) return;

  try {
    console.log(`\n🔍 Checking ${tenant.name} Feature Flags:`);
    const response = await axios.get(`${BASE_URL}/api/tenants/${tenant.id}/features`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📋 Feature Flags Status:');
    Object.entries(response.data.features || {}).forEach(([flag, enabled]) => {
      const status = enabled ? '✅' : '❌';
      const flagName = flag.replace('permission-', '').replace('-access', '');
      console.log(`  ${status} ${flagName}`);
    });
    
  } catch (error) {
    console.log(`❌ Could not fetch feature flags: ${error.response?.status || 'Network Error'}`);
  }
}

async function runIntegrationTests() {
  console.log('🚀 Starting EMR Integration Tests');
  console.log('=====================================');
  console.log(`Testing URL: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);

  const allResults = {};

  // Test each tenant
  for (const tenant of tenants) {
    allResults[tenant.id] = await testTenantFeatures(tenant);
    await testFeatureFlags(tenant);
  }

  // Final comparison
  console.log('\n🎯 Final Comparison:');
  console.log('=' .repeat(50));
  
  tenants.forEach(tenant => {
    const results = allResults[tenant.id] || [];
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const percentage = Math.round((successCount / totalCount) * 100);
    
    console.log(`${tenant.name}: ${successCount}/${totalCount} modules (${percentage}%)`);
  });

  // Identify Enterprise tenant (should have all features)
  const enterpriseResults = allResults['EHS'] || [];
  const enterpriseSuccess = enterpriseResults.filter(r => r.success).length;
  
  if (enterpriseSuccess === allModules.length) {
    console.log('\n🎉 SUCCESS: Enterprise tenant has ALL FEATURES!');
    console.log('✅ Ready for comprehensive testing and validation');
  } else {
    console.log('\n⚠️  WARNING: Enterprise tenant missing some features');
    console.log(`❌ Expected: ${allModules.length}, Got: ${enterpriseSuccess}`);
  }

  console.log('\n🏁 Integration Tests Complete!');
}

// Health check
async function healthCheck() {
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is running');
    console.log(`📊 Service: ${response.data.service}`);
    console.log(`🔧 Version: ${response.data.version}`);
    return true;
  } catch (error) {
    console.error('❌ Server is not running or not accessible');
    console.error('Please start the server with: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking server health...');
  const isServerRunning = await healthCheck();
  
  if (!isServerRunning) {
    process.exit(1);
  }

  await runIntegrationTests();
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runIntegrationTests,
  testTenantFeatures,
  testFeatureFlags,
  tenants,
  allModules
};
