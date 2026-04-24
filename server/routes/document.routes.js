import express from 'express';
import { query } from '../db/connection.js';
import { authenticate, requireTenant, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply common middleware to all document routes
router.use(authenticate);
router.use(requireTenant);

/**
 * @route   GET /api/documents
 * @desc    Get document metadata with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { category, includeDeleted = 'false', patientId } = req.query;
    const conditions = ['d.tenant_id::text = $1::text'];
    const params = [req.tenantId];
    if (category) { params.push(category); conditions.push(`d.category = $${params.length}`); }
    if (patientId) { params.push(patientId); conditions.push(`d.patient_id = $${params.length}`); }
    if (String(includeDeleted).toLowerCase() !== 'true') conditions.push('d.is_deleted = false');
    
const result = await query(
      `SELECT 'No documents available' as message`,
      []
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * @route   POST /api/documents
 * @desc    Register new document metadata (Upload bridge)
 */
router.post('/', requireRole('Admin', 'Doctor', 'Nurse', 'Lab', 'Pharmacy', 'Front Office'), async (req, res) => {
  try {
    const { patientId = null, encounterId = null, category = 'other', title, fileName, mimeType = null, storageKey = null, sizeBytes = 0, tags = [] } = req.body;
    if (!title || !fileName) return res.status(400).json({ error: 'title and fileName are required' });
    
    const inserted = await query(
      `INSERT INTO emr.documents (tenant_id, patient_id, encounter_id, category, title, file_name, mime_type, storage_key, size_bytes, tags, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11) RETURNING *`,
      [req.tenantId, patientId, encounterId, category, title, fileName, mimeType, storageKey || `manual://${fileName}`, Number(sizeBytes || 0), JSON.stringify(tags), req.user.id]
    );
    
    await query(`INSERT INTO emr.document_audit_logs (tenant_id, document_id, action, actor_id, metadata) VALUES ($1, $2, 'upload', $3, $4::jsonb)`,
      [req.tenantId, inserted.rows[0].id, req.user.id, JSON.stringify({ category })]
    );
    res.status(201).json(inserted.rows[0]);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document metadata' });
  }
});

/**
 * @route   PATCH /api/documents/:id/delete
 * @desc    Soft delete or restore a document
 */
router.patch('/:id/delete', requireRole('Admin', 'Doctor', 'Nurse', 'Lab', 'Pharmacy', 'Front Office'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isDeleted = true } = req.body;
    
    const updated = await query(`UPDATE emr.documents SET is_deleted = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [Boolean(isDeleted), id, req.tenantId]
    );
    if (!updated.rows.length) return res.status(404).json({ error: 'Notice not found' });
    
    await query(`INSERT INTO emr.document_audit_logs (tenant_id, document_id, action, actor_id, metadata) VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [req.tenantId, id, isDeleted ? 'delete' : 'restore', req.user.id, JSON.stringify({ softDelete: true })]
    );
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating document deletion state:', error);
    res.status(500).json({ error: 'Failed to update document state' });
  }
});

export default router;
