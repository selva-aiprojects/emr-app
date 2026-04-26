import { storeAuth, getStoredSession, getStoredUser } from '../api.js';

// Internal helper for superadmin specifically, though api.js could be extended.
async function superadminRequest(endpoint, options = {}) {
  const token = localStorage.getItem('emr_auth_token');
  console.log(`[SUPERADMIN_REQUEST] Fetching ${endpoint} with token prefix:`, token ? token.substring(0, 10) : 'MISSING');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle both /superadmin prefixed routes and global routes
  // We only use /api for the public tenant list and specific communication logs
  const baseUrl = (endpoint === '/tenants' && (!options.method || options.method === 'GET'))
    ? '/api' 
    : '/api/superadmin';

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || `Management Plane request failed: ${response.status}`);
  }

  return response.json();
}

export const superadminService = {
  /**
   * Provision a new hospital shard (tenant)
   */
  provisionTenant: async (tenantData, adminData) => {
    return superadminRequest('/tenants', {
      method: 'POST',
      body: JSON.stringify({ tenantData, adminData }),
    });
  },

  /**
   * Fetch all tenants
   */
  getTenants: async () => {
    return superadminRequest('/tenants');
  },

  /**
   * Fetch communication history
   */
  getCommunications: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return superadminRequest(`/communication?${params.toString()}`);
  },

  /**
   * Reset password for any user in any tenant node
   */
  resetUserPassword: async (tenantCode, email, newPassword) => {
    return superadminRequest('/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({ tenantCode, email, newPassword }),
    });
  },

  /**
   * Dispatch a strategic communication shard (Email)
   */
  sendCommunication: async (tenantCode, templateId, metadata = {}) => {
    return superadminRequest('/communication/send', {
      method: 'POST',
      body: JSON.stringify({ tenantCode, templateId, metadata }),
    });
  },

  /**
   * Provision a new admin identity for a tenant
   */
  provisionAdmin: async (tenantCode, adminData) => {
    return superadminRequest('/users/provision', {
      method: 'POST',
      body: JSON.stringify({ tenantCode, ...adminData }),
    });
  },

  /**
   * Fetch System Audit Logs
   */
  getSystemLogs: async () => {
    return superadminRequest('/logs');
  },

  /**
   * Update Tenant metadata (platform-level)
   */
  updateTenant: async (tenantId, data) => {
    return superadminRequest(`/tenants/${tenantId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete hospital shard with schema purge
   */
  deleteTenant: async (tenantId) => {
    return superadminRequest(`/tenants/${tenantId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Platform-wide broadcast to all active institutional nodes
   */
  broadcastToAllTenants: async (templateId, subject, body) => {
    return superadminRequest('/broadcast', {
      method: 'POST',
      body: JSON.stringify({ templateId, subject, body }),
    });
  },

  /**
   * Get Fixed Overview with accurate live data
   */
  getFixedOverview: async () => {
    return superadminRequest('/overview-fixed');
  }
};
