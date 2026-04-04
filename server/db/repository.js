/**
 * Database Repository Layer
 * Provides all CRUD operations for EMR system
 * Replaces JSON file storage with PostgreSQL
 */

import { query } from './connection.js';

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
import { getSuperadminOverview as getManagementPlaneOverview } from '../services/superadminMetrics.service.js';


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
  return getManagementPlaneOverview();
}

