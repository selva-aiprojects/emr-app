const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Checking Doctors Trigger Logic ===');
    
    const nhslTenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
    
    // Check what the current trigger function is doing
    console.log('=== Current NHSL Doctors Count ===');
    const currentDoctors = await query(`
      SELECT COUNT(*) as count 
      FROM nhsl.employees 
      WHERE tenant_id = $1 AND (lower(designation) LIKE '%doctor%' OR lower(designation) LIKE '%consultant%' OR lower(designation) LIKE '%physician%' OR lower(designation) LIKE '%surgeon%')
    `, [nhslTenantId]);
    
    console.log('Actual NHSL doctors:', currentDoctors.rows[0].count);
    
    // Note: The trigger is looking at users table but doctors are in employees table
    console.log('Note: Trigger is looking at wrong table (users instead of employees)');
    
    // Manually update the cache with correct doctor count
    console.log('\n=== Manually Updating Doctor Count ===');
    const updateResult = await query(`
      UPDATE emr.management_tenant_metrics 
      SET doctors_count = $1, updated_at = NOW()
      WHERE tenant_id = $2
    `, [currentDoctors.rows[0].count, nhslTenantId]);
    
    console.log('Update result:', updateResult.rowCount, 'rows affected');
    
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
    
    // Test the superadmin overview again
    console.log('\n=== Testing Superadmin Overview After Fix ===');
    const { getSuperadminOverview } = require('./server/services/superadminMetrics.service.js');
    const overview = await getSuperadminOverview();
    
    console.log('Superadmin Overview Results:');
    console.log('Total Tenants:', overview.totals.tenants);
    console.log('Total Doctors:', overview.totals.doctors);
    console.log('Total Patients:', overview.totals.patients);
    console.log('Available Beds:', overview.totals.bedsAvailable);
    
    console.log('\nTarget Tenant Details:');
    overview.tenants.forEach(tenant => {
      if (tenant.name?.toLowerCase().includes('nitra') || tenant.name?.toLowerCase().includes('starlight')) {
        console.log(`- ${tenant.name}: ${tenant.patients} patients, ${tenant.doctors} doctors, ${tenant.bedsAvailable} beds`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
