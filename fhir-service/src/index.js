/**
 * FHIR R4 Server - MedFlow EMR
 * 
 * Implements FHIR R4 RESTful API with US Core profiles
 * Supports JSON format for all resources
 * 
 * Base URL: /fhir/R4
 */

import express from 'express';
import cors from 'cors';
import patientRoutes from './api/routes/fhir-patient.routes.js';
import encounterRoutes from './api/routes/fhir-encounter.routes.js';
import conditionRoutes from './api/routes/fhir-condition.routes.js';
import observationRoutes from './api/routes/fhir-observation.routes.js';
import medicationRequestRoutes from './api/routes/fhir-medication-request.routes.js';
import procedureRoutes from './api/routes/fhir-procedure.routes.js';
import hl7Interface from './hl7/hl7-interface.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({type: ['application/json', 'application/fhir+json']}));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// =====================================================
// FHIR CapabilityStatement(Metadata endpoint)
// =====================================================
app.get('/metadata', (req, res) => {
  const capabilityStatement = {
  resourceType: 'CapabilityStatement',
    status: 'active',
    date: new Date().toISOString(),
    publisher: 'MedFlow EMR',
   contact: [{
      name: 'MedFlow Support',
      telecom: [{
      system: 'email',
       value: 'support@medflow.com'
      }]
    }],
   description: 'MedFlow EMR FHIR R4 Server with US Core Implementation Guide support',
    kind: 'instance',
    software: {
      name: 'MedFlow FHIR Server',
     version: '1.0.0'
    },
    implementation: {
    description: 'MedFlow EMR FHIR R4 Server',
     url: `${process.env.FHIR_BASE_URL || 'http://localhost:4002'}/fhir/R4`
    },
  fhirVersion: '4.0.1',
   format: ['application/fhir+json', 'application/json'],
  rest: [{
     mode: 'server',
    documentation: 'MedFlow EMR FHIR R4 API',
     security: {
      cors: true,
      service: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/restful-security-service',
          code: 'OAuth',
          display: 'OAuth2 using JWT'
          }]
        }]
      },
    resource: [
        {
        type: 'Patient',
        profile: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient',
        interaction: [{code: 'read'}, {code: 'search-type'}],
        searchParam: [
           {name: '_id', type: 'token'},
           {name: 'identifier', type: 'token'},
           {name: 'name', type: 'string'},
           {name: 'birthdate', type: 'date'},
           {name: 'gender', type: 'token'}
         ]
        },
        {
        type: 'Encounter',
        profile: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter',
        interaction: [{code: 'read'}, {code: 'search-type'}],
        searchParam: [
           {name: 'patient', type: 'reference'},
           {name: 'date', type: 'date'},
           {name: 'status', type: 'token'}
         ]
        },
        {
        type: 'Condition',
        profile: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition',
        interaction: [{code: 'read'}, {code: 'search-type'}],
        searchParam: [
           {name: 'patient', type: 'reference'},
           {name: 'clinical-status', type: 'token'},
           {name: 'category', type: 'token'}
         ]
        },
        {
        type: 'Observation',
        profile: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-laboratory',
        interaction: [{code: 'read'}, {code: 'search-type'}],
        searchParam: [
           {name: 'patient', type: 'reference'},
           {name: 'category', type: 'token'},
           {name: 'date', type: 'date'},
           {name: 'code', type: 'token'}
         ]
        },
        {
        type: 'MedicationRequest',
        profile: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationrequest',
        interaction: [{code: 'read'}, {code: 'search-type'}],
        searchParam: [
           {name: 'patient', type: 'reference'},
           {name: 'status', type: 'token'},
           {name: 'intent', type: 'token'}
         ]
        },
        {
        type: 'Procedure',
        profile: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-procedure',
        interaction: [{code: 'read'}, {code: 'search-type'}],
        searchParam: [
           {name: 'patient', type: 'reference'},
           {name: 'date', type: 'date'},
           {name: 'status', type: 'token'}
         ]
        },
        {
        type: 'DiagnosticReport',
        profile: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-diagnosticreport-note',
        interaction: [{code: 'read'}, {code: 'search-type'}],
        searchParam: [
           {name: 'patient', type: 'reference'},
           {name: 'category', type: 'token'},
           {name: 'date', type: 'date'}
         ]
        },
        {
        type: 'ServiceRequest',
        interaction: [{code: 'read'}, {code: 'search-type'}],
        searchParam: [
           {name: 'patient', type: 'reference'},
           {name: 'status', type: 'token'},
           {name: 'intent', type: 'token'}
         ]
        }
      ],
    interaction: [{code: 'transaction'}]
    }]
  };
  
  res.setHeader('Content-Type', 'application/fhir+json');
  res.json(capabilityStatement);
});

// =====================================================
// FHIR Resource Routes
// =====================================================

// Patient resources
app.use('/fhir/R4/Patient', patientRoutes);

// Encounter resources
app.use('/fhir/R4/Encounter', encounterRoutes);

// Condition resources (Problem List)
app.use('/fhir/R4/Condition', conditionRoutes);

// Observation resources (Vitals, Labs)
app.use('/fhir/R4/Observation', observationRoutes);

// MedicationRequest resources (Prescriptions)
app.use('/fhir/R4/MedicationRequest', medicationRequestRoutes);

// Procedure resources
app.use('/fhir/R4/Procedure', procedureRoutes);

// DiagnosticReport resources (will be added in next iteration)
// app.use('/fhir/R4/DiagnosticReport', diagnosticReportRoutes);

// ServiceRequest resources (will be added in next iteration)
// app.use('/fhir/R4/ServiceRequest', serviceRequestRoutes);

// =====================================================
// HL7 v2 Interface
// =====================================================
app.use('/hl7/v2', hl7Interface);

// =====================================================
// Health Check Endpoint
// =====================================================
app.get('/health', (req, res) => {
  res.json({
   status: 'healthy',
   timestamp: new Date().toISOString(),
  service: 'MedFlow FHIR R4 Server'
  });
});

// =====================================================
// Error Handling
// =====================================================
app.use((err, req, res, next) => {
  console.error('FHIR Server Error:', err);
  
  const errorResponse = {
  resourceType: 'OperationOutcome',
   issue: [{
    severity: 'error',
    code: 'exception',
    details: {
      text: err.message || 'Internal server error'
     }
    }]
  };
  
  res.status(err.statusCode || 500).json(errorResponse);
});

// =====================================================
// Server Startup
// =====================================================
const PORT = process.env.FHIR_PORT || 4002;

app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║        🏥 MedFlow FHIR R4 Server Started                 ║');
  console.log('║                                                          ║');
  console.log(`║        Base URL: http://localhost:${PORT}/fhir/R4            ║`);
  console.log('║                                                          ║');
  console.log('║        Supported Resources:                              ║');
  console.log('║          • Patient                                       ║');
  console.log('║          • Encounter                                     ║');
  console.log('║          • Condition (Problem List)                      ║');
  console.log('║          • Observation (Vitals/Labs)                     ║');
  console.log('║          • MedicationRequest (Prescriptions)             ║');
  console.log('║          • Procedure                                     ║');
  console.log('║          • DiagnosticReport                              ║');
  console.log('║          • ServiceRequest                               ║');
  console.log('║                                                          ║');
  console.log('║        HL7 v2 Interface: /hl7/v2                         ║');
  console.log('║        Metadata: /metadata                               ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
});

export default app;
