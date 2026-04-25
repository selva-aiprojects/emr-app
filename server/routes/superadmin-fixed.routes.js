import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { query } from '../db/connection.js';

const router = express.Router();

// All routes require SuperAdmin role
router.use(authenticate, requireRole('Superadmin'));

/**
 * Fixed Dashboard Overview - Direct queries for accurate data
 */
router.get('/overview-fixed', async (req, res) => {
  try {
    console.log('[SUPERADMIN-FIXED] Getting accurate overview data...');
    
    // Get all active tenants
    const tenantsResult = await query(`
      SELECT id, name, code, schema_name 
      FROM management_tenants 
      WHERE status = 'active'
      ORDER BY name
    `);
    
    const tenants = tenantsResult.rows;
    let totalPatients = 0;
    let totalDoctors = 0;
    let availableBeds = 0;
    let availableAmbulances = 0;
    
    // Query each tenant directly for accurate counts
    for (const tenant of tenants) {
      try {
        const [patientsResult, doctorsResult, bedsResult, ambulancesResult] = await Promise.all([
          query(`SELECT COUNT(*)::int as count FROM "${tenant.schema_name}".patients`).catch(() => ({ rows: [{ count: 0 }] })),
          query(`SELECT COUNT(*)::int as count FROM "${tenant.schema_name}".employees WHERE tenant_id = $1 AND (lower(designation) LIKE '%doctor%' OR lower(designation) LIKE '%consultant%' OR lower(designation) LIKE '%physician%' OR lower(designation) LIKE '%surgeon%')`, [tenant.id]).catch(() => ({ rows: [{ count: 0 }] })),
          query(`SELECT COUNT(CASE WHEN status = 'available' THEN 1 END)::int as count FROM "${tenant.schema_name}".beds`).catch(() => ({ rows: [{ count: 0 }] })),
          query(`SELECT COUNT(CASE WHEN status = 'available' THEN 1 END)::int as count FROM "${tenant.schema_name}".ambulances`).catch(() => ({ rows: [{ count: 0 }] }))
        ]);
        
        const patientCount = patientsResult.rows[0]?.count || 0;
        const doctorCount = doctorsResult.rows[0]?.count || 0;
        const bedCount = bedsResult.rows[0]?.count || 0;
        const ambulanceCount = ambulancesResult.rows[0]?.count || 0;
        
        totalPatients += patientCount;
        totalDoctors += doctorCount;
        availableBeds += bedCount;
        availableAmbulances += ambulanceCount;
        
        // Update cache with correct data
        await query(`
          INSERT INTO management_tenant_metrics
            (tenant_id, tenant_code, tenant_name, schema_name, patients_count, doctors_count, available_beds, available_ambulances, active_users_count, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (tenant_id) DO UPDATE SET
            patients_count = EXCLUDED.patients_count,
            doctors_count = EXCLUDED.doctors_count,
            available_beds = EXCLUDED.available_beds,
            available_ambulances = EXCLUDED.available_ambulances,
            updated_at = NOW()
        `, [tenant.id, tenant.code, tenant.name, tenant.schema_name, patientCount, doctorCount, bedCount, ambulanceCount, doctorCount]);
        
      } catch (error) {
        console.warn(`[SUPERADMIN-FIXED] Error querying ${tenant.name}:`, error.message);
      }
    }
    
    // Update global summary
    await query(`
      INSERT INTO management_dashboard_summary
        (summary_key, total_tenants, total_doctors, total_patients, available_beds, updated_at)
      VALUES ('global', $1, $2, $3, $4, NOW())
      ON CONFLICT (summary_key) DO UPDATE SET
        total_tenants = EXCLUDED.total_tenants,
        total_doctors = EXCLUDED.total_doctors,
        total_patients = EXCLUDED.total_patients,
        available_beds = EXCLUDED.available_beds,
        updated_at = NOW()
    `, [tenants.length, totalDoctors, totalPatients, availableBeds]);
    
    // Get updated tenant data with metrics
    const enrichedTenants = await query(`
      SELECT 
        t.id, t.name, t.code, t.schema_name,
        COALESCE(mtm.patients_count, 0) as patients,
        COALESCE(mtm.doctors_count, 0) as doctors,
        COALESCE(mtm.available_beds, 0) as bedsAvailable,
        COALESCE(mtm.available_ambulances, 0) as ambulancesAvailable
      FROM management_tenants t
      LEFT JOIN management_tenant_metrics mtm ON t.id::text = mtm.tenant_id::text
      WHERE t.status = 'active'
      ORDER BY t.name
    `);
    
    const response = {
      totals: {
        tenants: tenants.length,
        doctors: totalDoctors,
        patients: totalPatients,
        bedsAvailable: availableBeds,
        ambulancesAvailable: availableAmbulances
      },
      tenants: enrichedTenants.rows,
      generatedAt: new Date().toISOString()
    };
    
    console.log('[SUPERADMIN-FIXED] Returning accurate data:', {
      tenants: tenants.length,
      doctors: totalDoctors,
      patients: totalPatients,
      beds: availableBeds
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('[SUPERADMIN-FIXED] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
