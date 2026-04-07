import { storeAuth, getStoredSession, getStoredUser, getToken } from '../api.js';

// Internal helper for superadmin specifically, though api.js could be extended.
async function superadminRequest(endpoint, options = {}) {
  const token = getToken();
  const response = await fetch(`/api/superadmin${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
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
  }
};
