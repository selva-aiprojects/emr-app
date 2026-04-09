import express from 'express';
import { query } from '../db/connection.js';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant } from '../middleware/auth.middleware.js';
import { moduleGate } from '../middleware/featureFlag.middleware.js';

const router = express.Router();

// Apply common middleware to all lab routes
router.use(authenticate);
router.use(requireTenant);
router.use(moduleGate('lab'));

/**
 * @route   GET /api/lab/orders
 * @desc    Get laboratory orders filtered by status
 */
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT sr.*, p.first_name as patient_first_name, p.last_name as patient_last_name, u.name as ordered_by_name
      FROM emr.service_requests sr
      LEFT JOIN emr.patients p ON sr.patient_id = p.id
      LEFT JOIN emr.users u ON sr.requester_id = u.id
      WHERE sr.tenant_id = $1 AND sr.category = 'lab'
    `;
    const params = [req.tenantId];
    if (status) { sql += ` AND sr.status = $2`; params.push(status); }
    sql += ' ORDER BY sr.created_at DESC LIMIT 100';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching lab orders:', error);
    res.status(500).json({ error: 'Failed to fetch lab orders' });
  }
});

/**
 * @route   POST /api/lab/orders
 * @desc    Create new laboratory test orders
 */
router.post('/orders', async (req, res) => {
  try {
    const { patientId, encounterId, tests, priority = 'routine', notes } = req.body;
    if (!patientId || !tests || !tests.length) return res.status(400).json({ error: 'patientId and tests are required' });
    
    const orders = [];
    try {
      await query('BEGIN');
      for (const test of tests) {
        const r = await query(
          `INSERT INTO emr.service_requests (tenant_id, patient_id, encounter_id, requester_id, category, code, display, status, priority, notes)
           VALUES ($1,$2,$3,$4,'lab',$5,$6,'pending',$7,$8) RETURNING *`,
          [req.tenantId, patientId, encounterId || null, req.user.id, test.code || 'LAB', test.name || test.display, priority, notes || null]
        );
        orders.push(r.rows[0]);
      }
      await query('COMMIT');
    } catch (e) {
      await query('ROLLBACK');
      throw e;
    }
    res.status(201).json(orders);
  } catch (error) {
    console.error('Error creating lab order:', error);
    res.status(500).json({ error: 'Failed to create lab order' });
  }
});

/**
 * @route   PATCH /api/lab/orders/:id/status
 * @desc    Update lab order status
 */
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const r = await query(
      `UPDATE emr.service_requests SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, req.tenantId]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(r.rows[0]);
  } catch (error) {
    console.error('Error updating lab order status:', error);
    res.status(500).json({ error: 'Failed to update lab order status' });
  }
});

/**
 * @route   POST /api/lab/orders/:id/results
 * @desc    Record results for a laboratory order
 */
router.post('/orders/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const { results, notes, criticalFlag = false } = req.body;
    
    const r = await query(
      `UPDATE emr.service_requests SET status = 'completed', notes = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [JSON.stringify({ results, criticalFlag, enteredBy: req.user.id, enteredAt: new Date(), notes }), id, req.tenantId]
    );
    
    await repo.createAuditLog({
      tenantId: req.tenantId, userId: req.user.id, userName: req.user.name,
      action: criticalFlag ? 'lab.result.record_critical' : 'lab.result.record',
      entityName: 'service_request', entityId: id, details: { criticalFlag }
    });
    
    if (!r.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(r.rows[0]);
  } catch (error) {
    console.error('Error recording lab results:', error);
    res.status(500).json({ error: 'Failed to record lab results' });
  }
});

export default router;
