import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant, requirePermission } from '../middleware/auth.middleware.js';
import { moduleGate } from '../middleware/featureFlag.middleware.js';

const router = express.Router();

// Apply common middleware to all employee routes
router.use(authenticate);
router.use(requireTenant);
router.use(moduleGate('employees'));

/**
 * @route   POST /api/employees
 * @desc    Create a new employee record
 */
router.post('/', requirePermission('employees'), async (req, res) => {
  try {
    const { name, code, department, designation, joinDate, shift, salary } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'name and code are required' });
    }

    const employee = await repo.createEmployee({
      tenantId: req.tenantId,
      name,
      code,
      department,
      designation,
      joinDate,
      shift,
      salary: salary || 0,
    });

    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'employee.create',
      entityName: 'employee',
      entityId: employee.id,
      details: { code },
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.constraint === 'employees_tenant_id_code_key') {
      return res.status(409).json({ error: 'Employee code already exists' });
    }
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

/**
 * @route   POST /api/employees/:id/leaves
 * @desc    Apply for employee leave
 */
router.post('/:id/leaves', requirePermission('employees'), async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, type } = req.body;

    if (!from || !to || !type) {
      return res.status(400).json({ error: 'from, to, and type are required' });
    }

    const validTypes = ['Casual', 'Sick', 'Earned', 'Unpaid'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid leave type' });
    }

    const leave = await repo.createEmployeeLeave({
      tenantId: req.tenantId,
      employeeId: id,
      from,
      to,
      type,
    });

    res.status(201).json(leave);
  } catch (error) {
    console.error('Error creating employee leave:', error);
    res.status(500).json({ error: 'Failed to create leave record' });
  }
});

export default router;
