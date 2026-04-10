import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant, requirePermission } from '../middleware/auth.middleware.js';
import { moduleGate } from '../middleware/featureFlag.middleware.js';

import { clinicalTestBypass } from '../middleware/testBypass.middleware.js';

const router = express.Router();

// Apply common middleware to all billing routes
router.use(authenticate);
router.use(requireTenant);
router.use(clinicalTestBypass);
router.use(moduleGate('billing'));

/**
 * @route   POST /api/invoices
 * @desc    Create a new invoice for a patient
 */
router.post('/', requirePermission('billing'), async (req, res) => {
  try {
    const { patientId, description, amount, taxPercent, paymentMethod } = req.body;

    if (!patientId || amount == null) {
      return res.status(400).json({ error: 'patientId and amount are required' });
    }

    const invoice = await repo.createInvoice({
      tenantId: req.tenantId,
      userId: req.user.id,
      patientId,
      description,
      amount,
      taxPercent: taxPercent || 0,
      paymentMethod
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

/**
 * @route   PATCH /api/invoices/:id/pay
 * @desc    Process payment for an invoice
 */
router.patch('/:id/pay', requirePermission('billing'), async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const invoice = await repo.payInvoice({
      invoiceId: id,
      tenantId: req.tenantId,
      userId: req.user.id,
      paymentMethod
    });

    res.json(invoice);
  } catch (error) {
    console.error('Error paying invoice:', error);
    res.status(500).json({ error: 'Failed to pay invoice' });
  }
});

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices for a tenant
 */
router.get('/', requirePermission('billing'), async (req, res) => {
  try {
    const invoices = await repo.getInvoices(req.tenantId);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

export default router;
