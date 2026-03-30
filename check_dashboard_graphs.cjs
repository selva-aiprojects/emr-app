const { query } = require('./server/db/connection.js');

async function checkDashboardGraphs() {
  console.log('🔍 Checking dashboard graphs and metrics...');
  
  try {
    // Check if dashboard metrics are returning real data
    const { getRealtimeDashboardMetrics } = require('./server/enhanced_dashboard_metrics_fixed.mjs');
    const metrics = await getRealtimeDashboardMetrics('f998a8f5-95b9-4fd7-a583-63cf574d65ed');
    
    console.log('📊 Dashboard metrics result:');
    console.log('  todayAppointments:', metrics.todayAppointments);
    console.log('  todayRevenue:', metrics.todayRevenue);
    console.log('  todayPatients:', metrics.todayPatients);
    console.log('  todayAdmissions:', metrics.todayAdmissions);
    console.log('  todayDischarges:', metrics.todayDischarges);
    console.log('  occupiedBeds:', metrics.occupiedBeds);
    console.log('  availableBeds:', metrics.availableBeds);
    console.log('  totalBeds:', metrics.totalBeds);
    console.log('  criticalLabResults:', metrics.criticalLabResults);
    
    // Check if there's actual data for today
    const actualDataCheck = await query(`
      SELECT 
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_patients,
        COUNT(CASE WHEN DATE(scheduled_start) = CURRENT_DATE THEN 1 END) as today_appointments,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE AND status = 'paid' THEN 1 END) as today_invoices,
        COUNT(CASE WHEN DATE(visit_date) = CURRENT_DATE AND encounter_type = 'admission' THEN 1 END) as today_admissions,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_beds
      FROM emr.patients
      LEFT JOIN emr.appointments ON patients.id = appointments.patient_id
      LEFT JOIN emr.invoices ON patients.id = invoices.patient_id
      LEFT JOIN emr.encounters ON patients.id = encounters.patient_id
      LEFT JOIN emr.beds ON beds.id = encounters.bed_id
      WHERE emr.patients.tenant_id = $1
    `);
    
    console.log('\n📈 Actual data check result:');
    actualDataCheck.rows.forEach(row => {
      console.log(`  ${JSON.stringify(row)}`);
    });
    
    // Check master stats tables
    const masterStatsCheck = await query(`
      SELECT 
        COUNT(DISTINCT id) as departments,
        COUNT(DISTINCT id) as wards,
        COUNT(DISTINCT id) as beds,
        COUNT(DISTINCT id) as services
      FROM emr.departments
      LEFT JOIN emr.wards ON departments.id = wards.department_id
      LEFT JOIN emr.beds ON wards.id = beds.ward_id
      LEFT JOIN emr.services ON departments.id = services.department_id
      WHERE departments.tenant_id = $1
    `);
    
    console.log('\n📊 Master stats check result:');
    masterStatsCheck.rows.forEach(row => {
      console.log(`  Departments: ${row.departments}, Wards: ${row.wards}, Beds: ${row.beds}, Services: ${row.services}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking dashboard graphs:', error);
    process.exit(1);
  }
}

checkDashboardGraphs();
