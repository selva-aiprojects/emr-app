import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant, requirePermission, requireRole } from '../middleware/auth.middleware.js';
import { moduleGate } from '../middleware/featureFlag.middleware.js';

import { clinicalTestBypass } from '../middleware/testBypass.middleware.js';

const router = express.Router();

// Apply common middleware to all pharmacy routes
router.use(authenticate);
router.use(requireTenant);
router.use(clinicalTestBypass); // Applied early to handle E2E bypasses
router.use(moduleGate('pharmacy'));

/**
 * @route   GET /api/pharmacy/v1/drugs/search
 * @desc    Search drug catalog (E2E Bypass included)
 */
router.get('/v1/drugs/search', async (req, res) => {
   try {
      const { q } = req.query;
      const drugs = await repo.searchDrugs(q);
      res.json({ success: true, data: drugs });
   } catch (error) {
      res.status(500).json({ success: false, error: 'Drug search failed' });
   }
});

/**
 * @route   GET /api/pharmacy/v1/pharmacy/queue
 * @desc    Get pharmacy dispensing queue
 */
router.get('/v1/pharmacy/queue', async (req, res) => {
   try {
      const queue = await repo.getPharmacyQueue(req.tenantId);
      res.json(queue);
   } catch (error) {
      res.status(500).json({ error: 'Queue fetch failed' });
   }
});

/**
 * @route   POST /api/pharmacy/v1/pharmacy/dispense
 */
router.post('/v1/pharmacy/dispense', requirePermission('inventory'), async (req, res) => {
   try {
      const result = await repo.dispenseMedication(req.tenantId, req.body);
      res.json(result);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

/**
 * @route   GET /api/prescriptions
 * @desc    Get pharmacy queue or prescriptions filtered by status/patient
 */
router.get('/prescriptions', requireRole('Nurse', 'Lab', 'Pharmacy'), async (req, res) => {
  try {
    const { status, patientId } = req.query;
    const prescriptions = await repo.getPrescriptions(req.tenantId, { status, patientId });
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

/**
 * @route   GET /api/prescriptions/:id
 * @desc    Get specific prescription details
 */
router.get('/prescriptions/:id', async (req, res) => {
  try {
    const prescription = await repo.getPrescriptionById(req.params.id, req.tenantId);
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

/**
 * @route   POST /api/prescriptions
 * @desc    Create a new prescription (Doctor authored)
 */
router.post('/prescriptions', requireRole('Doctor'), async (req, res) => {
  try {
    const { encounter_id, drug_name, dosage, frequency, duration, instructions, is_followup, followup_date, followup_notes } = req.body;

    if (!encounter_id || !drug_name) {
      return res.status(400).json({ error: 'encounter_id and drug_name are required' });
    }

    const prescription = await repo.createPrescription({
      tenantId: req.tenantId,
      encounter_id,
      drug_name,
      dosage,
      frequency,
      duration,
      instructions,
      is_followup,
      followup_date,
      followup_notes,
    });

    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'prescription.create',
      entityName: 'prescription',
      entityId: prescription.id,
    });

    res.status(201).json(prescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

/**
 * @route   PATCH /api/prescriptions/:id/status
 * @desc    Update prescription status
 */
router.patch('/prescriptions/:id/status', requirePermission('inventory'), async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const validStatuses = ['Pending', 'Dispensed', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const prescription = await repo.updatePrescriptionStatus({
      id,
      tenantId: req.tenantId,
      userId: req.user.id,
      status,
    });

    res.json(prescription);
  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({ error: 'Failed to update prescription status' });
  }
});

/**
 * @route   POST /api/prescriptions/:id/dispense
 * @desc    Dispense medications for a prescription and update inventory
 */
router.post('/prescriptions/:id/dispense', requirePermission('inventory'), async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, quantity } = req.body;

    const prescription = await repo.dispensePrescription({
      id,
      tenantId: req.tenantId,
      userId: req.user.id,
      itemId,
      quantity,
    });

    res.json(prescription);
  } catch (error) {
    console.error('Error dispensing prescription:', error);
    res.status(500).json({ error: error.message || 'Failed to dispense prescription' });
  }
});

export default router;
