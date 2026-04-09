import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant, requirePermission } from '../middleware/auth.middleware.js';
import { moduleGate } from '../middleware/featureFlag.middleware.js';

const router = express.Router();

// Apply common middleware to all ambulance routes
router.use(authenticate);
router.use(requireTenant);
router.use(moduleGate('ambulance'));

/**
 * @route   GET /api/ambulances
 * @desc    Get organization-wide ambulance fleet details
 */
router.get('/', async (req, res) => {
  try {
    const fleet = await repo.getAmbulances(req.tenantId);
    res.json(fleet);
  } catch (error) {
    console.error('Error fetching fleet:', error);
    res.status(500).json({ error: 'Failed to fetch fleet' });
  }
});

/**
 * @route   POST /api/ambulances
 * @desc    Register a new ambulance unit
 */
router.post('/', requirePermission('admin'), async (req, res) => {
  try {
    const ambulance = await repo.createAmbulance({ ...req.body, tenantId: req.tenantId, userId: req.user.id });
    res.status(201).json(ambulance);
  } catch (error) {
    console.error('Error creating ambulance:', error);
    res.status(500).json({ error: 'Failed to register ambulance in fleet' });
  }
});

/**
 * @route   POST /api/ambulances/dispatch
 * @desc    Dispatch an ambulance unit to a specific location
 */
router.post('/dispatch', async (req, res) => {
  try {
    const dispatchResult = await repo.dispatchAmbulance({ ...req.body, tenantId: req.tenantId });
    res.status(200).json(dispatchResult);
  } catch (error) {
    console.error('Dispatch Error:', error);
    res.status(500).json({ error: 'Systemic Dispatch Failure' });
  }
});

/**
 * @route   PATCH /api/ambulances/:id/status
 * @desc    Update ambulance status and location (Telemetry)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, lat, lng } = req.body;
    const updated = await repo.updateAmbulanceStatus(id, req.tenantId, status, lat, lng);
    res.json(updated);
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ error: 'Failed to update unit status' });
  }
});

export default router;
