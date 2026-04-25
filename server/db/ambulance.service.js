/**
 * Ambulance & Emergency Fleet Service
 */

import { query } from './connection.js';

/**
 * Fleet Registry
 */
export async function getAmbulances(tenantId) {
  const sql = 'SELECT * FROM nexus.ambulances WHERE tenant_id::text = $1::text ORDER BY vehicle_number';
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createAmbulance({ tenantId, userId, vehicleNumber, model, currentDriver, contactNumber }) {
  const sql = `
    INSERT INTO nexus.ambulances (tenant_id, vehicle_number, model, current_driver, contact_number, status)
    VALUES ($1, $2, $3, $4, $5, 'Available')
    RETURNING *
  `;
  const result = await query(sql, [tenantId, vehicleNumber, model, currentDriver, contactNumber]);
  return result.rows[0];
}

/**
 * Dispatch Hub
 */
export async function dispatchAmbulance({ id, tenantId, incidentLat, incidentLng, patientName, priority }) {
  // Update ambulance status
  await query(
    'UPDATE nexus.ambulances SET status = $1, last_location_lat = $2, last_location_lng = $3 WHERE id::text = $4::text AND tenant_id::text = $5::text',
    ['On Mission', incidentLat, incidentLng, id, tenantId]
  );

  // Create trip record
  const sql = `
    INSERT INTO nexus.ambulance_trips (tenant_id, ambulance_id, patient_name, location_lat, location_lng, priority, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'En Route')
    RETURNING *
  `;
  const result = await query(sql, [tenantId, id, patientName, incidentLat, incidentLng, priority]);
  return result.rows[0];
}

export async function updateAmbulanceStatus(id, tenantId, status, lat, lng) {
  const sql = `
    UPDATE nexus.ambulances 
    SET status = $1, last_location_lat = $2, last_location_lng = $3, updated_at = NOW()
    WHERE id::text = $4::text AND tenant_id::text = $5::text
    RETURNING *
  `;
  const result = await query(sql, [status, lat, lng, id, tenantId]);
  return result.rows[0];
}
