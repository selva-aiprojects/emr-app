const { query } = require('./server/db/connection.js');
const { getTenantSchema } = require('./server/utils/tenant-schema-helper.js');

async function getDemoDashboardMetrics(tenantId) {
  try {
    console.log('Getting demo dashboard metrics for Starlight...');
    
    // Get the tenant schema dynamically
    const schemaName = await getTenantSchema(tenantId);
    console.log(`Using schema: ${schemaName} for tenant: ${tenantId}`);
    
    // Calculate all-time metrics (not just today's)
    const [
      totalAppointments,
      totalRevenue,
      totalPatients,
      totalAdmissions,
      totalDischarges,
      occupiedBeds,
      availableBeds,
      totalBeds,
      criticalLabResults,
      bloodUnits,
      labPending,
      totalLabToday,
      ambulancesTotal,
      ambulancesAvailable,
      todayRevenue,
      todayPatients
    ] = await Promise.all([
      // Total appointments (all time)
      query(`SELECT COUNT(*) as count FROM ${schemaName}.appointments WHERE tenant_id = $1`, [tenantId]),
      
      // Total revenue (all time, paid invoices)
      query(`SELECT COALESCE(SUM(total), 0) as total FROM ${schemaName}.invoices WHERE tenant_id = $1 AND status = 'paid'`, [tenantId]),
      
      // Total patients (all time)
      query(`SELECT COUNT(*) as count FROM ${schemaName}.patients WHERE tenant_id = $1`, [tenantId]),
      
      // Total admissions (all time)
      query(`SELECT COUNT(*) as count FROM ${schemaName}.encounters WHERE tenant_id = $1 AND encounter_type = 'admission'`, [tenantId]),
      
      // Total discharges (all time)
      query(`SELECT COUNT(*) as count FROM ${schemaName}.encounters WHERE tenant_id = $1 AND encounter_type = 'discharge'`, [tenantId]),
      
      // Occupied beds
      query(`SELECT COUNT(*) as count FROM ${schemaName}.beds WHERE tenant_id = $1 AND status = 'occupied'`, [tenantId]),
      
      // Available beds
      query(`SELECT COUNT(*) as count FROM ${schemaName}.beds WHERE tenant_id = $1 AND status != 'occupied'`, [tenantId]),
      
      // Total beds
      query(`SELECT COUNT(*) as count FROM ${schemaName}.beds WHERE tenant_id = $1`, [tenantId]),
      
      // Critical lab results (all time)
      query(`
        SELECT COUNT(*) as count FROM ${schemaName}.service_requests 
        WHERE tenant_id = $1 AND category = 'lab' 
        AND (
          (CASE WHEN notes ~ '^\{.*\}$' THEN (notes::jsonb->>'criticalFlag') ELSE 'false' END = 'true')
            OR notes::text ILIKE '%critical%'
        )
      `, [tenantId]),

      // Blood Bank Units
      query(`SELECT COUNT(*) as count FROM ${schemaName}.blood_units WHERE tenant_id = $1`, [tenantId]),

      // Lab Progress (Pending)
      query(`SELECT COUNT(*) as count FROM ${schemaName}.service_requests WHERE tenant_id = $1 AND category = 'lab' AND status = 'pending'`, [tenantId]),
      
      // Total lab tests today
      query(`SELECT COUNT(*) as count FROM ${schemaName}.service_requests WHERE tenant_id = $1 AND category = 'lab' AND DATE(created_at) = CURRENT_DATE`, [tenantId]),
      
      // Ambulance fleet
      query(`SELECT COUNT(*) as count FROM ${schemaName}.ambulances WHERE tenant_id = $1`, [tenantId]),
      
      // Available ambulances
      query(`SELECT COUNT(*) as count FROM ${schemaName}.ambulances WHERE tenant_id = $1 AND (status = 'available' OR status = 'ready')`, [tenantId]),
      
      // Today's revenue (for growth calculation)
      query(`SELECT COALESCE(SUM(total), 0) as total FROM ${schemaName}.invoices WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = 'paid'`, [tenantId]),
      
      // Today's patients (for growth calculation)
      query(`SELECT COUNT(*) as count FROM ${schemaName}.patients WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE`, [tenantId])
    ]);

    return {
      todayAppointments: parseInt(totalAppointments.rows[0].count) || 0,
      todayRevenue: parseFloat(totalRevenue.rows[0].total) || 0,
      todayPatients: parseInt(totalPatients.rows[0].count) || 0,
      todayAdmissions: parseInt(totalAdmissions.rows[0].count) || 0,
      todayDischarges: parseInt(totalDischarges.rows[0].count) || 0,
      occupiedBeds: parseInt(occupiedBeds.rows[0].count) || 0,
      availableBeds: parseInt(availableBeds.rows[0].count) || 0,
      totalBeds: parseInt(totalBeds.rows[0].count) || 0,
      criticalLabResults: parseInt(criticalLabResults.rows[0].count) || 0,
      bloodBank: { value: parseInt(bloodUnits.rows[0].count) || 0, label: 'Units' },
      labProgress: { 
        value: parseInt(totalLabToday.rows[0].count) || 0, 
        pending: parseInt(labPending.rows[0].count) || 0 
      },
      fleetStatus: { 
        available: parseInt(ambulancesAvailable.rows[0].count) || 0, 
        total: parseInt(ambulancesTotal.rows[0].count) || 0, 
        active: (parseInt(ambulancesTotal.rows[0].count) || 0) - (parseInt(ambulancesAvailable.rows[0].count) || 0)
      },
      criticalAlerts: parseInt(criticalLabResults.rows[0].count) || 0,
      growth: { 
        revenue: 0, // No growth calculation for demo
        patients: 0 
      }
    };
  } catch (error) {
    console.error('Error getting demo dashboard metrics:', error);
    return {
      todayAppointments: 0,
      todayRevenue: 0,
      todayPatients: 0,
      todayAdmissions: 0,
      todayDischarges: 0,
      occupiedBeds: 0,
      availableBeds: 0,
      totalBeds: 0,
      criticalLabResults: 0,
      bloodBank: { value: 0, label: 'Units' },
      labProgress: { value: 0, pending: 0 },
      fleetStatus: { available: 0, total: 0, active: 0 },
      criticalAlerts: 0,
      growth: { revenue: 0, patients: 0 }
    };
  }
}

// Test the function
(async () => {
  try {
    const tenantId = 'fd0a2138-8abe-4a6d-af5b-c93765c5afaa'; // Starlight tenant ID
    const metrics = await getDemoDashboardMetrics(tenantId);
    
    console.log('\n=== Starlight Dashboard Metrics (All-Time Data) ===');
    console.log('Total Income:', metrics.todayRevenue);
    console.log('Check up Bookings:', metrics.todayAppointments);
    console.log('Total Registered Patients:', metrics.todayPatients);
    console.log('System Alerts:', metrics.criticalAlerts);
    console.log('Blood Bank Stock:', metrics.bloodBank.value);
    console.log('Lab Progress:', metrics.labProgress.value);
    console.log('Fleet Available:', metrics.fleetStatus.available);
    console.log('Occupied Beds:', metrics.occupiedBeds);
    console.log('Available Beds:', metrics.availableBeds);
    console.log('Total Beds:', metrics.totalBeds);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
