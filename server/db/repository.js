/**
 * Database Repository Layer
 * Explicit Export Standard v1.3 - MODULAR EXPANSION
 */

import { query } from './connection.js';
export { query };

// Import all services
import * as tenantService from './tenant.service.js';
import * as userService from './user.service.js';
import * as patientService from './patient.service.js';
import * as encounterService from './encounter.service.js';
import * as billingService from './billing.service.js';
import * as pharmacyService from './pharmacy.service.js';
import * as prescriptionService from './prescription.service.js';
import * as inventoryService from './inventory.service.js';
import * as appointmentService from './appointment.service.js';
import * as supportService from './support.service.js';
import * as insuranceService from './insurance.service.js';
import * as labsService from './opd.service.js';
import * as docAvailService from './doctor_availability.service.js';
import * as utilityService from './utility.service.js';
import * as financialsService from './financials.service.js';
import * as hrService from './hr.service.js';
import * as infraService from './infrastructure.service.js';
import * as bootstrapService from './bootstrap.service.js';
import * as ambulanceService from './ambulance.service.js';
import * as bloodbankService from './bloodbank.service.js';
import { getSuperadminOverview as getManagementPlaneOverview } from '../services/superadminMetrics.service.js';

// Explicitly export functions from each service to provide a stable repository interface
export const { getBootstrapData } = bootstrapService;

export const {
  getTenants, getAllTenants, getTenantById, createTenant, updateTenantStatus, setTenantTier, getTenantTier,
  getTenantCustomFeatures, setTenantFeatureOverride, getGlobalKillSwitches, setGlobalKillSwitch,
  createAuditLog, updateTenantSettings, generateMRN, generateInvoiceNumber, getTenantByCode,
  provisionTenantSchema
} = tenantService;

export const {
  getUsers, getUserById, getUserByEmail, createUser, updateUserStatus, updateUserLastLogin
} = userService;

export const {
  getPatients, getPatientById, createPatient, searchPatients, getPatientDocuments, addClinicalRecord
} = patientService;

export const {
  getEncounters, getEncounterById, createEncounter, updateEncounterStatus, getEncountersByPatient
} = encounterService;

export const {
  getInvoices, getInvoiceById, createInvoice, updateInvoiceStatus, payInvoice,
  getBillingItems, getBillingItemById, createBillingItem, updateBillingItem, deleteBillingItem,
  getBillingConcessions, createBillingConcession, updateBillingConcession,
  getCreditNotes, createCreditNote,
  getBillingApprovals, createBillingApproval, updateBillingApproval,
  getCorporateClients, createCorporateClient,
  getCorporateBills, getCorporateBillById, createCorporateBill, updateCorporateBill,
  getCorporateBillItems, createCorporateBillItem
} = billingService;

export const {
  getPrescriptions, getPrescriptionById, createPrescription, updatePrescriptionStatus,
  dispensePrescription
} = prescriptionService;

export const {
  getPharmacyInventory, getEnhancedPrescriptions, dispenseEnhancedMedication,
  addDrugBatch, getPharmacyDashboard, getExpiringInventory, searchDrugs,
  createEnhancedPrescription, getPharmacyAlerts
} = pharmacyService;

export const {
  getInventoryItems, createInventoryItem, updateInventoryStock
} = inventoryService;

export const {
  getAppointments, getAppointmentById, createAppointment, updateAppointmentStatus,
  rescheduleAppointment, getAvailableSlots, bookAppointment
} = appointmentService;

export const {
  getSupportTickets, createSupportTicket, updateTicketStatus
} = supportService;

export const {
  getInsuranceProviders, createInsuranceProvider, updateInsuranceProvider,
  getPatientInsurance, createPatientInsurance, updatePatientInsurance,
  getInsuranceClaims, createInsuranceClaim,
  getPreauthorizationRequests, createPreauthorizationRequest, updatePreauthStatus
} = insuranceService;

export const {
  getLabOrders, getLabOrderById, createLabOrder, updateLabOrderStatus, recordLabResults
} = labsService;

export const {
  getDoctorAvailability,
  createDoctorAvailability,
  generateDoctorAvailabilitySlots,
  updateDoctorAvailabilitySlot,
  incrementAppointmentCount,
  decrementAppointmentCount,
  getAvailableSlotsForDoctor,
  getDoctorAvailabilityCalendar
} = docAvailService;

export const {
  getReportSummary, calculatePerformanceScore, calculateUtilizationRate,
  calculateRevenuePerBed, calculateTrend, getPerformanceColor, getTrendColor
} = utilityService;

export const {
  recordAttendance, getAttendance, addExpense, getExpenses, getFinancialSummary, getDoctorPayouts
} = financialsService;

export const {
  getEmployees, createEmployee, getEmployeeLeaves, createEmployeeLeave
} = hrService;

export const {
  getDepartments, createDepartment, getWards, createWard, getBeds, createBed, updateBedStatus,
  getServices, createService, updateService, deleteService
} = infraService;

export const updateDoctorAvailability = updateDoctorAvailabilitySlot;
export const getTimeSlots = getAvailableSlotsForDoctor;

export const {
  getAmbulances, createAmbulance, updateAmbulanceStatus, dispatchAmbulance
} = ambulanceService;

export const {
  getBloodUnits, createBloodUnit, getBloodRequests, createBloodRequest
} = bloodbankService;

export { getManagementPlaneOverview as getSuperadminOverview };
