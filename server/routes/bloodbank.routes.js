import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant, requirePermission } from '../middleware/auth.middleware.js';
import { moduleGate } from '../middleware/featureFlag.middleware.js';

const router = express.Router();

// Apply common middleware to all blood bank routes
router.use(authenticate);
router.use(requireTenant);
router.use(moduleGate('inventory'));

/**
 * @route   GET /api/blood-bank/units
 * @desc    Get blood unit inventory
 */
router.get('/units', async (req, res) => {
  try {
    const units = await repo.getBloodUnits(req.tenantId);
    res.json(units);
  } catch (error) {
    console.error('Error fetching blood units:', error);
    res.status(500).json({ error: 'Failed to fetch blood bank inventory' });
  }
});

/**
 * @route   POST /api/blood-bank/units
 * @desc    Add new blood units to inventory
 */
router.post('/units', requirePermission('inventory'), async (req, res) => {
  try {
    const unit = await repo.createBloodUnit({ ...req.body, tenantId: req.tenantId, userId: req.user.id });
    res.status(201).json(unit);
  } catch (error) {
    console.error('Error adding blood unit:', error);
    res.status(500).json({ error: 'Failed to record blood unit' });
  }
});

/**
 * @route   GET /api/blood-bank/requests
 * @desc    Get all blood transfusion requests
 */
router.get('/requests', async (req, res) => {
  try {
    const requests = await repo.getBloodRequests(req.tenantId);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching blood requests:', error);
    res.status(500).json({ error: 'Failed to fetch blood requests' });
  }
});

export default router;
