import { query } from '../server/db/connection.js';

async function checkExistingUsers() {
  try {
    console.log('🔍 Checking existing users in database...');
    
    // Get all users with their tenant info
    const users = await query(`
      SELECT u.id, u.name, u.email, u.role, u.tenant_id, t.name as tenant_name, t.code as tenant_code, t.subscription_tier
      FROM emr.users u
      LEFT JOIN emr.tenants t ON u.tenant_id = t.id
      ORDER BY t.code, u.email
    `);
    
    console.log('\n📋 Existing Users:');
    if (users.rows.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.rows.forEach(row => {
        console.log(`👤 ${row.name}`);
        console.log(`   Email: ${row.email}`);
        console.log(`   Role: ${row.role}`);
        console.log(`   Tenant: ${row.tenant_name} (${row.tenant_code})`);
        console.log(`   Tier: ${row.subscription_tier || 'Unknown'}`);
        console.log(`   Password: Test@123`);
        console.log('');
      });
    }

    // Get tenants
    const tenants = await query('SELECT id, name, code, subscription_tier FROM emr.tenants ORDER BY code');
    console.log('🏢 Available Tenants:');
    tenants.rows.forEach(row => {
      console.log(`   ${row.code}: ${row.name} (${row.subscription_tier})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkExistingUsers();
