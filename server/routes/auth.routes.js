import express from 'express';
import * as repo from '../db/repository.js';
import { hashPassword, comparePassword, generateToken } from '../services/auth.service.js';
import { authenticate, getPermissions } from '../middleware/auth.middleware.js';
import { query } from '../db/connection.js';

const router = express.Router();

/**
 * @route   POST /api/login
 * @desc    Authenticate user and return JWT
 */
router.post('/login', async (req, res) => {
  const { tenantId, email, password } = req.body;
  


  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user;

    // Handle superadmin login
    if (tenantId === 'superadmin') {
      user = await repo.getUserByEmail(email, null);

      if (!user || user.role.toLowerCase() !== 'superadmin') {
        return res.status(401).json({ error: 'Invalid superadmin credentials' });
      }

      const isValidPassword = await comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const normalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
      const finalRole = normalizedRole === 'Hr' ? 'HR' : normalizedRole;

      if (user.is_2fa_enabled) {
        return res.json({
          mfaRequired: true,
          challengeId: `mfa_${Math.random().toString(36).substr(2, 9)}`,
          method: 'SMS',
          recipient: '***-***-1234'
        });
      }

      const token = generateToken({
        userId: user.id,
        tenantId: null,
        role: finalRole,
        email: user.email,
      });

      return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: finalRole },
        tenantId: null,
        role: finalRole,
      });
    }

    // Handle tenant user login
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required for tenant login' });
    }

    let resolvedTenantId = tenantId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    console.log(`[AUTH_1] Resolving tenant: ${tenantId}`);
    if (!uuidRegex.test(tenantId)) {
      const tenant = await repo.getTenantByCode(tenantId);
      if (!tenant) return res.status(400).json({ error: 'Invalid tenant' });
      resolvedTenantId = tenant.id;
    }
    console.log(`[AUTH_2] Tenant resolved: ${resolvedTenantId}`);

    // 3. User Recovery & Session Acquisition
    user = await repo.getUserByEmail(email, resolvedTenantId);

    if (!user) {
      console.log(`[AUTH_PHASE_FAIL] Identity mismatch: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4. Password Verification
    console.log('[AUTH_PHASE_4] Verifying credentials...');
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('[AUTH_PHASE_FAIL] Credential verification failed');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('[AUTH_PHASE_5] Authentication successful. Generating life-cycle tokens...');

    // 5. Token Generation
    const normalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
    const finalRole = normalizedRole === 'Front office' ? 'Front Office' : 
                     (normalizedRole === 'Support staff' ? 'Support Staff' : 
                     (normalizedRole === 'Hr' ? 'HR' : normalizedRole));

    // Resolve Tier
    let subscriptionTier = 'Basic';
    try {
      const tenantTierResult = await query(
        'SELECT subscription_tier FROM emr.tenants WHERE id = $1',
        [user.tenant_id]
      );
      subscriptionTier = tenantTierResult.rows[0]?.subscription_tier || 'Basic';
    } catch (err) {
      console.warn('Failed to resolve tenant tier at login:', err.message);
    }

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: finalRole,
      email: user.email,
      patientId: user.patient_id,
      subscription_tier: subscriptionTier
    });

    // Resolve Permissions
    let rolePermissions = [];
    try {
      const roleResult = await query(
        `SELECT rp.permission FROM emr.role_permissions rp
         JOIN emr.roles r ON rp.role_id = r.id
         WHERE r.name = $1 AND (r.tenant_id::text = $2::text OR r.is_system = true)`,
        [finalRole, user.tenant_id]
      );
      if (roleResult.rows.length > 0) {
        rolePermissions = roleResult.rows.map(r => r.permission);
      } else {
        const allPermissions = getPermissions();
        rolePermissions = allPermissions[finalRole] || [];
      }
    } catch (err) {
      console.warn('Failed to resolve dynamic role permissions:', err.message);
      const allPermissions = getPermissions();
      rolePermissions = allPermissions[finalRole] || [];
    }
    console.log('[AUTH_7] Permissions resolved. Loading feature flags...');

    // Load Feature Flags
    let featureFlags = null;
    try {
      const { getFeatureFlagStatus } = await import('../services/featureFlag.service.js');
      featureFlags = await getFeatureFlagStatus(user.tenant_id);
    } catch (err) {
      console.warn('Failed to load feature flags at login:', err.message);
    }

    const responsePayload = {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: finalRole },
      tenantId: user.tenant_id,
      role: finalRole,
      subscriptionTier,
      permissions: { [finalRole]: rolePermissions },
      featureFlags,
    };

    console.log(`[AUTH_FINISH] Authentication successful for ${email}`);
    return res.json(responsePayload);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/debug-token
 * @desc    Diagnostic tool to inspect JWT contents
 */
router.get('/debug-token', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ error: 'Token query param required' });

    const { verifyToken, decodeToken } = (await import('../services/auth.service.js'));
    const decoded = decodeToken(token);

    let verified = false;
    let verifyError = null;
    try {
      verifyToken(token);
      verified = true;
    } catch (e) {
      verifyError = e.message;
    }

    let userInDb = null;
    if (decoded?.userId) {
      const result = await query('SELECT id, email, role, is_active FROM emr.users WHERE id = $1', [decoded.userId]);
      userInDb = result.rows[0];
    }

    res.json({ tokenProvided: !!token, decoded, verified, verifyError, userInDb });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
