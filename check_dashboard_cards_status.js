import { query } from './server/db/connection.js';
import { getTenantSchema } from './server/utils/tenant-schema-helper.js';

async function checkDashboardCardsStatus() {
  try {
    console.log('=== CHECKING DASHBOARD CARDS STATUS ===\n');
    
    const tenants = [
      { name: 'DEMO', id: '20d07615-8de9-49b4-9929-ec565197e6f4' },
      { name: 'NHGL', id: 'b01f0cdc-4e8b-4db5-ba71-e657a414695e' }
    ];
    
    for (const tenant of tenants) {
      console.log(`\n=== ${tenant.name} TENANT ===`);
      
      // Get the schema for this tenant
      const schemaName = await getTenantSchema(tenant.id);
      console.log(`Schema: ${schemaName}`);
      
      // Check key dashboard metrics
      const metrics = await Promise.all([
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.patients WHERE tenant_id = $1`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.appointments WHERE tenant_id = $1`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.beds WHERE tenant_id = $1`, [tenant.id]),
        query(`SELECT COUNT(*)::int as occupied FROM ${schemaName}.beds WHERE tenant_id = $1 AND status = 'occupied'`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.lab_tests WHERE tenant_id = $1`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.blood_units WHERE tenant_id = $1`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.employees WHERE tenant_id = $1`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.inventory_items WHERE tenant_id = $1`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.service_requests WHERE tenant_id = $1`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.frontdesk_visits WHERE tenant_id = $1`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.walkins WHERE tenant_id = $1`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.discharges WHERE tenant_id = $1`, [tenant.id])
      ]);
      
      console.log(`\n${tenant.name} Dashboard Metrics:`);
      console.log(` Total Patients: ${metrics[0].rows[0].count}`);
      console.log(` Total Appointments: ${metrics[1].rows[0].count}`);
      console.log(` Total Beds: ${metrics[2].rows[0].count}`);
      console.log(` Occupied Beds: ${metrics[4].rows[0].occupied || 0}`);
      console.log(` Bed Occupancy Rate: ${metrics[2].rows[0].count > 0 ? (((metrics[4].rows[0].occupied || 0) / metrics[2].rows[0].count) * 100).toFixed(1) : 0}%`);
      console.log(` Lab Tests Available: ${metrics[5].rows[0].count}`);
      console.log(` Blood Units Available: ${metrics[6].rows[0].count}`);
      console.log(` Total Employees: ${metrics[7].rows[0].count}`);
      console.log(` Inventory Items: ${metrics[8].rows[0].count}`);
      console.log(` Service Requests: ${metrics[9].rows[0].count}`);
      console.log(` Front Desk Visits: ${metrics[10].rows[0].count}`);
      console.log(` Walk-ins: ${metrics[11].rows[0].count}`);
      console.log(` Discharges: ${metrics[12].rows[0].count}`);
      
      // Check specific cards that were showing zeros
      console.log(`\n${tenant.name} Specific Card Status:`);
      
      // Blood Bank card
      const bloodBankData = await Promise.all([
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.blood_units WHERE tenant_id = $1`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.blood_requests WHERE tenant_id = $1`, [tenant.id])
      ]);
      console.log(` Blood Bank - Blood Units Available: ${bloodBankData[0].rows[0].count}`);
      console.log(` Blood Bank - Blood Requests: ${bloodBankData[1].rows[0].count}`);
      
      // Lab Tests card
      const labTestsData = await Promise.all([
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.lab_tests WHERE tenant_id = $1`, [tenant.id]),
        query(`SELECT COUNT(*)::int as completed FROM ${schemaName}.diagnostic_reports WHERE tenant_id = $1 AND status = 'completed'`, [tenant.id])
      ]);
      console.log(` Lab Tests - Available Tests: ${labTestsData[0].rows[0].count}`);
      console.log(` Lab Tests - Completed Reports: ${labTestsData[1].rows[0].count}`);
      
      // Revenue Mix by Service card
      const revenueData = await Promise.all([
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.invoice_items WHERE tenant_id = $1`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.services WHERE tenant_id = $1`, [tenant.id])
      ]);
      console.log(` Revenue Mix - Invoice Items: ${revenueData[0].rows[0].count}`);
      console.log(` Revenue Mix - Services: ${revenueData[1].rows[0].count}`);
      
      // No-Show Analysis card
      const noShowData = await Promise.all([
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.appointments WHERE tenant_id = $1 AND status = 'no-show' AND DATE(scheduled_start) >= CURRENT_DATE - INTERVAL '7 days'`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.appointments WHERE tenant_id = $1 AND status = 'cancelled' AND DATE(scheduled_start) >= CURRENT_DATE - INTERVAL '7 days'`, [tenant.id])
      ]);
      console.log(` No-Show Analysis - No-Shows (7 days): ${noShowData[0].rows[0].count}`);
      console.log(` No-Show Analysis - Cancellations (7 days): ${noShowData[1].rows[0].count}`);
      
      // Patients Waiting (queue) card
      const waitingPatientsData = await Promise.all([
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.frontdesk_visits WHERE tenant_id = $1 AND status = 'waiting'`, [tenant.id]),
        query(`SELECT COUNT(*)::int as count FROM ${schemaName}.appointments WHERE tenant_id = $1 AND status = 'scheduled' AND DATE(scheduled_start) <= CURRENT_DATE + INTERVAL '1 hour'`, [tenant.id])
      ]);
      console.log(` Patients Waiting - In Queue: ${waitingPatientsData[0].rows[0].count}`);
      console.log(` Patients Waiting - Scheduled Next Hour: ${waitingPatientsData[1].rows[0].count}`);
      
      // Check if any cards have zero values
      const zeroCards = [
        { name: 'Patients', count: metrics[0].rows[0].count },
        { name: 'Appointments', count: metrics[1].rows[0].count },
        { name: 'Beds', count: metrics[2].rows[0].count },
        { name: 'Lab Tests', count: metrics[5].rows[0].count },
        { name: 'Blood Units', count: data[6].rows[0].count },
        { name: 'Employees', count: metrics[7].rows[0].count },
        { name: 'Inventory Items', count: metrics[8].rows[0].count },
        { name: 'Service Requests', count: metrics[9].rows[0].count },
        { name: 'Front Desk Visits', count: metrics[10].rows[0].count },
        { name: 'Walk-ins', count: metrics[11].rows[0].count },
        { name: 'Discharges', count: metrics[12].rows[0].count }
      ];
      
      const zeroCards = zeroCards.filter(card => card.count === 0);
      
      if (zeroCards.length > 0) {
        console.log(`\n${tenant.name} CARDS SHOWING ZER:`);
        zeroCards.forEach(card => {
          console.log(`  ${card.name}: ${card.count}`);
        });
      } else {
        console.log(`\n${tenant.name} ALL CARDS HAVE DATA`);
      }
      
      console.log(`\n${tenant.name} Reports Page Status: ${zeroCards.length === 0 ? 'READY' : 'ISSUES DETECTED'}`);
    }
    
    console.log('\n=== RECOMMENDATIONS ===');
    
    if (zeroCards.length > 0) {
      console.log('\nISSUES FOUND:');
      console.log('1. Run data seeding scripts to populate missing data');
      console.log('2. Check if tables exist in the correct schema');
      console.log('3. Verify tenant data completeness');
      console.log('4. Test Reports API endpoints');
    } else {
      console.log('\nALL CARDS ARE POPULATED - Dashboard should work correctly');
      console.log('Reports & Analysis page should display complete data');
    }
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Refresh the dashboard page');
    console.log('2. Check browser console for any JavaScript errors');
    console.log('3. Verify API calls are working correctly');
    console.log('4. Test Reports & Analysis page functionality');
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking dashboard cards:', err.message);
    process.exit(1);
  }
}

checkDashboardCardsStatus();
