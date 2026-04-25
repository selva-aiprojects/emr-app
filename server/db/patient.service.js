/**
 * Patient Management Service
 * Handles all patient-related database operations
 */

import { query } from './connection.js';
import { generateMRN } from './tenant.service.js';

// =====================================================
// PATIENTS
// =====================================================

export async function getPatients(tenantId, userRole = null, limit = 50, offset = 0, includeArchived = false, filters = {}) {
  const values = [tenantId, includeArchived];
  let queryStr = `
    SELECT 
      p.id, 
      p.first_name as "firstName", 
      p.last_name as "lastName", 
      p.date_of_birth as "dateOfBirth", 
      p.gender, p.phone, p.email, p.address, p.mrn, p.blood_group, 
      p.medical_history as "medicalHistory", 
      p.emergency_contact as "emergencyContact", 
      p.insurance, p.created_at as "createdAt", 
      p.updated_at as "updatedAt", 
      p.is_archived as "isArchived",
      EXTRACT(YEAR FROM AGE(p.date_of_birth)) as age

    FROM nexus.patients p
    WHERE p.tenant_id::text = $1::text
    AND p.is_archived = $2`;

  if (filters.text) {
    const textPattern = `%${filters.text}%`;
    values.push(textPattern);
    queryStr += ` AND ((p.first_name || ' ' || p.last_name) ILIKE $${values.length} OR p.mrn ILIKE $${values.length} OR p.phone ILIKE $${values.length})`;

  }

  queryStr += ` ORDER BY p.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  console.log(`[PATIENT_SERVICE] Fetching for tenant: ${tenantId}, search: ${filters.text || 'none'}, limit: ${limit}`);
  const res = await query(queryStr, values);
  return res.rows;
}

export async function searchPatients(tenantId, searchTermOrFilters, filters = {}) {
  let searchTerm = typeof searchTermOrFilters === 'string' ? searchTermOrFilters : (searchTermOrFilters?.text || '');
  let searchFilters = typeof searchTermOrFilters === 'object' ? searchTermOrFilters : filters;
  
  const { bloodGroup, gender, ageRange, city, state } = searchFilters;
  
  let sql = `
    SELECT 
      p.id, 
      p.first_name as "firstName", 
      p.last_name as "lastName", 
      p.date_of_birth as "dateOfBirth", 
      p.gender, p.phone, p.email, p.address, p.mrn, p.blood_group, 
      p.medical_history as "medicalHistory", 
      p.emergency_contact as "emergencyContact", 
      p.insurance, p.created_at as "createdAt", 
      p.updated_at as "updatedAt", 
      p.is_archived as "isArchived",
      EXTRACT(YEAR FROM AGE(p.date_of_birth)) as age,
      u.name as primary_doctor_name
    FROM nexus.patients p
    LEFT JOIN nexus.users u ON p.primary_doctor_id::text = u.id::text

    WHERE p.tenant_id::text = $1::text
  `;

  const params = [tenantId];
  let paramIndex = 2;

  if (searchTerm) {
    sql += ` AND (
      (p.first_name || ' ' || p.last_name) ILIKE $${paramIndex} OR 
      p.mrn ILIKE $${paramIndex} OR 
      p.phone ILIKE $${paramIndex} OR 
      p.email ILIKE $${paramIndex}
    )`;
    params.push(`%${searchTerm}%`);
    paramIndex++;
  }

  if (bloodGroup) {
    sql += ` AND p.blood_group = $${paramIndex++}`;
    params.push(bloodGroup);
  }

  if (gender) {
    sql += ` AND p.gender = $${paramIndex++}`;
    params.push(gender);
  }

  if (ageRange) {
    const [minAge, maxAge] = ageRange.split('-').map(Number);
    sql += ` AND p.dob BETWEEN $${paramIndex++} AND $${paramIndex++}`;
    params.push(minAge, maxAge);
  }

  if (city) {
    sql += ` AND p.city ILIKE $${paramIndex++}`;
    params.push(`%${city}%`);
  }

  if (state) {
    sql += ` AND p.state ILIKE $${paramIndex++}`;
    params.push(`%${state}%`);
  }

  sql += ` ORDER BY p.created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
}

export async function getPatientById(id, tenantId, userRole = null) {
  const sql = `
    SELECT 
      p.id, 
      p.first_name as "firstName", 
      p.last_name as "lastName", 
      p.date_of_birth as "dateOfBirth", 
      p.gender, p.phone, p.email, p.address, p.mrn, p.blood_group, 
      p.medical_history as "medicalHistory", 
      p.emergency_contact as "emergencyContact", 
      p.insurance, p.created_at as "createdAt", 
      p.updated_at as "updatedAt", 
      p.is_archived as "isArchived",
      EXTRACT(YEAR FROM AGE(p.date_of_birth)) as age,
      u.name as primary_doctor_name
    FROM nexus.patients p
    LEFT JOIN nexus.users u ON p.primary_doctor_id::text = u.id::text
    WHERE p.id::text = $1::text AND p.tenant_id::text = $2::text
  `;
  const result = await query(sql, [id, tenantId]);
  return result.rows[0];
}

export async function createPatient({ tenantId, firstName, lastName, dob, gender, phone, email, address, bloodGroup, emergencyContact, insurance, medicalHistory }) {
  // Generate MRN from nexus schema function BEFORE insert to avoid Not-Null constraint failure
  const mrn = await generateMRN(tenantId);
  console.log(`[PATIENT_CREATE] Creating patient: ${firstName} ${lastName}, MRN: ${mrn}, Tenant: ${tenantId}`);

  const insertRes = await query(`
    INSERT INTO nexus.patients (
      tenant_id, first_name, last_name, date_of_birth, gender, phone, email, address, 
      blood_group, medical_history, emergency_contact, insurance, mrn, is_archived
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false)
    RETURNING *
  `, [
    tenantId, firstName, lastName, dob, gender, phone, email, address, 
    bloodGroup, JSON.stringify(medicalHistory), emergencyContact, insurance, mrn
  ]);

  console.log(`[PATIENT_SERVICE] Successfully created patient with MRN: ${mrn}`);
  return insertRes.rows[0];
}

export async function updatePatient({ tenantId, id, updates }) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });

  fields.push('updated_at = NOW()');
  values.push(id, tenantId);

  const sql = `
    UPDATE nexus.patients 
    SET ${fields.join(', ')}
    WHERE id::text = $${paramIndex++} AND tenant_id::text = $${paramIndex++}
    RETURNING *
  `;

  const result = await query(sql, values);
  return result.rows[0];
}

export async function addClinicalRecord({ tenantId, patientId, userId, section, content }) {
  // Gracefully map the generic 'payload' into the rigidly structured clinical_records table
  const recordType = section || 'caseHistory';
  const diagnosis = content?.diagnosis || 'No Diagnosis Provided';
  const treatment = content?.medications ? JSON.stringify(content.medications) : 'None';
  const notes = content?.notes || 'No specific clinical notes documented.';
  const attachments = content?.vitals ? JSON.stringify(content.vitals) : '{}';

  const sql = `
    INSERT INTO nexus.clinical_records (
      tenant_id, patient_id, created_by, record_type, diagnosis, treatment, notes, attachments
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, CAST($8 AS JSONB))
    RETURNING *
  `;

  const result = await query(sql, [tenantId, patientId, userId, recordType, diagnosis, treatment, notes, attachments]);

  return result.rows[0];
}

export async function maskPatientData(patients, userRole) {
  // Apply role-based data masking for HIPAA compliance
  if (!userRole || ['Admin', 'Superadmin'].includes(userRole)) {
    return patients.map(patient => ({
      ...patient,
      phone: patient.phone ? patient.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') : '***-***-****',
      email: patient.email ? patient.email.replace(/(.{2}).*@/, '***@***.***') : '***@***.***'
    }));
  }
  return patients;
}
