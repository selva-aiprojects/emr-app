import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { getSubscriptionCatalog, upsertSubscriptionPlan, ALL_MODULES } from '../db/subscriptionCatalog.service.js';
import { getFeatureTierMatrix, saveFeatureTierMatrix } from '../db/featuresTier.service.js';

const router = express.Router();

// Apply common middleware to all superadmin routes
router.use(authenticate);
router.use(requireRole('Superadmin'));

/**
 * @route   GET /api/admin/subscription-catalog
 * @desc    Get all subscription plan definitions (price, features, module keys)
 */
router.get('/subscription-catalog', async (req, res) => {
  try {
    const catalog = await getSubscriptionCatalog();
    res.json({ plans: catalog, modules: ALL_MODULES });
  } catch (error) {
    console.error('Error fetching subscription catalog:', error);
    res.status(500).json({ error: 'Failed to fetch subscription catalog' });
  }
});

/**
 * @route   POST /api/admin/subscription-catalog
 * @desc    Upsert a subscription plan definition (price, features, modules)
 */
router.post('/subscription-catalog', async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.id) {
      return res.status(400).json({ error: 'subscription.id is required' });
    }
    const saved = await upsertSubscriptionPlan(subscription);
    res.json(saved);
  } catch (error) {
    console.error('Error saving subscription plan:', error);
    res.status(500).json({ error: 'Failed to save subscription plan' });
  }
});

/**
 * @route   GET /api/admin/features-tiers
 * @desc    Get tier-feature matrix (seeded from consolidated XLSX)
 */
router.get('/features-tiers', async (req, res) => {
  try {
    const matrix = await getFeatureTierMatrix();
    res.json(matrix);
  } catch (error) {
    console.error('Error fetching features tiers matrix:', error);
    res.status(500).json({ error: 'Failed to fetch feature tier matrix' });
  }
});

/**
 * @route   PUT /api/admin/features-tiers
 * @desc    Save tier-feature matrix
 */
router.put('/features-tiers', async (req, res) => {
  try {
    const { features } = req.body || {};
    if (!Array.isArray(features)) {
      return res.status(400).json({ error: 'features array is required' });
    }

    const matrix = await saveFeatureTierMatrix(features);
    res.json(matrix);
  } catch (error) {
    console.error('Error saving features tiers matrix:', error);
    res.status(500).json({ error: 'Failed to save feature tier matrix' });
  }
});

/**
 * @route   GET /api/admin/tenants
 * @desc    Get all tenants for management plane
 */
router.get('/tenants', async (req, res) => {
  try {
    const tenants = await repo.getAllTenants();
    res.json(tenants);
  } catch (error) {
    console.error('Error fetching admin tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

/**
 * @route   POST /api/admin/tenants
 * @desc    Onboard a new healthcare institution (Tenant)
 */
router.post('/tenants', async (req, res) => {
  try {
    const { name, code, subdomain, contact_email, subscription_tier } = req.body;
    
    if (!name || !code || !subdomain) {
      return res.status(400).json({ error: 'Name, code, and subdomain are required' });
    }

    const tenant = await repo.createTenant({
      name,
      code,
      subdomain,
      contactEmail: contact_email,
      subscriptionTier: subscription_tier || 'Professional'
    });

    // --- AUTOMATED SHARD PROVISIONING ---
    try {
      await repo.provisionTenantSchema(tenant.id, code.toLowerCase());
    } catch (provErr) {
      console.error(`[PROVISIONING_FAIL] ${code}:`, provErr.message);
    }

    await repo.createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'tenant.create',
      entityName: 'tenant',
      entityId: tenant.id,
      details: { code, subdomain }
    });

    res.status(201).json(tenant);
  } catch (error) {
    console.error('Error creating tenant:', error);
    if (error.constraint === 'tenants_code_key') return res.status(409).json({ error: 'Tenant code already exists' });
    if (error.constraint === 'tenants_subdomain_key') return res.status(409).json({ error: 'Subdomain already exists' });
    res.status(500).json({ error: 'Failed to create tenant', details: error.message });
  }
});

/**
 * @route   PATCH /api/admin/tenants/:id/status
 * @desc    Enable/Disable a tenant institution
 */
router.patch('/tenants/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const tenant = await repo.updateTenantStatus(id, status);

    await repo.createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'tenant.status_update',
      entityName: 'tenant',
      entityId: id,
      details: { status }
    });

    res.json(tenant);
  } catch (error) {
    console.error('Error updating tenant status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get global operational metrics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await repo.getGlobalStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * @route   PATCH /api/admin/tenants/:id/tier
 * @desc    Update a tenant's subscription tier
 */
router.patch('/tenants/:id/tier', async (req, res) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;
    if (!tier) return res.status(400).json({ error: 'tier is required' });

    const tenant = await repo.setTenantTier(id, tier);

    await repo.createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'tenant.tier_update',
      entityName: 'tenant',
      entityId: id,
      details: { tier }
    });

    res.json(tenant);
  } catch (error) {
    console.error('Error updating tenant tier:', error);
    res.status(500).json({ error: 'Failed to update tier' });
  }
});

/**
 * @route   POST /api/admin/tenants/:id/features
 * @desc    Enable/Disable specific feature flags for a tenant
 */
router.post('/tenants/:id/features', async (req, res) => {
  try {
    const { id } = req.params;
    const { featureFlag, enabled } = req.body;
    if (!featureFlag || typeof enabled !== 'boolean') return res.status(400).json({ error: 'featureFlag and enabled are required' });

    const override = await repo.setTenantFeatureOverride(id, featureFlag, enabled);

    await repo.createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'tenant.feature_override',
      entityName: 'tenant',
      entityId: id,
      details: { featureFlag, enabled }
    });

    res.json(override);
  } catch (error) {
    console.error('Error updating tenant feature override:', error);
    res.status(500).json({ error: 'Failed to update feature override' });
  }
});

/**
 * @route   GET /api/admin/kill-switches
 * @desc    Get status of all global kill switches
 */
router.get('/kill-switches', async (req, res) => {
  try {
    const { getGlobalKillSwitches } = await import('../services/featureFlag.service.js');
    const killSwitches = await getGlobalKillSwitches();
    res.json(killSwitches);
  } catch (error) {
    console.error('Error fetching kill switches:', error);
    res.status(500).json({ error: 'Failed to fetch kill switches' });
  }
});

/**
 * @route   POST /api/admin/kill-switches
 * @desc    Update a global kill switch status
 */
router.post('/kill-switches', async (req, res) => {
  try {
    const { featureFlag, enabled } = req.body;
    if (!featureFlag || typeof enabled !== 'boolean') return res.status(400).json({ error: 'featureFlag and enabled are required' });

    const { setGlobalKillSwitch } = await import('../services/featureFlag.service.js');
    const killSwitch = await setGlobalKillSwitch(featureFlag, enabled);

    await repo.createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'kill_switch.update',
      entityName: 'kill_switch',
      details: { featureFlag, enabled }
    });

    res.json(killSwitch);
  } catch (error) {
    console.error('Error updating kill switch:', error);
    res.status(500).json({ error: 'Failed to update kill switch' });
  }
});

export default router;
