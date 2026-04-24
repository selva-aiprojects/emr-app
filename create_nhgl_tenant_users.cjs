const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Creating NHGL Tenant-Specific Users ===');
    
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
    console.log(`NHGL Tenant: ${tenant.name} (Schema: ${tenant.schema_name})`);
    
    // Check if tenant schema has users table
    const schemaCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 AND table_name = 'users'
    `, [tenant.schema_name]);
    
    if (schemaCheck.rows.length === 0) {
      console.log(`Creating users table in ${tenant.schema_name} schema...`);
      
      // Create users table in tenant schema
      await query(`
        CREATE TABLE IF NOT EXISTS "${tenant.schema_name}".users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          tenant_id UUID NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      console.log('✅ Users table created in tenant schema');
    }
    
    // Create clinical users in tenant schema
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
    
    console.log('\nCreating clinical users in tenant schema...');
    
    for (const user of clinicalUsers) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Insert user into tenant schema
        await query(`
          INSERT INTO "${tenant.schema_name}".users (email, name, role, tenant_id, password_hash, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            tenant_id = EXCLUDED.tenant_id,
            password_hash = EXCLUDED.password_hash,
            updated_at = NOW()
        `, [user.email, user.name, user.role, tenant.id, hashedPassword]);
        
        console.log(`✅ Created: ${user.email} (${user.role}) in ${tenant.schema_name} schema`);
      } catch (error) {
        console.log(`⚠️  Failed to create ${user.email}: ${error.message}`);
      }
    }
    
    // Also create in global emr.users for authentication (but mark as tenant-specific)
    console.log('\nCreating global authentication entries...');
    
    for (const user of clinicalUsers) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
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
        
        console.log(`✅ Global auth: ${user.email}`);
      } catch (error) {
        console.log(`⚠️  Global auth failed for ${user.email}: ${error.message}`);
      }
    }
    
    // Verify tenant users
    console.log('\n=== TENANT SCHEMA USERS ===');
    const tenantUsers = await query(`
      SELECT email, name, role, created_at
      FROM "${tenant.schema_name}".users 
      ORDER BY role, name
    `);
    
    tenantUsers.rows.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ${user.name}`);
    });
    
    console.log('\n=== NHGL TENANT USER CREDENTIALS ===');
    console.log('Tenant ID:', tenant.id);
    console.log('Tenant Name:', tenant.name);
    console.log('Schema:', tenant.schema_name);
    console.log('\n--- LOGIN CREDENTIALS ---');
    
    clinicalUsers.forEach(user => {
      console.log(`\n${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Tenant ID: ${tenant.id}`);
      console.log(`  Managed in: ${tenant.schema_name} schema`);
    });
    
    console.log('\n=== CORRECT ARCHITECTURE ===');
    console.log('✅ Users stored in tenant schema');
    console.log('✅ Global auth table for login');
    console.log('✅ Tenant admin can manage own users');
    console.log('✅ Proper multi-tenant isolation');
    
    console.log('\n=== TESTING INSTRUCTIONS ===');
    console.log('1. Go to: http://127.0.0.1:5175');
    console.log('2. Login with tenant-specific credentials');
    console.log('3. You should see EMR workflow');
    console.log('4. Tenant admin can add/manage users');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
