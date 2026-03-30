/**
 * Appointment Management Service
 * Handles all appointment-related database operations
 */

import { query } from './connection.js';

// =====================================================
// APPOINTMENTS
// =====================================================

export async function getAppointments(tenantId, filters = {}) {
  const { status, doctorId, departmentId, date, patientId } = filters;
  
  let sql = `
    SELECT 
      a.*, p.first_name || ' ' || p.last_name as patient_name,
      p.phone as patient_phone,
      d.name as department_name,
      u.name as doctor_name
    FROM emr.appointments a
    LEFT JOIN emr.patients p ON a.patient_id = p.id
    LEFT JOIN emr.departments d ON a.department_id = d.id
    LEFT JOIN emr.users u ON a.doctor_id = u.id
    WHERE a.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND a.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (doctorId) {
    sql += ` AND a.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (departmentId) {
    sql += ` AND a.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (date) {
    sql += ` AND DATE(a.start) = $${paramIndex++}`;
    params.push(date);
  }
  
  if (patientId) {
    sql += ` AND a.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  sql += ` ORDER BY a.start DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function createAppointment({ tenantId, patientId, doctorId, departmentId, start, end, type, notes, status = 'scheduled' }) {
  const sql = `
    INSERT INTO emr.appointments (tenant_id, patient_id, doctor_id, department_id, start, end, type, status, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, doctorId, departmentId, start, end, type, status, notes
  ]);
  
  return result.rows[0];
}

export async function updateAppointmentStatus(appointmentId, tenantId, status) {
  const sql = `
    UPDATE emr.appointments 
    SET status = $1, updated_at = NOW() 
    WHERE id = $2 AND tenant_id = $3
    RETURNING *
  `;
  
  const result = await query(sql, [status, appointmentId, tenantId]);
  return result.rows[0];
}

export async function getAvailableSlots(tenantId, doctorId, date) {
  const sql = `
    SELECT 
      COUNT(*) as booked_count,
      EXTRACT(HOUR FROM start) as hour_slot
    FROM emr.appointments 
    WHERE tenant_id = $1 
      AND doctor_id = $2 
      AND DATE(start) = $3 
      AND status != 'cancelled'
    GROUP BY EXTRACT(HOUR FROM start)
    HAVING COUNT(*) < 4
    ORDER BY hour_slot
  `;
  
  const result = await query(sql, [tenantId, doctorId, date]);
  return result.rows;
}

export async function bookAppointment({ tenantId, patientId, doctorId, departmentId, start, end, type, notes }) {
  // Check for conflicts
  const conflictSql = `
    SELECT COUNT(*) as conflict_count
    FROM emr.appointments 
    WHERE tenant_id = $1 
      AND doctor_id = $2 
      AND (
        (start <= $3 AND end > $3) OR 
        (start < $4 AND end >= $4)
      )
      AND status != 'cancelled'
  `;
  
  const conflictResult = await query(conflictSql, [tenantId, doctorId, start, end]);
  
  if (conflictResult.rows[0].conflict_count > 0) {
    throw new Error('Time slot conflicts with existing appointment');
  }
  
  // Create appointment
  return await createAppointment({
    tenantId, patientId, doctorId, departmentId, start, end, type, notes, status: 'confirmed'
  });
}
