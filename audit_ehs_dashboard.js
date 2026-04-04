const { query } = require('./server/db/connection.js');

async function checkEhsDashboard() {
  try {
    const tenantResult = await query("SELECT id, name, code FROM emr.tenants WHERE code = 'EHS'");
    if (tenantResult.rows.length === 0) {
      console.log('❌ EHS tenant not found!');
      process.exit(1);
    }

    const ehs = tenantResult.rows[0];
    const tenantId = ehs.id;
    console.log(`🏥 Found EHS Tenant: ${ehs.name} (${tenantId})`);

    // Today's metrics
    const [
      appointments,
      revenue,
      patients,
      admissions,
      discharges,
      beds_occupied,
      beds_available,
      beds_total
    ] = await Promise.all([
      query("SELECT * FROM emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = CURRENT_DATE", [tenantId]),
      query("SELECT * FROM emr.invoices WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = 'paid'", [tenantId]),
      query("SELECT * FROM emr.patients WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE", [tenantId]),
      query("SELECT * FROM emr.encounters WHERE tenant_id = $1 AND DATE(visit_date) = CURRENT_DATE AND encounter_type = 'admission'", [tenantId]),
      query("SELECT * FROM emr.encounters WHERE tenant_id = $1 AND DATE(visit_date) = CURRENT_DATE AND encounter_type = 'discharge'", [tenantId]),
      query("SELECT * FROM emr.beds WHERE tenant_id = $1 AND status = 'occupied'", [tenantId]),
      query("SELECT * FROM emr.beds WHERE tenant_id = $1 AND status != 'occupied'", [tenantId]),
      query("SELECT * FROM emr.beds WHERE tenant_id = $1", [tenantId])
    ]);

    console.log('\n📊 Real-time Dashboard Metrics for EHS:');
    console.log(`  - Appointments Today: ${appointments.rows.length}`);
    console.log(`  - Revenue Today: ${revenue.rows.reduce((sum, r) => sum + parseFloat(r.total || 0), 0)}`);
    console.log(`  - Patients Registered Today: ${patients.rows.length}`);
    console.log(`  - Admissions Today: ${admissions.rows.length}`);
    console.log(`  - Discharges Today: ${discharges.rows.length}`);
    console.log(`  - Bed Occupancy: ${beds_occupied.rows.length} / ${beds_total.rows.length}`);

    if (appointments.rows.length > 0) {
      console.log('\n📅 Appointment Records:');
      appointments.rows.forEach(r => console.log(`    ID: ${r.id}, Status: ${r.status}, Start: ${r.scheduled_start}`));
    }
    
    if (revenue.rows.length > 0) {
      console.log('\n💸 Revenue Records:');
      revenue.rows.forEach(r => console.log(`    ID: ${r.id}, Amount: ${r.total}, Status: ${r.status}`));
    }

    if (patients.rows.length > 0) {
        console.log('\n👤 Patient Records:');
        patients.rows.forEach(r => console.log(`    ID: ${r.id}, Name: ${r.first_name} ${r.last_name}, Created: ${r.created_at}`));
    }

    if (admissions.rows.length > 0) {
        console.log('\n🏥 Admission Records (Encounters):');
        admissions.rows.forEach(r => console.log(`    ID: ${r.id}, Type: ${r.encounter_type}, Date: ${r.visit_date}`));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking EHS dashboard:', error);
    process.exit(1);
  }
}

checkEhsDashboard();
