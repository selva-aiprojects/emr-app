/**
 * FHIR Condition Resource Routes
 */

import express from 'express';
import { 
  searchConditions, 
  getConditionById, 
  createCondition, 
  updateConditionStatus,
  getActiveProblemList
} from '../controllers/fhir-condition.controller.js';

const router = express.Router();

// GET /fhir/R4/Condition- Search conditions
router.get('/', async (req, res) => {
  try {
  const conditions = await searchConditions(req.query);
    
  const bundle = {
   resourceType: 'Bundle',
    type: 'searchset',
      timestamp: new Date().toISOString(),
    total: conditions.length,
    entry: conditions.map(condition => ({
       fullUrl: `${process.env.FHIR_BASE_URL}/fhir/R4/Condition/${condition.id}`,
      resource: condition
      }))
    };
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(bundle);
  } catch (error) {
  console.error('Condition search error:', error);
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

// GET /fhir/R4/Condition/{id} - Read by ID
router.get('/:id', async (req, res) => {
  try {
  const condition = await getConditionById(req.params.id);
    
    if (!condition) {
   return res.status(404).json({
     resourceType: 'OperationOutcome',
        issue: [{
       severity: 'error',
       code: 'not-found',
       details: {text: `Condition ${req.params.id} not found`}
        }]
      });
    }
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(condition);
  } catch (error) {
  console.error('Condition read error:', error);
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

// POST /fhir/R4/Condition- Create condition
router.post('/', async (req, res) => {
  try {
  const fhirCondition = req.body;
    
    if (fhirCondition.resourceType !== 'Condition') {
   return res.status(400).json({
     resourceType: 'OperationOutcome',
        issue: [{
       severity: 'error',
       code: 'value',
       details: {text: 'Resource type must be Condition'}
        }]
      });
    }
    
  const created = await createCondition(fhirCondition);
    
  res.status(201).setHeader('Location', `${process.env.FHIR_BASE_URL}/fhir/R4/Condition/${created.id}`);
  res.json(created);
  } catch (error) {
  console.error('Condition create error:', error);
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

// PUT /fhir/R4/Condition/{id}/status- Update status (resolve, etc.)
router.put('/:id/status', async(req, res) => {
  try {
  const { clinical_status } = req.body;
    
    if (!clinical_status) {
   return res.status(400).json({
     resourceType: 'OperationOutcome',
        issue: [{
       severity: 'error',
       code: 'value',
       details: {text: 'clinical_status is required'}
        }]
      });
    }
    
  const updated = await updateConditionStatus(req.params.id, clinical_status);
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(updated);
  } catch (error) {
  console.error('Condition update error:', error);
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

// GET /fhir/R4/Patient/{id}/ProblemList - Get active problem list
router.get('/patient/:id/ProblemList', async (req, res) => {
  try {
  const conditions = await getActiveProblemList(req.params.id);
    
  const bundle = {
   resourceType: 'Bundle',
    type: 'searchset',
      timestamp: new Date().toISOString(),
    total: conditions.length,
    entry: conditions.map(condition => ({
       fullUrl: `${process.env.FHIR_BASE_URL}/fhir/R4/Condition/${condition.id}`,
      resource: condition
      }))
    };
    
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(bundle);
  } catch (error) {
  console.error('Problem list error:', error);
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
