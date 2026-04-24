const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Creating NHGL Clinical Users ===');
    
    // Find NHGL tenant
    const nhglTenant = await query(`
      SELECT id, name, code, schema_name 
      FROM emr.management_tenants 
      WHERE code ILIKE '%nhgl%' OR name ILIKE '%nhgl%'
    `);
    
    if (nhglTenant.rows.length === 0) {
      console.log('NHGL tenant not found');
      process.exit(1);
    }
    
    const tenant = nhglTenant.rows[0];
    console.log(`NHGL Tenant: ${tenant.name} (ID: ${tenant.id})`);
    
    // Create clinical users in emr.users table
    const clinicalUsers = [
      { 
        email: 'doctor@nhgl.com', 
        name: 'Dr. John Smith', 
        role: 'doctor',
        password: 'Admin@123'
      },
      { 
        email: 'nurse@nhgl.com', 
        name: 'Nurse Sarah Johnson', 
        role: 'nurse',
        password: 'Admin@123'
      },
      { 
        email: 'admin@nhgl.com', 
        name: 'Admin Mike Wilson', 
        role: 'admin',
        password: 'Admin@123'
      },
      { 
        email: 'reception@nhgl.com', 
        name: 'Receptionist Lisa Brown', 
        role: 'receptionist',
        password: 'Admin@123'
      }
    ];
    
    const bcrypt = require('bcryptjs');
    
    console.log('\nCreating clinical users...');
    
    for (const user of clinicalUsers) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Insert user
        await query(`
          INSERT INTO emr.users (email, name, role, tenant_id, password_hash, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            tenant_id = EXCLUDED.tenant_id,
            password_hash = EXCLUDED.password_hash,
            updated_at = NOW()
        `, [user.email, user.name, user.role, tenant.id, hashedPassword]);
        
        console.log(`✅ Created: ${user.email} (${user.role})`);
      } catch (error) {
        console.log(`⚠️  Failed to create ${user.email}: ${error.message}`);
      }
    }
    
    // Verify created users
    console.log('\n=== VERIFIED CLINICAL USERS ===');
    const users = await query(`
      SELECT email, name, role, tenant_id, created_at
      FROM emr.users 
      WHERE tenant_id = $1 
      AND role IN ('doctor', 'nurse', 'admin', 'receptionist')
      ORDER BY role, name
    `, [tenant.id]);
    
    users.rows.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ${user.name}`);
    });
    
    console.log('\n=== NHGL CLINICAL USER CREDENTIALS ===');
    console.log('Tenant ID:', tenant.id);
    console.log('Tenant Name:', tenant.name);
    console.log('\n--- LOGIN CREDENTIALS ---');
    
    clinicalUsers.forEach(user => {
      console.log(`\n${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Tenant ID: ${tenant.id}`);
    });
    
    console.log('\n=== TESTING INSTRUCTIONS ===');
    console.log('1. Go to: http://127.0.0.1:5175');
    console.log('2. Use any of the credentials above');
    console.log('3. You should see EMR workflow (clinical interface)');
    console.log('4. Test patient search and other EMR features');
    console.log('5. Verify you do NOT see superadmin features');
    
    console.log('\n=== QUICK TEST - DOCTOR LOGIN ===');
    console.log('Email: doctor@nhgl.com');
    console.log('Password: Admin@123');
    console.log('Tenant ID: ' + tenant.id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
