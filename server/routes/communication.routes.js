import express from 'express';
import { query } from '../db/connection.js';
import { authenticate, requireTenant, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply common middleware to all communication routes
router.use(authenticate);
router.use(requireTenant);

/**
 * @route   GET /api/notices
 * @desc    Get published notices filtered by audience role
 */
router.get('/notices', async (req, res) => {
  try {
    const { status = 'published' } = req.query;
    const role = req.user.role;
    const statusCondition = status === 'all' ? '' : 'AND n.status = $3';
    const params = status === 'all' ? [req.tenantId, role] : [req.tenantId, role, status];
    
    const result = await query(
      `SELECT n.*, u.name AS created_by_name FROM emr.notices n 
       LEFT JOIN emr.users u ON u.id = n.created_by
       WHERE n.tenant_id = $1 AND (jsonb_array_length(n.audience_roles) = 0 OR n.audience_roles ? $2) ${statusCondition}
       ORDER BY n.priority DESC, n.starts_at DESC, n.created_at DESC`,
      params

    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
});

/**
 * @route   POST /api/notices
 * @desc    Create a new notice for the organization
 */
router.post('/notices', requireRole('Admin', 'Management', 'HR'), async (req, res) => {
  try {
    const { title, body, audienceRoles = [], audienceDepartments = [], startsAt, endsAt, status = 'published', priority = 'normal' } = req.body;
    if (!title || !body || !startsAt) return res.status(400).json({ error: 'title, body and startsAt are required' });
    
    const created = await query(
      `INSERT INTO emr.notices (tenant_id, title, body, audience_roles, audience_departments, starts_at, ends_at, status, priority, created_by)
       VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10) RETURNING *`,
      [req.tenantId, title, body, JSON.stringify(audienceRoles), JSON.stringify(audienceDepartments), startsAt, endsAt || null, status, priority, req.user.id]
    );
    res.status(201).json(created.rows[0]);
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ error: 'Failed to create notice' });
  }
});

/**
 * @route   PATCH /api/notices/:id/status
 * @desc    Update notice status (draft/published/archived)
 */
router.patch('/notices/:id/status', requireRole('Admin', 'Management', 'HR'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['draft', 'published', 'archived'].includes(status)) return res.status(400).json({ error: 'Invalid status value' });
    
    const updated = await query(
      `UPDATE emr.notices SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, req.tenantId]
    );
    if (!updated.rows.length) return res.status(404).json({ error: 'Notice not found' });
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating notice status:', error);
    res.status(500).json({ error: 'Failed to update notice status' });
  }
});

export default router;
