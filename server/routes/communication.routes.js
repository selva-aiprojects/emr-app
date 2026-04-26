import express from 'express';
import { query } from '../db/connection.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/communications
 * Lists all communications, optionally filtered by tenant_id
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { tenantId, type, status } = req.query;
    
    // Superadmin can see all, others (if authorized) can only see their tenant's
    const isSuperadmin = req.user.role === 'Superadmin';
    const effectiveTenantId = isSuperadmin ? tenantId : req.user.tenantId;

    let sql = `
      SELECT c.*, t.name as tenant_name, t.code as tenant_code
      FROM nexus.communications c
      LEFT JOIN nexus.management_tenants t ON c.tenant_id::text = t.id::text
      WHERE 1=1
    `;
    const params = [];

    if (effectiveTenantId) {
      params.push(effectiveTenantId);
      sql += ` AND c.tenant_id::text = $${params.length}::text`;
    }

    if (type) {
      params.push(type);
      sql += ` AND c.type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND c.status = $${params.length}`;
    }

    sql += ` ORDER BY c.created_at DESC LIMIT 200`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch communications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/communications/notices
 * Alias endpoint for notices (same as communications)
 */
router.get('/notices', authenticate, async (req, res) => {
  try {
    const { tenantId, type, status } = req.query;
    
    // Superadmin can see all, others (if authorized) can only see their tenant's
    const isSuperadmin = req.user.role === 'Superadmin';
    const effectiveTenantId = isSuperadmin ? tenantId : req.user.tenantId;

    let sql = `
      SELECT c.*, t.name as tenant_name, t.code as tenant_code
      FROM nexus.communications c
      LEFT JOIN nexus.management_tenants t ON c.tenant_id::text = t.id::text
      WHERE 1=1
    `;
    const params = [];

    if (effectiveTenantId) {
      params.push(effectiveTenantId);
      sql += ` AND c.tenant_id::text = $${params.length}::text`;
    }

    if (type) {
      params.push(type);
      sql += ` AND c.type = $${params.length}`;
    }

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND c.status = $${params.length}`;
    }

    sql += ` ORDER BY c.created_at DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch communications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/communications/:id
 * Fetches full content of a single communication
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM nexus.communications WHERE id::text = $1::text`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Communication not found' });
    }

    // Auth check
    const comm = result.rows[0];
    if (req.user.role !== 'Superadmin' && comm.tenant_id !== req.user.tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(comm);
  } catch (error) {
    console.error('Failed to fetch communication details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
