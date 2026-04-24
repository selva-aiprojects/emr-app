const axios = require('axios');
const { execSync } = require('child_process');

console.log('🚀 Phase 2: Create Fresh Tenant via Superadmin');

async function createFreshTenant() {
  try {
    // 1. Start server if not running
    console.log('Starting dev server...');
    execSync('npm run dev:server', { stdio: 'pipe', timeout: 10000 });

    // 2. Superadmin login (magnum)
    const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
      tenantCode: 'magnum',
      email: 'superadmin@magnum.com',
      password: 'Magnum2024!'
    });
    const token = loginRes.data.token;
    console.log('✅ Superadmin logged in');

    // 3. Create fresh tenant
    const tenantRes = await axios.post('http://localhost:4000/api/tenants', {
      name: 'Fresh Hospital Test',
      code: 'fresh-hosp',
      subdomain: 'fresh-hosp',
      tier: 'Enterprise'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const newTenant = tenantRes.data;
    console.log('✅ New tenant created:', newTenant.code, newTenant.schema_name);

    // 4. Verify shard setup
    const metricsRes = await axios.get('http://localhost:4000/api/management/metrics/' + newTenant.id, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('📊 Tenant metrics:', metricsRes.data);

    console.log('🎉 Fresh tenant ready!');
    console.log('Next: node seeds/full_patient_journey.cjs fresh-hosp');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createFreshTenant();
