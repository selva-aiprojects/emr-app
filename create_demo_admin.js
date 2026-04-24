import { query } from './server/db/connection.js';
import { hashPassword } from './server/services/auth.service.js';

async function createDemoAdmin() {
  try {
    const tenantId = '20d07615-8de9-49b4-9929-ec565197e6f4';
    
    // Check if admin user already exists
    const existingAdmin = await query('SELECT * FROM emr.users WHERE email = $1 AND tenant_id = $2', ['admin@demo.hospital', tenantId]);
    
    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists:', existingAdmin.rows[0].email);
      console.log('Password is likely "Demo@123"');
      process.exit(0);
    }
    
    // Create admin user with known password
    const hashedPassword = await hashPassword('Demo@123');
    
    const result = await query(`
      INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [
      tenantId,
      'admin@demo.hospital',
      hashedPassword,
      'Demo Hospital Admin',
      'Admin',
      true
    ]);
    
    console.log('Created admin user:');
    console.log('Email: admin@demo.hospital');
    console.log('Password: Demo@123');
    console.log('Role: Admin');
    console.log('User ID:', result.rows[0].id);
    
    console.log('\n You can now login with these credentials!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createDemoAdmin();
