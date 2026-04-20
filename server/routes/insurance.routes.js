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

router.put('/providers/:id', async (req, res) => {
  try {
    const provider = await repo.updateInsuranceProvider({ providerId: req.params.id, tenantId: req.tenantId, updates: req.body });
    res.json(provider);
  } catch (error) {
    console.error('Error updating insurance provider:', error);
    res.status(500).json({ error: 'Failed to update insurance provider' });
  }
});

/**
 * @route   GET /api/insurance/claims
 * @desc    Get insurance claims filtered by status
 */
router.get('/claims', async (req, res) => {
  try {
    const claims = await repo.getInsuranceClaims(req.tenantId, req.query);
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
    const claim = await repo.createInsuranceClaim({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(claim);
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

// Pre-authorization endpoints
router.get('/preauth', async (req, res) => {
  try {
    const preauthRequests = await repo.getPreauthorizationRequests(req.tenantId, req.query);
    res.json(preauthRequests);
  } catch (error) {
    console.error('Error fetching preauthorization requests:', error);
    res.status(500).json({ error: 'Failed to fetch preauthorization requests' });
  }
});

router.post('/preauth', async (req, res) => {
  try {
    const preauth = await repo.createPreauthorizationRequest({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(preauth);
  } catch (error) {
    console.error('Error creating preauthorization request:', error);
    res.status(500).json({ error: 'Failed to create preauthorization request' });
  }
});

router.patch('/preauth/:id', async (req, res) => {
  try {
    const preauth = await repo.updatePreauthStatus({ preauthId: req.params.id, tenantId: req.tenantId, ...req.body });
    res.json(preauth);
  } catch (error) {
    console.error('Error updating preauthorization request:', error);
    res.status(500).json({ error: 'Failed to update preauthorization request' });
  }
});

// Patient insurance policies
router.get('/patient-insurance', async (req, res) => {
  try {
    const policies = await repo.getPatientInsurance(req.tenantId, req.query);
    res.json(policies);
  } catch (error) {
    console.error('Error fetching patient insurance records:', error);
    res.status(500).json({ error: 'Failed to fetch patient insurance records' });
  }
});

router.post('/patient-insurance', async (req, res) => {
  try {
    const policy = await repo.createPatientInsurance({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(policy);
  } catch (error) {
    console.error('Error creating patient insurance record:', error);
    res.status(500).json({ error: 'Failed to create patient insurance record' });
  }
});

router.patch('/patient-insurance/:id', async (req, res) => {
  try {
    const policy = await repo.updatePatientInsurance({ insuranceId: req.params.id, tenantId: req.tenantId, updates: req.body });
    res.json(policy);
  } catch (error) {
    console.error('Error updating patient insurance record:', error);
    res.status(500).json({ error: 'Failed to update patient insurance record' });
  }
});

export default router;
