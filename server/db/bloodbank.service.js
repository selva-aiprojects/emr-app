/**
 * Blood Bank Management Service
 */

import { query } from './connection.js';

/**
 * Blood Unit Inventory
 */
export async function getBloodUnits(tenantId) {
  const sql = 'SELECT * FROM nexus.blood_units WHERE tenant_id::text = $1::text AND status != $2 ORDER BY expiry_date ASC';
  const result = await query(sql, [tenantId, 'Consumed']);
  return result.rows;
}

export async function createBloodUnit({ tenantId, userId, bloodGroup, volumeMl, donorName, donorContact, expiryDate }) {
  const sql = `
    INSERT INTO nexus.blood_units (tenant_id, created_by, blood_group, volume_ml, donor_name, donor_contact, expiry_date, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'Available')
    RETURNING *
  `;
  const result = await query(sql, [
    tenantId, 
    userId, 
    bloodGroup, 
    volumeMl, 
    donorName || 'Anonymous', 
    donorContact || 'N/A', 
    expiryDate || new Date(Date.now() + 35 * 24 * 60 * 60 * 1000) // Default 35 days
  ]);
  return result.rows[0];
}

/**
 * Blood Requests (Transfusion Management)
 */
export async function getBloodRequests(tenantId) {
  const sql = `
    SELECT br.*, p.first_name || ' ' || p.last_name as patient_name 
    FROM nexus.blood_requests br
    LEFT JOIN nexus.patients p ON p.id::text = br.patient_id::text
    WHERE br.tenant_id::text = $1::text 
    ORDER BY br.priority DESC, br.created_at DESC
  `;
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createBloodRequest({ tenantId, patientId, requestedGroup, volumeMl, priority, urgencyNotes }) {
  const sql = `
    INSERT INTO nexus.blood_requests (tenant_id, patient_id, requested_group, volume_ml, priority, urgency_notes, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
    RETURNING *
  `;
  const result = await query(sql, [tenantId, patientId, requestedGroup, volumeMl, priority || 'normal', urgencyNotes]);
  return result.rows[0];
}
