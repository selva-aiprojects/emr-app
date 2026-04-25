/**
 * Doctor Availability Management Service
 * Handles doctor schedules, slot generation, and availability checking
 */

import { query } from './connection.js';

// =====================================================
// DOCTOR AVAILABILITY
// =====================================================

export async function getDoctorAvailability(tenantId, doctorId, date) {
  const sql = `
    SELECT 
      id,
      doctor_id,
      date,
      start_time,
      end_time,
      slot_duration_minutes,
      is_available,
      max_appointments,
      current_appointments,
      status,
      notes
    FROM nexus.doctor_availability 
    WHERE tenant_id::text = $1::text 
      AND ($2::uuid IS NULL OR doctor_id = $2)
      AND ($3::date IS NULL OR date = $3)
      AND is_available = true
      AND status = 'available'
      AND current_appointments < max_appointments
    ORDER BY date, start_time
  `;
  
  const result = await query(sql, [tenantId, doctorId, date]);
  return result.rows;
}

export async function createDoctorAvailability({ tenantId, doctorId, date, startTime, endTime, slotDurationMinutes = 15, maxAppointments = 1, notes, createdBy }) {
  const sql = `
    INSERT INTO nexus.doctor_availability (
      tenant_id, doctor_id, date, start_time, end_time, 
      slot_duration_minutes, max_appointments, notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, doctorId, date, startTime, endTime, 
    slotDurationMinutes, maxAppointments, notes, createdBy
  ]);
  
  return result.rows[0];
}

export async function generateDoctorAvailabilitySlots({ tenantId, doctorId, date, startTime, endTime, slotDurationMinutes = 15, maxAppointmentsPerSlot = 1, createdBy }) {
  const slots = [];
  const current = new Date(`${date} ${startTime}`);
  const end = new Date(`${date} ${endTime}`);
  
  while (current < end) {
    const slotEndTime = new Date(current.getTime() + slotDurationMinutes * 60000);
    
    if (slotEndTime <= end) {
      const sql = `
        INSERT INTO nexus.doctor_availability (
          tenant_id, doctor_id, date, start_time, end_time, 
          slot_duration_minutes, max_appointments, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const result = await query(sql, [
        tenantId, 
        doctorId, 
        date, 
        current.toTimeString().slice(0, 5), // HH:MM format
        slotEndTime.toTimeString().slice(0, 5), // HH:MM format
        slotDurationMinutes, 
        maxAppointmentsPerSlot, 
        createdBy
      ]);
      
      slots.push(result.rows[0]);
    }
    
    current.setTime(current.getTime() + slotDurationMinutes * 60000);
  }
  
  return slots;
}

export async function updateDoctorAvailabilitySlot(availabilityId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 2;
  
  if (updates.is_available !== undefined) {
    fields.push(`is_available = $${paramIndex++}`);
    values.push(updates.is_available);
  }
  
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  
  if (updates.max_appointments !== undefined) {
    fields.push(`max_appointments = $${paramIndex++}`);
    values.push(updates.max_appointments);
  }
  
  if (updates.notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(updates.notes);
  }
  
  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  const sql = `
    UPDATE nexus.doctor_availability 
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id::text = $1::text AND tenant_id::text = $${paramIndex}::text
    RETURNING *
  `;
  
  values.unshift(availabilityId);
  values.push(tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function incrementAppointmentCount(availabilityId, tenantId) {
  const sql = `
    UPDATE nexus.doctor_availability 
    SET current_appointments = current_appointments + 1,
        updated_at = NOW()
    WHERE id::text = $1::text 
      AND tenant_id::text = $2::text 
      AND current_appointments < max_appointments
    RETURNING *
  `;
  
  const result = await query(sql, [availabilityId, tenantId]);
  return result.rows[0];
}

export async function decrementAppointmentCount(availabilityId, tenantId) {
  const sql = `
    UPDATE nexus.doctor_availability 
    SET current_appointments = GREATEST(current_appointments - 1, 0),
        updated_at = NOW()
    WHERE id::text = $1::text AND tenant_id::text = $2::text
    RETURNING *
  `;
  
  const result = await query(sql, [availabilityId, tenantId]);
  return result.rows[0];
}

export async function getAvailableSlotsForDoctor(tenantId, doctorId, date) {
  const sql = `
    SELECT 
      id,
      doctor_id,
      date,
      start_time,
      end_time,
      slot_duration_minutes,
      max_appointments,
      current_appointments,
      available_slots
    FROM nexus.doctor_availability 
    WHERE tenant_id::text = $1::text 
      AND doctor_id::uuid = $2::uuid 
      AND date = $3 
      AND is_available = true 
      AND status = 'available'
      AND current_appointments < max_appointments
    ORDER BY start_time
  `;
  
  const result = await query(sql, [tenantId, doctorId, date]);
  return result.rows.map(slot => ({
    ...slot,
    available_slots: slot.max_appointments - slot.current_appointments
  }));
}

export async function getDoctorAvailabilityCalendar(tenantId, doctorId, startDate, endDate) {
  const sql = `
    SELECT 
      date,
      COUNT(*) as total_slots,
      COUNT(CASE WHEN current_appointments < max_appointments THEN 1 END) as available_slots,
      COUNT(CASE WHEN current_appointments >= max_appointments THEN 1 END) as booked_slots,
      MIN(start_time) as first_slot_time,
      MAX(end_time) as last_slot_time
    FROM nexus.doctor_availability 
    WHERE tenant_id::text = $1::text 
      AND ($2::uuid IS NULL OR doctor_id = $2)
      AND date BETWEEN $3 AND $4
      AND is_available = true
    GROUP BY date
    ORDER BY date
  `;
  
  const result = await query(sql, [tenantId, doctorId, startDate, endDate]);
  return result.rows;
}
