import { query } from './server/db/connection.js';

async function checkDemoCredentials() {
  try {
    console.log('=== CHECKING DEMO CREDENTIALS ===\n');
    
    // Check the demo tenant
    const tenantCheck = await query('SELECT id, name, code, subdomain FROM emr.tenants WHERE code = \'DEMO\'', []);
    
    if (tenantCheck.rows.length > 0) {
      const tenant = tenantCheck.rows[0];
      console.log('DEMO Tenant Found:');
      console.log(` ID: ${tenant.id}`);
      console.log(` Name: ${tenant.name}`);
      console.log(` Code: ${tenant.code}`);
      console.log(` Subdomain: ${tenant.subdomain}`);
      
      // Check admin user for this tenant
      const adminCheck = await query('SELECT id, name, email, role FROM emr.users WHERE tenant_id = $1 AND role = \'admin\'', [tenant.id]);
      
      console.log('\nAdmin Users:');
      if (adminCheck.rows.length > 0) {
        adminCheck.rows.forEach(user => {
          console.log(` ${user.name} (${user.email}) - ${user.role}`);
        });
      } else {
        console.log(' No admin users found for DEMO tenant');
        
        // Create admin user
        console.log('\nCreating admin user...');
        await query(`
          INSERT INTO emr.users (tenant_id, name, email, role, password_hash, is_active, created_at, updated_at)
          VALUES ($1, 'Admin User', 'admin@demo.hospital', 'admin', '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', true, NOW(), NOW())
          ON CONFLICT (tenant_id, email) DO NOTHING
        `, [tenant.id]);
        
        console.log('Admin user created: admin@demo.hospital');
      }
      
      console.log('\n=== LOGIN CREDENTIALS ===');
      console.log('Tenant ID:', tenant.id);
      console.log('Email: admin@demo.hospital');
      console.log('Password: Demo@123');
      
      // Test the login with these credentials
      console.log('\n=== TESTING LOGIN ===');
      
      try {
        const { query: directQuery } = await import('./server/db/connection.js');
        
        // Simulate login check
        const userCheck = await directQuery(`
          SELECT u.*, t.name as tenant_name, t.code as tenant_code 
          FROM emr.users u 
          JOIN emr.tenants t ON u.tenant_id = t.id 
          WHERE u.tenant_id = $1 AND u.email = $2 AND u.is_active = true
        `, [tenant.id, 'admin@demo.hospital']);
        
        if (userCheck.rows.length > 0) {
          console.log('SUCCESS: User found in database');
          console.log('User:', userCheck.rows[0].name);
          console.log('Role:', userCheck.rows[0].role);
          console.log('Tenant:', userCheck.rows[0].tenant_name);
        } else {
          console.log('ISSUE: User not found in database');
        }
        
      } catch (error) {
        console.log('Database check failed:', error.message);
      }
      
    } else {
      console.log('DEMO tenant not found');
      
      // Create demo tenant
      console.log('Creating DEMO tenant...');
      const newTenant = await query(`
        INSERT INTO emr.tenants (id, name, code, subdomain, contact_email, subscription_tier, status, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Demo Hospital', 'DEMO', 'demo', 'admin@demo.hospital', 'Professional', 'active', NOW(), NOW())
        RETURNING id, name, code, subdomain
      `);
      
      console.log('DEMO tenant created:', newTenant.rows[0]);
    }
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Use the correct tenant ID for login');
    console.log('2. Verify password is set correctly');
    console.log('3. Test the Reports API again');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkDemoCredentials();
