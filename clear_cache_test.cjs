const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Clearing NHSL Cache and Testing ===');
    
    const nhslTenantId = 'a730192d-efe3-4fd8-82a3-829ad905acff';
    
    // Clear NHSL from cache
    const deleteResult = await query('DELETE FROM emr.management_tenant_metrics WHERE tenant_id = $1', [nhslTenantId]);
    console.log('Deleted NHSL from cache:', deleteResult.rowCount, 'rows');
    
    // Clear global summary cache
    const deleteSummary = await query('DELETE FROM emr.management_dashboard_summary WHERE summary_key = \'global\'');
    console.log('Deleted global summary:', deleteSummary.rowCount, 'rows');
    
    // Now test superadmin overview
    console.log('\n=== Testing Superadmin After Cache Clear ===');
    const { getSuperadminOverview } = require('./server/services/superadminMetrics.service.js');
    const overview = await getSuperadminOverview();
    
    console.log('Superadmin Overview Results:');
    console.log('Total Tenants:', overview.totals.tenants);
    console.log('Total Doctors:', overview.totals.doctors);
    console.log('Total Patients:', overview.totals.patients);
    console.log('Available Beds:', overview.totals.bedsAvailable);
    console.log('Available Ambulances:', overview.totals.ambulancesAvailable);
    
    console.log('\nTenant Details:');
    overview.tenants.forEach(tenant => {
      if (tenant.name.toLowerCase().includes('nitra') || tenant.name.toLowerCase().includes('starlight')) {
        console.log(`- ${tenant.name}: ${tenant.patients} patients, ${tenant.doctors} doctors, ${tenant.bedsAvailable} beds`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
