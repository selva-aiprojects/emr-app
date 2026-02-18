import { evaluateFeatureFlag, getTenantFeatureFlags, isModuleAccessible } from '../services/featureFlag.service.js';

/**
 * Middleware to evaluate feature flags and attach results to request object
 * This should be called after authentication but before route handlers
 */
export function featureGate(requiredFlag) {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ 
          error: 'Tenant context required for feature gate' 
        });
      }

      const hasAccess = await evaluateFeatureFlag(tenantId, requiredFlag);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Feature not available for your subscription tier',
          feature: requiredFlag,
          code: 'FEATURE_NOT_AVAILABLE'
        });
      }

      // Attach feature flag result to request for downstream use
      req.featureFlags = req.featureFlags || {};
      req.featureFlags[requiredFlag] = true;
      
      next();
    } catch (error) {
      console.error('Feature gate error:', error);
      res.status(500).json({ error: 'Feature evaluation failed' });
    }
  };
}

/**
 * Middleware to gate access to entire modules
 */
export function moduleGate(moduleName) {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ 
          error: 'Tenant context required for module access' 
        });
      }

      const hasAccess = await isModuleAccessible(tenantId, moduleName);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: `Module '${moduleName}' not available for your subscription tier`,
          module: moduleName,
          code: 'MODULE_NOT_AVAILABLE'
        });
      }

      // Attach module access to request
      req.moduleAccess = req.moduleAccess || {};
      req.moduleAccess[moduleName] = true;
      
      next();
    } catch (error) {
      console.error('Module gate error:', error);
      res.status(500).json({ error: 'Module access evaluation failed' });
    }
  };
}

/**
 * Middleware to evaluate all feature flags for a tenant and attach to request
 * This should be used once per request to avoid multiple database calls
 */
export async function evaluateAllFeatures(req, res, next) {
  try {
    const tenantId = req.tenantId;
    
    if (!tenantId) {
      return next(); // Skip if no tenant context
    }

    const featureFlags = await getTenantFeatureFlags(tenantId);
    
    // Attach all feature flags to request
    req.featureFlags = {};
    featureFlags.forEach(flag => {
      req.featureFlags[flag] = true;
    });
    
    next();
  } catch (error) {
    console.error('Feature evaluation error:', error);
    // Continue without feature flags on error
    req.featureFlags = {};
    next();
  }
}

/**
 * Helper function to check if a feature is enabled in the request context
 */
export function hasFeatureAccess(req, flag) {
  return req.featureFlags && req.featureFlags[flag] === true;
}

/**
 * Helper function to check if a module is accessible in the request context
 */
export function hasModuleAccess(req, moduleName) {
  return req.moduleAccess && req.moduleAccess[moduleName] === true;
}
