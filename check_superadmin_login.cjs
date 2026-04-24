const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Checking Superadmin Login Requirements ===');
    
    // Check if there's a superadmin user in the users table
    const superadminCheck = await query(`
      SELECT email, role, tenant_id 
      FROM emr.users 
      WHERE role = 'Superadmin' OR email ILIKE '%admin@healthezee.com%'
    `);
    
    console.log('Superadmin users found:');
    superadminCheck.rows.forEach(user => {
      console.log(`- Email: ${user.email}, Role: ${user.role}, Tenant ID: ${user.tenant_id}`);
    });
    
    // Check if there's a default superadmin tenant
    const tenantCheck = await query(`
      SELECT id, name, code 
      FROM emr.management_tenants 
      WHERE code ILIKE '%super%' OR name ILIKE '%super%' OR code ILIKE '%admin%'
    `);
    
    console.log('\nSuperadmin-related tenants:');
    tenantCheck.rows.forEach(tenant => {
      console.log(`- Name: ${tenant.name}, Code: ${tenant.code}, ID: ${tenant.id}`);
    });
    
    // Try to find any tenant that could be used for superadmin login
    const anyTenant = await query(`
      SELECT id, name, code 
      FROM emr.management_tenants 
      LIMIT 1
    `);
    
    if (anyTenant.rows.length > 0) {
      console.log('\nUsing first available tenant for login:');
      const tenant = anyTenant.rows[0];
      console.log(`- Name: ${tenant.name}, Code: ${tenant.code}, ID: ${tenant.id}`);
      
      // Test login with this tenant
      console.log('\n=== Testing Login with Tenant ID ===');
      
      const http = require('http');
      const loginData = JSON.stringify({
        email: 'admin@healthezee.com',
        password: 'Admin@123',
        tenantId: tenant.id
      });
      
      const options = {
        hostname: '127.0.0.1',
        port: 4005,
        path: '/api/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData)
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.log(`Login Status: ${res.statusCode}`);
          console.log('Login Response:', data);
          
          if (res.statusCode === 200) {
            try {
              const loginResult = JSON.parse(data);
              if (loginResult.token) {
                console.log('Login successful! Token received');
                console.log('Role:', loginResult.role);
                
                // Now test the superadmin overview
                testSuperadminWithToken(loginResult.token);
              }
            } catch (e) {
              console.log('Failed to parse login response');
            }
          }
        });
      });
      
      req.on('error', (e) => {
        console.error('Login request failed:', e.message);
      });
      
      req.write(loginData);
      req.end();
      
      function testSuperadminWithToken(token) {
        console.log('\n=== Testing Superadmin Overview ===');
        
        const overviewOptions = {
          hostname: '127.0.0.1',
          port: 4005,
          path: '/api/superadmin/overview',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        const overviewReq = http.request(overviewOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            console.log(`Overview Status: ${res.statusCode}`);
            
            if (res.statusCode === 200) {
              try {
                const overviewData = JSON.parse(data);
                console.log('Superadmin Overview Success!');
                console.log('Totals:', overviewData.totals);
                
                const targetTenants = overviewData.tenants?.filter(t => 
                  t.name?.toLowerCase().includes('nitra') || 
                  t.name?.toLowerCase().includes('starlight')
                ) || [];
                
                console.log('\nTarget Tenants:');
                targetTenants.forEach(tenant => {
                  console.log(`- ${tenant.name}: ${tenant.patients} patients, ${tenant.doctors} doctors, ${tenant.bedsAvailable} beds`);
                });
                
              } catch (e) {
                console.log('Failed to parse overview:', data);
              }
            } else {
              console.log('Overview failed:', data);
            }
          });
        });
        
        overviewReq.on('error', (e) => {
          console.error('Overview request failed:', e.message);
        });
        
        overviewReq.end();
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
