import { api } from '../api.js';

export const superadminService = {
  /**
   * Provision a new hospital shard (tenant)
   */
  provisionTenant: async (tenantData, adminData) => {
    try {
      const response = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ tenantData, adminData }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to provision tenant');
      }
      return await response.json();
    } catch (error) {
      console.error('Provisioning error:', error);
      throw error;
    }
  },

  /**
   * Reset password for any user in any tenant node
   */
  resetUserPassword: async (tenantCode, email, newPassword) => {
    try {
      const response = await fetch('/api/superadmin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ tenantCode, email, newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset password');
      }
      return await response.json();
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  /**
   * Dispatch a strategic communication shard (Email)
   */
  sendCommunication: async (tenantCode, templateId, metadata = {}) => {
    try {
      const response = await fetch('/api/superadmin/communication/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ tenantCode, templateId, metadata }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to dispatch communication');
      }
      return await response.json();
    } catch (error) {
      console.error('Communication error:', error);
      throw error;
    }
  },

  /**
   * Provision a new admin identity for a tenant
   */
  provisionAdmin: async (tenantCode, adminData) => {
    try {
      const response = await fetch('/api/superadmin/users/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ tenantCode, ...adminData }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to provision admin');
      }
      return await response.json();
    } catch (error) {
      console.error('Admin provisioning error:', error);
      throw error;
    }
  }
};
