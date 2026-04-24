import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant } from '../middleware/auth.middleware.js';
import { moduleGate } from '../middleware/featureFlag.middleware.js';

const router = express.Router();

/**
 * Custom middleware to handle Superadmin bypass of tenant requirement for support tickets
 */
const dynamicTenantGate = (req, res, next) => {
  const tenantId = req.query.tenantId || req.header('x-tenant-id');
  if (req.user.role === 'Superadmin' && !tenantId) {
    req.tenantId = null;
    return next();
  }
  return requireTenant(req, res, next);
};

// Apply common middleware to all support routes
router.use(authenticate);
router.use(dynamicTenantGate);

/**
 * @route   GET /api/support/tickets
 * @desc    Get all support tickets (Admin filtered)
 */
router.get('/tickets', async (req, res, next) => {
  if (!req.tenantId) return next();
  return moduleGate('support')(req, res, next);
}, async (req, res) => {
  try {
    const tickets = await repo.getSupportTickets(req.tenantId);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

/**
 * @route   POST /api/support/tickets
 * @desc    Create a new support ticket
 */
router.post('/tickets', moduleGate('support'), async (req, res) => {
  try {
    const { type, location, description, priority } = req.body;
    if (!type || !description) return res.status(400).json({ error: 'type and description are required' });
    
    const ticket = await repo.createSupportTicket({ 
      tenantId: req.tenantId, 
      userId: req.user.id, 
      type, location, description, priority 
    });
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

/**
 * @route   PATCH /api/support/tickets/:id/status
 * @desc    Update support ticket status
 */
router.patch('/tickets/:id/status', moduleGate('support'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const ticket = await repo.updateSupportTicketStatus({ 
      id, tenantId: req.tenantId, userId: req.user.id, status 
    });
    res.json(ticket);
  } catch (error) {
    console.error('Error updating support ticket status:', error);
    res.status(500).json({ error: 'Failed to update support ticket status' });
  }
});

export default router;
