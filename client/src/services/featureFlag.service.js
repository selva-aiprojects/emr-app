import React from 'react';
import { api } from '../api.js';

// Feature flag definitions matching backend
export const FEATURE_FLAGS = {
  CORE_ENGINE_ACCESS: 'permission-core_engine-access',
  HR_PAYROLL_ACCESS: 'permission-hr_payroll-access',
  ACCOUNTS_ACCESS: 'permission-accounts-access',
  CUSTOMER_SUPPORT_ACCESS: 'permission-customer_support-access',
  INPATIENT_ACCESS: 'permission-inpatient-access',
  PHARMACY_LAB_ACCESS: 'permission-pharmacy_lab-access'
};

// Module to flag mapping
export const MODULE_FLAG_MAPPING = {
  dashboard: FEATURE_FLAGS.CORE_ENGINE_ACCESS,
  patients: FEATURE_FLAGS.CORE_ENGINE_ACCESS,
  appointments: FEATURE_FLAGS.CORE_ENGINE_ACCESS,
  emr: FEATURE_FLAGS.CORE_ENGINE_ACCESS,
  inpatient: FEATURE_FLAGS.INPATIENT_ACCESS,
  employees: FEATURE_FLAGS.HR_PAYROLL_ACCESS,
  billing: FEATURE_FLAGS.ACCOUNTS_ACCESS,
  accounts: FEATURE_FLAGS.ACCOUNTS_ACCESS,
  pharmacy: FEATURE_FLAGS.PHARMACY_LAB_ACCESS,
  lab: FEATURE_FLAGS.PHARMACY_LAB_ACCESS,
  inventory: FEATURE_FLAGS.CORE_ENGINE_ACCESS,
  reports: FEATURE_FLAGS.CORE_ENGINE_ACCESS,
  support: FEATURE_FLAGS.CUSTOMER_SUPPORT_ACCESS,
  ticketing: FEATURE_FLAGS.CUSTOMER_SUPPORT_ACCESS,
  insurance: FEATURE_FLAGS.ACCOUNTS_ACCESS,
  admin: FEATURE_FLAGS.CORE_ENGINE_ACCESS,
  users: FEATURE_FLAGS.CORE_ENGINE_ACCESS
};

/**
 * Feature flag service for frontend
 */
class FeatureFlagService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get feature flags for current tenant
   */
  async getFeatureFlags(tenantId) {
    const cacheKey = `features_${tenantId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await api.get(`/tenants/${tenantId}/features`);
      const flags = response.data || response; // api.get might return data directly or wrapped

      // Cache the result
      this.cache.set(cacheKey, {
        data: flags,
        timestamp: Date.now()
      });

      return flags;
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      return {};
    }
  }

  /**
   * Check if a specific feature flag is enabled
   */
  async isFeatureEnabled(tenantId, flag) {
    const flags = await this.getFeatureFlags(tenantId);
    return flags[flag]?.enabled || false;
  }

  /**
   * Check if a module is accessible
   */
  async isModuleAccessible(tenantId, module) {
    const flag = MODULE_FLAG_MAPPING[module];
    if (!flag) {
      return true; // Allow access if no flag defined
    }

    return await this.isFeatureEnabled(tenantId, flag);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const featureFlagService = new FeatureFlagService();

/**
 * React hook for feature flags
 */
export function useFeatureFlags(tenantId) {
  const [flags, setFlags] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadFlags = async () => {
      try {
        setLoading(true);
        const featureFlags = await featureFlagService.getFeatureFlags(tenantId);
        if (mounted) {
          setFlags(featureFlags);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadFlags();

    return () => {
      mounted = false;
    };
  }, [tenantId]);

  const isFeatureEnabled = React.useCallback((flag) => {
    // Superadmin/Platform bypass: If no tenantId, allow all features
    if (!tenantId) return true;
    return flags[flag]?.enabled || false;
  }, [flags, tenantId]);

  const isModuleAccessible = React.useCallback((module) => {
    // Superadmin/Platform bypass: If no tenantId, allow all modules
    if (!tenantId) return true;

    const flag = MODULE_FLAG_MAPPING[module];
    if (!flag) return true;
    return isFeatureEnabled(flag);
  }, [tenantId, isFeatureEnabled]);

  return {
    flags,
    loading,
    error,
    isFeatureEnabled,
    isModuleAccessible
  };
}
