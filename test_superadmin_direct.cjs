const { query } = require('./server/db/connection.js');
const { getSuperadminOverview } = require('./server/services/superadminMetrics.service.js');

(async () => {
  try {
    console.log('=== Testing Superadmin Overview Directly ===');
    
    // First check if we have the right data
    console.log('\n=== Checking NHSL Data ===');
    const nhslPatients = await query('SELECT COUNT(*) as count FROM nhsl.patients');
    // const nhslStaff = await query('SELECT COUNT(*) as count FROM nhsl.staff'); // staff table doesn't exist
    const nhslEmployees = await query('SELECT COUNT(*) as count FROM nhsl.employees');
    const nhslDoctors = await query('SELECT COUNT(*) as count FROM nhsl.employees WHERE lower(designation) LIKE \'%doctor%\' OR lower(designation) LIKE \'%consultant%\' OR lower(designation) LIKE \'%physician%\' OR lower(designation) LIKE \'%surgeon%\'');
    const nhslBeds = await query('SELECT COUNT(*) as count FROM nhsl.beds');
    const nhslAvailableBeds = await query('SELECT COUNT(*) as count FROM nhsl.beds WHERE status = \'available\'');
    
    console.log('NHSL Patients:', nhslPatients.rows[0].count);
    console.log('NHSL Employees:', nhslEmployees.rows[0].count);
    console.log('NHSL Doctors:', nhslDoctors.rows[0].count);
    console.log('NHSL Beds:', nhslBeds.rows[0].count);
    console.log('NHSL Available Beds:', nhslAvailableBeds.rows[0].count);
    
    console.log('\n=== Checking Starlight Data ===');
    const starlightPatients = await query('SELECT COUNT(*) as count FROM smcmega.patients');
    const starlightEmployees = await query('SELECT COUNT(*) as count FROM smcmega.employees');
    const starlightDoctors = await query('SELECT COUNT(*) as count FROM smcmega.employees WHERE lower(designation) LIKE \'%doctor%\' OR lower(designation) LIKE \'%consultant%\' OR lower(designation) LIKE \'%physician%\' OR lower(designation) LIKE \'%surgeon%\'');
    const starlightBeds = await query('SELECT COUNT(*) as count FROM smcmega.beds');
    const starlightAvailableBeds = await query('SELECT COUNT(*) as count FROM smcmega.beds WHERE status = \'available\'');
    
    console.log('Starlight Patients:', starlightPatients.rows[0].count);
    console.log('Starlight Employees:', starlightEmployees.rows[0].count);
    console.log('Starlight Doctors:', starlightDoctors.rows[0].count);
    console.log('Starlight Beds:', starlightBeds.rows[0].count);
    console.log('Starlight Available Beds:', starlightAvailableBeds.rows[0].count);
    
    console.log('\n=== Testing Superadmin Overview Function ===');
    const overview = await getSuperadminOverview();
    
    console.log('Superadmin Overview Results:');
    console.log('Total Tenants:', overview.totals.tenants);
    console.log('Total Doctors:', overview.totals.doctors);
    console.log('Total Patients:', overview.totals.patients);
    console.log('Available Beds:', overview.totals.bedsAvailable);
    console.log('Available Ambulances:', overview.totals.ambulancesAvailable);
    
    console.log('\nTenant Details:');
    overview.tenants.forEach(tenant => {
      console.log(`- ${tenant.name}: ${tenant.patients} patients, ${tenant.doctors} doctors, ${tenant.bedsAvailable} beds`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
