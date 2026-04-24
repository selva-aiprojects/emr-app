/**
 * FHIR Patient Controller
 * Handles FHIR Patient resource CRUD operations
 */

import { pool } from '../../db/index.js';
import { transformPatientToFHIR } from '../transformers/emr-to-fhir.js';

// =====================================================
// Search Patients
// Supports FHIR search parameters: _id, identifier, name, birthdate, gender
// =====================================================
export const searchPatients = async (queryParams) => {
  const client = await pool.connect();
  
  try {
  const conditions = ['1=1']; // Always true base
   const values = [];
   let paramIndex = 1;
    
    // Handle _id parameter
    if (queryParams._id) {
    conditions.push(`p.id = $${paramIndex++}`);
     values.push(queryParams._id);
    }
    
    // Handle identifier (MRN) parameter
    if (queryParams.identifier) {
    conditions.push(`p.mrn = $${paramIndex++}`);
     values.push(queryParams.identifier);
    }
    
    // Handle name parameter (fuzzy search)
    if (queryParams.name) {
    conditions.push(`(p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex})`);
     values.push(`%${queryParams.name}%`);
     paramIndex++;
    }
    
    // Handle birthdate parameter
    if (queryParams.birthdate) {
    conditions.push(`p.date_of_birth = $${paramIndex++}`);
     values.push(queryParams.birthdate);
    }
    
    // Handle gender parameter
    if (queryParams.gender) {
    conditions.push(`p.gender = $${paramIndex++}`);
     values.push(queryParams.gender);
    }
    
    // Build query
  const sql = `
      SELECT 
       p.id,
        p.tenant_id,
       p.mrn,
        p.first_name,
       p.last_name,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.email,
       p.address,
        p.city,
        p.state,
        p.zip_code,
        p.country,
        p.communication_language,
        p.marital_status,
       p.birth_place,
        p.ethnicity,
        p.general_practitioner_id,
        p.created_at,
        p.updated_at
      FROM emr.patients p
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.created_at DESC
      LIMIT 100
    `;
    
  const result = await client.query(sql, values);
    
    // Transform to FHIR resources
  const fhirPatients = result.rows.map(transformPatientToFHIR);
    
  return fhirPatients;
  } finally {
   client.release();
  }
};

// =====================================================
// Get Patient by ID
// Returns FHIR Patient resource
// =====================================================
export const getPatientById = async (patientId) => {
  const client = await pool.connect();
  
  try {
  const sql = `
      SELECT 
        p.id,
        p.tenant_id,
        p.mrn,
       p.first_name,
        p.last_name,
       p.date_of_birth,
        p.gender,
       p.phone,
        p.email,
        p.address,
        p.city,
       p.state,
        p.zip_code,
        p.country,
       p.communication_language,
        p.marital_status,
        p.birth_place,
        p.ethnicity,
        p.general_practitioner_id,
        p.created_at,
        p.updated_at
      FROM emr.patients p
      WHERE p.id = $1
    `;
    
  const result = await client.query(sql, [patientId]);
    
    if (result.rows.length === 0) {
    return null;
    }
    
  return transformPatientToFHIR(result.rows[0]);
  } finally {
   client.release();
  }
};

// =====================================================
// Create Patient from FHIR Resource
// Transforms FHIR Patient → EMR Patient → FHIR Patient
// =====================================================
export const createPatient = async (fhirPatient) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Extract data from FHIR resource
  const mrn = fhirPatient.identifier?.[0]?.value || generateMRN();
  const name = fhirPatient.name?.[0] || {};
  const telecom = fhirPatient.telecom || [];
  const address = fhirPatient.address?.[0] || {};
    
  const phone = telecom.find(t => t.system === 'phone')?.value;
  const email = telecom.find(t => t.system === 'email')?.value;
    
  const insertSql = `
      INSERT INTO emr.patients (
        tenant_id, mrn, first_name, last_name, date_of_birth, gender,
        phone, email, address, city, state, zip_code, country,
       communication_language, marital_status, birth_place, ethnicity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;
    
  const values = [
     fhirPatient.managingOrganization?.reference?.split('/')[1] || null, // tenant_id from organization ref
      mrn,
      name.given?.[0] || '',
      name.family || '',
     fhirPatient.birthDate ? new Date(fhirPatient.birthDate) : null,
     mapFHIRGender(fhirPatient.gender),
      phone,
      email,
     address.line?.join('\n') || '',
     address.city,
     address.district,
     address.postalCode,
     address.country,
     fhirPatient.communication?.[0]?.language?.coding?.[0]?.code || 'en',
     fhirPatient.maritalStatus?.coding?.[0]?.code,
      null, // birth_place- would need extension parsing
      null  // ethnicity - would need extension parsing
    ];
    
  const result = await client.query(insertSql, values);
  const patient = result.rows[0];
    
    // Update FHIR reference
  const updateFHIRSql = `
      UPDATE emr.patients
      SET fhir_patient_ref = $1 
      WHERE id = $2
    `;
   await client.query(updateFHIRSql, [patient.id, patient.id]);
    
    await client.query('COMMIT');
    
    // Return as FHIR resource
  return transformPatientToFHIR(patient);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
   client.release();
  }
};

// =====================================================
// Update Patient
// =====================================================
export const updatePatient = async (patientId, fhirPatient) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
  const name = fhirPatient.name?.[0] || {};
  const telecom = fhirPatient.telecom || [];
  const address = fhirPatient.address?.[0] || {};
    
  const phone = telecom.find(t => t.system === 'phone')?.value;
  const email = telecom.find(t => t.system === 'email')?.value;
    
  const updateSql = `
      UPDATE emr.patients
      SET 
        first_name = $1,
        last_name = $2,
        date_of_birth = $3,
        gender = $4,
        phone= $5,
        email = $6,
       address = $7,
        city = $8,
        state = $9,
        zip_code = $10,
       country = $11,
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `;
    
  const values = [
      name.given?.[0] || '',
      name.family || '',
     fhirPatient.birthDate ? new Date(fhirPatient.birthDate) : null,
     mapFHIRGender(fhirPatient.gender),
      phone,
      email,
     address.line?.join('\n') || '',
     address.city,
     address.district,
     address.postalCode,
     address.country,
     patientId
    ];
    
  const result = await client.query(updateSql, values);
   
    if (result.rows.length === 0) {
     throw new Error(`Patient ${patientId} not found`);
    }
    
  const patient = result.rows[0];
    
    await client.query('COMMIT');
    
  return transformPatientToFHIR(patient);
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

const mapFHIRGender= (gender) => {
  const map = {
    'male': 'M',
    'female': 'F',
    'other': 'O',
    'unknown': 'U'
  };
  return map[gender] || 'U';
};

const generateMRN = () => {
  // Generate unique MRN: MRN-YYYYMMDD-RANDOM
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `MRN-${date}-${random}`;
};
