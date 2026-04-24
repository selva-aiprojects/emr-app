import { pool } from './server/db/connection.js';

async function checkNHGLTenant() {
  try {
    console.log('🔍 Checking NHGL tenant status...\n');
    
    // Check all tenants
    const allTenantsQuery = `
      SELECT id, name, code, subdomain, status, logo_url, created_at, updated_at 
      FROM emr.tenants 
      ORDER BY code
    `;
    
    const allTenantsResult = await pool.query(allTenantsQuery);
    
    console.log('📋 All Tenants:');
    console.log('ID\t\t\t\tName\t\t\tCode\tStatus\tSubdomain');
    console.log('─'.repeat(100));
    
    allTenantsResult.rows.forEach(tenant => {
      console.log(`${tenant.id}\t${tenant.name.padEnd(20)}\t${tenant.code}\t${tenant.status}\t${tenant.subdomain || 'N/A'}`);
    });
    
    // Check specifically for NHGL
    const nhglQuery = `
      SELECT id, name, code, subdomain, status, logo_url, created_at, updated_at 
      FROM emr.tenants 
      WHERE code = 'NHGL'
    `;
    
    const nhglResult = await pool.query(nhglQuery);
    
    console.log('\n🎯 NHGL Tenant Details:');
    if (nhglResult.rows.length > 0) {
      const nhgl = nhglResult.rows[0];
      console.log(`ID: ${nhgl.id}`);
      console.log(`Name: ${nhgl.name}`);
      console.log(`Code: ${nhgl.code}`);
      console.log(`Status: ${nhgl.status}`);
      console.log(`Subdomain: ${nhgl.subdomain}`);
      console.log(`Logo URL: ${nhgl.logo_url}`);
      console.log(`Created: ${nhgl.created_at}`);
      console.log(`Updated: ${nhgl.updated_at}`);
      
      if (nhgl.status !== 'active') {
        console.log('\n⚠️  ISSUE: NHGL status is not "active"');
        console.log('This is why it\'s not appearing in the login dropdown');
        
        // Update NHGL to active status
        console.log('\n🔧 Fixing NHGL status to "active"...');
        const updateQuery = `
          UPDATE emr.tenants 
          SET status = 'active', updated_at = CURRENT_TIMESTAMP 
          WHERE code = 'NHGL'
        `;
        await pool.query(updateQuery);
        console.log('✅ NHGL status updated to "active"');
      } else {
        console.log('\n✅ NHGL status is already "active"');
        console.log('The issue might be elsewhere');
      }
    } else {
      console.log('❌ NHGL tenant not found in database');
    }
    
    // Check what the login API would return
    console.log('\n🌐 What the login API would return:');
    const publicTenantsQuery = `
      SELECT id, name, code, subdomain, logo_url 
      FROM emr.tenants 
      WHERE status = 'active' 
      LIMIT 100
    `;
    
    const publicTenantsResult = await pool.query(publicTenantsQuery);
    console.log(`Found ${publicTenantsResult.rows.length} active tenants:`);
    publicTenantsResult.rows.forEach(tenant => {
      console.log(`- ${tenant.name} (${tenant.code}) - ${tenant.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking NHGL tenant:', error);
  } finally {
    await pool.end();
  }
}

checkNHGLTenant();
