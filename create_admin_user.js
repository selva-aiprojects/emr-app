import bcrypt from 'bcrypt';
import { query } from './server/db/connection.js';

async function createAdminUser() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    console.log('=== CREATING ADMIN USER ===\n');
    
    // Hash the password
    const password = 'Demo@123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('Password hashed successfully');
    
    // Delete existing admin user if any
    await query('DELETE FROM emr.users WHERE tenant_id = $1 AND email = $2', [tenantId, 'admin@demo.hospital']);
    
    // Create new admin user
    const result = await query(`
      INSERT INTO emr.users (tenant_id, name, email, role, password_hash, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING id, name, email, role, is_active
    `, [tenantId, 'Admin User', 'admin@demo.hospital', 'admin', passwordHash]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('Admin user created successfully:');
      console.log(` ID: ${user.id}`);
      console.log(` Name: ${user.name}`);
      console.log(` Email: ${user.email}`);
      console.log(` Role: ${user.role}`);
      console.log(` Active: ${user.is_active}`);
    }
    
    // Verify the user was created
    console.log('\n=== VERIFYING USER ===');
    const verifyUser = await query('SELECT id, name, email, role FROM emr.users WHERE tenant_id = $1 AND email = $2', [tenantId, 'admin@demo.hospital']);
    
    if (verifyUser.rows.length > 0) {
      console.log('SUCCESS: Admin user verified in database');
      console.log('User:', verifyUser.rows[0].name);
    } else {
      console.log('ISSUE: User verification failed');
    }
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Tenant ID:', tenantId);
    console.log('Email: admin@demo.hospital');
    console.log('Password: Demo@123');
    
    console.log('\n=== TESTING LOGIN MANUALLY ===');
    
    // Test password verification
    const storedHash = verifyUser.rows[0].password_hash || passwordHash;
    const isValid = await bcrypt.compare(password, storedHash);
    console.log('Password verification:', isValid ? 'SUCCESS' : 'FAILED');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createAdminUser();
