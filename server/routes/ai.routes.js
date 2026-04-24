import express from 'express';
import { generatePatientSummary, suggestTreatmentPlan, generateDischargeSummary, analyzeMedicalImage } from '../services/ai.service.js';
import * as repo from '../db/repository.js';
import { authenticate, requireTenant, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication to all AI routes
router.use(authenticate);

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
router.post('/suggest-treatment', requireTenant, requireRole('Doctor', 'Admin'), async (req, res) => {
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

// Generate a formal discharge summary for an inpatient
router.post('/discharge-summary', requireTenant, async (req, res) => {
  try {
    const { encounterId } = req.body;
    if (!encounterId) return res.status(400).json({ error: 'encounterId is required' });

    const summary = await generateDischargeSummary(req.tenantId, encounterId);
    
    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'ai.generate_discharge_summary',
      entityName: 'encounter',
      entityId: encounterId,
    });

    res.json({ summary });
  } catch (error) {
    console.error('AI discharge summary error:', error);
    res.status(500).json({ error: 'Failed to generate discharge summary' });
  }
});

// Analyze a medical image or document scan
router.post('/analyze-image', requireTenant, async (req, res) => {
  try {
    const { documentId, imageUrl } = req.body;
    if (!documentId) return res.status(400).json({ error: 'documentId is required' });

    const analysis = await analyzeMedicalImage(req.tenantId, documentId, imageUrl);
    
    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'ai.analyze_image',
      entityName: 'document',
      entityId: documentId,
    });

    res.json({ analysis });
  } catch (error) {
    console.error('AI scan error:', error);
    res.status(500).json({ error: 'Failed to analyze clinical document' });
  }
});

export default router;
