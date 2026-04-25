/**
 * Encounter Management Service
 * Handles all encounter-related database operations
 */

import { query } from './connection.js';

// =====================================================
// ENCOUNTERS
// =====================================================

export async function getEncounters(tenantId) {
  const sql = `
    SELECT e.*, p.first_name, p.last_name, u.name as provider_name
    FROM nexus.encounters e
    LEFT JOIN nexus.patients p ON e.patient_id = p.id
    LEFT JOIN nexus.users u ON e.provider_id = u.id
    WHERE e.tenant_id::text = $1::text
    ORDER BY e.created_at DESC
  `;
  const result = await query(sql, [tenantId]);

  return result.rows.map((row) => ({
    ...row,
    type: row.encounter_type,
    chiefComplaint: row.chief_complaint,
    diagnosis: row.diagnosis,
    assessment: row.assessment,
    plan: row.plan,
    notes: row.notes,
    createdAt: row.created_at,
    vitals: typeof row.vitals === 'string' ? JSON.parse(row.vitals) : row.vitals,
    patientName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    patient_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    providerName: row.provider_name
  }));
}

export async function getPatientEncounters(patientId, tenantId) {
  const sql = `
    SELECT e.*, p.first_name, p.last_name, u.name as provider_name 
    FROM nexus.encounters e
    LEFT JOIN nexus.patients p ON e.patient_id = p.id
    LEFT JOIN nexus.users u ON e.provider_id = u.id
    WHERE e.patient_id::text = $1::text AND e.tenant_id::text = $2::text
    ORDER BY e.created_at DESC
  `;
  const result = await query(sql, [patientId, tenantId]);
  return result.rows.map(row => ({
    ...row,
    type: row.encounter_type,
    chiefComplaint: row.chief_complaint,
    diagnosis: row.diagnosis,
    assessment: row.assessment,
    plan: row.plan,
    notes: row.notes,
    createdAt: row.created_at,
    vitals: typeof row.vitals === 'string' ? JSON.parse(row.vitals) : row.vitals,
    patientName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    providerName: row.provider_name
  }));
}

export async function createEncounter({
  tenantId,
  userId,
  patientId,
  providerId,
  type,
  complaint,
  diagnosis,
  assessment,
  plan,
  notes,
  wardId,
  bedId,
  bp,
  hr,
  temperature,
  oxygen_saturation
}) {
  const sql = `
    INSERT INTO nexus.encounters (
      tenant_id,
      patient_id,
      provider_id,
      encounter_type,
      visit_date,
      chief_complaint,
      diagnosis,
      assessment,
      plan,
      notes,
      status,
      vitals,
      ward_id,
      bed_id
    )
    VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8, $9, 'open', $10, $11, $12)
    RETURNING *
  `;

  const vitals = {
    bp,
    hr,
    temperature,
    oxygen_saturation
  };
  const result = await query(sql, [
    tenantId,
    patientId,
    providerId,
    type,
    complaint,
    diagnosis,
    assessment,
    plan,
    notes,
    JSON.stringify(vitals),
    wardId,
    bedId
  ]);

  // If a bed is specified, mark it as occupied
  if (bedId) {
    await query(`UPDATE nexus.beds SET status = 'occupied' WHERE id::text = $1::text`, [bedId]);
  }

  const row = result.rows[0];
  return {
    ...row,
    type: row.encounter_type,
    chiefComplaint: row.chief_complaint,
    diagnosis: row.diagnosis,
    assessment: row.assessment,
    plan: row.plan,
    notes: row.notes,
    createdAt: row.created_at,
    vitals: typeof row.vitals === 'string' ? JSON.parse(row.vitals) : row.vitals
  };
}

export async function dischargePatient({
  tenantId,
  encounterId,
  dischargeType,
  dischargeSummary,
  followUpRequired,
  followUpDate,
}) {
  // 1. Get the encounter to find the bedId
  const encRes = await query('SELECT bed_id FROM nexus.encounters WHERE id::text = $1::text', [encounterId]);
  const bedId = encRes.rows[0]?.bed_id;

  // 2. Update encounter status
  const sql = `
    UPDATE nexus.encounters 

    SET
      status = 'discharged',
      discharge_type = $1,
      discharge_summary = $2,
      follow_up_required = $3,
      follow_up_date = $4,
      discharged_at = NOW()
    WHERE id::text = $5::text AND tenant_id::text = $6::text
    RETURNING *
  `;

  const result = await query(sql, [
    dischargeType,
    dischargeSummary,
    followUpRequired,
    followUpDate,
    encounterId,
    tenantId,
  ]);

  // 3. If a bed was assigned, set it back to available
  if (bedId) {
    await query(`UPDATE nexus.beds SET status = 'available' WHERE id::text = $1::text`, [bedId]);
  }

  return result.rows[0];
}

export async function getEncounterById(encounterId, tenantId) {
  const sql = `
    SELECT 
      e.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.phone as patient_phone,
      u.name as provider_name
    FROM nexus.encounters e
    LEFT JOIN nexus.patients p ON e.patient_id = p.id
    LEFT JOIN nexus.users u ON e.provider_id = u.id
    WHERE e.id::text = $1::text AND e.tenant_id::text = $2::text
  `;

  const result = await query(sql, [encounterId, tenantId]);
  const row = result.rows[0];
  if (!row) return null;

  return {
    ...row,
    type: row.encounter_type,
    chiefComplaint: row.chief_complaint,
    diagnosis: row.diagnosis,
    assessment: row.assessment,
    plan: row.plan,
    notes: row.notes,
    createdAt: row.created_at,
    vitals: typeof row.vitals === 'string' ? JSON.parse(row.vitals) : row.vitals
  };
}
