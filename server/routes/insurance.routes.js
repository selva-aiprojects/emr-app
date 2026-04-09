import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant, requirePermission } from '../middleware/auth.middleware.js';
import { moduleGate } from '../middleware/featureFlag.middleware.js';

const router = express.Router();

// Apply common middleware to all insurance routes
router.use(authenticate);
router.use(requireTenant);
router.use(requirePermission('insurance'));
router.use(moduleGate('insurance'));

/**
 * @route   GET /api/insurance/providers
 * @desc    Get all active insurance providers
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = await repo.getInsuranceProviders(req.tenantId);
    res.json(providers);
  } catch (error) {
    console.error('Error fetching insurance providers:', error);
    res.status(500).json({ error: 'Failed to fetch insurance providers' });
  }
});

/**
 * @route   POST /api/insurance/providers
 * @desc    Add a new insurance provider to the tenant
 */
router.post('/providers', async (req, res) => {
  try {
    const provider = await repo.createInsuranceProvider({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(provider);
  } catch (error) {
    console.error('Error creating insurance provider:', error);
    res.status(500).json({ error: 'Failed to create insurance provider' });
  }
});

/**
 * @route   GET /api/insurance/claims
 * @desc    Get insurance claims filtered by status
 */
router.get('/claims', async (req, res) => {
  try {
    const { status } = req.query;
    const claims = await repo.getClaims(req.tenantId, { status });
    res.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

/**
 * @route   POST /api/insurance/claims
 * @desc    File a new insurance claim for a patient/encounter
 */
router.post('/claims', async (req, res) => {
  try {
    const claim = await repo.createClaim({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(claim);
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

export default router;
