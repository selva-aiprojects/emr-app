const express = require('express');
const patientController = require('../controllers/patient.controller');
const { authenticateToken, resolveTenant } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and tenant resolution middleware
router.use(authenticateToken);
router.use(resolveTenant);

// Patient CRUD operations
router.get('/', patientController.getPatients);
router.post('/', patientController.createPatient);
router.get('/:id', patientController.getPatient);
router.put('/:id', patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);

// Patient clinical data
router.get('/:id/medical-history', patientController.getMedicalHistory);
router.get('/:id/medications', patientController.getMedications);
router.get('/:id/diagnostics', patientController.getDiagnostics);
router.get('/:id/vitals', patientController.getVitals);
router.get('/:id/billing', patientController.getBilling);

module.exports = router;
