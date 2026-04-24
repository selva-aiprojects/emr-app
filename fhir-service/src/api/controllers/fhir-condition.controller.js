/**
 * FHIR Condition Controller
 * Handles FHIR Condition resource CRUD operations (Problem List, Diagnoses)
 */

import { pool } from '../../db/index.js';
import { transformConditionToFHIR } from '../transformers/emr-to-fhir.js';

// =====================================================
// Search Conditions
// Supports FHIR search parameters: patient, clinical-status, category, code
// =====================================================
export const searchConditions = async (queryParams) => {
  const client = await pool.connect();
  
  try {
  const conditions = ['1=1'];
  const values = [];
    let paramIndex = 1;
    
    // Handle patient parameter
    if (queryParams.patient) {
    conditions.push(`c.patient_id = $${paramIndex++}`);
    values.push(queryParams.patient);
    }
    
    // Handle clinical-status parameter
    if (queryParams['clinical-status']) {
    conditions.push(`c.clinical_status = $${paramIndex++}`);
    values.push(queryParams['clinical-status']);
    }
    
    // Handle category parameter
    if (queryParams.category) {
    conditions.push(`c.category = $${paramIndex++}`);
    values.push(queryParams.category);
    }
    
    // Handle code parameter (SNOMED or ICD-10)
    if (queryParams.code) {
    conditions.push(`(c.code_snomed = $${paramIndex} OR c.code_icd10 = $${paramIndex})`);
    values.push(queryParams.code);
    paramIndex++;
    }
    
    // Build query
  const sql = `
      SELECT 
       c.condition_id as id,
        c.tenant_id,
      c.patient_id,
        c.encounter_id,
       c.clinical_status,
        c.verification_status,
       c.category,
        c.severity,
        c.code_snomed,
        c.code_icd10,
       c.code_icd9,
      c.body_site,
        c.onset_datetime,
        c.abatement_datetime,
        c.recorded_date,
       c.recorder_id,
       c.asserter_id,
        c.stage_summary,
        c.evidence_code,
       c.note,
        c.display_name,
        c.created_at,
        c.updated_at
      FROM emr.conditions c
      WHERE ${conditions.join(' AND ')}
      ORDER BY c.recorded_date DESC
      LIMIT 100
    `;
    
  const result = await client.query(sql, values);
    
    // Transform to FHIR resources
  const fhirConditions = result.rows.map(transformConditionToFHIR);
    
  return fhirConditions;
  } finally {
  client.release();
  }
};

// =====================================================
// Get Condition by ID
// Returns FHIR Condition resource
// =====================================================
export const getConditionById = async(conditionId) => {
  const client = await pool.connect();
  
  try {
  const sql = `
      SELECT 
       c.condition_id as id,
        c.tenant_id,
       c.patient_id,
        c.encounter_id,
        c.clinical_status,
        c.verification_status,
        c.category,
        c.severity,
       c.code_snomed,
       c.code_icd10,
        c.code_icd9,
       c.body_site,
        c.onset_datetime,
        c.abatement_datetime,
        c.recorded_date,
      c.recorder_id,
       c.asserter_id,
        c.stage_summary,
        c.evidence_code,
       c.note,
        c.display_name,
        c.created_at,
        c.updated_at
      FROM emr.conditions c
      WHERE c.condition_id = $1
    `;
    
  const result = await client.query(sql, [conditionId]);
    
    if (result.rows.length === 0) {
    return null;
    }
    
  return transformConditionToFHIR(result.rows[0]);
  } finally {
  client.release();
  }
};

// =====================================================
// Create Condition from FHIR Resource
// Transforms FHIR Condition → EMR Condition → FHIR Condition
// =====================================================
export const createCondition = async(fhirCondition) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Extract data from FHIR resource
  const subjectRef = fhirCondition.subject?.reference || '';
  const patientId = subjectRef.split('/')[1] || null;
    
  const encounterRef = fhirCondition.encounter?.reference || '';
  const encounterId = encounterRef.split('/')?.[1] || null;
    
  const recorderRef = fhirCondition.recorder?.reference || '';
  const recorderId = recorderRef.split('/')?.[1] || null;
    
  const asserterRef = fhirCondition.asserter?.reference || '';
  const asserterId = asserterRef.split('/')?.[1] || null;
    
   // Extract codes
  const code = fhirCondition.code?.coding || [];
  const snomedCode = code.find(c => c.system === 'http://snomed.info/sct')?.code;
  const icd10Code = code.find(c => c.system === 'http://hl7.org/fhir/sid/icd-10')?.code;
    
  const severityCoding = fhirCondition.severity?.coding?.[0]?.code;
  const severity = mapSeverityFromFHIR(severityCoding);
    
  const insertSql = `
      INSERT INTO emr.conditions(
        tenant_id, patient_id, encounter_id, clinical_status, verification_status,
       category, severity, code_snomed, code_icd10, body_site, onset_datetime,
       recorded_date, recorder_id, asserter_id, stage_summary, evidence_code, note, display_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;
    
  const values = [
    fhirCondition.managingOrganization?.reference?.split('/')[1] || null,
    patientId,
    encounterId,
    fhirCondition.clinicalStatus?.coding?.[0]?.code || 'active',
    fhirCondition.verificationStatus?.coding?.[0]?.code || 'unconfirmed',
    fhirCondition.category?.[0]?.coding?.[0]?.code || 'problem-list-item',
    severity,
     snomedCode,
     icd10Code,
    fhirCondition.bodySite?.[0]?.coding?.[0]?.code,
    fhirCondition.onsetDateTime ? new Date(fhirCondition.onsetDateTime) : null,
    fhirCondition.recordedDate ? new Date(fhirCondition.recordedDate) : new Date(),
    recorderId,
    asserterId,
    fhirCondition.stage?.summary?.text,
    fhirCondition.evidence?.code?.map(c => c.coding?.[0]?.code) || [],
    fhirCondition.note?.[0]?.text,
    fhirCondition.code?.text
    ];
    
  const result = await client.query(insertSql, values);
  const condition = result.rows[0];
    
    // Update FHIR reference
  const updateFHIRSql = `
      UPDATE emr.conditions
      SET fhir_condition_ref = $1 
      WHERE condition_id = $2
    `;
    await client.query(updateFHIRSql, [condition.id, condition.condition_id]);
    
    await client.query('COMMIT');
    
    // Return as FHIR resource
  return transformConditionToFHIR(condition);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
  client.release();
  }
};

// =====================================================
// Update Condition Status
// Commonly used for resolving problems
// =====================================================
export const updateConditionStatus = async(conditionId, clinicalStatus) => {
  const client = await pool.connect();
  
  try {
  const updateSql = `
      UPDATE emr.conditions
      SET 
      clinical_status = $1,
        abatement_datetime = CASE WHEN $1 IN ('resolved', 'inactive', 'remission') THEN NOW() ELSE NULL END,
        updated_at = NOW()
      WHERE condition_id = $2
      RETURNING *
    `;
    
  const result = await client.query(updateSql, [clinicalStatus, conditionId]);
    
    if (result.rows.length === 0) {
      throw new Error(`Condition ${conditionId} not found`);
    }
    
  const condition = result.rows[0];
    
    // Return as FHIR resource
  return transformConditionToFHIR(condition);
  } finally {
  client.release();
  }
};

// =====================================================
// Get Patient's Active Problem List
// Optimized for clinical workflow
// =====================================================
export const getActiveProblemList = async(patientId) => {
  const client = await pool.connect();
  
  try {
  const sql = `
      SELECT 
       c.condition_id as id,
        c.tenant_id,
       c.patient_id,
        c.encounter_id,
        c.clinical_status,
        c.verification_status,
        c.category,
        c.severity,
       c.code_snomed,
       c.code_icd10,
       c.body_site,
        c.onset_datetime,
       c.abatement_datetime,
        c.recorded_date,
       c.recorder_id,
        c.asserter_id,
        c.stage_summary,
        c.evidence_code,
       c.note,
        c.display_name,
        c.created_at,
        c.updated_at
      FROM emr.conditions c
      WHERE c.patient_id = $1
        AND c.clinical_status IN ('active', 'recurrence', 'relapse')
      ORDER BY c.recorded_date DESC
    `;
    
  const result = await client.query(sql, [patientId]);
    
    // Transform to FHIR resources
  const fhirConditions = result.rows.map(transformConditionToFHIR);
    
  return fhirConditions;
  } finally {
  client.release();
  }
};

// =====================================================
// Helper Functions
// =====================================================

const mapSeverityFromFHIR = (severityCode) => {
  const map = {
    '255604002': 'mild',
    '371923003': 'moderate',
    '24484000': 'severe'
  };
  return map[severityCode] || severityCode;
};
