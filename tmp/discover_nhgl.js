import { api } from './client/src/api.js';

async function discover() {
  try {
    console.log('Logging in as Superadmin...');
    await api.login('superadmin', 'superadmin@emr.local', 'Admin@123');
    
    console.log('Fetching all tenants...');
    const tenants = await api.getTenants();
    const nhgl = tenants.find(t => t.code === 'NHGL' || t.name.includes('NHGL'));
    
    if (!nhgl) {
      console.log('❌ NHGL Tenant not found!');
      process.exit(1);
    }
    
    console.log(`Found NHGL Tenant: ${nhgl.id} (${nhgl.name})`);
    
    // We need to fetch users for this tenant
    // Since we are Superadmin, we can use the admin endpoint
    const response = await fetch(`http://127.0.0.1:4001/api/superadmin/tenants/${nhgl.id}/users`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('emr_auth_token')}`,
        'x-tenant-id': 'superadmin'
      }
    });
    
    const users = await response.json();
    console.log('NHGL Users:', JSON.stringify(users, null, 2));
    
  } catch (err) {
    console.error('Discovery failed:', err.message);
  }
}

discover();
