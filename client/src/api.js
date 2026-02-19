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

      // Only clear auth and redirect if we actually have a token
      if (getToken()) {
        clearAuth();
        window.location.href = '/'; // Redirect to login
      }
      throw new Error('Session expired. Please login again.');
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
  // We'll rely on server exposing this or use bootstrap data if not. 
  // Let's assume we will add GET /api/encounters for InpatientPage.
  return await apiRequest(`/encounters?tenantId=${tenantId}`);
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

// =====================================================
// EMPLOYEES
// =====================================================

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
  return await apiRequest(`/reports/summary?tenantId=${tenantId}`);
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

export async function dispensePrescription(id, data) {
  return await apiRequest(`/prescriptions/${id}/dispense`, {
    method: 'POST',
    body: JSON.stringify(data)
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
  getFinancials,

  // Insurance
  getInsuranceProviders,
  createInsuranceProvider,
  getClaims,
  createClaim,

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
apiClient.dispensePrescription = dispensePrescription;
apiClient.addInvoice = createInvoice;
apiClient.markInvoicePaid = payInvoice;
apiClient.addInventory = createInventoryItem;
apiClient.addEmployee = createEmployee;
apiClient.addEmployeeLeave = createEmployeeLeave;
apiClient.getBootstrap = getBootstrapData;

// Generic HTTP methods (for direct usage)
apiClient.get = (url) => apiRequest(url);
apiClient.post = (url, body) => apiRequest(url, { method: 'POST', body: JSON.stringify(body) });
apiClient.patch = (url, body) => apiRequest(url, { method: 'PATCH', body: JSON.stringify(body) });
apiClient.put = (url, body) => apiRequest(url, { method: 'PUT', body: JSON.stringify(body) });
apiClient.del = (url) => apiRequest(url, { method: 'DELETE' });

// Export as both default and named export for compatibility
export default apiClient;
export { apiClient as api };
