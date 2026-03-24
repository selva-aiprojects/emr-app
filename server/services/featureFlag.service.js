import * as repo from '../db/repository.js';

// Feature flag definitions with naming convention: permission-{module}-access
export const FEATURE_FLAGS = {
  CORE_ENGINE_ACCESS: 'permission-core_engine-access',
  HR_PAYROLL_ACCESS: 'permission-hr_payroll-access',
  ACCOUNTS_ACCESS: 'permission-accounts-access',
  CUSTOMER_SUPPORT_ACCESS: 'permission-customer_support-access',
  INPATIENT_ACCESS: 'permission-inpatient-access',
  PHARMACY_LAB_ACCESS: 'permission-pharmacy_lab-access'
};

// Module to flag mapping for easy lookup
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
  inventory: FEATURE_FLAGS.PHARMACY_LAB_ACCESS,
  reports: FEATURE_FLAGS.CORE_ENGINE_ACCESS,
  support: FEATURE_FLAGS.CUSTOMER_SUPPORT_ACCESS,
  ticketing: FEATURE_FLAGS.CUSTOMER_SUPPORT_ACCESS,
  insurance: FEATURE_FLAGS.ACCOUNTS_ACCESS,
  admin: FEATURE_FLAGS.CORE_ENGINE_ACCESS,
  users: FEATURE_FLAGS.CORE_ENGINE_ACCESS
};

// Default feature flags by subscription tier
const DEFAULT_FEATURES_BY_TIER = {
  'Free': [
    FEATURE_FLAGS.CORE_ENGINE_ACCESS
  ],
  'Basic': [
    FEATURE_FLAGS.CORE_ENGINE_ACCESS,
    FEATURE_FLAGS.CUSTOMER_SUPPORT_ACCESS,
    FEATURE_FLAGS.PHARMACY_LAB_ACCESS
  ],
  'Professional': [
    FEATURE_FLAGS.CORE_ENGINE_ACCESS,
    FEATURE_FLAGS.CUSTOMER_SUPPORT_ACCESS,
    FEATURE_FLAGS.PHARMACY_LAB_ACCESS,
    FEATURE_FLAGS.INPATIENT_ACCESS,
    FEATURE_FLAGS.ACCOUNTS_ACCESS
  ],
  'Enterprise': [
    FEATURE_FLAGS.CORE_ENGINE_ACCESS,
    FEATURE_FLAGS.HR_PAYROLL_ACCESS,
    FEATURE_FLAGS.ACCOUNTS_ACCESS,
    FEATURE_FLAGS.CUSTOMER_SUPPORT_ACCESS,
    FEATURE_FLAGS.PHARMACY_LAB_ACCESS,
    FEATURE_FLAGS.INPATIENT_ACCESS
  ]
};

// Cache for global kill switches
let globalKillSwitchesCache = null;
let killSwitchesCacheTime = 0;
const KILL_SWITCHES_CACHE_TTL = 60000; // 1 minute

/**
 * Get tenant's subscription tier
 */
async function getTenantTier(tenantId) {
  return await repo.getTenantTier(tenantId);
}

/**
 * Get custom feature flags for a tenant from database
 */
async function getTenantCustomFeatures(tenantId) {
  return await repo.getTenantCustomFeatures(tenantId);
}

/**
 * Get global kill switches with caching
 */
export async function getGlobalKillSwitches() {
  const now = Date.now();

  // Return cached value if still valid
  if (globalKillSwitchesCache && (now - killSwitchesCacheTime) < KILL_SWITCHES_CACHE_TTL) {
    return globalKillSwitchesCache;
  }

  // Fetch from database
  globalKillSwitchesCache = await repo.getGlobalKillSwitches();
  killSwitchesCacheTime = now;

  return globalKillSwitchesCache;
}

/**
 * Evaluate if a feature flag is enabled for a tenant
 */
export async function evaluateFeatureFlag(tenantId, flag) {
  try {
    // Check global kill switch first
    const killSwitches = await getGlobalKillSwitches();
    if (killSwitches[flag] === true) {
      console.log(`Feature ${flag} disabled by global kill switch`);
      return false;
    }

    // Get tenant tier
    const tier = await getTenantTier(tenantId);

    // Get default features for tier
    const defaultFeatures = DEFAULT_FEATURES_BY_TIER[tier] || [];

    // Get custom features for tenant
    const customFeatures = await getTenantCustomFeatures(tenantId);

    // Combine features
    const enabledFeatures = [...defaultFeatures, ...customFeatures];

    return enabledFeatures.includes(flag);
  } catch (error) {
    console.error(`Error evaluating feature flag ${flag}:`, error);
    return false; // Fail safe: disable feature on error
  }
}

/**
 * Get all available feature flags and their status for a tenant
 * Returns an object suitable for the frontend: { "flag-name": { enabled: true/false } }
 */
export async function getFeatureFlagStatus(tenantId) {
  try {
    const tier = await getTenantTier(tenantId);
    const defaultFeatures = DEFAULT_FEATURES_BY_TIER[tier] || [];
    const customFeatures = await getTenantCustomFeatures(tenantId);
    const killSwitches = await getGlobalKillSwitches();

    const enabledList = [...defaultFeatures, ...customFeatures];
    const status = {};

    // Initialize all known flags as disabled
    Object.values(FEATURE_FLAGS).forEach(flag => {
      status[flag] = { enabled: false };
    });

    // Mark as enabled if part of tier/custom and not killed
    enabledList.forEach(flag => {
      if (!killSwitches[flag]) {
        status[flag] = { enabled: true };
      }
    });

    return status;
  } catch (error) {
    console.error('Error getting feature flag status:', error);
    return {};
  }
}

/**
 * Get all enabled feature flags for a tenant
 */
export async function getTenantFeatureFlags(tenantId) {
  try {
    const tier = await getTenantTier(tenantId);
    const defaultFeatures = DEFAULT_FEATURES_BY_TIER[tier] || [];
    const customFeatures = await getTenantCustomFeatures(tenantId);
    const killSwitches = await getGlobalKillSwitches();

    const allFeatures = [...defaultFeatures, ...customFeatures];

    // Filter out killed features
    return allFeatures.filter(flag => !killSwitches[flag]);
  } catch (error) {
    console.error('Error getting tenant feature flags:', error);
    return [];
  }
}

/**
 * Check if a module is accessible for a tenant
 */
export async function isModuleAccessible(tenantId, module) {
  const flag = MODULE_FLAG_MAPPING[module];
  if (!flag) {
    // If no flag defined for module, allow access (backward compatibility)
    return true;
  }

  return await evaluateFeatureFlag(tenantId, flag);
}

/**
 * Enable/disable global kill switch for a feature
 */
export async function setGlobalKillSwitch(flag, enabled, userId, reason) {
  try {
    await repo.setGlobalKillSwitch(flag, enabled, userId, reason);

    // Clear cache to force refresh
    globalKillSwitchesCache = null;
    killSwitchesCacheTime = 0;

    console.log(`Global kill switch for ${flag} ${enabled ? 'ENABLED' : 'DISABLED'}`);
    return true;
  } catch (error) {
    console.error('Error setting global kill switch:', error);
    return false;
  }
}
