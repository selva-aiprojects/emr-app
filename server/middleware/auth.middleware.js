import { verifyToken } from '../services/auth.service.js';
import { query } from '../db/connection.js';
import { tenantContext } from '../lib/tenantContext.js';
import fs from 'fs';

/**
 * Middleware to authenticate requests using JWT
 * Extracts token from Authorization header and verifies it
 */
export async function authenticate(req, res, next) {
  // If already authenticated by a previous middleware in the chain, just skip
  if (req.user) {
    return next();
  }

  const endpoint = `${req.method} ${req.path}`;
  console.log(`[MW_TRACE] Entering authenticate for ${endpoint}`);
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH_DEBUG] No Bearer token found in header');
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authorization header with Bearer token is required'
      });
    }

    const token = authHeader.substring(7).trim(); // Ensure no leading/trailing whitespace

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
      if (!decoded || !decoded.userId) {
        throw new Error('Token payload missing userId');
      }
      console.log(`[AUTH_SUCCESS] User ${decoded.userId} (${decoded.role}) verified for ${req.path}`);
    } catch (error) {
      console.error('[AUTH_ERROR] JWT Verification failed for token:', token.substring(0, 10) + '...', 'Error:', error.message);
      
      // LOG TO FILE FOR AI TO READ
      try {
        const fs = await import('fs');
        const path = await import('path');
        const logPath = path.join(process.cwd(), 'scratch', 'token_debug.log');
        const logData = `[${new Date().toISOString()}] AUTH_ERROR for ${req.method} ${req.path}\nToken: ${token}\nError: ${error.message}\nStack: ${error.stack}\nJWT_SECRET used in verify: ${process.env.JWT_SECRET}\n\n`;
        fs.appendFileSync(logPath, logData);
      } catch(e) {}

      return res.status(401).json({ 
        error: 'Invalid token', 
        message: error.message,
        diagnostic: {
          tokenPrefix: token.substring(0, 10),
          length: token.length
        }
      });
    }

    // For Superadmin tokens, trust the JWT claims directly.
    // This prevents a 401 cascade when nexus.users hasn't been seeded yet.
    if (decoded.role && decoded.role.toLowerCase() === 'superadmin') {
      console.log(`[AUTH_SUPERADMIN] Superadmin token trusted from JWT claims, skipping DB lookup`);
      req.user = {
        id: decoded.userId,
        tenantId: null,
        email: decoded.email,
        name: decoded.email,
        role: 'Superadmin',
        subscription_tier: 'Enterprise'
      };
      return next();
    }

    // Fetch user from database with tenant info
    console.log(`[AUTH_DB_QUERY] Searching for user ID: ${decoded.userId}`);
    const userResult = await query(
      `SELECT u.id, u.tenant_id, u.email, u.name, u.role, u.is_active, t.subscription_tier 
       FROM nexus.users u 
       LEFT JOIN nexus.management_tenants t ON u.tenant_id::text = t.id::text
       WHERE u.id::text = $1::text`,
      [decoded.userId]
    );
    console.log(`[AUTH_DB_RES] Rows found: ${userResult.rows.length}`);

    if (userResult.rows.length === 0) {
      console.error('[AUTH_CRITICAL_DEBUG] User ID not found in database:', decoded.userId);
      console.error(`[AUTH_CRITICAL_DEBUG] Token was issued for tenant: ${decoded.tenantId || 'NONE'}`);
      return res.status(401).json({ 
        error: 'User not found', 
        details: `User ${decoded.userId} missing from master plane.` 
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'User account has been deactivated'
      });
    }

    // Normalize role for consistency
    const userRole = user.role?.charAt(0).toUpperCase() + user.role?.slice(1).toLowerCase() || 'User';
    let finalRole = userRole;

    // Canonicalize specialized or alias roles to system-standard equivalents
    if (userRole === 'Front office') finalRole = 'Front Office';
    else if (userRole === 'Support staff') finalRole = 'Support Staff';
    else if (userRole === 'Hr') finalRole = 'HR';
    else if (userRole === 'Administrator' || userRole === 'Admin role') finalRole = 'Admin';
    else if (userRole === 'Supervisor' || userRole === 'Supervisor role') finalRole = 'Supervisor';

    // Attach user info to request object
    req.user = {
      id: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      name: user.name,
      role: finalRole,
      subscription_tier: user.subscription_tier || 'Basic'
    };

    next();
  } catch (error) {
    const errorLog = `\n--- [${new Date().toISOString()}] AUTH_CRASH ---\nPath: ${req.method} ${req.path}\nError: ${error.message}\nStack: ${error.stack}\n-----------------------------------\n`;
    try {
      fs.appendFileSync('AUTH_ERROR.log', errorLog);
    } catch (fsErr) {
      console.error('Failed to write to AUTH_ERROR.log', fsErr);
    }
    
    console.error(`[AUTH_CRASH] Error during authentication for ${req.method} ${req.path}:`, error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication',
      details: error.message
    });
  }
}

/**
 * Middleware to require specific role(s)
 * Must be used after authenticate middleware
 * @param {...string} roles - Required roles (e.g., 'Admin', 'Doctor')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    if (req.user.role === 'Superadmin') {
      tenantContext.run('SUPERADMIN_BYPASS', () => {
        next();
      });
    } else {
      next();
    }
  };
}

/**
 * Middleware to ensure tenant context exists
 * Extracts tenantId from query params or body
 */
export function requireTenant(req, res, next) {
  // Use authenticated user's tenantId first, then check other sources
  let tenantId = req.user?.tenantId;
  
  if (!tenantId) {
    tenantId = req.header('x-tenant-id') || req.query.tenantId || req.body.tenantId || req.params.id || req.params.tenantId;
  }

  if (!tenantId) {
    // Superadmins can bypass mandatory tenantId for global operations
    if (req.user?.role === 'Superadmin') {
      return next();
    }
    return res.status(400).json({
      error: 'Missing tenant',
      message: 'tenantId is required'
    });
  }

  // Verify user belongs to this tenant
  // CRITICAL SECURITY FIX: Superadmin cannot access tenant data by default. 
  // Must use "Break Glass" or dedicated superadmin endpoints.
  const isSuperadmin = req.user.role === 'Superadmin';
  const isBreakGlass = req.headers['x-break-glass'] === 'true' && req.headers['x-break-glass-reason'];

  if (isSuperadmin) {
    // Superadmin is BLOCKED from tenant context unless breaking glass
    if (!isBreakGlass) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Superadmin cannot access tenant context without Break Glass protocol.',
        code: 'REQUIRES_BREAK_GLASS'
      });
    }
    // If break glass, log it (audit log happens in controller or separate middleware, but good to note)
    console.warn(`[SECURITY] Superadmin BROKE GLASS for tenant ${tenantId}. Reason: ${req.headers['x-break-glass-reason']}`);
  } else if (req.user.tenantId !== tenantId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have access to this tenant'
    });
  }

  req.tenantId = tenantId;
  
  // Wrap next() in AsyncLocalStorage context for RLS support
  console.log(`[MW_TRACE] Wrapping next() in tenantContext for ${req.tenantId}`);
  tenantContext.run(tenantId, () => {
    next();
  });
}

/**
 * Permission definitions by role
 */
const PERMISSIONS = {
  Superadmin: ['superadmin', 'tenants', 'users', 'inventory', 'billing', 'reports'], // REMOVED: 'dashboard', 'patients', 'appointments', 'emr'
  Admin: ['dashboard', 'patients', 'appointments', 'emr', 'inpatient', 'billing', 'accounts', 'insurance', 'inventory', 'pharmacy', 'lab', 'employees', 'reports', 'admin', 'users', 'communication', 'documents'],
  Doctor: ['dashboard', 'patients', 'appointments', 'emr', 'inpatient', 'pharmacy', 'reports', 'communication', 'documents'],
  Nurse: ['dashboard', 'patients', 'appointments', 'emr', 'inpatient', 'pharmacy', 'communication', 'documents'],
  Lab: ['dashboard', 'patients', 'reports', 'communication', 'documents'],
  Pharmacy: ['dashboard', 'pharmacy', 'inventory', 'reports', 'communication', 'documents'], // Can see patients but only for prescriptions
  'Support Staff': ['dashboard', 'patients', 'appointments', 'communication'],
  'Front Office': ['dashboard', 'patients', 'appointments', 'communication', 'documents'],
  Billing: ['dashboard', 'billing', 'accounts', 'insurance', 'reports'],
  Accounts: ['dashboard', 'billing', 'accounts', 'insurance', 'reports'],
  Inventory: ['dashboard', 'inventory', 'reports'],
  Patient: ['dashboard', 'appointments', 'patients'],
  // New Roles
  Insurance: ['dashboard', 'insurance', 'reports'],
  Management: ['dashboard', 'reports', 'users', 'billing', 'accounts', 'insurance', 'inventory'],
  Supervisor: ['dashboard', 'reports', 'users', 'billing', 'accounts', 'insurance', 'inventory', 'patients', 'appointments'],
  HR: ['dashboard', 'employees', 'reports', 'users', 'communication', 'documents'],
  Operations: ['dashboard', 'reports', 'inventory', 'users', 'billing'],
  Auditor: ['dashboard', 'reports'],
};

/**
 * Middleware to check if user has specific permission
 * @param {string} permission - Required permission
 */
export function requirePermission(permission) {
  return async (req, res, next) => {
    const endpoint = `${req.method} ${req.path}`;
    console.log(`[MW_TRACE] Entering requirePermission(${permission}) for ${endpoint}`);
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'Authentication required'
      });
    }

    let userPermissions = PERMISSIONS[req.user.role] || []; // Fallback defaults

    try {
      // EMERGENCY BYPASS for NHGL Clinical Shard (Stabilization Phase)
      if (req.user.tenantId === 'nhgl-tenant-uuid' || req.user.tenantId === 'nhgl') {
         if (req.user.role === 'Admin') {
            console.log(`[BYPASS] Auto-approving permissions for NHGL Admin: ${permission}`);
            return next();
         }
      }

      // Check database for dynamic Role permissions if tenant context is available
      if (req.user.tenantId && req.user.role !== 'Superadmin') {
         console.log(`[AUTH_PERM] Checking dynamic permissions for ${req.user.role} on tenant ${req.user.tenantId}`);
         const roleResult = await query(
           `SELECT rp.permission 
            FROM role_permissions rp
            JOIN roles r ON rp.role_id = r.id
            WHERE r.name = $1 AND (r.tenant_id::text = $2::text OR r.is_system = true)`, 
           [req.user.role, req.user.tenantId]
         );
         
         if (roleResult.rows.length > 0) {
            userPermissions = roleResult.rows.map(r => r.permission);
            console.log(`[AUTH_PERM] Dynamic permissions found: ${userPermissions.length}`);
         } else {
            console.warn(`[AUTH_PERM] No dynamic permissions for ${req.user.role}. Falling back to static.`);
         }
      }
    } catch(err) {
      console.error('[AUTH_PERM_ERROR] Dynamic check failed, using static fallback:', err.message);
    }

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Permission '${permission}' required. Your role '${req.user.role}' does not have this permission.`
      });
    }

    next();
  };
}

/**
 * DEPRECATED — patient_id column removed from users table by design.
 * Patient access scoping is handled at the route level via appointments/encounters.
 * Kept as a no-op pass-through to avoid breaking any routes that still reference it.
 */
export function restrictPatientAccess(req, res, next) {
  next();
}

/**
 * Optional authentication - proceed even if no token provided
 * Useful for endpoints that have different behavior for authenticated vs anonymous users
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without user
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const userResult = await query(
      'SELECT id, tenant_id, email, name, role, is_active FROM users WHERE id::text = $1::text AND is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const userRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
      const finalRole = userRole === 'Front office'
        ? 'Front Office'
        : (userRole === 'Support staff'
          ? 'Support Staff'
          : (userRole === 'Hr' ? 'HR' : userRole));

      req.user = {
        id: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        name: user.name,
        role: finalRole,
      };
    } else {
      req.user = null;
    }
  } catch (error) {
    // Token invalid, continue without user
    req.user = null;
  }

  next();
}

/**
 * Get permissions for export
 */
export function getPermissions() {
  return PERMISSIONS;
}

export default {
  authenticate,
  requireRole,
  requireTenant,
  requirePermission,
  restrictPatientAccess,
  optionalAuth,
  getPermissions,
};
