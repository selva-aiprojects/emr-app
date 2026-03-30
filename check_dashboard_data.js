const { query } = require('./server/db/connection.js');

async function checkDashboardData() {
  console.log('🔍 Checking dashboard data availability...');
  
  try {
    // Check if tables exist and have data
    const tables = await query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'emr' 
      ORDER BY table_name
    `);
    
    console.log('📊 Available tables:', tables.rows.map(t => t.table_name));
    
    // Check specific key tables for dashboard metrics
    const checks = await Promise.all([
      // Patients
      query('SELECT COUNT(*) as count FROM emr.patients LIMIT 1'),
      // Appointments  
      query('SELECT COUNT(*) as count FROM emr.appointments LIMIT 1'),
      // Invoices/Revenue
      query('SELECT COUNT(*) as count FROM emr.invoices LIMIT 1'),
      // Beds
      query('SELECT COUNT(*) as count FROM emr.beds LIMIT 1'),
      // Departments
      query('SELECT COUNT(*) as count FROM emr.departments LIMIT 1')
    ]);
    
    console.log('📈 Data availability:');
    console.log('  Patients:', checks[0].rows[0]?.count || 0);
    console.log('  Appointments:', checks[1].rows[0]?.count || 0);
    console.log('  Invoices:', checks[2].rows[0]?.count || 0);
    console.log('  Beds:', checks[3].rows[0]?.count || 0);
    console.log('  Departments:', checks[4].rows[0]?.count || 0);
    
    // Check for New Age Hospital specifically
    const nahData = await query(`
      SELECT 
        COUNT(DISTINCT id) as tenant_count,
        STRING_AGG(name, ', ') as tenant_names
      FROM emr.tenants 
      WHERE name ILIKE '%new age%' OR code ILIKE '%nah%'
    `);
    
    console.log('🏥 New Age Hospital data:', nahData.rows[0]);
    
    // Test dashboard metrics call directly
    const { getRealtimeDashboardMetrics } = require('./server/enhanced_dashboard_metrics_fixed.mjs');
    const metrics = await getRealtimeDashboardMetrics('f998a8f5-95b9-4fd7-a583-63cf574d65ed');
    console.log('📊 Dashboard metrics result:', metrics);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error checking dashboard data:', error);
    process.exit(1);
  }
}

checkDashboardData();
