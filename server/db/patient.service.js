/**
 * Patient Management Service
 * Handles all patient-related database operations
 */

import { query } from './connection.js';

// =====================================================
// PATIENTS
// =====================================================

export async function getPatients(tenantId, userRole = null, limit = 50, offset = 0, includeArchived = false) {
  let sql = `
    SELECT 
      p.id, p.first_name, p.last_name, p.dob, p.gender, p.phone, p.email, p.address, p.city, p.state, p.country, p.postal_code, p.mrn, p.blood_group, p.allergies, p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relationship, p.insurance_provider, p.insurance_policy_number, p.created_at, p.updated_at, p.is_archived,
      u.name as primary_doctor_name
    FROM emr.patients p
    LEFT JOIN emr.users u ON p.primary_doctor_id = u.id
    WHERE p.tenant_id = $1
  `;

  const params = [tenantId];
  let paramIndex = 2;

  // Apply role-based data masking
  if (userRole) {
    sql += ` AND $${paramIndex++} = ANY (
      SELECT user_id FROM emr.user_roles WHERE role_name = $${paramIndex++} AND tenant_id = $${paramIndex++}
    )`;
    params.push(userRole);
    paramIndex++;
  }

  if (!includeArchived) {
    sql += ` AND p.is_archived = $${paramIndex++}`;
    params.push(false);
  }

  sql += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
}

export async function searchPatients(tenantId, searchTerm, filters = {}) {
  const { bloodGroup, gender, ageRange, city, state } = filters;
  
  let sql = `
    SELECT 
      p.id, p.first_name, p.last_name, p.dob, p.gender, p.phone, p.email, p.address, p.city, p.state, p.country, p.postal_code, p.mrn, p.blood_group, p.allergies, p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relationship, p.insurance_provider, p.insurance_policy_number, p.created_at, p.updated_at, p.is_archived,
      u.name as primary_doctor_name
    FROM emr.patients p
    LEFT JOIN emr.users u ON p.primary_doctor_id = u.id
    WHERE p.tenant_id = $1
  `;

  const params = [tenantId];
  let paramIndex = 2;

  // Search term
  if (searchTerm) {
    sql += ` AND (
      p.first_name ILIKE $${paramIndex++} OR 
      p.last_name ILIKE $${paramIndex++} OR 
      p.mrn ILIKE $${paramIndex++} OR 
      p.phone ILIKE $${paramIndex++} OR 
      p.email ILIKE $${paramIndex++}
    )`;
    params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
  }

  // Filters
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
  let sql = `
    SELECT 
      p.*, u.name as primary_doctor_name
    FROM emr.patients p
    LEFT JOIN emr.users u ON p.primary_doctor_id = u.id
    WHERE p.id = $1 AND p.tenant_id = $2
  `;

  const params = [id, tenantId];
  let paramIndex = 3;

  // Apply role-based data masking
  if (userRole) {
    sql += ` AND $${paramIndex++} = ANY (
      SELECT user_id FROM emr.user_roles WHERE role_name = $${paramIndex++} AND tenant_id = $${paramIndex++}
    )`;
    params.push(userRole);
  }

  const result = await query(sql, params);
  return result.rows[0];
}

export async function createPatient({ tenantId, firstName, lastName, dob, gender, phone, email, address, city, state, country, postalCode, bloodGroup, allergies, emergencyContactName, emergencyContactPhone, emergencyContactRelationship, insuranceProvider, insurancePolicyNumber, primaryDoctorId }) {
  const sql = `
    INSERT INTO emr.patients (
      tenant_id, first_name, last_name, dob, gender, phone, email, address, city, state, country, postal_code, blood_group, allergies, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, insurance_provider, insurance_policy_number, primary_doctor_id, mrn, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId, firstName, lastName, dob, gender, phone, email, address, city, state, country, postalCode, bloodGroup, allergies, emergencyContactName, emergencyContactPhone, emergencyContactRelationship, insuranceProvider, insurancePolicyNumber, primaryDoctorId
  ]);

  // Generate MRN
  const mrnResult = await query('SELECT get_next_mrn($1) as mrn', [tenantId]);
  const mrn = mrnResult.rows[0].mrn;

  // Update patient with MRN
  await query('UPDATE emr.patients SET mrn = $1 WHERE id = $2', [mrn, result.rows[0].id]);

  return { ...result.rows[0], mrn };
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
  values.push(id);

  const sql = `
    UPDATE emr.patients 
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
    RETURNING *
  `;

  const result = await query(sql, values);
  return result.rows[0];
}

export async function addClinicalRecord({ tenantId, patientId, userId, recordType, diagnosis, treatment, notes, attachments }) {
  const sql = `
    INSERT INTO emr.clinical_records (
      tenant_id, patient_id, created_by, record_type, diagnosis, treatment, notes, attachments
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
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
