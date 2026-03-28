/**
 * Frontend API Client with JWT Authentication
 * Updated version for PostgreSQL backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Token management
const TOKEN_KEY = 'emr_auth_token';
const USER_KEY = 'emr_user';
const SESSION_KEY = 'emr_session';

/**
 * Store authentication data in localStorage
 */
export function storeAuth(token, user, session) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Get stored authentication token
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user data
 */
export function getStoredUser() {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
}

/**
 * Get stored session data
 */
export function getStoredSession() {
  const sessionData = localStorage.getItem(SESSION_KEY);
  return sessionData ? JSON.parse(sessionData) : null;
}

/**
 * Clear authentication data
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Make an API request with automatic token inclusion
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add JWT token if available
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        // If it's a login attempt, don't say "Session expired"
        if (endpoint === '/login') {
          throw new Error('Invalid email or password');
        }

        // Parse JSON response to get specific error message if available
        let serverMessage = 'Session expired or unauthorized. Please login again.';
        try {
          const errorData = await response.json();
          if (errorData.message || errorData.error) {
            serverMessage = errorData.message || errorData.error;
          }
        } catch (e) {
          // If JSON parse fails, use default
        }

        if (getToken()) {
          clearAuth();
        }
        throw new Error(serverMessage);
      }

    // Parse JSON response safely
    let data = {};
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', text);
      }
    }

    // Handle error responses
    if (!response.ok) {
      throw new Error(data.error || data.message || `API request failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * API Methods
 */

// =====================================================
// AUTHENTICATION
// =====================================================

export async function login(tenantId, email, password) {
  const data = await apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ tenantId, email, password }),
  });

  // Store authentication data
  storeAuth(data.token, data.user, { tenantId: data.tenantId, role: data.role });

  return data;
}

export function logout() {
  clearAuth();
  window.location.href = '/';
}

// =====================================================
// HEALTH CHECK
// =====================================================

export async function checkHealth() {
  return await apiRequest('/health');
}

// =====================================================
// TENANTS
// =====================================================

export async function getTenants() {
  return await apiRequest('/tenants');
}

export async function createTenant(data) {
  return await apiRequest('/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTenantSettings(tenantId, data) {
  return await apiRequest(`/tenants/${tenantId}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function provisionTenantAdmin(tenantId, data) {
  return await apiRequest(`/admin/tenants/${tenantId}/provision-admin`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resetTenantUserPassword(tenantId, email, newPassword) {
  return await apiRequest(`/admin/tenants/${tenantId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ email, newPassword }),
  });
}

// =====================================================
// USERS
// =====================================================

export async function getUsers(tenantId) {
  const query = tenantId ? `?tenantId=${tenantId}` : '';
  return await apiRequest(`/users${query}`);
}

export async function createUser(data) {
  return await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// =====================================================
// HR & ACCOUNTS
// =====================================================

export async function recordAttendance(data) {
  return await apiRequest('/attendance', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAttendance(tenantId, date) {
  return await apiRequest(`/attendance?tenantId=${tenantId}&date=${date}`);
}

export async function addExpense(data) {
  return await apiRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getExpenses(tenantId, month) {
  const params = month ? `?tenantId=${tenantId}&month=${month}` : `?tenantId=${tenantId}`;
  return await apiRequest(`/expenses${params}`);
}

export async function getFinancials(tenantId, month) {
  return await apiRequest(`/reports/financials?tenantId=${tenantId}&month=${month}`);
}

// =====================================================
// BOOTSTRAP
// =====================================================

export async function getBootstrapData(tenantId, userId) {
  return await apiRequest(`/bootstrap?tenantId=${tenantId}&userId=${userId}`);
}

// =====================================================
// SUPERADMIN
// =====================================================

export async function getSuperadminOverview() {
  return await apiRequest('/superadmin/overview');
}

// =====================================================
// PATIENTS
// =====================================================

export async function getPatients(tenantId, filters = {}) {
  // Filter out null/undefined/empty string values
  const queryParams = { tenantId };
  if (filters.text) queryParams.text = filters.text;
  if (filters.date) queryParams.date = filters.date;
  if (filters.type) queryParams.type = filters.type;
  if (filters.status) queryParams.status = filters.status;
  if (filters.limit) queryParams.limit = filters.limit;
  if (filters.offset) queryParams.offset = filters.offset;

  const queryString = new URLSearchParams(queryParams).toString();
  return await apiRequest(`/patients?${queryString}`);
}

export async function createPatient(data) {
  return await apiRequest('/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function addClinicalRecord(patientId, tenantId, section, payload) {
  return await apiRequest(`/patients/${patientId}/clinical`, {
    method: 'PATCH',
    body: JSON.stringify({ tenantId, section, payload }),
  });
}

export async function getPatientPrintData(patientId, docType, tenantId) {
  return await apiRequest(`/patients/${patientId}/print/${docType}?tenantId=${tenantId}`);
}

export async function searchPatients(tenantId, filters = {}) {
  // Filter out null/undefined/empty string values
  const queryParams = { tenantId };
  if (filters.text) queryParams.text = filters.text;
  if (filters.date) queryParams.date = filters.date;
  if (filters.type) queryParams.type = filters.type;
  if (filters.status) queryParams.status = filters.status;

  const params = new URLSearchParams(queryParams);
  return await apiRequest(`/patients/search?${params.toString()}`);
}

// =====================================================
// WALK-INS
// =====================================================

export async function createWalkin(data) {
  return await apiRequest('/walkins', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function convertWalkinToPatient(walkinId, data) {
  return await apiRequest(`/walkins/${walkinId}/convert`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// =====================================================
// APPOINTMENTS
// =====================================================

export async function createAppointment(data) {
  return await apiRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createSelfAppointment(data) {
  return await apiRequest('/appointments/self', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAppointmentStatus(appointmentId, tenantId, status) {
  return await apiRequest(`/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ tenantId, status }),
  });
}

export async function rescheduleAppointment(appointmentId, data) {
  return await apiRequest(`/appointments/${appointmentId}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// =====================================================
// ENCOUNTERS
// =====================================================

export async function getEncounters(tenantId) {
  return await apiRequest(`/encounters?tenantId=${tenantId}`);
}

export async function getInvoices(tenantId) {
  return await apiRequest(`/invoices?tenantId=${tenantId}`);
}

export async function createEncounter(data) {
  return await apiRequest('/encounters', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function dischargePatient(encounterId, data) {
  return await apiRequest(`/encounters/${encounterId}/discharge`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// =====================================================
// INVOICES
// =====================================================

export async function createInvoice(data) {
  return await apiRequest('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function payInvoice(invoiceId, tenantId, userId, paymentMethod = 'Cash') {
  return await apiRequest(`/invoices/${invoiceId}/pay`, {
    method: 'PATCH',
    body: JSON.stringify({ tenantId, userId, paymentMethod }),
  });
}

// =====================================================
// INVENTORY
// =====================================================

export async function createInventoryItem(data) {
  return await apiRequest('/inventory-items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInventoryStock(itemId, tenantId, delta) {
  return await apiRequest(`/inventory-items/${itemId}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ tenantId, delta }),
  });
}

export async function getEmployees(tenantId) {
  return await apiRequest(`/users?tenantId=${tenantId}&role=Doctor,Nurse,Pharmacist,Lab,Admin`);
}

export async function createEmployee(data) {
  return await apiRequest('/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createEmployeeLeave(employeeId, data) {
  return await apiRequest(`/employees/${employeeId}/leaves`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// =====================================================
// REPORTS
// =====================================================

export async function getReportSummary(tenantId) {
  return await apiRequest(`/reports/summary/${tenantId}`);
}

export async function getDoctorPayouts(tenantId) {
  return await apiRequest(`/reports/payouts?tenantId=${tenantId}`);
}

// =====================================================
// REALTIME
// =====================================================

export async function getRealtimeTick(tenantId) {
  return await apiRequest(`/realtime-tick?tenantId=${tenantId}`);
}

// =====================================================
// PRESCRIPTIONS
// =====================================================

export async function getPrescriptions(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null)) });
  return await apiRequest(`/prescriptions?${params.toString()}`);
}

export async function createPrescription(tenantId, data) {
  return await apiRequest('/pharmacy/v1/prescriptions', {
    method: 'POST',
    headers: { 'x-tenant-id': tenantId },
    body: JSON.stringify(data)
  });
}

export async function validatePrescription(tenantId, data) {
  return await apiRequest('/pharmacy/v1/prescriptions/validate', {
    method: 'POST',
    headers: { 'x-tenant-id': tenantId },
    body: JSON.stringify(data)
  });
}

// Dispensing Queue
export async function getPharmacyQueue(tenantId) {
  return await apiRequest('/pharmacy/v1/pharmacy/queue', {
    headers: { 'x-tenant-id': tenantId }
  });
}

export async function dispenseMedication(tenantId, data) {
  return await apiRequest('/pharmacy/v1/pharmacy/dispense', {
    method: 'POST',
    headers: { 'x-tenant-id': tenantId },
    body: JSON.stringify(data)
  });
}

// Old Dispense (for backward compatibility if needed, though we should migrate)
export async function dispensePrescriptionOld(id, data) {
  return await apiRequest(`/prescriptions/${id}/dispense`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Drug Catalog
export async function searchDrugs(query, filters = {}) {
  const params = new URLSearchParams({ q: query, ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null)) });
  return await apiRequest(`/pharmacy/v1/drugs/search?${params.toString()}`);
}

export async function getDrugDetails(id) {
  return await apiRequest(`/pharmacy/v1/drugs/${id}`);
}

// Alerts
export async function getLowStockAlerts(tenantId) {
  return await apiRequest('/pharmacy/v1/alerts/low-stock', {
    headers: { 'x-tenant-id': tenantId }
  });
}

export async function getExpiringStockAlerts(tenantId, days = 90) {
  return await apiRequest(`/pharmacy/v1/alerts/expiring?days=${days}`, {
    headers: { 'x-tenant-id': tenantId }
  });
}

// Procurement & Vendors
export async function getPharmacyVendors(tenantId) {
  return await apiRequest('/pharmacy/v1/vendors', {
    headers: { 'x-tenant-id': tenantId }
  });
}

export async function getPharmacyPOs(tenantId) {
  return await apiRequest('/pharmacy/v1/purchase-orders', {
    headers: { 'x-tenant-id': tenantId }
  });
}

export async function addPharmacyVendor(tenantId, data) {
  return await apiRequest('/pharmacy/v1/vendors', {
    method: 'POST',
    headers: { 'x-tenant-id': tenantId },
    body: JSON.stringify(data)
  });
}

export async function createPharmacyPO(tenantId, data) {
  return await apiRequest('/pharmacy/v1/purchase-orders', {
    method: 'POST',
    headers: { 'x-tenant-id': tenantId },
    body: JSON.stringify(data)
  });
}

export async function importPharmacyStock(tenantId, items) {
  return await apiRequest('/pharmacy/v1/stock/import', {
    method: 'POST',
    headers: { 'x-tenant-id': tenantId },
    body: JSON.stringify({ items })
  });
}

// =====================================================
// SUPPORT MODULE
// =====================================================

export async function getSupportTickets(tenantId) {
  const query = tenantId ? `?tenantId=${tenantId}` : '';
  return await apiRequest(`/support/tickets${query}`);
}

export async function createSupportTicket(data) {
  return await apiRequest('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSupportTicketStatus(id, status) {
  return await apiRequest(`/support/tickets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// =====================================================
// COMMUNICATION / NOTICE BOARD
// =====================================================

export async function getNotices(tenantId, status = 'published') {
  const query = new URLSearchParams({ tenantId, status });
  return await apiRequest(`/notices?${query.toString()}`);
}

export async function createNotice(data) {
  return await apiRequest('/notices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNoticeStatus(id, status, tenantId) {
  return await apiRequest(`/notices/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, tenantId }),
  });
}

// =====================================================
// DOCUMENT VAULT
// =====================================================

export async function getDocuments(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/documents?${params.toString()}`);
}

export async function createDocument(data) {
  return await apiRequest('/documents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function setDocumentDeleted(id, tenantId, isDeleted) {
  return await apiRequest(`/documents/${id}/delete`, {
    method: 'PATCH',
    body: JSON.stringify({ tenantId, isDeleted }),
  });
}
// =====================================================
// INSURANCE
// =====================================================

export async function getInsuranceProviders(tenantId) {
  return await apiRequest(`/insurance/providers?tenantId=${tenantId}`);
}

export async function createInsuranceProvider(data) {
  return await apiRequest('/insurance/providers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getClaims(tenantId, filters = {}) {
  const params = new URLSearchParams({ tenantId, ...filters });
  return await apiRequest(`/insurance/claims?${params.toString()}`);
}

export async function createClaim(data) {
  return await apiRequest('/insurance/claims', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// =====================================================
// AMBULANCE
// =====================================================

export async function getAmbulances(tenantId) {
  return await apiRequest(`/ambulances?tenantId=${tenantId}`);
}

export async function createAmbulance(data) {
  return await apiRequest('/ambulances', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// =====================================================
// BLOOD BANK
// =====================================================

export async function getBloodUnits(tenantId) {
  return await apiRequest(`/blood-bank/units?tenantId=${tenantId}`);
}

export async function createBloodUnit(data) {
  return await apiRequest('/blood-bank/units', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getBloodRequests(tenantId) {
  return await apiRequest(`/blood-bank/requests?tenantId=${tenantId}`);
}

export async function createBloodRequest(data) {
  return await apiRequest('/blood-bank/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

const apiClient = {
  // Auth
  login,
  logout,
  isAuthenticated,
  getToken,
  getStoredUser,
  getStoredSession,
  clearAuth,

  // Health
  checkHealth,

  // Tenants
  getTenants,
  createTenant,
  updateTenantSettings,

  // Users
  getUsers,
  createUser,

  // Bootstrap
  getBootstrapData,

  // Superadmin
  getSuperadminOverview,

  // Patients
  getPatients,
  createPatient,
  addClinicalRecord,
  getPatientPrintData,

  // Walk-ins
  createWalkin,
  convertWalkinToPatient,

  // Appointments
  createAppointment,
  createSelfAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,

  // Encounters
  createEncounter,

  // Invoices
  getInvoices,
  createInvoice,
  payInvoice,

  // Inventory
  createInventoryItem,
  updateInventoryStock,

  // Employees
  createEmployee,
  createEmployeeLeave,

  // Reports
  getReportSummary,
  getDoctorPayouts,
  getFinancials,

  // HR & Accounts
  recordAttendance,
  addExpense,
  getAttendance,
  getExpenses,

  // Insurance
  getInsuranceProviders,
  createInsuranceProvider,
  getClaims,
  createClaim,

  // Ambulance
  getAmbulances,
  createAmbulance,

  // Blood Bank
  getBloodUnits,
  createBloodUnit,
  getBloodRequests,
  createBloodRequest,

  // Communication
  getNotices,
  createNotice,
  updateNoticeStatus,

  // Document Vault
  getDocuments,
  createDocument,
  setDocumentDeleted,

  // Realtime
  getRealtimeTick,
};

// Add aliases for backward compatibility with old frontend code
apiClient.addPatient = createPatient;
apiClient.addWalkin = createWalkin;
apiClient.addAppointment = createAppointment;
apiClient.addSelfAppointment = createSelfAppointment;
apiClient.addPatientClinical = addClinicalRecord;
apiClient.getPatientPrintDoc = getPatientPrintData;
apiClient.convertWalkin = convertWalkinToPatient;
apiClient.setAppointmentStatus = updateAppointmentStatus;
apiClient.getEncounters = getEncounters;
apiClient.addEncounter = createEncounter;
apiClient.dischargePatient = dischargePatient;
apiClient.searchPatients = searchPatients;
apiClient.getPrescriptions = getPrescriptions;
apiClient.dispensePrescription = dispensePrescriptionOld; // keeping old alias just in case
apiClient.createPrescription = createPrescription;
apiClient.validatePrescription = validatePrescription;
apiClient.getPharmacyQueue = getPharmacyQueue;
apiClient.dispenseMedication = dispenseMedication;
apiClient.searchDrugs = searchDrugs;
apiClient.getDrugDetails = getDrugDetails;
apiClient.getLowStockAlerts = getLowStockAlerts;
apiClient.getExpiringStockAlerts = getExpiringStockAlerts;
apiClient.getPharmacyVendors = getPharmacyVendors;
apiClient.getPharmacyPOs = getPharmacyPOs;
apiClient.addPharmacyVendor = addPharmacyVendor;
apiClient.createPharmacyPO = createPharmacyPO;
apiClient.importPharmacyStock = importPharmacyStock;
apiClient.addInvoice = createInvoice;
apiClient.markInvoicePaid = payInvoice;
apiClient.addInventory = createInventoryItem;
apiClient.addEmployee = createEmployee;
apiClient.getEmployees = getEmployees;
apiClient.addEmployeeLeave = createEmployeeLeave;
apiClient.getSupportTickets = getSupportTickets;
apiClient.addSupportTicket = createSupportTicket;
apiClient.updateSupportStatus = updateSupportTicketStatus;
apiClient.getNotices = getNotices;
apiClient.createNotice = createNotice;
apiClient.updateNoticeStatus = updateNoticeStatus;
apiClient.getDocuments = getDocuments;
apiClient.createDocument = createDocument;
apiClient.setDocumentDeleted = setDocumentDeleted;
apiClient.getInvoices = getInvoices;
apiClient.getBootstrap = getBootstrapData;

// Ambulance & Blood Bank Hub
apiClient.getAmbulances = getAmbulances;
apiClient.createAmbulance = createAmbulance;
apiClient.getBloodUnits = getBloodUnits;
apiClient.createBloodUnit = createBloodUnit;
apiClient.getBloodRequests = getBloodRequests;
apiClient.createBloodRequest = createBloodRequest;

// Lab module
apiClient.getLabOrders = (tenantId, status) => apiRequest(`/lab/orders${status ? `?status=${status}` : ''}`);
apiClient.createLabOrder = (data) => apiRequest('/lab/orders', { method: 'POST', body: JSON.stringify(data) });
apiClient.updateLabOrderStatus = (id, status) => apiRequest(`/lab/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
apiClient.recordLabResults = (id, data) => apiRequest(`/lab/orders/${id}/results`, { method: 'POST', body: JSON.stringify(data) });

// Infrastructure & Administrative Masters
apiClient.getDepartments = () => apiRequest('/departments');
apiClient.createDepartment = (data) => apiRequest('/departments', { method: 'POST', body: JSON.stringify(data) });

apiClient.getWards = () => apiRequest('/wards');
apiClient.createWard = (data) => apiRequest('/wards', { method: 'POST', body: JSON.stringify(data) });

apiClient.getBeds = (wardId) => apiRequest(`/beds?wardId=${wardId}`);
apiClient.createBed = (data) => apiRequest('/beds', { method: 'POST', body: JSON.stringify(data) });

apiClient.getServices = () => apiRequest('/services');
apiClient.createService = (data) => apiRequest('/services', { method: 'POST', body: JSON.stringify(data) });

// Superadmin Feature Management
apiClient.getAdminTenantFeatures = (tenantId) => apiRequest(`/admin/tenants/${tenantId}/features`);
apiClient.updateTenantTier = (tenantId, tier) => apiRequest(`/admin/tenants/${tenantId}/tier`, { method: 'PATCH', body: JSON.stringify({ tier }) });
apiClient.updateTenantStatus = (tenantId, status) => apiRequest(`/tenants/${tenantId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
apiClient.updateTenantFeatureOverride = (tenantId, featureFlag, enabled) => apiRequest(`/admin/tenants/${tenantId}/features`, { method: 'POST', body: JSON.stringify({ featureFlag, enabled }) });

// Generic HTTP methods
apiClient.get = (url) => apiRequest(url);
apiClient.post = (url, body) => apiRequest(url, { method: 'POST', body: JSON.stringify(body) });
apiClient.patch = (url, body) => apiRequest(url, { method: 'PATCH', body: JSON.stringify(body) });
apiClient.put = (url, body) => apiRequest(url, { method: 'PUT', body: JSON.stringify(body) });
apiClient.del = (url) => apiRequest(url, { method: 'DELETE' });

// Export as both default and named export for compatibility
export default apiClient;
export { apiClient as api };

// Append: Patient fetch by ID
apiClient.getPatient = (id, tenantId) => apiRequest(`/patients/${id}${tenantId ? `?tenantId=${tenantId}` : ''}`);

