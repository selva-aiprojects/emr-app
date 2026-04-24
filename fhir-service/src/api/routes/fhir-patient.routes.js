/**
 * FHIR Patient Resource Routes
 * Implements FHIR R4 Patient endpoints with US Core profiles
 */

import express from 'express';
import { 
  searchPatients, 
  getPatientById, 
  createPatient, 
  updatePatient 
} from '../controllers/fhir-patient.controller.js';

const router = express.Router();

// =====================================================
// FHIR Search Endpoint
// GET /fhir/R4/Patient?[parameters]
// =====================================================
router.get('/', async (req, res) => {
  try {
   const patients = await searchPatients(req.query);
    
    // Return as FHIR Bundle
   const bundle = {
    resourceType: 'Bundle',
     type: 'searchset',
      timestamp: new Date().toISOString(),
     total: patients.length,
     entry: patients.map(patient => ({
       fullUrl: `${process.env.FHIR_BASE_URL}/fhir/R4/Patient/${patient.id}`,
       resource: patient
      }))
    };
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(bundle);
  } catch (error) {
   console.error('Patient search error:', error);
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

// =====================================================
// FHIR Read by ID
// GET /fhir/R4/Patient/{id}
// =====================================================
router.get('/:id', async (req, res) => {
  try {
   const patient = await getPatientById(req.params.id);
    
    if (!patient) {
     return res.status(404).json({
      resourceType: 'OperationOutcome',
        issue: [{
        severity: 'error',
        code: 'not-found',
        details: {text: `Patient ${req.params.id} not found`}
        }]
      });
    }
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(patient);
  } catch (error) {
   console.error('Patient read error:', error);
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

// =====================================================
// FHIR Create
// POST /fhir/R4/Patient
// =====================================================
router.post('/', async (req, res) => {
  try {
  const fhirPatient = req.body;
    
    // Validate FHIR resource
    if (fhirPatient.resourceType !== 'Patient') {
     return res.status(400).json({
      resourceType: 'OperationOutcome',
        issue: [{
        severity: 'error',
        code: 'value',
        details: {text: 'Resource type must be Patient'}
        }]
      });
    }
    
  const created = await createPatient(fhirPatient);
    
  res.status(201).setHeader('Location', `${process.env.FHIR_BASE_URL}/fhir/R4/Patient/${created.id}`);
  res.json(created);
  } catch (error) {
   console.error('Patient create error:', error);
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

// =====================================================
// FHIR Update
// PUT /fhir/R4/Patient/{id}
// =====================================================
router.put('/:id', async(req, res) => {
  try {
  const fhirPatient = req.body;
    
    // Validate ID match
    if (fhirPatient.id && fhirPatient.id !== req.params.id) {
     return res.status(400).json({
      resourceType: 'OperationOutcome',
        issue: [{
        severity: 'error',
        code: 'value',
        details: {text: 'Resource ID does not match URL ID'}
        }]
      });
    }
    
  const updated = await updatePatient(req.params.id, fhirPatient);
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(updated);
  } catch (error) {
   console.error('Patient update error:', error);
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
