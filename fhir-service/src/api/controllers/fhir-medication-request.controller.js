/**
 * FHIR MedicationRequest Controller
 * Handles FHIR MedicationRequest resource CRUD operations (Prescriptions)
 */

import { pool } from '../../db/index.js';
import { transformMedicationRequestToFHIR } from '../transformers/emr-to-fhir.js';

// =====================================================
// Search MedicationRequests
// Supports FHIR search parameters: patient, status, intent, authoredon
// =====================================================
export const searchMedicationRequests = async(queryParams) => {
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
    
    // Handle status parameter
    if (queryParams.status) {
   conditions.push(`p.status = $${paramIndex++}`);
   values.push(queryParams.status);
    }
    
    // Handle intent parameter
    if (queryParams.intent) {
   conditions.push(`p.intent = $${paramIndex++}`);
   values.push(queryParams.intent);
    }
    
    // Build query
  const sql = `
      SELECT 
       p.id,
        p.tenant_id,
      p.patient_id,
        p.encounter_id,
      p.provider_id,
        p.drug_name,
       p.dosage,
        p.frequency,
       p.duration,
        p.instructions,
        p.status,
        p.intent,
       p.priority,
        p.category,
        p.prescription_number,
        p.refills_allowed,
        p.quantity_dispensed,
       p.days_supply,
        p.rxnorm_code,
        p.ndc_code,
        p.snomed_code,
        p.created_at,
        p.updated_at,
        json_agg(
          json_build_object(
            'item_id', pi.item_id,
            'drug_id', pi.drug_id,
            'sequence', pi.sequence,
            'dose', pi.dose,
            'dose_unit', pi.dose_unit,
            'frequency', pi.frequency,
            'route', pi.route,
            'instructions', pi.instructions,
            'quantity_prescribed', pi.quantity_prescribed,
            'status', pi.status
          )
        ) as prescription_items
      FROM emr.prescriptions p
      LEFT JOIN emr.prescription_items pi ON p.id= pi.prescription_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `;
    
  const result = await client.query(sql, values);
    
    // Transform to FHIR resources
  const fhirMedicationRequests = result.rows.map(row => {
  return transformMedicationRequestToFHIR(row, row.prescription_items.filter(i => i.item_id));
  });
    
  return fhirMedicationRequests;
  } finally {
  client.release();
  }
};

// =====================================================
// Get MedicationRequest by ID
// Returns FHIR MedicationRequest resource
// =====================================================
export const getMedicationRequestById = async(prescriptionId) => {
  const client = await pool.connect();
  
  try {
  const sql = `
      SELECT 
      p.id,
        p.tenant_id,
       p.patient_id,
        p.encounter_id,
       p.provider_id,
       p.drug_name,
       p.dosage,
        p.frequency,
       p.duration,
        p.instructions,
        p.status,
        p.intent,
       p.priority,
        p.category,
        p.prescription_number,
        p.refills_allowed,
       p.quantity_dispensed,
        p.days_supply,
        p.rxnorm_code,
       p.ndc_code,
        p.snomed_code,
        p.created_at,
        p.updated_at,
        json_agg(
          json_build_object(
            'item_id', pi.item_id,
            'drug_id', pi.drug_id,
            'sequence', pi.sequence,
            'dose', pi.dose,
            'dose_unit', pi.dose_unit,
            'frequency', pi.frequency,
            'route', pi.route,
            'instructions', pi.instructions,
            'quantity_prescribed', pi.quantity_prescribed,
            'status', pi.status
          )
        ) as prescription_items
      FROM emr.prescriptions p
      LEFT JOIN emr.prescription_items pi ON p.id = pi.prescription_id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    
  const result = await client.query(sql, [prescriptionId]);
    
    if (result.rows.length === 0) {
   return null;
    }
    
  const row = result.rows[0];
  return transformMedicationRequestToFHIR(row, row.prescription_items.filter(i => i.item_id));
  } finally {
  client.release();
  }
};

// =====================================================
// Cancel MedicationRequest
// Commonly used to discontinue prescriptions
// =====================================================
export const cancelMedicationRequest = async(prescriptionId, reason = null) => {
  const client = await pool.connect();
  
  try {
  const updateSql = `
      UPDATE emr.prescriptions
      SET 
      status = 'cancelled',
       note_text = COALESCE(note_text, '') || CASE WHEN $2 IS NOT NULL THEN '\nCancelled: ' || $2 ELSE '' END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
  const result = await client.query(updateSql, [prescriptionId, reason]);
    
    if (result.rows.length === 0) {
      throw new Error(`Prescription ${prescriptionId} not found`);
    }
    
  const prescription = result.rows[0];
    
    // Also update prescription items
  const updateItemsSql = `
      UPDATE emr.prescription_items
      SET status = 'cancelled', updated_at = NOW()
      WHERE prescription_id = $1
    `;
    await client.query(updateItemsSql, [prescriptionId]);
    
    // Return as FHIR resource
  return transformMedicationRequestToFHIR(prescription, []);
  } finally {
  client.release();
  }
};

// =====================================================
// Renew MedicationRequest
// Creates new prescription based on existing one
// =====================================================
export const renewMedicationRequest = async(originalPrescriptionId, providerId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get original prescription
  const originalSql = `
      SELECT * FROM emr.prescriptions WHERE id = $1
    `;
  const originalResult = await client.query(originalSql, [originalPrescriptionId]);
    
    if (originalResult.rows.length === 0) {
      throw new Error(`Original prescription ${originalPrescriptionId} not found`);
    }
    
  const original = originalResult.rows[0];
    
    // Create renewed prescription
  const insertSql = `
      INSERT INTO emr.prescriptions(
        tenant_id, patient_id, encounter_id, provider_id, drug_name,
       dosage, frequency, duration, instructions, status, intent,
      priority, category, rxnorm_code, ndc_code, snomed_code,
       prior_prescription_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
  const values = [
     original.tenant_id,
     original.patient_id,
     original.encounter_id,
    providerId,
     original.drug_name,
     original.dosage,
     original.frequency,
     original.duration,
     original.instructions,
     'active',
     original.intent,
     original.priority,
     original.category,
     original.rxnorm_code,
     original.ndc_code,
     original.snomed_code
    ];
    
  const result = await client.query(insertSql, values);
  const renewed = result.rows[0];
    
    // Copy prescription items
  const itemsSql = `
      INSERT INTO emr.prescription_items(
       prescription_id, drug_id, sequence, dose, dose_unit,
       frequency, route, administration_timing, duration_days,
       quantity_prescribed, instructions, sig_code, refills_allowed,
        days_supply
      )
      SELECT $1, drug_id, sequence, dose, dose_unit,
             frequency, route, administration_timing, duration_days,
            quantity_prescribed, instructions, sig_code, refills_allowed,
             days_supply
      FROM emr.prescription_items
      WHERE prescription_id= $2
    `;
    await client.query(itemsSql, [renewed.id, originalPrescriptionId]);
    
    await client.query('COMMIT');
    
    // Return renewed prescription as FHIR
  return getMedicationRequestById(renewed.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
  client.release();
  }
};
