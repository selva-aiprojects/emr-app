// Enhanced API Functions for Insurance and Pharmacy Modules
// Healthcare Standards Compliant
import { apiRequest } from '../api';

// ==========================================
// ENHANCED INSURANCE API FUNCTIONS
// ==========================================

export async function getEnhancedInsuranceProviders(tenantId) {
  return await apiRequest(`/insurance/providers/enhanced?tenantId=${tenantId}`);
}

export async function createEnhancedInsuranceProvider(data) {
  return await apiRequest('/insurance/providers/enhanced', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getInsuranceDashboard(tenantId) {
  return await apiRequest(`/insurance/dashboard?tenantId=${tenantId}`);
}

export async function getInsuranceClaims(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/insurance/claims/enhanced?${params.toString()}`);
}

export async function createInsuranceClaim(data) {
  return await apiRequest('/insurance/claims/enhanced', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createClaimLineItem(data) {
  return await apiRequest('/insurance/claims/line-item', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClaimStatus(claimId, data) {
  return await apiRequest(`/insurance/claims/${claimId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getPreauthorizationRequests(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/insurance/preauth?${params.toString()}`);
}

export async function createPreauthorizationRequest(data) {
  return await apiRequest('/insurance/preauth', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePreauthStatus(preauthId, data) {
  return await apiRequest(`/insurance/preauth/${preauthId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function createClaimSettlement(data) {
  return await apiRequest('/insurance/settlements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==========================================
// ENHANCED PHARMACY API FUNCTIONS
// ==========================================

export async function getEnhancedPharmacyInventory(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/pharmacy/inventory/enhanced?${params.toString()}`);
}

export async function createEnhancedPharmacyInventory(data) {
  return await apiRequest('/pharmacy/inventory/enhanced', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getEnhancedPrescriptions(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/pharmacy/prescriptions/enhanced?${params.toString()}`);
}

export async function createEnhancedPrescription(data) {
  return await apiRequest('/pharmacy/prescriptions/enhanced', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function addPrescriptionMedicine(data) {
  return await apiRequest('/pharmacy/prescriptions/medicine', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function checkDrugInteractions(tenantId, drugIds) {
  return await apiRequest('/pharmacy/drug-interactions', {
    method: 'POST',
    body: JSON.stringify({ tenantId, drugIds }),
  });
}

export async function createPharmacyDispensing(data) {
  return await apiRequest('/pharmacy/dispensing', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function addDispensingItem(data) {
  return await apiRequest('/pharmacy/dispensing/item', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPharmacyDashboard(tenantId) {
  return await apiRequest(`/pharmacy/dashboard?tenantId=${tenantId}`);
}

export async function getExpiringDrugs(tenantId, days = 30) {
  return await apiRequest(`/pharmacy/expiring?tenantId=${tenantId}&days=${days}`);
}

export async function updateInventoryStock(data) {
  return await apiRequest('/pharmacy/inventory/stock', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getPharmacyReports(tenantId, reportType, filters = {}) {
  const params = new URLSearchParams({ tenantId, reportType, ...filters });
  return await apiRequest(`/pharmacy/reports?${params.toString()}`);
}

export async function addStockMovement(data) {
  return await apiRequest('/pharmacy/stock-movement', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDrugMaster(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/pharmacy/drug-master?${params.toString()}`);
}

export async function createDrugMaster(data) {
  return await apiRequest('/pharmacy/drug-master', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDrugMaster(drugId, data) {
  return await apiRequest(`/pharmacy/drug-master/${drugId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ==========================================
// REGULATORY COMPLIANCE API FUNCTIONS
// ==========================================

export async function getInsuranceAuditLog(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/insurance/audit-log?${params.toString()}`);
}

export async function getPharmacyAuditLog(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/pharmacy/audit-log?${params.toString()}`);
}

export async function generateComplianceReport(tenantId, reportType, filters = {}) {
  const params = new URLSearchParams({ tenantId, reportType, ...filters });
  return await apiRequest(`/compliance/reports?${params.toString()}`);
}

export async function exportRegulatoryData(tenantId, dataType, filters = {}) {
  const params = new URLSearchParams({ tenantId, dataType, ...filters });
  return await apiRequest(`/compliance/export?${params.toString()}`);
}

// ==========================================
// CLINICAL DECISION SUPPORT API FUNCTIONS
// ==========================================

export async function getDrugInteractionCheck(tenantId, medications) {
  return await apiRequest('/clinical/drug-interactions', {
    method: 'POST',
    body: JSON.stringify({ tenantId, medications }),
  });
}

export async function getDrugAllergyCheck(tenantId, patientId, medications) {
  return await apiRequest('/clinical/drug-allergies', {
    method: 'POST',
    body: JSON.stringify({ tenantId, patientId, medications }),
  });
}

export async function getDosageRecommendations(tenantId, drugId, patientData) {
  return await apiRequest('/clinical/dosage-recommendations', {
    method: 'POST',
    body: JSON.stringify({ tenantId, drugId, patientData }),
  });
}

export async function getContraIndications(tenantId, drugId, patientConditions) {
  return await apiRequest('/clinical/contraindications', {
    method: 'POST',
    body: JSON.stringify({ tenantId, drugId, patientConditions }),
  });
}

// ==========================================
// BILLING AND INTEGRATION API FUNCTIONS
// ==========================================

export async function generatePharmacyBill(data) {
  return await apiRequest('/pharmacy/billing/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function processInsuranceClaimPayment(data) {
  return await apiRequest('/insurance/claims/payment', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getClaimSettlementStatus(claimId) {
  return await apiRequest(`/insurance/claims/${claimId}/settlement-status`);
}

export async function reconcileClaimPayments(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/insurance/reconcile-payments?${params.toString()}`);
}

// ==========================================
// INTEGRATION WITH EXTERNAL SYSTEMS
// ==========================================

export async function syncWithTPA(tenantId, providerId, data) {
  return await apiRequest('/integration/tpa/sync', {
    method: 'POST',
    body: JSON.stringify({ tenantId, providerId, data }),
  });
}

export async function validatePolicy(tenantId, policyNumber, providerId) {
  return await apiRequest('/insurance/validate-policy', {
    method: 'POST',
    body: JSON.stringify({ tenantId, policyNumber, providerId }),
  });
}

export async function getEligibilityCheck(tenantId, patientId, providerId) {
  return await apiRequest('/insurance/eligibility-check', {
    method: 'POST',
    body: JSON.stringify({ tenantId, patientId, providerId }),
  });
}

export async function syncWithDrugDatabase(tenantId, drugDatabase) {
  return await apiRequest('/pharmacy/sync-drug-database', {
    method: 'POST',
    body: JSON.stringify({ tenantId, drugDatabase }),
  });
}

// ==========================================
// ANALYTICS AND REPORTING API FUNCTIONS
// ==========================================

export async function getInsuranceAnalytics(tenantId, timeRange, filters = {}) {
  const params = new URLSearchParams({ tenantId, timeRange, ...filters });
  return await apiRequest(`/insurance/analytics?${params.toString()}`);
}

export async function getPharmacyAnalytics(tenantId, timeRange, filters = {}) {
  const params = new URLSearchParams({ tenantId, timeRange, ...filters });
  return await apiRequest(`/pharmacy/analytics?${params.toString()}`);
}

export async function getFinancialSummary(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/financial/summary?${params.toString()}`);
}

export async function getOperationalMetrics(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/operational/metrics?${params.toString()}`);
}

// ==========================================
// BATCH OPERATIONS API FUNCTIONS
// ==========================================

export async function bulkImportInsuranceProviders(tenantId, providerData) {
  return await apiRequest('/insurance/providers/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ tenantId, providers: providerData }),
  });
}

export async function bulkImportPharmacyInventory(tenantId, inventoryData) {
  return await apiRequest('/pharmacy/inventory/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ tenantId, inventory: inventoryData }),
  });
}

export async function bulkProcessClaims(tenantId, claimIds, action) {
  return await apiRequest('/insurance/claims/bulk-process', {
    method: 'POST',
    body: JSON.stringify({ tenantId, claimIds, action }),
  });
}

export async function bulkUpdateInventory(tenantId, updates) {
  return await apiRequest('/pharmacy/inventory/bulk-update', {
    method: 'PATCH',
    body: JSON.stringify({ tenantId, updates }),
  });
}

// ==========================================
// NOTIFICATION AND ALERT API FUNCTIONS
// ==========================================

export async function getInsuranceAlerts(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/insurance/alerts?${params.toString()}`);
}

export async function getPharmacyAlerts(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/pharmacy/alerts?${params.toString()}`);
}

export async function createAlert(tenantId, alertData) {
  return await apiRequest('/alerts/create', {
    method: 'POST',
    body: JSON.stringify({ tenantId, ...alertData }),
  });
}

export async function acknowledgeAlert(alertId, userId) {
  return await apiRequest(`/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

// ==========================================
// HEALTHCARE STANDARDS COMPLIANCE API FUNCTIONS
// ==========================================

export async function getComplianceStatus(tenantId, module) {
  return await apiRequest(`/compliance/status?tenantId=${tenantId}&module=${module}`);
}

export async function runComplianceCheck(tenantId, module, checkType) {
  return await apiRequest(`/compliance/check`, {
    method: 'POST',
    body: JSON.stringify({ tenantId, module, checkType }),
  });
}

export async function getComplianceReport(tenantId, reportType, filters = {}) {
  const params = new URLSearchParams({ tenantId, reportType, ...filters });
  return await apiRequest(`/compliance/report?${params.toString()}`);
}

export async function updateComplianceSettings(tenantId, settings) {
  return await apiRequest('/compliance/settings', {
    method: 'PATCH',
    body: JSON.stringify({ tenantId, settings }),
  });
}

// ==========================================
// UTILITY API FUNCTIONS
// ==========================================

export async function generateReportNumber(tenantId, reportType) {
  return await apiRequest('/utility/generate-number', {
    method: 'POST',
    body: JSON.stringify({ tenantId, reportType }),
  });
}

export async function validateICD10Code(code) {
  return await apiRequest('/utility/validate-icd10', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function searchDrugs(tenantId, searchTerm, filters = {}) {
  const params = new URLSearchParams({ tenantId, searchTerm, ...filters });
  return await apiRequest(`/utility/search-drugs?${params.toString()}`);
}

export async function calculateDrugDosage(tenantId, drugId, patientData) {
  return await apiRequest('/utility/calculate-dosage', {
    method: 'POST',
    body: JSON.stringify({ tenantId, drugId, patientData }),
  });
}

// ==========================================
// EXPORT ALL ENHANCED API FUNCTIONS
// ==========================================

export const enhancedAPI = {
  // Insurance
  getEnhancedInsuranceProviders,
  createEnhancedInsuranceProvider,
  getInsuranceDashboard,
  getInsuranceClaims,
  createInsuranceClaim,
  createClaimLineItem,
  updateClaimStatus,
  getPreauthorizationRequests,
  createPreauthorizationRequest,
  updatePreauthStatus,
  createClaimSettlement,
  
  // Pharmacy
  getEnhancedPharmacyInventory,
  createEnhancedPharmacyInventory,
  getEnhancedPrescriptions,
  createEnhancedPrescription,
  addPrescriptionMedicine,
  checkDrugInteractions,
  createPharmacyDispensing,
  addDispensingItem,
  getPharmacyDashboard,
  getExpiringDrugs,
  updateInventoryStock,
  getPharmacyReports,
  addStockMovement,
  getDrugMaster,
  createDrugMaster,
  updateDrugMaster,
  
  // Regulatory Compliance
  getInsuranceAuditLog,
  getPharmacyAuditLog,
  generateComplianceReport,
  exportRegulatoryData,
  
  // Clinical Decision Support
  getDrugInteractionCheck,
  getDrugAllergyCheck,
  getDosageRecommendations,
  getContraIndications,
  
  // Billing and Integration
  generatePharmacyBill,
  processInsuranceClaimPayment,
  getClaimSettlementStatus,
  reconcileClaimPayments,
  
  // External Integration
  syncWithTPA,
  validatePolicy,
  getEligibilityCheck,
  syncWithDrugDatabase,
  
  // Analytics
  getInsuranceAnalytics,
  getPharmacyAnalytics,
  getFinancialSummary,
  getOperationalMetrics,
  
  // Batch Operations
  bulkImportInsuranceProviders,
  bulkImportPharmacyInventory,
  bulkProcessClaims,
  bulkUpdateInventory,
  
  // Notifications
  getInsuranceAlerts,
  getPharmacyAlerts,
  createAlert,
  acknowledgeAlert,
  
  // Healthcare Standards
  getComplianceStatus,
  runComplianceCheck,
  getComplianceReport,
  updateComplianceSettings,
  
  // Utilities
  generateReportNumber,
  validateICD10Code,
  searchDrugs,
  calculateDrugDosage
};

// Export for backward compatibility
export default enhancedAPI;
