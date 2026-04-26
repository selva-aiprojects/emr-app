import express from 'express';
import { authenticate, requireTenant } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply middleware
router.use(authenticate);
router.use(requireTenant);

/**
 * @route   GET /api/expenses
 * @desc    Get expenses for a tenant
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req;
    const { limit = 50, offset = 0, status, category } = req.query;
    
    let sql = `
      SELECT * 
      FROM expenses 
      WHERE tenant_id::text = $1::text
    `;
    const params = [tenantId];
    
    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    
    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    // For now, return empty array since expenses table might not exist yet
    res.json([]);
    
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * @route   POST /api/expenses
 * @desc    Create a new expense
 */
router.post('/', async (req, res) => {
  try {
    const { tenantId, userId } = req;
    const { amount, category, description, date, status = 'pending' } = req.body;
    
    // For now, return a mock response since expenses table might not exist yet
    const mockExpense = {
      id: `exp_${Date.now()}`,
      tenantId,
      userId,
      amount,
      category,
      description,
      date,
      status,
      created_at: new Date().toISOString()
    };
    
    res.status(201).json(mockExpense);
    
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

export default router;
