/**
 * Prescription Management Service
 * Handles all prescription and pharmacy-related database operations
 */

import { query } from './connection.js';

// =====================================================
// PRESCRIPTIONS & PHARMACY
// =====================================================

export async function getPrescriptions(tenantId, filters = {}) {
  const { status, patientId } = filters;
  
  let sql = `
    SELECT pr.*,
           p.first_name || ' ' || p.last_name as patient_name,
           p.mrn as patient_mrn,
           u.name as doctor_name
    FROM nexus.prescriptions pr
    JOIN nexus.encounters e ON pr.encounter_id = e.id
    JOIN nexus.patients p ON e.patient_id = p.id
    LEFT JOIN nexus.users u ON e.provider_id = u.id
    WHERE pr.tenant_id::text = $1::text
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND pr.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (patientId) {
    sql += ` AND p.id::text = $${paramIndex++}::text`;
    params.push(patientId);
  }
  
  sql += ` ORDER BY pr.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getPrescriptionById(id, tenantId) {
  const sql = `
    SELECT pr.*,
           p.first_name || ' ' || p.last_name as patient_name,
           p.mrn as patient_mrn,
           u.name as doctor_name
    FROM nexus.prescriptions pr
    JOIN nexus.encounters e ON pr.encounter_id = e.id
    JOIN nexus.patients p ON e.patient_id = p.id
    LEFT JOIN nexus.users u ON e.provider_id = u.id
    WHERE pr.id::text = $1::text AND pr.tenant_id::text = $2::text
  `;
  
  const result = await query(sql, [id, tenantId]);
  return result.rows[0];
}

export async function createPrescription({ tenantId, encounter_id, drug_name, dosage, frequency, duration, instructions, is_followup, followup_date, followup_notes }) {
  const sql = `
    INSERT INTO nexus.prescriptions (
      tenant_id, encounter_id, drug_name, dosage, frequency, duration, instructions, status, is_followup, followup_date, followup_notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending', $8, $9, $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, encounter_id, drug_name, dosage || null, frequency || null, duration || null, instructions || null,
    !!is_followup, followup_date || null, followup_notes || null
  ]);
  
  return result.rows[0];
}

export async function updatePrescriptionStatus({ id, tenantId, userId, status }) {
  const sql = `
    UPDATE nexus.prescriptions
    SET status = $1, updated_at = NOW()
    WHERE id::text = $2::text AND tenant_id::text = $3::text
    RETURNING *
  `;
  
  const result = await query(sql, [status, id, tenantId]);
  
  if (result.rows.length > 0) {
    await query(`
      INSERT INTO nexus.audit_logs (tenant_id, user_id, user_name, action, entity_name, entity_id, details)
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7)
    `, [tenantId, userId, 'System', `prescription.${status.toLowerCase()}`, 'prescription', id, JSON.stringify({ status })]);
  }
  
  return result.rows[0];
}

export async function dispensePrescription({ id, tenantId, userId, itemId, quantity }) {
  // Update prescription status
  const prescription = await updatePrescriptionStatus({ id, tenantId, userId, status: 'Dispensed' });
  
  if (!prescription) {
    throw new Error('Prescription not found');
  }
  
  // If itemId is provided, update inventory
  if (itemId && quantity) {
    await query(`
      UPDATE nexus.inventory_items
      SET current_stock = current_stock - $1, updated_at = NOW()
      WHERE id::text = $2::text AND tenant_id::text = $3::text
    `, [quantity, itemId, tenantId]);
  }
  
  return prescription;
}
