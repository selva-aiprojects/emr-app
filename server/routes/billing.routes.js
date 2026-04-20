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

// Billing item endpoints
router.get('/items', requirePermission('billing'), async (req, res) => {
  try {
    const items = await repo.getBillingItems(req.tenantId, req.query);
    res.json(items);
  } catch (error) {
    console.error('Error fetching billing items:', error);
    res.status(500).json({ error: 'Failed to fetch billing items' });
  }
});

router.post('/items', requirePermission('billing'), async (req, res) => {
  try {
    const item = await repo.createBillingItem({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating billing item:', error);
    res.status(500).json({ error: 'Failed to create billing item' });
  }
});

router.patch('/items/:id', requirePermission('billing'), async (req, res) => {
  try {
    const updatedItem = await repo.updateBillingItem({ itemId: req.params.id, tenantId: req.tenantId, updates: req.body });
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating billing item:', error);
    res.status(500).json({ error: 'Failed to update billing item' });
  }
});

router.delete('/items/:id', requirePermission('billing'), async (req, res) => {
  try {
    const deletedItem = await repo.deleteBillingItem(req.params.id, req.tenantId);
    res.json(deletedItem);
  } catch (error) {
    console.error('Error deleting billing item:', error);
    res.status(500).json({ error: 'Failed to delete billing item' });
  }
});

// Billing concessions
router.get('/concessions', requirePermission('billing'), async (req, res) => {
  try {
    const concessions = await repo.getBillingConcessions(req.tenantId, req.query);
    res.json(concessions);
  } catch (error) {
    console.error('Error fetching billing concessions:', error);
    res.status(500).json({ error: 'Failed to fetch billing concessions' });
  }
});

router.post('/concessions', requirePermission('billing'), async (req, res) => {
  try {
    const concession = await repo.createBillingConcession({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(concession);
  } catch (error) {
    console.error('Error creating billing concession:', error);
    res.status(500).json({ error: 'Failed to create billing concession' });
  }
});

router.patch('/concessions/:id', requirePermission('billing'), async (req, res) => {
  try {
    const concession = await repo.updateBillingConcession({ concessionId: req.params.id, tenantId: req.tenantId, updates: req.body });
    res.json(concession);
  } catch (error) {
    console.error('Error updating billing concession:', error);
    res.status(500).json({ error: 'Failed to update billing concession' });
  }
});

// Credit notes
router.get('/credit-notes', requirePermission('billing'), async (req, res) => {
  try {
    const creditNotes = await repo.getCreditNotes(req.tenantId, req.query);
    res.json(creditNotes);
  } catch (error) {
    console.error('Error fetching credit notes:', error);
    res.status(500).json({ error: 'Failed to fetch credit notes' });
  }
});

router.post('/credit-notes', requirePermission('billing'), async (req, res) => {
  try {
    const creditNote = await repo.createCreditNote({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(creditNote);
  } catch (error) {
    console.error('Error creating credit note:', error);
    res.status(500).json({ error: 'Failed to create credit note' });
  }
});

// Approval workflows
router.get('/approvals', requirePermission('billing'), async (req, res) => {
  try {
    const approvals = await repo.getBillingApprovals(req.tenantId, req.query);
    res.json(approvals);
  } catch (error) {
    console.error('Error fetching billing approvals:', error);
    res.status(500).json({ error: 'Failed to fetch billing approvals' });
  }
});

router.post('/approvals', requirePermission('billing'), async (req, res) => {
  try {
    const approval = await repo.createBillingApproval({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(approval);
  } catch (error) {
    console.error('Error creating billing approval:', error);
    res.status(500).json({ error: 'Failed to create billing approval' });
  }
});

router.patch('/approvals/:id', requirePermission('billing'), async (req, res) => {
  try {
    const approval = await repo.updateBillingApproval({ approvalId: req.params.id, tenantId: req.tenantId, updates: req.body });
    res.json(approval);
  } catch (error) {
    console.error('Error updating billing approval:', error);
    res.status(500).json({ error: 'Failed to update billing approval' });
  }
});

// Corporate billing
router.get('/corporate-clients', requirePermission('billing'), async (req, res) => {
  try {
    const clients = await repo.getCorporateClients(req.tenantId);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching corporate clients:', error);
    res.status(500).json({ error: 'Failed to fetch corporate clients' });
  }
});

router.post('/corporate-clients', requirePermission('billing'), async (req, res) => {
  try {
    const client = await repo.createCorporateClient({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating corporate client:', error);
    res.status(500).json({ error: 'Failed to create corporate client' });
  }
});

router.get('/corporate-bills', requirePermission('billing'), async (req, res) => {
  try {
    const bills = await repo.getCorporateBills(req.tenantId, req.query);
    res.json(bills);
  } catch (error) {
    console.error('Error fetching corporate bills:', error);
    res.status(500).json({ error: 'Failed to fetch corporate bills' });
  }
});

router.post('/corporate-bills', requirePermission('billing'), async (req, res) => {
  try {
    const bill = await repo.createCorporateBill({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(bill);
  } catch (error) {
    console.error('Error creating corporate bill:', error);
    res.status(500).json({ error: 'Failed to create corporate bill' });
  }
});

router.patch('/corporate-bills/:id', requirePermission('billing'), async (req, res) => {
  try {
    const bill = await repo.updateCorporateBill({ billId: req.params.id, tenantId: req.tenantId, updates: req.body });
    res.json(bill);
  } catch (error) {
    console.error('Error updating corporate bill:', error);
    res.status(500).json({ error: 'Failed to update corporate bill' });
  }
});

router.get('/corporate-bills/:id/items', requirePermission('billing'), async (req, res) => {
  try {
    const items = await repo.getCorporateBillItems(req.params.id, req.tenantId);
    res.json(items);
  } catch (error) {
    console.error('Error fetching corporate bill items:', error);
    res.status(500).json({ error: 'Failed to fetch corporate bill items' });
  }
});

router.post('/corporate-bills/:id/items', requirePermission('billing'), async (req, res) => {
  try {
    const item = await repo.createCorporateBillItem({ ...req.body, tenantId: req.tenantId, billId: req.params.id });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating corporate bill item:', error);
    res.status(500).json({ error: 'Failed to create corporate bill item' });
  }
});

export default router;
