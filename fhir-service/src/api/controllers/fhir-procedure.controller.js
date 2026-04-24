/**
 * FHIR Procedure Controller
 * Handles FHIR Procedure resource CRUD operations
 */

import { pool } from '../../db/index.js';
import { transformProcedureToFHIR } from '../transformers/emr-to-fhir.js';

// =====================================================
// Search Procedures
// Supports FHIR search parameters: patient, date, status, code
// =====================================================
export const searchProcedures = async(queryParams) => {
  const client = await pool.connect();
  
  try {
  const conditions = ['1=1'];
  const values = [];
    let paramIndex = 1;
    
    // Handle patient parameter
    if (queryParams.patient) {
  conditions.push(`p.patient_id = $${paramIndex++}`);
  values.push(queryParams.patient);
    }
    
    // Handle date parameter
    if (queryParams.date) {
  conditions.push(`p.performed_datetime::date = $${paramIndex++}`);
  values.push(queryParams.date);
    }
    
    // Handle status parameter
    if (queryParams.status) {
  conditions.push(`p.status = $${paramIndex++}`);
  values.push(queryParams.status);
    }
    
    // Handle code parameter
    if (queryParams.code) {
  conditions.push(`(p.code_snomed = $${paramIndex} OR p.code_cpt = $${paramIndex})`);
  values.push(queryParams.code);
  paramIndex++;
    }
    
  const sql = `
      SELECT 
       p.procedure_id as id,
        p.tenant_id,
       p.patient_id,
       p.encounter_id,
       p.status,
       p.category,
        p.code_snomed,
       p.code_cpt,
      p.code_hcpcs,
       p.body_site,
        p.performed_datetime,
        p.performer_id,
        p.reason_code,
        p.indication_condition_id,
        p.outcome,
        p.complication,
        p.follow_up_required,
       p.follow_up_instructions,
        p.note,
        p.created_at,
       p.updated_at
      FROM emr.procedures p
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.performed_datetime DESC
      LIMIT 100
    `;
    
  const result = await client.query(sql, values);
    
    // Transform to FHIR resources
  const fhirProcedures = result.rows.map(transformProcedureToFHIR);
    
  return fhirProcedures;
  } finally {
  client.release();
  }
};

// =====================================================
// Get Procedure by ID
// Returns FHIR Procedure resource
// =====================================================
export const getProcedureById = async(procedureId) => {
  const client = await pool.connect();
  
  try {
  const sql = `
      SELECT 
      p.procedure_id as id,
        p.tenant_id,
      p.patient_id,
        p.encounter_id,
       p.status,
        p.category,
        p.code_snomed,
       p.code_cpt,
      p.code_hcpcs,
       p.body_site,
        p.performed_datetime,
        p.performer_id,
       p.reason_code,
        p.indication_condition_id,
        p.outcome,
       p.complication,
        p.follow_up_required,
        p.follow_up_instructions,
       p.note,
        p.created_at,
        p.updated_at
      FROM emr.procedures p
      WHERE p.procedure_id = $1
    `;
    
  const result = await client.query(sql, [procedureId]);
    
    if (result.rows.length === 0) {
  return null;
    }
    
  return transformProcedureToFHIR(result.rows[0]);
  } finally {
  client.release();
  }
};

// =====================================================
// Create Procedure from FHIR Resource
// =====================================================
export const createProcedure = async(fhirProcedure) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Extract data from FHIR resource
  const subjectRef = fhirProcedure.subject?.reference || '';
  const patientId = subjectRef.split('/')[1] || null;
    
  const encounterRef = fhirProcedure.encounter?.reference || '';
  const encounterId = encounterRef.split('/')?.[1] || null;
    
  const performerRef = fhirProcedure.performer?.[0]?.actor?.reference || '';
  const performerId = performerRef.split('/')?.[1] || null;
    
  const indicationRef = fhirProcedure.reasonReference?.[0]?.reference || '';
  const indicationConditionId = indicationRef.split('/')?.[1] || null;
    
    // Extract codes
  const code = fhirProcedure.code?.coding || [];
  const snomedCode = code.find(c => c.system === 'http://snomed.info/sct')?.code;
  const cptCode = code.find(c => c.system === 'http://www.ama-assn.org/go/cpt')?.code;
  const hcpcsCode = code.find(c => c.system === 'http://www.ama-assn.org/go/hcpcs')?.code;
    
  const insertSql = `
      INSERT INTO emr.procedures(
        tenant_id, patient_id, encounter_id, status, category, code_snomed,
      code_cpt, code_hcpcs, body_site, performed_datetime, performer_id,
      reason_code, indication_condition_id, outcome, complication,
        follow_up_required, follow_up_instructions, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;
    
  const values = [
   fhirProcedure.managingOrganization?.reference?.split('/')[1] || null,
   patientId,
   encounterId,
   fhirProcedure.status || 'preparation',
   fhirProcedure.category?.coding?.[0]?.code,
     snomedCode,
     cptCode,
     hcpcsCode,
   fhirProcedure.bodySite?.map(site => site.coding?.[0]?.code),
   fhirProcedure.performedDateTime ? new Date(fhirProcedure.performedDateTime) : null,
   performerId,
   fhirProcedure.reasonCode?.map(code => code.coding?.[0]?.code),
   indicationConditionId,
   fhirProcedure.outcome?.text,
   fhirProcedure.complication?.map(c => c.text),
   fhirProcedure.followUpRequired,
   fhirProcedure.followUp?.[0]?.text,
   fhirProcedure.note?.[0]?.text
    ];
    
  const result = await client.query(insertSql, values);
  const procedure = result.rows[0];
    
    // Update FHIR reference
  const updateFHIRSql = `
      UPDATE emr.procedures
      SET fhir_procedure_ref = $1 
      WHERE procedure_id = $2
    `;
    await client.query(updateFHIRSql, [procedure.id, procedure.procedure_id]);
    
    await client.query('COMMIT');
    
  return transformProcedureToFHIR(procedure);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
  client.release();
  }
};
