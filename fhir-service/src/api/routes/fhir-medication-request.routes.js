/**
 * FHIR MedicationRequest Resource Routes
 */

import express from 'express';
import { 
  searchMedicationRequests, 
  getMedicationRequestById, 
  cancelMedicationRequest,
  renewMedicationRequest
} from '../controllers/fhir-medication-request.controller.js';

const router = express.Router();

// GET /fhir/R4/MedicationRequest-Search prescriptions
router.get('/', async (req, res) => {
  try {
  const prescriptions = await searchMedicationRequests(req.query);
    
  const bundle = {
  resourceType: 'Bundle',
  type: 'searchset',
      timestamp: new Date().toISOString(),
  total: prescriptions.length,
  entry: prescriptions.map(prescription => ({
       fullUrl: `${process.env.FHIR_BASE_URL}/fhir/R4/MedicationRequest/${prescription.id}`,
    resource: prescription
      }))
    };
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(bundle);
  } catch (error) {
  console.error('MedicationRequest search error:', error);
  res.status(500).json({
  resourceType: 'OperationOutcome',
      issue: [{
   severity: 'error',
   code: 'exception',
   details: {text: error.message}
      }]
    });
  }
});

// GET /fhir/R4/MedicationRequest/{id} - Read by ID
router.get('/:id', async (req, res) => {
  try {
  const prescription = await getMedicationRequestById(req.params.id);
    
    if (!prescription) {
  return res.status(404).json({
   resourceType: 'OperationOutcome',
        issue: [{
     severity: 'error',
     code: 'not-found',
     details: {text: `MedicationRequest ${req.params.id} not found`}
        }]
      });
    }
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(prescription);
  } catch (error) {
  console.error('MedicationRequest read error:', error);
  res.status(500).json({
  resourceType: 'OperationOutcome',
      issue: [{
   severity: 'error',
   code: 'exception',
   details: {text: error.message}
      }]
    });
  }
});

// PUT /fhir/R4/MedicationRequest/{id}/cancel- Cancel prescription
router.put('/:id/cancel', async(req, res) => {
  try {
  const {reason } = req.body;
    
  const cancelled = await cancelMedicationRequest(req.params.id, reason);
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(cancelled);
  } catch (error) {
  console.error('MedicationRequest cancel error:', error);
  res.status(400).json({
  resourceType: 'OperationOutcome',
      issue: [{
   severity: 'error',
   code: 'processing',
   details: {text: error.message}
      }]
    });
  }
});

// POST /fhir/R4/MedicationRequest/{id}/renew- Renew prescription
router.post('/:id/renew', async(req, res) => {
  try {
  const { providerId} = req.body;
    
    if (!providerId) {
  return res.status(400).json({
   resourceType: 'OperationOutcome',
        issue: [{
     severity: 'error',
     code: 'value',
     details: {text: 'providerId is required'}
        }]
      });
    }
    
  const renewed = await renewMedicationRequest(req.params.id, providerId);
    
  res.status(201).json(renewed);
  } catch (error) {
  console.error('MedicationRequest renew error:', error);
  res.status(400).json({
  resourceType: 'OperationOutcome',
      issue: [{
   severity: 'error',
   code: 'processing',
   details: {text: error.message}
      }]
    });
  }
});

export default router;
