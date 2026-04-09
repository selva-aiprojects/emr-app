import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant, requirePermission } from '../middleware/auth.middleware.js';
import { moduleGate } from '../middleware/featureFlag.middleware.js';

const router = express.Router();

// Apply common middleware to all HR/Account routes
router.use(authenticate);
router.use(requireTenant);

/**
 * @route   POST /api/attendance
 * @desc    Record employee attendance (Check-in/Check-out)
 */
router.post('/attendance', requirePermission('employees'), moduleGate('employees'), async (req, res) => {
  try {
    const record = await repo.recordAttendance({ ...req.body, tenantId: req.tenantId });

    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'attendance.record',
      entityName: 'attendance',
      entityId: record.id,
      details: { employeeId: req.body.employeeId, status: req.body.status },
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

/**
 * @route   GET /api/attendance
 * @desc    Get attendance records for a specific date
 */
router.get('/attendance', requirePermission('employees'), moduleGate('employees'), async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const records = await repo.getAttendance(req.tenantId, date);
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

/**
 * @route   POST /api/expenses
 * @desc    Add a new operational expense
 */
router.post('/expenses', requirePermission('billing'), moduleGate('billing'), async (req, res) => {
  try {
    const expense = await repo.addExpense({ ...req.body, tenantId: req.tenantId, recordedBy: req.user.id });
    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'expense.create',
      entityName: 'expense',
      entityId: expense.id,
      details: { category: req.body.category, amount: req.body.amount }
    });
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

/**
 * @route   GET /api/expenses
 * @desc    Get expenses filtered by month
 */
router.get('/expenses', requirePermission('billing'), moduleGate('billing'), async (req, res) => {
  try {
    const { month } = req.query;
    const expenses = await repo.getExpenses(req.tenantId, { month });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

export default router;
