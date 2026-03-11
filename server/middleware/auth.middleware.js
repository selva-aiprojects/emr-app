import { verifyToken } from '../services/auth.service.js';
import { query } from '../db/connection.js';

/**
 * Middleware to authenticate requests using JWT
 * Extracts token from Authorization header and verifies it
 */
export async function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authorization header with Bearer token is required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);

      // Normalize role to PascalCase (e.g., "doctor" -> "Doctor", "DOCTOR" -> "Doctor")
      if (decoded.role) {
        decoded.role = decoded.role.charAt(0).toUpperCase() + decoded.role.slice(1).toLowerCase();
        // Special handling for multi-word roles if needed, though most here are single word or handled
        if (decoded.role === 'Front office') decoded.role = 'Front Office';
        if (decoded.role === 'Support staff') decoded.role = 'Support Staff';
        if (decoded.role === 'Hr') decoded.role = 'HR';
      }

    } catch (error) {
      return res.status(401).json({
        error: 'Invalid token',
        message: error.message
      });
    }

    // Fetch user from database to ensure they still exist and are active
    const userResult = await query(
      'SELECT id, tenant_id, email, name, role, patient_id, is_active FROM emr.users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User account no longer exists'
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
    const userRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
    const finalRole = userRole === 'Front office'
      ? 'Front Office'
      : (userRole === 'Support staff'
        ? 'Support Staff'
        : (userRole === 'Hr' ? 'HR' : userRole));

    // Attach user info to request object
    req.user = {
      id: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      name: user.name,
      role: finalRole,
      patientId: user.patient_id,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
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

    next();
  };
}

/**
 * Middleware to ensure tenant context exists
 * Extracts tenantId from query params or body
 */
export function requireTenant(req, res, next) {
  const tenantId = req.header('x-tenant-id') || req.query.tenantId || req.body.tenantId || req.params.id || req.params.tenantId;

  if (!tenantId) {
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
  next();
}

/**
 * Permission definitions by role
 */
const PERMISSIONS = {
  Superadmin: ['superadmin', 'tenants', 'users', 'inventory', 'billing', 'reports'], // REMOVED: 'dashboard', 'patients', 'appointments', 'emr'
  Admin: ['dashboard', 'patients', 'appointments', 'emr', 'billing', 'accounts', 'insurance', 'inventory', 'pharmacy', 'lab', 'employees', 'reports', 'admin', 'users'],
  Doctor: ['dashboard', 'patients', 'appointments', 'emr', 'inpatient', 'pharmacy', 'reports'],
  Nurse: ['dashboard', 'patients', 'appointments', 'emr', 'inpatient', 'pharmacy'],
  Lab: ['dashboard', 'patients', 'reports'],
  Pharmacy: ['dashboard', 'pharmacy', 'inventory', 'reports'], // Can see patients but only for prescriptions
  'Support Staff': ['dashboard', 'patients', 'appointments'],
  'Front Office': ['dashboard', 'patients', 'appointments'],
  Billing: ['dashboard', 'billing', 'accounts', 'insurance', 'reports'],
  Accounts: ['dashboard', 'billing', 'accounts', 'insurance', 'reports'],
  Inventory: ['dashboard', 'inventory', 'reports'],
  Patient: ['dashboard', 'appointments', 'patients'],
  // New Roles
  Insurance: ['dashboard', 'insurance', 'reports'],
  Management: ['dashboard', 'reports', 'users', 'billing', 'accounts', 'insurance', 'inventory'],
  HR: ['dashboard', 'employees', 'reports', 'users'],
  Operations: ['dashboard', 'reports', 'inventory', 'users', 'billing'],
  Auditor: ['dashboard', 'reports'],
};

/**
 * Middleware to check if user has specific permission
 * @param {string} permission - Required permission
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'Authentication required'
      });
    }

    const userPermissions = PERMISSIONS[req.user.role] || [];

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
 * Middleware to restrict patients to their own data
 * Must be used after authenticate middleware
 */
export function restrictPatientAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // If user is a patient, restrict access to their own patient record
  if (req.user.role === 'Patient') {
    const requestedPatientId = req.params.patientId || req.query.patientId || req.body.patientId;

    if (requestedPatientId && requestedPatientId !== req.user.patientId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own patient data'
      });
    }

    // Force patientId to be the authenticated user's patientId
    if (req.params.patientId) req.params.patientId = req.user.patientId;
    if (req.query.patientId) req.query.patientId = req.user.patientId;
    if (req.body.patientId) req.body.patientId = req.user.patientId;
  }

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
      'SELECT id, tenant_id, email, name, role, patient_id, is_active FROM emr.users WHERE id = $1 AND is_active = true',
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
        patientId: user.patient_id,
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
