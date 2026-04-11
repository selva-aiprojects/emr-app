/**
 * Infrastructure Management Service
 * Handles departments, wards, and beds
 */

import { query } from './connection.js';
import { createAuditLog } from './tenant.service.js';

/**
 * Department Functions
 */
export async function getDepartments(tenantId) {
  const sql = 'SELECT * FROM emr.departments WHERE tenant_id::text = $1::text ORDER BY name';
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createDepartment({ tenantId, name, code, hod_user_id }) {
  const sql = `
    INSERT INTO emr.departments (tenant_id, name, code, hod_user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, name, code, hod_user_id || null]);
  const dept = result.rows[0];

  await createAuditLog({
    tenantId,
    action: 'department.create',
    entityName: 'department',
    entityId: dept.id,
    details: { name, code }
  });

  return dept;
}

/**
 * Ward Functions
 */
export async function getWards(tenantId) {
  const sql = 'SELECT * FROM emr.wards WHERE tenant_id::text = $1::text ORDER BY name';
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createWard({ tenantId, name, type, base_rate }) {
  const sql = `
    INSERT INTO emr.wards (tenant_id, name, type, base_rate)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, name, type, base_rate]);
  return result.rows[0];
}

/**
 * Bed Functions
 */
export async function getBeds(tenantId, wardId = null) {
  let sql, params;
  if (wardId) {
    sql = 'SELECT * FROM emr.beds WHERE tenant_id::text = $1::text AND ward_id::text = $2::text ORDER BY bed_number';
    params = [tenantId, wardId];
  } else {
    sql = 'SELECT * FROM emr.beds WHERE tenant_id::text = $1::text ORDER BY bed_number';
    params = [tenantId];
  }
  const result = await query(sql, params);
  return result.rows;
}

export async function createBed({ tenantId, wardId, bedNumber }) {
  const sql = `
    INSERT INTO emr.beds (tenant_id, ward_id, bed_number, status)
    VALUES ($1, $2, $3, 'available')
    RETURNING *
  `;
  const result = await query(sql, [tenantId, wardId, bedNumber]);
  return result.rows[0];
}

export async function updateBedStatus(tenantId, bedId, status) {
  const sql = `
    UPDATE emr.beds 
    SET status = $1, updated_at = NOW() 
    WHERE tenant_id::text = $2::text AND id::text = $3::text 
    RETURNING *
  `;
  const result = await query(sql, [status, tenantId, bedId]);
  return result.rows[0];
}

/**
 * Service Catalog
 */
export async function getServices(tenantId) {
  const sql = 'SELECT * FROM emr.services WHERE tenant_id::text = $1::text ORDER BY category, name';
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createService({ tenantId, name, code, category, base_rate, tax_percent }) {
  const sql = `
    INSERT INTO emr.services (tenant_id, name, code, category, base_rate, tax_percent)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, name, code, category, base_rate, tax_percent || 0]);
  const service = result.rows[0];

  await createAuditLog({
    tenantId,
    action: 'service.create',
    entityName: 'service',
    entityId: service.id,
    details: { name, code, category, base_rate }
  });

  return service;
}

export async function updateService({ tenantId, serviceId, name, code, category, base_rate, tax_percent }) {
  const sql = `
    UPDATE emr.services
    SET name = $1,
        code = $2,
        category = $3,
        base_rate = $4,
        tax_percent = $5,
        updated_at = NOW()
    WHERE tenant_id::text = $6::text AND id::text = $7::text
    RETURNING *
  `;
  const result = await query(sql, [name, code, category, base_rate, tax_percent || 0, tenantId, serviceId]);
  const service = result.rows[0];

  if (!service) throw new Error('Service not found');

  await createAuditLog({
    tenantId,
    action: 'service.update',
    entityName: 'service',
    entityId: service.id,
    details: { name, code, category, base_rate }
  });

  return service;
}

export async function deleteService({ tenantId, serviceId }) {
  const sql = `
    DELETE FROM emr.services
    WHERE tenant_id::text = $1::text AND id::text = $2::text
    RETURNING *
  `;
  const result = await query(sql, [tenantId, serviceId]);
  const service = result.rows[0];

  if (!service) throw new Error('Service not found');

  await createAuditLog({
    tenantId,
    action: 'service.delete',
    entityName: 'service',
    entityId: service.id,
    details: { name: service.name, code: service.code, category: service.category }
  });

  return service;
}
