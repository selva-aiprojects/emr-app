/**
 * OPD Token Management Service
 * Handles queuing, token generation, and clinic flow
 */

import { query } from './connection.js';

// =====================================================
// OPD TOKENS
// =====================================================

export async function createOPDToken({ tenantId, patientId, departmentId, doctorId, visitType, priority = 'routine', createdBy }) {
  const tokenNumberSql = 'SELECT get_next_token_number($1, $2, $3)';
  const tokenRes = await query(tokenNumberSql, [tenantId, departmentId, doctorId]);
  const tokenNumber = tokenRes.rows[0].get_next_token_number;
  
  const sql = `
    INSERT INTO opd_tokens (
      tenant_id, patient_id, department_id, doctor_id, token_number, 
      visit_type, priority, status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'waiting', $8)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, departmentId, doctorId, tokenNumber, 
    visitType, priority, createdBy
  ]);
  
  return result.rows[0];
}

export async function getOPDTokens(tenantId, filters = {}) {
  const { status, doctorId, departmentId, date = 'CURRENT_DATE' } = filters;
  
  let sql = `
    SELECT 
      t.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.mrn as patient_mrn,
      d.name as department_name,
      u.name as doctor_name
    FROM opd_tokens t
    JOIN patients p ON t.patient_id = p.id
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN users u ON t.doctor_id = u.id
    WHERE t.tenant_id = $1 AND DATE(t.created_at) = ${date}
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND t.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (doctorId) {
    sql += ` AND t.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (departmentId) {
    sql += ` AND t.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  sql += ` ORDER BY t.priority = 'stat' DESC, t.token_number ASC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function updateTokenStatus(tokenId, tenantId, status, userId) {
  let extraFields = '';
  if (status === 'consulting') extraFields = ', consultation_started_at = NOW()';
  if (status === 'completed') extraFields = ', consultation_completed_at = NOW()';
  
  const sql = `
    UPDATE opd_tokens 
    SET status = $1, updated_at = NOW() ${extraFields}
    WHERE id = $2 AND tenant_id = $3
    RETURNING *
  `;
  
  const result = await query(sql, [status, tokenId, tenantId]);
  return result.rows[0];
}

export async function updateTokenVitals(tokenId, tenantId, vitalsData) {
  const sql = `
    UPDATE opd_tokens 
    SET vitals_recorded = true,
        updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  
  const result = await query(sql, [tokenId, tenantId]);
  
  // Create vitals record if needed
  if (result.rows[0]) {
    const vitalsSql = `
      INSERT INTO vitals (
        tenant_id, patient_id, encounter_id, blood_pressure_systolic,
        blood_pressure_diastolic, heart_rate, temperature, 
        oxygen_saturation, weight, height, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    await query(vitalsSql, [
      tenantId, 
      result.rows[0].patient_id, 
      null, // No encounter yet
      vitalsData.bloodPressureSystolic,
      vitalsData.bloodPressureDiastolic,
      vitalsData.heartRate,
      vitalsData.temperature,
      vitalsData.oxygenSaturation,
      vitalsData.weight,
      vitalsData.height,
      vitalsData.createdBy
    ]);
  }
  
  return result.rows[0];
}

export async function getTokenHistory(tenantId, patientId, limit = 10) {
  const sql = `
    SELECT 
      t.*,
      d.name as department_name,
      u.name as doctor_name,
      EXTRACT(EPOCH FROM (consultation_completed_at - consultation_started_at))/60 as consultation_duration_minutes
    FROM opd_tokens t
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN users u ON t.doctor_id = u.id
    WHERE t.tenant_id = $1 AND t.patient_id = $2
    ORDER BY t.created_at DESC
    LIMIT $3
  `;
  
  const result = await query(sql, [tenantId, patientId, limit]);
  return result.rows;
}
