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

// Re-export all functions for backward compatibility
export * from './tenant.service.js';
export * from './patient.service.js';
export * from './appointment.service.js';
export * from './billing.service.js';
export * from './exotel.service.js';
