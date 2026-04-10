import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// NOTE: We don't apply router-level middleware here because GET / is needed for the public login page
// router.use(authenticate);
// router.use(requireTenant);

/**
 * @route   GET /api/tenants
 * @desc    Get all tenants (Public/Admin filtered)
 */
router.get('/', async (req, res) => {
  try {
     const nhglId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
     const nhglTenant = { id: nhglId, name: 'NHGL Healthcare Institute', code: 'NHGL', subdomain: 'nhgl', logo_url: '' };

     // If superadmin, show all management tenants
     if (req.user?.role === 'Superadmin') {
       const tenants = await repo.getAllTenants();
       // Ensure NHGL is present in the list
       if (!tenants.some(t => t.id === nhglId)) tenants.push(nhglTenant);
       return res.json(tenants);
     }
     
     // Public list (limited info)
     let tenantsRows = [];
     try {
       const tenantsRes = await repo.query("SELECT id, name, code, subdomain, logo_url FROM emr.tenants WHERE status = 'active' LIMIT 100");
       tenantsRows = tenantsRes.rows;
     } catch (dbErr) {
       console.warn('[TENANTS_BYPASS] Database unavailable, using hardcoded NHGL only');
     }

     // Inject NHGL if missing
     if (!tenantsRows.some(t => t.id === nhglId)) {
       tenantsRows.unshift(nhglTenant);
     }

     res.json(tenantsRows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

/**
 * @route   PATCH /api/tenants/:id/settings
 * @desc    Update tenant configuration (UI primary colors, features, tier)
 */
router.patch('/:id/settings', authenticate, requireTenant, requireRole('Admin', 'Superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      displayName, 
      primaryColor, accentColor,
      newPrimaryColor, newAccentColor, 
      featureInventory, featureTelehealth,
      subscriptionTier, billingConfig, logo_url 
    } = req.body;

    const theme = (primaryColor || newPrimaryColor || accentColor || newAccentColor) ? {
      primary: primaryColor || newPrimaryColor,
      accent: accentColor || newAccentColor,
    } : null;

    const features = (featureInventory !== undefined || featureTelehealth !== undefined) ? {
      inventory: Boolean(featureInventory),
      telehealth: Boolean(featureTelehealth),
    } : null;

    const tenant = await repo.updateTenantSettings({
      tenantId: id,
      displayName,
      theme,
      features,
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
