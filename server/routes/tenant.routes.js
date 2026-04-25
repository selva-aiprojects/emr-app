import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant, requireRole } from '../middleware/auth.middleware.js';
import { getSubscriptionCatalog, ALL_MODULES } from '../db/subscriptionCatalog.service.js';

const router = express.Router();

// NOTE: We don't apply router-level middleware here because GET / is needed for the public login page
// router.use(authenticate);
// router.use(requireTenant);

/**
 * @route   GET /api/tenants/subscription-catalog
 * @desc    Get the public subscription feature matrix for tenant upgrades
 */
router.get('/subscription-catalog', authenticate, async (req, res) => {
  try {
    const catalog = await getSubscriptionCatalog();
    res.json({ plans: catalog, modules: ALL_MODULES });
  } catch (error) {
    console.error('Error fetching subscription catalog:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

/**
 * @route   GET /api/tenants
 * @desc    Get all tenants (Public/Admin filtered)
 */
router.get('/', async (req, res) => {
  try {
     // If superadmin, show all management tenants
     if (req.user?.role === 'Superadmin') {
       const tenants = await repo.getAllTenants();
       return res.json(tenants);
     }
     
     // Public list (strictly from DB)
     const tenantsRes = await repo.query("SELECT id, name, code, subdomain, logo_url FROM nexus.tenants WHERE status = 'active' LIMIT 100");
     res.json(tenantsRes.rows);
  } catch (error) {
    console.error('Tenant fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

/**
 * @route   PATCH /api/tenants/:id/settings
 * @desc    Update tenant configuration (UI primary colors, features, tier)
 * NOTE: requireTenant is intentionally SKIPPED here — Superadmin has no JWT tenantId
 *       and would be blocked. We resolve tenantId from the URL param instead.
 */
router.patch('/:id/settings', authenticate, requireRole('Admin', 'Superadmin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Superadmin has no tenantId in JWT — use URL param directly
    if (!req.tenantId) req.tenantId = id;

    // Non-superadmin can only edit their own tenant
    if (req.user.role !== 'Superadmin' && req.tenantId !== id) {
      return res.status(403).json({ error: 'You can only update your own tenant settings' });
    }

    const { 
      displayName, 
      primaryColor, accentColor,
      newPrimaryColor, newAccentColor, 
      featureInventory, featureTelehealth,
      subscriptionTier, billingConfig, logo_url,
      // Accept theme as a full object (sent by HospitalSettingsPage)
      theme: themeBody,
      features: featuresBody
    } = req.body;

    // Resolve theme: prefer the full theme object, fall back to flat color fields
    const resolvedTheme = themeBody || ((primaryColor || newPrimaryColor || accentColor || newAccentColor) ? {
      primary: primaryColor || newPrimaryColor,
      accent: accentColor || newAccentColor,
    } : null);

    // Resolve features: prefer the full features object, fall back to individual flags
    const resolvedFeatures = featuresBody || ((featureInventory !== undefined || featureTelehealth !== undefined) ? {
      inventory: Boolean(featureInventory),
      telehealth: Boolean(featureTelehealth),
    } : null);

    const tenant = await repo.updateTenantSettings({
      tenantId: id,
      displayName,
      theme: resolvedTheme,
      features: resolvedFeatures,
      subscriptionTier,
      billingConfig,
      logo_url
    });

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    await repo.createAuditLog({
      tenantId: id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'tenant.settings.update',
      entityName: 'tenant',
      entityId: id,
    });

    res.json(tenant);
  } catch (error) {
    console.error('Tenant settings update error:', error);
    res.status(500).json({ error: 'Failed to update tenant settings', details: error.message });
  }
});

/**
 * @route   GET /api/tenants/:id/features
 * @desc    Get active feature flags for the current tenant
 */
router.get('/:id/features', authenticate, requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { getFeatureFlagStatus } = await import('../services/featureFlag.service.js');
    const flags = await getFeatureFlagStatus(id);
    res.json(flags);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
});

export default router;
