import express from 'express';
import { generatePatientSummary, suggestTreatmentPlan } from '../services/ai.service.js';
import * as repo from '../db/repository.js';
import { requireTenant, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Generate a clinical summary for a patient
router.post('/patient-summary', requireTenant, async (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId) return res.status(400).json({ error: 'patientId is required' });

    const summary = await generatePatientSummary(req.tenantId, patientId);
    
    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'ai.generate_summary',
      entityName: 'patient',
      entityId: patientId,
    });

    res.json({ summary });
  } catch (error) {
    console.error('AI summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Suggest a treatment plan based on clinical data
router.post('/suggest-treatment', requireTenant, requireRole('Doctor'), async (req, res) => {
  try {
    const { complaint, diagnosis, history } = req.body;
    if (!complaint || !diagnosis) return res.status(400).json({ error: 'complaint and diagnosis are required' });

    const suggestion = await suggestTreatmentPlan(req.tenantId, { complaint, diagnosis, history });
    
    res.json({ suggestion });
  } catch (error) {
    console.error('AI treatment error:', error);
    res.status(500).json({ error: 'Failed to suggest treatment' });
  }
});

export default router;
