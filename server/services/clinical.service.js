/**
 * Clinical Services Layer
 * Comprehensive clinical data management for MedFlow EMR
 * 
 * Provides high-level business logic for:
 * - Problem List Management (Conditions)
 * - Vital Signs Recording (Observations)
 * - Procedure Documentation
 * - Clinical Decision Support
 */

import { pool } from '../db/index.js';
import { 
  transformConditionToFHIR,
  transformObservationToFHIR,
  transformProcedureToFHIR
} from '../../fhir-service/src/fhir/transformers/emr-to-fhir.js';

// =====================================================
// PROBLEM LIST MANAGEMENT
// =====================================================

export class ClinicalService {
  
  /**
   * Add a new problem to patient's problem list
   * @param {Object} params - Problem details
   * @returns {Object} FHIR Condition resource
   */
  async addProblem({ tenantId, patientId, encounterId, providerId, 
                    codeSNOMED, codeICD10, displayName, category = 'problem-list-item',
                    severity = 'moderate', onsetDate, note }) {
   const client = await pool.connect();
    
   try {
      await client.query('BEGIN');
      
     const insertSql = `
        INSERT INTO conditions(
          tenant_id, patient_id, encounter_id, recorder_id,
         clinical_status, verification_status, category,
         code_snomed, code_icd10, display_name, severity,
         onset_datetime, recorded_date, note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13)
        RETURNING *
      `;
      
     const values = [
        tenantId,
       patientId,
       encounterId,
       providerId,
        'active',
        'confirmed',
       category,
       codeSNOMED,
       codeICD10,
       displayName,
       severity,
       onsetDate ? new Date(onsetDate) : null,
       note
      ];
      
     const result = await client.query(insertSql, values);
     const condition = result.rows[0];
      
      // Update FHIR reference
      await client.query(`
        UPDATE conditions
        SET fhir_condition_ref = $1
        WHERE condition_id = $2
      `, [condition.condition_id, condition.condition_id]);
      
      await client.query('COMMIT');
      
     return {
        emr: condition,
       fhir: transformConditionToFHIR(condition)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
     client.release();
    }
  }
  
  /**
   * Get patient's active problem list
   * @param {string} patientId 
   * @returns {Array} Array of FHIR Condition resources
   */
  async getActiveProblemList(patientId) {
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
        FROM conditions c
        WHERE c.patient_id = $1
          AND c.clinical_status IN ('active', 'recurrence', 'relapse')
        ORDER BY c.recorded_date DESC
      `;
      
     const result = await client.query(sql, [patientId]);
      
     return {
        emr: result.rows,
       fhir: result.rows.map(transformConditionToFHIR)
      };
    } finally {
     client.release();
    }
  }
  
  /**
   * Resolve a problem (mark as resolved/inactive)
   * @param {string} conditionId 
   * @param {string} status- 'resolved', 'inactive', or 'remission'
   */
  async resolveProblem(conditionId, status = 'resolved') {
   const client = await pool.connect();
    
   try {
     const updateSql = `
        UPDATE conditions
        SET 
         clinical_status = $1,
          abatement_datetime = NOW(),
          updated_at = NOW()
        WHERE condition_id = $2
        RETURNING *
      `;
      
     const result = await client.query(updateSql, [status, conditionId]);
     const condition = result.rows[0];
      
     return {
        emr: condition,
       fhir: transformConditionToFHIR(condition)
      };
    } finally {
     client.release();
    }
  }
  
  // =====================================================
  // VITAL SIGNS RECORDING
  // =====================================================
  
  /**
   * Record vital signs (multiple observations at once)
   * @param {Object} params - Patient, encounter, and vitals data
   * @returns {Object} Array of FHIR Observation resources
   */
  async recordVitalSigns({ tenantId, patientId, encounterId, performerId, vitalSigns }) {
   const client = await pool.connect();
    
   try {
      await client.query('BEGIN');
      
     const createdObservations = [];
      
      for (const vital of vitalSigns) {
       const insertSql = `
          INSERT INTO observations(
            tenant_id, patient_id, encounter_id, status, category,
           code_loinc, code_snomed, display_name,
           value_quantity, value_quantity_unit,
            effective_datetime, performer_id,
           interpretation, reference_range_low, reference_range_high, note
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING *
        `;
        
       const values = [
          tenantId,
         patientId,
         encounterId,
          'final',
          'vital-signs',
          vital.codeLOINC,
          vital.codeSNOMED,
          vital.displayName,
          vital.value,
          vital.unit,
          new Date(vital.effectiveDateTime || Date.now()),
         performerId,
          vital.interpretation,
          vital.referenceRangeLow,
          vital.referenceRangeHigh,
          vital.note
        ];
        
       const result = await client.query(insertSql, values);
       const observation = result.rows[0];
        
        // Update FHIR reference
        await client.query(`
          UPDATE observations
          SET fhir_observation_ref = $1
          WHERE observation_id = $2
        `, [observation.observation_id, observation.observation_id]);
        
       createdObservations.push(observation);
      }
      
      await client.query('COMMIT');
      
     return {
        emr: createdObservations,
       fhir: createdObservations.map(transformObservationToFHIR)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
     client.release();
    }
  }
  
  /**
   * Get latest vital signs for patient
   * @param {string} patientId 
   * @param {string} encounterId (optional)
   * @returns {Object} Latest vitals as FHIR resources
   */
  async getLatestVitalSigns(patientId, encounterId = null) {
   const client = await pool.connect();
    
   try {
      let sql;
      let values;
      
      if (encounterId) {
        // Get vitals for specific encounter
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
          FROM observations o
          WHERE o.patient_id = $1
            AND o.encounter_id= $2
            AND o.category = 'vital-signs'
          ORDER BY o.code_loinc, o.effective_datetime DESC
        `;
       values = [patientId, encounterId];
      } else {
        // Get latest vitals across all encounters
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
          FROM observations o
          WHERE o.patient_id = $1
            AND o.category = 'vital-signs'
          ORDER BY o.code_loinc, o.effective_datetime DESC
        `;
       values = [patientId];
      }
      
     const result = await client.query(sql, values);
      
     return {
        emr: result.rows,
       fhir: result.rows.map(transformObservationToFHIR)
      };
    } finally {
     client.release();
    }
  }
  
  // =====================================================
  // PROCEDURE DOCUMENTATION
  // =====================================================
  
  /**
   * Document a surgical or therapeutic procedure
   * @param {Object} params - Procedure details
   * @returns {Object} FHIR Procedure resource
   */
  async documentProcedure({ tenantId, patientId, encounterId, providerId,
                          codeSNOMED, codeCPT, displayName, bodySite,
                          performedDateTime, outcome, complications, followUpRequired, note }) {
   const client = await pool.connect();
    
   try {
      await client.query('BEGIN');
      
     const insertSql = `
        INSERT INTO procedures(
          tenant_id, patient_id, encounter_id, status, category,
         code_snomed, code_cpt, body_site, performed_datetime,
         performer_id, outcome, complication, follow_up_required,
          follow_up_instructions, note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;
      
     const values = [
        tenantId,
       patientId,
       encounterId,
        'completed',
        'surgical',
       codeSNOMED,
       codeCPT,
       bodySite,
        new Date(performedDateTime),
       providerId,
        outcome,
       complications,
        followUpRequired,
        followUpRequired ? 'Follow-up required' : null,
       note
      ];
      
     const result = await client.query(insertSql, values);
     const procedure = result.rows[0];
      
      // Update FHIR reference
      await client.query(`
        UPDATE procedures
        SET fhir_procedure_ref = $1
        WHERE procedure_id= $2
      `, [procedure.procedure_id, procedure.procedure_id]);
      
      await client.query('COMMIT');
      
     return {
        emr: procedure,
       fhir: transformProcedureToFHIR(procedure)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
     client.release();
    }
  }
  
  /**
   * Get procedures for patient
   * @param {string} patientId 
   * @returns {Array} FHIR Procedure resources
   */
  async getPatientProcedures(patientId, limit = 50) {
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
          p.body_site,
          p.performed_datetime,
         p.performer_id,
          p.outcome,
          p.complication,
          p.follow_up_required,
          p.note,
          p.created_at,
          p.updated_at
        FROM procedures p
        WHERE p.patient_id = $1
        ORDER BY p.performed_datetime DESC
        LIMIT $2
      `;
      
     const result = await client.query(sql, [patientId, limit]);
      
     return {
        emr: result.rows,
       fhir: result.rows.map(transformProcedureToFHIR)
      };
    } finally {
     client.release();
    }
  }
  
  // =====================================================
  // CLINICAL DECISION SUPPORT
  // =====================================================
  
  /**
   * Get patient's complete clinical summary
   * @param {string} patientId 
   * @returns {Object} Comprehensive clinical data
   */
  async getClinicalSummary(patientId) {
   const client = await pool.connect();
    
   try {
      // Get active problems
     const problemsQuery = `
        SELECT * FROM conditions
        WHERE patient_id = $1
          AND clinical_status IN ('active', 'recurrence', 'relapse')
        ORDER BY recorded_date DESC
      `;
     const problems = await client.query(problemsQuery, [patientId]);
      
      // Get latest vitals
     const vitalsQuery = `
        SELECT DISTINCT ON (code_loinc) *
        FROM observations
        WHERE patient_id = $1 AND category = 'vital-signs'
        ORDER BY code_loinc, effective_datetime DESC
      `;
     const vitals = await client.query(vitalsQuery, [patientId]);
      
      // Get recent procedures
     const proceduresQuery = `
        SELECT * FROM procedures
        WHERE patient_id = $1
        ORDER BY performed_datetime DESC
        LIMIT 20
      `;
     const procedures = await client.query(proceduresQuery, [patientId]);
      
     return {
        emr: {
         problems: problems.rows,
          vitals: vitals.rows,
         procedures: procedures.rows
        },
       fhir: {
         problems: problems.rows.map(transformConditionToFHIR),
          vitals: vitals.rows.map(transformObservationToFHIR),
         procedures: procedures.rows.map(transformProcedureToFHIR)
        }
      };
    } finally {
     client.release();
    }
  }
}

export default ClinicalService;
