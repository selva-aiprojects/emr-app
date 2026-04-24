/**
 * FHIR Encounter Controller
 * Handles FHIR Encounter resource CRUD operations
 */

import { pool } from '../../db/index.js';
import { transformEncounterToFHIR } from '../transformers/emr-to-fhir.js';

// =====================================================
// Search Encounters
// Supports FHIR search parameters: patient, date, status, class
// =====================================================
export const searchEncounters = async (queryParams) => {
  const client = await pool.connect();
  
  try {
   const conditions = ['1=1'];
   const values = [];
    let paramIndex = 1;
    
    // Handle patient parameter
    if (queryParams.patient) {
     conditions.push(`e.patient_id = $${paramIndex++}`);
     values.push(queryParams.patient);
    }
    
    // Handle date parameter(date range)
    if (queryParams.date) {
     conditions.push(`e.visit_date::date = $${paramIndex++}`);
     values.push(queryParams.date);
    }
    
    // Handle status parameter
    if (queryParams.status) {
     conditions.push(`e.status = $${paramIndex++}`);
     values.push(queryParams.status);
    }
    
    // Handle class parameter
    if (queryParams.class) {
     conditions.push(`e.encounter_class = $${paramIndex++}`);
     values.push(queryParams.class);
    }
    
    // Build query
   const sql = `
      SELECT 
        e.id,
        e.tenant_id,
        e.patient_id,
       e.provider_id,
        e.encounter_type,
        e.encounter_class,
       e.visit_date,
        e.chief_complaint,
        e.diagnosis,
        e.notes,
        e.status,
        e.service_type,
        e.priority,
        e.discharge_disposition,
        e.hospitalization_admission_source,
       e.created_at,
        e.updated_at
      FROM emr.encounters e
      WHERE ${conditions.join(' AND ')}
      ORDER BY e.visit_date DESC
      LIMIT 100
    `;
    
   const result = await client.query(sql, values);
    
    // Transform to FHIR resources
   const fhirEncounters = result.rows.map(transformEncounterToFHIR);
    
   return fhirEncounters;
  } finally {
   client.release();
  }
};

// =====================================================
// Get Encounter by ID
// Returns FHIR Encounter resource
// =====================================================
export const getEncounterById = async(encounterId) => {
  const client = await pool.connect();
  
  try {
   const sql = `
      SELECT 
       e.id,
        e.tenant_id,
       e.patient_id,
        e.provider_id,
       e.encounter_type,
        e.encounter_class,
        e.visit_date,
       e.chief_complaint,
       e.diagnosis,
        e.notes,
        e.status,
       e.service_type,
        e.priority,
        e.discharge_disposition,
        e.hospitalization_admission_source,
        e.created_at,
        e.updated_at
      FROM emr.encounters e
      WHERE e.id = $1
    `;
    
   const result = await client.query(sql, [encounterId]);
    
    if (result.rows.length === 0) {
     return null;
    }
    
   return transformEncounterToFHIR(result.rows[0]);
  } finally {
   client.release();
  }
};

// =====================================================
// Create Encounter from FHIR Resource
// Transforms FHIR Encounter → EMR Encounter → FHIR Encounter
// =====================================================
export const createEncounter = async (fhirEncounter) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Extract data from FHIR resource
   const subjectRef = fhirEncounter.subject?.reference || '';
   const patientId = subjectRef.split('/')[1] || null;
    
   const participantRef = fhirEncounter.participant?.[0]?.individual?.reference || '';
   const providerId = participantRef.split('/')[1] || null;
    
   const encounterClass = fhirEncounter.class?.code || 'AMB';
    
   const insertSql = `
      INSERT INTO emr.encounters(
        tenant_id, patient_id, provider_id, encounter_type, encounter_class,
        visit_date, chief_complaint, notes, status, service_type, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
   const values = [
     fhirEncounter.serviceProvider?.reference?.split('/')[1] || null,
     patientId,
     providerId,
     mapFHIRClassToType(encounterClass),
     encounterClass,
     fhirEncounter.period?.start ? new Date(fhirEncounter.period.start) : new Date(),
     fhirEncounter.reasonCode?.[0]?.text || null,
     fhirEncounter.diagnosis?.[0]?.condition?.reference ? 'See condition' : null,
     mapFHREncounterStatus(fhirEncounter.status),
     fhirEncounter.serviceType ? fhirEncounter.serviceType.text : null,
     fhirEncounter.priority?.coding?.[0]?.code || '5'
    ];
    
   const result = await client.query(insertSql, values);
   const encounter = result.rows[0];
    
    // Update FHIR reference
   const updateFHIRSql = `
      UPDATE emr.encounters
      SET fhir_encounter_ref = $1 
      WHERE id = $2
    `;
    await client.query(updateFHIRSql, [encounter.id, encounter.id]);
    
    await client.query('COMMIT');
    
    // Return as FHIR resource
   return transformEncounterToFHIR(encounter);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
   client.release();
  }
};

// =====================================================
// Update Encounter
// =====================================================
export const updateEncounter = async(encounterId, fhirEncounter) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
   const encounterClass = fhirEncounter.class?.code || 'AMB';
    
   const updateSql = `
      UPDATE emr.encounters
      SET 
       encounter_type = $1,
       encounter_class = $2,
        chief_complaint = $3,
       notes = $4,
        status = $5,
       service_type = $6,
       priority = $7,
       discharge_disposition = $8,
        hospitalization_admission_source = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;
    
   const values = [
     mapFHIRClassToType(encounterClass),
     encounterClass,
     fhirEncounter.reasonCode?.[0]?.text || null,
     fhirEncounter.diagnosis?.[0]?.condition?.reference ? 'See condition' : null,
     mapFHREncounterStatus(fhirEncounter.status),
     fhirEncounter.serviceType ? fhirEncounter.serviceType.text : null,
     fhirEncounter.priority?.coding?.[0]?.code || '5',
     fhirEncounter.hospitalization?.dischargeDisposition?.coding?.[0]?.code || null,
     fhirEncounter.hospitalization?.admissionSource?.coding?.[0]?.code || null,
     encounterId
    ];
    
   const result = await client.query(updateSql, values);
    
    if (result.rows.length === 0) {
      throw new Error(`Encounter ${encounterId} not found`);
    }
    
   const encounter = result.rows[0];
    
    await client.query('COMMIT');
    
   return transformEncounterToFHIR(encounter);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
   client.release();
  }
};

// =====================================================
// Helper Functions
// =====================================================

const mapFHREncounterStatus = (status) => {
  const map = {
    'planned': 'scheduled',
    'in-progress': 'open',
    'finished': 'closed',
    'cancelled': 'cancelled',
    'entered-in-error': 'cancelled'
  };
  return map[status] || 'open';
};

const mapFHIRClassToType = (classCode) => {
  const map = {
    'AMB': 'OPD',
    'IMP': 'IPD',
    'EMER': 'emergency',
    'VR': 'virtual',
    'HH': 'home'
  };
  return map[classCode] || 'OPD';
};
