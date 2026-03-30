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
    FROM emr.encounters e
    LEFT JOIN emr.patients p ON e.patient_id = p.id
    LEFT JOIN emr.users u ON e.provider_id = u.id
    WHERE e.tenant_id = $1
    ORDER BY e.created_at DESC
  `;
  const result = await query(sql, [tenantId]);
  return result.rows.map(row => ({
    ...row,
    patientName: `${row.first_name} ${row.last_name}`,
    providerName: row.provider_name
  }));
}

export async function createEncounter({ tenantId, userId, patientId, providerId, type, complaint, diagnosis, notes }) {
  const sql = `
    INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, encounter_type, chief_complaint, diagnosis, notes, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
    RETURNING *
  `;
  const result = await query(sql, [
    tenantId, patientId, providerId, type, complaint, diagnosis, notes
  ]);
  return result.rows[0];
}

export async function dischargePatient({ tenantId, encounterId, dischargeType, dischargeSummary, followUpRequired, followUpDate }) {
  const sql = `
    UPDATE emr.encounters 
    SET status = $1, discharge_type = $2, discharge_summary = $3, 
        follow_up_required = $4, follow_up_date = $5, discharged_at = NOW()
    WHERE id = $6 AND tenant_id = $7
    RETURNING *
  `;
  const result = await query(sql, [dischargeType, dischargeSummary, followUpRequired, followUpDate, encounterId, tenantId]);
  return result.rows[0];
}

export async function getEncounterById(encounterId, tenantId) {
  const sql = `
    SELECT 
      e.*, p.first_name || ' ' || p.last_name as patient_name,
      p.phone as patient_phone,
      u.name as provider_name
    FROM emr.encounters e
    LEFT JOIN emr.patients p ON e.patient_id = p.id
    LEFT JOIN emr.users u ON e.provider_id = u.id
    WHERE e.id = $1 AND e.tenant_id = $2
  `;
  const result = await query(sql, [encounterId, tenantId]);
  return result.rows[0];
}
