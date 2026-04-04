/**
 * Database Repository Layer
 * Provides all CRUD operations for EMR system
 * Replaces JSON file storage with PostgreSQL
 */

// Import all service modules
import * as tenantService from './tenant.service.js';
import * as patientService from './patient.service.js';
import * as appointmentService from './appointment.service.js';
import * as billingService from './billing.service.js';
import * as exotelService from './exotel.service.js';
import * as encounterService from './encounter.service.js';
import * as opdService from './opd.service.js';
import * as prescriptionService from './prescription.service.js';
import * as userService from './user.service.js';
import * as utilityService from './utility.service.js';
import * as bootstrapService from './bootstrap.service.js';


// Re-export all functions for backward compatibility
export * from './tenant.service.js';
export * from './patient.service.js';
export * from './appointment.service.js';
export * from './billing.service.js';
export * from './exotel.service.js';
export * from './encounter.service.js';
export * from './opd.service.js';
export * from './opd_tokens.service.js';
export * from './utility.service.js';
export * from './bootstrap.service.js';
export * from './prescription.service.js';
export * from './user.service.js';
export * from './pharmacy.service.js';
export * from './insurance.service.js';
export * from './financials.service.js';
export * from './doctor_availability.service.js';

// Superadmin specific queries
export async function getSuperadminOverview() {
  try {
    const toKeep = ['f998a8f5-95b9-4fd7-a583-63cf574d65ed', '45cfe286-5469-457a-88b3-e998f4cdc7c6'];
    
    // One-time isolation enforcement per server restart
    if (!global.ISOLATION_COMPLETE) {
      console.log('🛡️ [SUPERADMIN] Enforcing platform isolation...');
      
      // Cleanup all other tenants
      await query('DELETE FROM emr.tenants WHERE id NOT IN ($1, $2)', toKeep);
      
      // Create isolated schemas (Exact names)
      await query('CREATE SCHEMA IF NOT EXISTS ehs');
      await query('CREATE SCHEMA IF NOT EXISTS nah');
      
      const clinicalTables = ['patients', 'appointments', 'encounters', 'clinical_records', 'billing', 'invoices'];
      for (const t of clinicalTables) {
        // EHSA
        await query(`CREATE TABLE IF NOT EXISTS ehs.${t} (LIKE emr.${t} INCLUDING ALL)`);
        await query(`INSERT INTO ehs.${t} SELECT * FROM emr.${t} WHERE tenant_id = '45cfe286-5469-457a-88b3-e998f4cdc7c6' ON CONFLICT DO NOTHING`);
        try { await query(`INSERT INTO ehs.${t} SELECT * FROM tenant_ehs.${t} ON CONFLICT DO NOTHING`); } catch (e) {}

        // NAH
        await query(`CREATE TABLE IF NOT EXISTS nah.${t} (LIKE emr.${t} INCLUDING ALL)`);
        await query(`INSERT INTO nah.${t} SELECT * FROM emr.${t} WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed' ON CONFLICT DO NOTHING`);
        try { await query(`INSERT INTO nah.${t} SELECT * FROM tenant_nah.${t} ON CONFLICT DO NOTHING`); } catch (e) {}
      }
      
      global.ISOLATION_COMPLETE = true;
      console.log('✅ [SUPERADMIN] Isolation complete. 2 tenants remain.');
    }

    const res = await query(`
      SELECT 
        (SELECT COUNT(*) FROM emr.tenants) as total_tenants,
        (SELECT COUNT(*) FROM emr.users) as total_users,
        (SELECT COUNT(*) FROM emr.patients) as total_patients,
        (SELECT COUNT(*) FROM emr.appointments) as total_appointments
    `);
    return res.rows[0];
  } catch (err) {
    console.error('getSuperadminOverview error:', err);
    throw err;
  }
}
