/**
 * FHIR Observation Controller
 * Handles FHIR Observation resource CRUD operations (Vitals, Lab Results)
 */

import { pool } from '../../db/index.js';
import { transformObservationToFHIR } from '../transformers/emr-to-fhir.js';

// =====================================================
// Search Observations
// Supports FHIR search parameters: patient, category, date, code
// =====================================================
export const searchObservations = async (queryParams) => {
  const client = await pool.connect();
  
  try {
  const conditions = ['1=1'];
  const values = [];
    let paramIndex = 1;
    
    // Handle patient parameter
    if (queryParams.patient) {
    conditions.push(`o.patient_id = $${paramIndex++}`);
    values.push(queryParams.patient);
    }
    
    // Handle category parameter
    if (queryParams.category) {
    conditions.push(`o.category = $${paramIndex++}`);
    values.push(queryParams.category);
    }
    
    // Handle date parameter(date range)
    if (queryParams.date) {
    conditions.push(`o.effective_datetime::date = $${paramIndex++}`);
    values.push(queryParams.date);
    }
    
    // Handle code parameter(LOINC or SNOMED)
    if (queryParams.code) {
    conditions.push(`(o.code_loinc = $${paramIndex} OR o.code_snomed = $${paramIndex})`);
    values.push(queryParams.code);
    paramIndex++;
    }
    
    // Build query
  const sql = `
      SELECT 
      o.observation_id as id,
        o.tenant_id,
       o.patient_id,
        o.encounter_id,
       o.status,
        o.category,
        o.code_loinc,
        o.code_snomed,
       o.display_name,
        o.value_quantity,
        o.value_quantity_unit,
       o.value_string,
        o.value_boolean,
        o.effective_datetime,
        o.issued_datetime,
        o.performer_id,
       o.interpretation,
        o.reference_range_low,
        o.reference_range_high,
        o.reference_range_text,
       o.method,
        o.note,
        o.created_at,
       o.updated_at
      FROM emr.observations o
      WHERE ${conditions.join(' AND ')}
      ORDER BY o.effective_datetime DESC
      LIMIT 100
    `;
    
  const result = await client.query(sql, values);
    
    // Transform to FHIR resources
  const fhirObservations = result.rows.map(transformObservationToFHIR);
    
  return fhirObservations;
  } finally {
  client.release();
  }
};

// =====================================================
// Get Observation by ID
// Returns FHIR Observation resource
// =====================================================
export const getObservationById = async(observationId) => {
  const client = await pool.connect();
  
  try {
  const sql = `
      SELECT 
       o.observation_id as id,
       o.tenant_id,
       o.patient_id,
        o.encounter_id,
      o.status,
        o.category,
        o.code_loinc,
        o.code_snomed,
       o.display_name,
       o.value_quantity,
        o.value_quantity_unit,
        o.value_string,
        o.value_boolean,
        o.effective_datetime,
       o.issued_datetime,
        o.performer_id,
        o.interpretation,
        o.reference_range_low,
       o.reference_range_high,
        o.reference_range_text,
        o.method,
        o.note,
       o.created_at,
        o.updated_at
      FROM emr.observations o
      WHERE o.observation_id= $1
    `;
    
  const result = await client.query(sql, [observationId]);
    
    if (result.rows.length === 0) {
    return null;
    }
    
  return transformObservationToFHIR(result.rows[0]);
  } finally {
  client.release();
  }
};

// =====================================================
// Create Observation from FHIR Resource
// Transforms FHIR Observation → EMR Observation → FHIR Observation
// =====================================================
export const createObservation = async(fhirObservation) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Extract data from FHIR resource
  const subjectRef = fhirObservation.subject?.reference || '';
  const patientId = subjectRef.split('/')[1] || null;
    
  const encounterRef = fhirObservation.encounter?.reference || '';
  const encounterId = encounterRef.split('/')?.[1] || null;
    
  const performerRef = fhirObservation.performer?.[0]?.reference || '';
  const performerId = performerRef.split('/')?.[1] || null;
    
    // Extract codes
  const code = fhirObservation.code?.coding || [];
  const loincCode = code.find(c => c.system === 'http://loinc.org')?.code;
  const snomedCode = code.find(c => c.system === 'http://snomed.info/sct')?.code;
    
    // Extract value
  const valueQuantity = fhirObservation.valueQuantity;
  const interpretation = fhirObservation.interpretation?.[0]?.coding?.[0]?.code;
    
  const insertSql = `
      INSERT INTO emr.observations(
        tenant_id, patient_id, encounter_id, status, category, code_loinc,
       code_snomed, display_name, value_quantity, value_quantity_unit,
        effective_datetime, performer_id, interpretation, reference_range_low,
       reference_range_high, reference_range_text, method, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;
    
  const values = [
    fhirObservation.managingOrganization?.reference?.split('/')[1] || null,
    patientId,
    encounterId,
    fhirObservation.status || 'registered',
    fhirObservation.category?.[0]?.coding?.[0]?.code || 'vital-signs',
     loincCode,
     snomedCode,
    fhirObservation.code?.text,
    valueQuantity?.value,
    valueQuantity?.unit,
    fhirObservation.effectiveDateTime ? new Date(fhirObservation.effectiveDateTime) : new Date(),
    performerId,
    interpretation,
    fhirObservation.referenceRange?.[0]?.low?.value,
    fhirObservation.referenceRange?.[0]?.high?.value,
    fhirObservation.referenceRange?.[0]?.text,
    fhirObservation.method?.coding?.[0]?.code,
    fhirObservation.note?.[0]?.text
    ];
    
  const result = await client.query(insertSql, values);
  const observation = result.rows[0];
    
    // Update FHIR reference
  const updateFHIRSql = `
      UPDATE emr.observations
      SET fhir_observation_ref = $1 
      WHERE observation_id = $2
    `;
    await client.query(updateFHIRSql, [observation.id, observation.observation_id]);
    
    await client.query('COMMIT');
    
    // Return as FHIR resource
  return transformObservationToFHIR(observation);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
  client.release();
  }
};

// =====================================================
// Create Multiple Observations(Panel)
// For lab panels or multiple vitals at once
// =====================================================
export const createObservationPanel = async(fhirObservations) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
  const createdObservations = [];
    
    for (const fhirObs of fhirObservations) {
    const subjectRef = fhirObs.subject?.reference || '';
    const patientId = subjectRef.split('/')[1] || null;
      
    const encounterRef = fhirObs.encounter?.reference || '';
    const encounterId = encounterRef.split('/')?.[1] || null;
      
    const performerRef = fhirObs.performer?.[0]?.reference || '';
    const performerId = performerRef.split('/')?.[1] || null;
      
    const code = fhirObs.code?.coding || [];
    const loincCode = code.find(c => c.system === 'http://loinc.org')?.code;
    const snomedCode = code.find(c => c.system === 'http://snomed.info/sct')?.code;
      
    const valueQuantity = fhirObs.valueQuantity;
    const interpretation = fhirObs.interpretation?.[0]?.coding?.[0]?.code;
      
    const insertSql = `
        INSERT INTO emr.observations(
          tenant_id, patient_id, encounter_id, status, category, code_loinc,
         code_snomed, display_name, value_quantity, value_quantity_unit,
          effective_datetime, performer_id, interpretation, reference_range_low,
         reference_range_high, reference_range_text, note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;
      
    const values = [
      fhirObs.managingOrganization?.reference?.split('/')[1] || null,
      patientId,
      encounterId,
      fhirObs.status || 'registered',
      fhirObs.category?.[0]?.coding?.[0]?.code || 'laboratory',
       loincCode,
       snomedCode,
      fhirObs.code?.text,
      valueQuantity?.value,
      valueQuantity?.unit,
      fhirObs.effectiveDateTime ? new Date(fhirObs.effectiveDateTime) : new Date(),
      performerId,
      interpretation,
      fhirObs.referenceRange?.[0]?.low?.value,
      fhirObs.referenceRange?.[0]?.high?.value,
      fhirObs.referenceRange?.[0]?.text,
      fhirObs.note?.[0]?.text
      ];
      
    const result = await client.query(insertSql, values);
    const observation = result.rows[0];
      
      // Update FHIR reference
    const updateFHIRSql = `
        UPDATE emr.observations
        SET fhir_observation_ref = $1 
        WHERE observation_id = $2
      `;
      await client.query(updateFHIRSql, [observation.id, observation.observation_id]);
      
    createdObservations.push(observation);
    }
    
    await client.query('COMMIT');
    
    // Return as FHIR resources
  return createdObservations.map(transformObservationToFHIR);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
  client.release();
  }
};

// =====================================================
// Get Patient's Vital Signs
// Optimized for clinical workflow - returns latest vitals
// =====================================================
export const getLatestVitalSigns = async(patientId, encounterId = null) => {
  const client = await pool.connect();
  
  try {
   let sql;
   let values;
   
   if (encounterId) {
    sql = `
      SELECT 
      o.observation_id as id,
        o.tenant_id,
       o.patient_id,
        o.encounter_id,
       o.status,
        o.category,
       o.code_loinc,
        o.code_snomed,
       o.display_name,
        o.value_quantity,
        o.value_quantity_unit,
        o.effective_datetime,
        o.performer_id,
        o.interpretation,
        o.reference_range_low,
       o.reference_range_high,
        o.reference_range_text,
        o.created_at
      FROM emr.observations o
      WHERE o.patient_id = $1
        AND o.encounter_id = $2
        AND o.category = 'vital-signs'
      ORDER BY o.effective_datetime DESC
    `;
    values = [patientId, encounterId];
   } else {
    sql = `
      SELECT DISTINCT ON (o.code_loinc)
       o.observation_id as id,
        o.tenant_id,
       o.patient_id,
        o.encounter_id,
       o.status,
        o.category,
       o.code_loinc,
        o.code_snomed,
       o.display_name,
        o.value_quantity,
        o.value_quantity_unit,
        o.effective_datetime,
        o.performer_id,
       o.interpretation,
        o.reference_range_low,
        o.reference_range_high,
        o.reference_range_text,
       o.created_at
      FROM emr.observations o
      WHERE o.patient_id = $1
        AND o.category = 'vital-signs'
      ORDER BY o.code_loinc, o.effective_datetime DESC
    `;
    values = [patientId];
   }
    
  const result = await client.query(sql, values);
    
    // Transform to FHIR resources
  const fhirObservations = result.rows.map(transformObservationToFHIR);
    
  return fhirObservations;
  } finally {
  client.release();
  }
};

// =====================================================
// Get Laboratory Results for Patient
// Returns lab results with interpretations
// =====================================================
export const getLaboratoryResults = async(patientId, dateRange = null) => {
  const client = await pool.connect();
  
  try {
   let sql = `
      SELECT 
       o.observation_id as id,
       o.tenant_id,
       o.patient_id,
        o.encounter_id,
      o.status,
        o.category,
        o.code_loinc,
        o.code_snomed,
       o.display_name,
       o.value_quantity,
        o.value_quantity_unit,
        o.effective_datetime,
       o.performer_id,
        o.interpretation,
        o.reference_range_low,
        o.reference_range_high,
       o.reference_range_text,
        o.created_at
      FROM emr.observations o
      WHERE o.patient_id = $1
        AND o.category = 'laboratory'
    `;
    
  const values = [patientId];
    
   if (dateRange) {
    sql += ` AND o.effective_datetime BETWEEN $2 AND $3`;
   values.push(dateRange.start, dateRange.end);
   }
    
   sql += ` ORDER BY o.effective_datetime DESC LIMIT 100`;
    
  const result = await client.query(sql, values);
    
    // Transform to FHIR resources
  const fhirObservations = result.rows.map(transformObservationToFHIR);
    
  return fhirObservations;
  } finally {
  client.release();
  }
};
