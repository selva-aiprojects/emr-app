import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant, requirePermission } from '../middleware/auth.middleware.js';
import { moduleGate } from '../middleware/featureFlag.middleware.js';

const router = express.Router();

// Apply common middleware to all inventory routes
router.use(authenticate);
router.use(requireTenant);
router.use(moduleGate('inventory'));

/**
 * @route   POST /api/inventory-items
 * @desc    Add a new item to the master inventory
 */
router.post('/items', requirePermission('inventory'), async (req, res) => {
  try {
    const { code, name, category, stock, reorder } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }

    const item = await repo.createInventoryItem({
      tenantId: req.tenantId,
      userId: req.user.id,
      code,
      name,
      category,
      stock: stock || 0,
      reorder: reorder || 0,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    if (error.constraint === 'inventory_items_tenant_id_item_code_key') {
      return res.status(409).json({ error: 'Item code already exists' });
    }
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

/**
 * @route   GET /api/inventory-items
 * @desc    List all inventory items for a tenant
 */
router.get('/items', requirePermission('inventory'), async (req, res) => {
  try {
    const items = await repo.getInventoryItems(req.tenantId);
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

/**
 * @route   PATCH /api/inventory-items/:id/stock
 * @desc    Adjust stock level for a specific item (delta-based)
 */
router.patch('/items/:id/stock', requirePermission('inventory'), async (req, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body;

    if (delta == null || isNaN(Number(delta))) {
      return res.status(400).json({ error: 'delta must be a number' });
    }

    const item = await repo.updateInventoryStock({
      itemId: id,
      tenantId: req.tenantId,
      userId: req.user.id,
      delta: Number(delta),
    });

    res.json(item);
  } catch (error) {
    console.error('Error updating inventory stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

export default router;
