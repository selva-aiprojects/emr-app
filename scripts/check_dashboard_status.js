import { query } from '../server/db/connection.js';

async function checkDashboardStatus() {
  console.log(' Checking Dashboard Data Status...\n');

  try {
    // Get tenant ID
    const tenantResult = await query(
      'SELECT id FROM emr.tenants WHERE code = $1',
      ['DEMO']
    );

    if (tenantResult.rows.length === 0) {
      console.log(' DEMO tenant not found!');
      return;
    }

    const tenantId = tenantResult.rows[0].id;
    console.log(` Found DEMO tenant with ID: ${tenantId}\n`);

    // Check overall data counts
    const [patients, appointments, invoices, encounters, beds, departments] = await Promise.all([
      query('SELECT COUNT(*) as count FROM patients WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM invoices WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM encounters WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM beds WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM departments WHERE tenant_id = $1', [tenantId])
    ]);
    
    let users = { rows: [{ count: 0 }] };
    try {
      users = await query('SELECT COUNT(*) as count FROM users WHERE tenant_id = $1', [tenantId]);
    } catch (e) {
      console.log(' Users table not found, using 0');
    }

    console.log('=== OVERALL DATA STATUS ===');
    console.log(` Patients: ${patients.rows[0].count}`);
    console.log(` Appointments: ${appointments.rows[0].count}`);
    console.log(` Invoices: ${invoices.rows[0].count}`);
    console.log(` Encounters: ${encounters.rows[0].count}`);
    console.log(` Beds: ${beds.rows[0].count}`);
    console.log(` Departments: ${departments.rows[0].count}`);
    console.log(` Users: ${users.rows[0].count}`);

    // Check today's activity
    const [todayPatients, todayAppointments, todayInvoices] = await Promise.all([
      query('SELECT COUNT(*) as count FROM patients WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE', [tenantId]),
      query('SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE', [tenantId]),
      query('SELECT COUNT(*) as count FROM invoices WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE', [tenantId])
    ]);

    console.log('\n=== TODAY\'S ACTIVITY ===');
    console.log(` New Patients Today: ${todayPatients.rows[0].count}`);
    console.log(` Appointments Today: ${todayAppointments.rows[0].count}`);
    console.log(` Invoices Today: ${todayInvoices.rows[0].count}`);

    // Check bed occupancy
    const [occupiedBeds, availableBeds] = await Promise.all([
      query('SELECT COUNT(*) as count FROM beds WHERE tenant_id = $1 AND status = \'occupied\'', [tenantId]),
      query('SELECT COUNT(*) as count FROM beds WHERE tenant_id = $1 AND status != \'occupied\'', [tenantId])
    ]);

    console.log('\n=== BED STATUS ===');
    console.log(` Occupied Beds: ${occupiedBeds.rows[0].count}`);
    console.log(` Available Beds: ${availableBeds.rows[0].count}`);
    console.log(` Occupancy Rate: ${((occupiedBeds.rows[0].count / beds.rows[0].count) * 100).toFixed(1)}%`);

    // Check additional data for dashboard
    const [bloodUnits, ambulances, inventoryItems] = await Promise.all([
      query('SELECT COUNT(*) as count FROM blood_units WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM ambulances WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*) as count FROM inventory_items WHERE tenant_id = $1', [tenantId])
    ]);

    console.log('\n=== ADDITIONAL DATA ===');
    console.log(` Blood Bank Units: ${bloodUnits.rows[0].count}`);
    console.log(` Ambulances: ${ambulances.rows[0].count}`);
    console.log(` Inventory Items: ${inventoryItems.rows[0].count}`);

    // Check dashboard readiness
    console.log('\n=== DASHBOARD READINESS ===');
    
    const hasPatients = patients.rows[0].count > 0;
    const hasAppointments = appointments.rows[0].count > 0;
    const hasInvoices = invoices.rows[0].count > 0;
    const hasEncounters = encounters.rows[0].count > 0;
    const hasBeds = beds.rows[0].count > 0;
    const hasTodayActivity = todayAppointments.rows[0].count > 0 || todayInvoices.rows[0].count > 0;

    console.log(` Patient Data: ${hasPatients ? 'Available' : 'Missing'}`);
    console.log(` Appointment Data: ${hasAppointments ? 'Available' : 'Missing'}`);
    console.log(` Invoice Data: ${hasInvoices ? 'Available' : 'Missing'}`);
    console.log(` Encounter Data: ${hasEncounters ? 'Available' : 'Missing'}`);
    console.log(` Bed Data: ${hasBeds ? 'Available' : 'Missing'}`);
    console.log(` Today\'s Activity: ${hasTodayActivity ? 'Available' : 'Missing'}`);

    // Overall assessment
    const readyMetrics = [hasPatients, hasAppointments, hasInvoices, hasEncounters, hasBeds].filter(Boolean).length;
    const totalMetrics = 5;
    const readinessScore = (readyMetrics / totalMetrics) * 100;

    console.log(`\n Overall Dashboard Data Score: ${readinessScore.toFixed(1)}%`);

    if (readinessScore >= 80) {
      console.log(' Status: EXCELLENT - Dashboard should show comprehensive data');
    } else if (readinessScore >= 60) {
      console.log(' Status: GOOD - Dashboard should show most data with some gaps');
    } else if (readinessScore >= 40) {
      console.log(' Status: FAIR - Dashboard will show limited data');
    } else {
      console.log(' Status: POOR - Dashboard will show minimal data');
    }

    // Specific recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    if (!hasInvoices) {
      console.log(' - Add invoice data for revenue metrics');
    }
    if (!hasTodayActivity) {
      console.log(' - Add today\'s appointments and invoices for live dashboard');
    }
    if (todayInvoices.rows[0].count === 0) {
      console.log(' - Create today\'s invoices for revenue display');
    }

    return {
      success: true,
      readinessScore: readinessScore,
      hasPatients,
      hasAppointments,
      hasInvoices,
      hasEncounters,
      hasBeds,
      hasTodayActivity
    };

  } catch (error) {
    console.error(' Error checking dashboard status:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the check
checkDashboardStatus().then(result => {
  if (result.success) {
    console.log('\n Dashboard status check completed!');
    process.exit(0);
  } else {
    console.log('\n Dashboard status check failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error(' Check execution failed:', error);
  process.exit(1);
});
