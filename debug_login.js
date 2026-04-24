import bcrypt from 'bcrypt';
import { query } from './server/db/connection.js';

async function debugLogin() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    const email = 'admin@demo.hospital';
    const password = 'Demo@123';
    
    console.log('=== DEBUGGING LOGIN ===\n');
    
    // Get the user from database
    const user = await query('SELECT * FROM emr.users WHERE tenant_id = $1 AND LOWER(email) = LOWER($2)', [tenantId, email]);
    
    if (user.rows.length === 0) {
      console.log('User not found in database');
      return;
    }
    
    const userData = user.rows[0];
    console.log('User found:');
    console.log(` ID: ${userData.id}`);
    console.log(` Name: ${userData.name}`);
    console.log(` Email: ${userData.email}`);
    console.log(` Role: ${userData.role}`);
    console.log(` Active: ${userData.is_active}`);
    console.log(` Tenant ID: ${userData.tenant_id}`);
    
    // Test password verification
    console.log('\n=== TESTING PASSWORD ===');
    console.log('Stored hash:', userData.password_hash);
    
    try {
      const isValid = await bcrypt.compare(password, userData.password_hash);
      console.log('Password verification:', isValid ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.log('Password verification error:', error.message);
    }
    
    // Test the exact query that getUserByEmail uses
    console.log('\n=== TESTING getUserByEmail QUERY ===');
    const userByEmailQuery = await query('SELECT * FROM emr.users WHERE LOWER(email) = LOWER($1) AND tenant_id::text = $2::text', [email, tenantId]);
    
    if (userByEmailQuery.rows.length > 0) {
      console.log('getUserByEmail query: SUCCESS');
      console.log('Found user:', userByEmailQuery.rows[0].name);
    } else {
      console.log('getUserByEmail query: FAILED');
      console.log('No user found with this query');
      
      // Try alternative query
      const altQuery = await query('SELECT * FROM emr.users WHERE LOWER(email) = LOWER($1) AND tenant_id = $2', [email, tenantId]);
      if (altQuery.rows.length > 0) {
        console.log('Alternative query: SUCCESS');
        console.log('Found user:', altQuery.rows[0].name);
      }
    }
    
    // Check if there are multiple admin users
    console.log('\n=== CHECKING ALL ADMIN USERS ===');
    const allAdmins = await query('SELECT id, name, email, tenant_id FROM emr.users WHERE role = \'admin\'', []);
    console.log('Total admin users:', allAdmins.rows.length);
    allAdmins.rows.forEach(admin => {
      console.log(` ${admin.name} (${admin.email}) - Tenant: ${admin.tenant_id}`);
    });
    
    console.log('\n=== RECOMMENDATIONS ===');
    if (userData.is_active) {
      console.log('User is active');
    } else {
      console.log('User is NOT active - this could be the issue');
    }
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. If password verification fails, recreate the user with correct hash');
    console.log('2. If getUserByEmail query fails, check the query logic');
    console.log('3. Try logging in through the frontend to see actual error');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

debugLogin();
