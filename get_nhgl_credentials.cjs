const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Getting NHGL Clinical User Credentials ===');
    
    // Find NHGL tenant
    const nhglTenant = await query(`
      SELECT id, name, code, schema_name 
      FROM emr.management_tenants 
      WHERE code ILIKE '%nhgl%' OR name ILIKE '%nhgl%'
    `);
    
    if (nhglTenant.rows.length === 0) {
      console.log('NHGL tenant not found. Checking all tenants...');
      const allTenants = await query('SELECT id, name, code, schema_name FROM emr.management_tenants ORDER BY name');
      console.log('Available tenants:');
      allTenants.rows.forEach(t => console.log(`- ${t.name} (${t.code}) - Schema: ${t.schema_name}`));
      process.exit(0);
    }
    
    const tenant = nhglTenant.rows[0];
    console.log(`\nFound NHGL Tenant: ${tenant.name}`);
    console.log(`Tenant ID: ${tenant.id}`);
    console.log(`Schema: ${tenant.schema_name}`);
    
    // Get clinical users from NHGL schema
    const clinicalUsers = await query(`
      SELECT email, name, role, password_hash IS NOT NULL as has_password
      FROM "${tenant.schema_name}".users 
      WHERE role IN ('doctor', 'nurse', 'admin', 'receptionist')
      ORDER BY role, name
    `);
    
    if (clinicalUsers.rows.length === 0) {
      console.log('\nNo clinical users found in NHGL schema. Checking emr.users...');
      
      const globalUsers = await query(`
        SELECT email, name, role, tenant_id, password_hash IS NOT NULL as has_password
        FROM emr.users 
        WHERE (tenant_id = $1 OR tenant_id IS NULL) 
        AND role IN ('doctor', 'nurse', 'admin', 'receptionist')
        ORDER BY role, name
      `, [tenant.id]);
      
      if (globalUsers.rows.length === 0) {
        console.log('No clinical users found. Creating sample users...');
        
        // Create sample clinical users
        const sampleUsers = [
          { email: 'doctor@nhgl.com', name: 'Dr. John Smith', role: 'doctor' },
          { email: 'nurse@nhgl.com', name: 'Nurse Sarah Johnson', role: 'nurse' },
          { email: 'admin@nhgl.com', name: 'Admin Mike Wilson', role: 'admin' },
          { email: 'reception@nhgl.com', name: 'Receptionist Lisa Brown', role: 'receptionist' }
        ];
        
        for (const user of sampleUsers) {
          try {
            // Add to emr.users
            await query(`
              INSERT INTO emr.users (email, name, role, tenant_id, password_hash, created_at, updated_at)
              VALUES ($1, $2, $3, $4, '$2b$10$dummy.hash.for.testing.purposes', NOW(), NOW())
              ON CONFLICT (email) DO NOTHING
            `, [user.email, user.name, user.role, tenant.id]);
            
            console.log(`✅ Created: ${user.email} (${user.role})`);
          } catch (error) {
            console.log(`⚠️  Failed to create ${user.email}: ${error.message}`);
          }
        }
        
        console.log('\nSample users created with default password: "Admin@123"');
      } else {
        console.log('\nClinical Users (Global):');
        globalUsers.rows.forEach(user => {
          console.log(`- ${user.email} (${user.role}) - ${user.name} ${user.has_password ? '✅' : '❌ No password'}`);
        });
      }
    } else {
      console.log('\nClinical Users (NHGL Schema):');
      clinicalUsers.rows.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - ${user.name} ${user.has_password ? '✅' : '❌ No password'}`);
      });
    }
    
    // Get default password for testing
    console.log('\n=== DEFAULT CREDENTIALS ===');
    console.log('For testing, try these credentials:');
    console.log('\n--- Doctor Login ---');
    console.log('Email: doctor@nhgl.com');
    console.log('Password: Admin@123');
    console.log('Tenant ID: ' + tenant.id);
    
    console.log('\n--- Nurse Login ---');
    console.log('Email: nurse@nhgl.com');
    console.log('Password: Admin@123');
    console.log('Tenant ID: ' + tenant.id);
    
    console.log('\n--- Admin Login ---');
    console.log('Email: admin@nhgl.com');
    console.log('Password: Admin@123');
    console.log('Tenant ID: ' + tenant.id);
    
    console.log('\n--- Receptionist Login ---');
    console.log('Email: reception@nhgl.com');
    console.log('Password: Admin@123');
    console.log('Tenant ID: ' + tenant.id);
    
    console.log('\n=== LOGIN INSTRUCTIONS ===');
    console.log('1. Go to: http://127.0.0.1:5175');
    console.log('2. Use email + password + tenant ID above');
    console.log('3. You should see EMR workflow (not superadmin)');
    console.log('4. Test patient search and other features');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
