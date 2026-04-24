/**
 * FHIR Observation Resource Routes
 */

import express from 'express';
import { 
  searchObservations, 
  getObservationById, 
  createObservation,
  createObservationPanel,
  getLatestVitalSigns,
  getLaboratoryResults
} from '../controllers/fhir-observation.controller.js';

const router = express.Router();

// GET /fhir/R4/Observation- Search observations
router.get('/', async (req, res) => {
  try {
  const observations = await searchObservations(req.query);
    
  const bundle = {
  resourceType: 'Bundle',
   type: 'searchset',
      timestamp: new Date().toISOString(),
   total: observations.length,
   entry: observations.map(observation => ({
       fullUrl: `${process.env.FHIR_BASE_URL}/fhir/R4/Observation/${observation.id}`,
     resource: observation
      }))
    };
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(bundle);
  } catch (error) {
  console.error('Observation search error:', error);
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

// GET /fhir/R4/Observation/{id} - Read by ID
router.get('/:id', async (req, res) => {
  try {
  const observation = await getObservationById(req.params.id);
    
    if (!observation) {
  return res.status(404).json({
    resourceType: 'OperationOutcome',
        issue: [{
      severity: 'error',
      code: 'not-found',
      details: {text: `Observation ${req.params.id} not found`}
        }]
      });
    }
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(observation);
  } catch (error) {
  console.error('Observation read error:', error);
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

// POST /fhir/R4/Observation- Create observation
router.post('/', async (req, res) => {
  try {
  const fhirObservation = req.body;
    
    if (fhirObservation.resourceType !== 'Observation') {
  return res.status(400).json({
    resourceType: 'OperationOutcome',
        issue: [{
      severity: 'error',
      code: 'value',
      details: {text: 'Resource type must be Observation'}
        }]
      });
    }
    
  const created = await createObservation(fhirObservation);
    
  res.status(201).setHeader('Location', `${process.env.FHIR_BASE_URL}/fhir/R4/Observation/${created.id}`);
  res.json(created);
  } catch (error) {
  console.error('Observation create error:', error);
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

// POST /fhir/R4/Observation/panel - Create multiple observations (lab panel, vitals set)
router.post('/panel', async (req, res) => {
  try {
  const fhirObservations = req.body;
    
    if (!Array.isArray(fhirObservations)) {
  return res.status(400).json({
    resourceType: 'OperationOutcome',
        issue: [{
      severity: 'error',
      code: 'value',
      details: {text: 'Request body must be an array of Observations'}
        }]
      });
    }
    
  const created = await createObservationPanel(fhirObservations);
    
  res.status(201).json({
  resourceType: 'Bundle',
   type: 'collection',
      timestamp: new Date().toISOString(),
   entry: created.map(obs => ({
     resource: obs
      }))
  });
  } catch (error) {
  console.error('Observation panel create error:', error);
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

// GET /fhir/R4/Patient/{id}/VitalSigns - Get latest vital signs
router.get('/patient/:id/VitalSigns', async (req, res) => {
  try {
  const vitals = await getLatestVitalSigns(req.params.id, req.query.encounter);
    
  const bundle = {
  resourceType: 'Bundle',
   type: 'searchset',
      timestamp: new Date().toISOString(),
   total: vitals.length,
   entry: vitals.map(vital => ({
       fullUrl: `${process.env.FHIR_BASE_URL}/fhir/R4/Observation/${vital.id}`,
     resource: vital
      }))
    };
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(bundle);
  } catch (error) {
  console.error('Vital signs error:', error);
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

// GET /fhir/R4/Patient/{id}/LaboratoryResults - Get lab results
router.get('/patient/:id/LaboratoryResults', async (req, res) => {
  try {
   const dateRange = req.query.date ? {
     start: req.query.date,
     end: req.query.endDate || new Date().toISOString()
    } : null;
    
  const results = await getLaboratoryResults(req.params.id, dateRange);
    
  const bundle = {
  resourceType: 'Bundle',
   type: 'searchset',
      timestamp: new Date().toISOString(),
   total: results.length,
   entry: results.map(result => ({
       fullUrl: `${process.env.FHIR_BASE_URL}/fhir/R4/Observation/${result.id}`,
     resource: result
      }))
    };
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(bundle);
  } catch (error) {
  console.error('Lab results error:', error);
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

export default router;
