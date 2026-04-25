/**
 * Appointment Management Service
 * Handles all appointment-related database operations
 */

import { query } from './connection.js';

// =====================================================
// APPOINTMENTS
// =====================================================

export async function getAppointments(tenantId, filters = {}) {
  const { status, doctorId, patientId, date } = filters;
  
  let sql = `
    SELECT 
      a.*, p.first_name || ' ' || p.last_name as patient_name,
      p.phone as patient_phone,
      u.name as doctor_name
    FROM nexus.appointments a
    LEFT JOIN nexus.patients p ON a.patient_id::text = p.id::text
    LEFT JOIN nexus.users u ON a.provider_id::text = u.id::text
    WHERE a.tenant_id::text = $1::text
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND a.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (doctorId) {
    sql += ` AND a.provider_id::text = $${paramIndex++}::text`;
    params.push(doctorId);
  }
  
  if (date) {
    sql += ` AND DATE(a.scheduled_start) = $${paramIndex++}`;
    params.push(date);
  }
  
  if (patientId) {
    sql += ` AND a.patient_id::text = $${paramIndex++}::text`;
    params.push(patientId);
  }
  
  sql += ` ORDER BY a.scheduled_start DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function createAppointment({ tenantId, patientId, providerId, start, end, status = 'scheduled', reason, source = 'staff' }) {
  const sql = `
    INSERT INTO nexus.appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason, source)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, providerId, start, end, status, reason, source
  ]);
  
  return result.rows[0];
}

export async function updateAppointmentStatus(appointmentId, tenantId, status) {
  const sql = `
    UPDATE nexus.appointments 
    SET status = $1, updated_at = NOW() 
    WHERE id::text = $2::text AND tenant_id::text = $3::text
    RETURNING *
  `;
  
  const result = await query(sql, [status, appointmentId, tenantId]);
  return result.rows[0];
}

export async function getAvailableSlots(tenantId, doctorId, date) {
  const sql = `
    SELECT 
      COUNT(*) as booked_count,
      EXTRACT(HOUR FROM scheduled_start) as hour_slot
    FROM nexus.appointments 
    WHERE tenant_id::text = $1::text 
      AND provider_id::text = $2::text 
      AND DATE(scheduled_start) = $3 
      AND status != 'cancelled'
    GROUP BY EXTRACT(HOUR FROM scheduled_start)
    HAVING COUNT(*) < 4
    ORDER BY hour_slot
  `;
  
  const result = await query(sql, [tenantId, doctorId, date]);
  return result.rows;
}

export async function bookAppointment({ tenantId, patientId, doctorId, start, end, reason }) {
  // Check for conflicts
  const conflictSql = `
    SELECT COUNT(*) as conflict_count
    FROM nexus.appointments 
    WHERE tenant_id::text = $1::text 
      AND provider_id::text = $2::text 
      AND (
        (scheduled_start <= $3 AND scheduled_end > $3) OR 
        (scheduled_start < $4 AND scheduled_end >= $4)
      )
      AND status != 'cancelled'
  `;
  
  const conflictResult = await query(conflictSql, [tenantId, doctorId, start, end]);
  
  if (conflictResult.rows[0].conflict_count > 0) {
    throw new Error('Time slot conflicts with existing appointment');
  }
  
  // Create appointment
  return await createAppointment({
    tenantId, patientId, providerId: doctorId, start, end, reason, status: 'scheduled'
  });
}

export async function rescheduleAppointment({ appointmentId, tenantId, userId, start, end, reason }) {
  const sql = `
    UPDATE nexus.appointments 
    SET 
      scheduled_start = $1, 
      scheduled_end = $2, 
      reason = COALESCE($3, reason),
      updated_at = NOW()
    WHERE id::text = $4::text AND tenant_id::text = $5::text
    RETURNING *
  `;
  
  const result = await query(sql, [start, end, reason, appointmentId, tenantId]);
  
  if (result.rows.length === 0) {
    throw new Error('Appointment not found or tenant mismatch');
  }

  return result.rows[0];
}
