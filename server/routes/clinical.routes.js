import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant } from '../middleware/auth.middleware.js';
import { moduleGate } from '../middleware/featureFlag.middleware.js';

const router = express.Router();

// Apply common middleware to all special clinical routes
router.use(authenticate);
router.use(requireTenant);

/**
 * @route   POST /api/inpatient/:id/discharge-invoice
 * @desc    Generate a final invoice specifically for inpatient discharge
 */
router.post('/inpatient/:id/discharge-invoice', moduleGate('inpatient'), async (req, res) => {
  try {
    const { id } = req.params;
    const { patientId, amount = 0, description } = req.body;
    if (!patientId) return res.status(400).json({ error: 'patientId is required' });
    
    const invoice = await repo.createInvoice({
      tenantId: req.tenantId, userId: req.user.id, patientId,
      description: description || 'Inpatient Admission & Healthcare Services',
      amount: amount || 0, taxPercent: 0, paymentMethod: 'Insurance', status: 'unpaid'
    });
    
    await repo.createAuditLog({
      tenantId: req.tenantId, userId: req.user.id, userName: req.user.name,
      action: 'inpatient.discharge.invoice_created', entityName: 'invoice', entityId: invoice.id, details: { encounterId: id, patientId }
    });
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating discharge invoice:', error);
    res.status(500).json({ error: 'Failed to create discharge invoice' });
  }
});

/**
 * @route   GET /api/realtime-tick
 * @desc    Get a summary update of critical datasets for dashboard polling
 */
router.get('/realtime-tick', async (req, res) => {
  try {
    const data = await repo.getBootstrapData(req.tenantId, req.user.id);
    res.json({ 
      patients: data.patients, 
      appointments: data.appointments, 
      encounters: data.encounters, 
      invoices: data.invoices, 
      inventory: data.inventory 
    });
  } catch (error) {
    console.error('Error fetching realtime data:', error);
    res.status(500).json({ error: 'Failed to fetch realtime data' });
  }
});

export default router;
