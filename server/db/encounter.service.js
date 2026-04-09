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
    FROM encounters e
    LEFT JOIN patients p ON e.patient_id = p.id
    LEFT JOIN emr.users u ON e.provider_id = u.id
    WHERE e.tenant_id = $1
    ORDER BY e.created_at DESC
  `;
  const result = await query(sql, [tenantId]);

  return result.rows.map((row) => ({
    ...row,
    patientName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    patient_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(), // Added for snake_case UI compatibility
    providerName: row.provider_name,
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
  notes,
  wardId,
  bedId
}) {
  const sql = `
    INSERT INTO encounters (
      tenant_id,
      patient_id,
      provider_id,
      encounter_type,
      chief_complaint,
      diagnosis,
      notes,
      status,
      ward_id,
      bed_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8, $9)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId,
    patientId,
    providerId,
    type,
    complaint,
    diagnosis,
    notes,
    wardId,
    bedId
  ]);

  // If a bed is specified, mark it as occupied
  if (bedId) {
    await query(`UPDATE beds SET status = 'occupied' WHERE id = $1`, [bedId]);
  }

  return result.rows[0];
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
  const encRes = await query('SELECT bed_id FROM encounters WHERE id = $1', [encounterId]);
  const bedId = encRes.rows[0]?.bed_id;

  // 2. Update encounter status
  const sql = `
    UPDATE encounters 
    SET
      status = 'discharged',
      discharge_type = $1,
      discharge_summary = $2,
      follow_up_required = $3,
      follow_up_date = $4,
      discharged_at = NOW()
    WHERE id = $5 AND tenant_id = $6
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
    await query(`UPDATE beds SET status = 'available' WHERE id = $1`, [bedId]);
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
    FROM encounters e
    LEFT JOIN patients p ON e.patient_id = p.id
    LEFT JOIN emr.users u ON e.provider_id = u.id
    WHERE e.id = $1 AND e.tenant_id = $2
  `;

  const result = await query(sql, [encounterId, tenantId]);
  return result.rows[0];
}