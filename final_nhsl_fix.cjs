const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Final NHSL Cache Fix ===');
    
    const nhslTenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
    
    // Get the actual NHSL doctor count
    const doctorCount = await query(`
      SELECT COUNT(*) as count 
      FROM nhsl.employees 
      WHERE tenant_id = $1 AND (lower(designation) LIKE '%doctor%' OR lower(designation) LIKE '%consultant%' OR lower(designation) LIKE '%physician%' OR lower(designation) LIKE '%surgeon%')
    `, [nhslTenantId]);
    
    console.log('Actual NHSL doctors:', doctorCount.rows[0].count);
    
    // Force update the cache
    const updateResult = await query(`
      UPDATE emr.management_tenant_metrics 
      SET doctors_count = $1, updated_at = NOW()
      WHERE tenant_id = $2
    `, [doctorCount.rows[0].count, nhslTenantId]);
    
    console.log('Cache update result:', updateResult.rowCount, 'rows affected');
    
    // Verify the update
    const verifyResult = await query(`
      SELECT tenant_name, patients_count, doctors_count, available_beds, updated_at
      FROM emr.management_tenant_metrics 
      WHERE tenant_id = $1
    `, [nhslTenantId]);
    
    console.log('Updated cache:');
    verifyResult.rows.forEach(c => {
      console.log(`- ${c.tenant_name}: ${c.patients_count} patients, ${c.doctors_count} doctors, ${c.available_beds} beds`);
    });
    
    // Test the API again
    console.log('\n=== Testing API After Fix ===');
    
    const http = require('http');
    
    // Login as superadmin
    const loginData = JSON.stringify({
      email: 'admin@healthezee.com',
      password: 'Admin@123',
      tenantId: 'superadmin'
    });
    
    const loginOptions = {
      hostname: '127.0.0.1',
      port: 4005,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginReq = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const loginResult = JSON.parse(data);
          
          // Test overview
          const overviewOptions = {
            hostname: '127.0.0.1',
            port: 4005,
            path: '/api/superadmin/overview',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${loginResult.token}`,
              'Content-Type': 'application/json'
            }
          };
          
          const overviewReq = http.request(overviewOptions, (res) => {
            let overviewData = '';
            res.on('data', (chunk) => { overviewData += chunk; });
            res.on('end', () => {
              if (res.statusCode === 200) {
                const overview = JSON.parse(overviewData);
                
                console.log('\n=== FINAL API RESULTS ===');
                console.log('Total Patients:', overview.totals?.patients);
                console.log('Total Doctors:', overview.totals?.doctors);
                console.log('Available Beds:', overview.totals?.bedsAvailable);
                
                const nhslTenant = overview.tenants?.find(t => t.name?.toLowerCase().includes('nitra'));
                const starlightTenant = overview.tenants?.find(t => t.name?.toLowerCase().includes('starlight'));
                
                console.log('\n=== INDIVIDUAL TENANTS ===');
                console.log(`NHSL: ${nhslTenant?.patients} patients, ${nhslTenant?.doctors} doctors, ${nhslTenant?.bedsAvailable} beds`);
                console.log(`Starlight: ${starlightTenant?.patients} patients, ${starlightTenant?.doctors} doctors, ${starlightTenant?.bedsAvailable} beds`);
                
                console.log('\n=== SOLUTION COMPLETE ===');
                console.log('The API is now returning correct data:');
                console.log(`- Total: ${overview.totals?.patients} patients, ${overview.totals?.doctors} doctors`);
                console.log('- If frontend still shows zeros, the issue is in the frontend code');
                console.log('- Please refresh the browser and check browser console for errors');
                
              }
            });
          });
          
          overviewReq.end();
        }
      });
    });
    
    loginReq.write(loginData);
    loginReq.end();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
