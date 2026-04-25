/**
 * HR & Employee Management Service
 * Handles employee records, leaves, and staff data
 */

import { query } from './connection.js';
import { createUser } from './user.service.js';

/**
 * Get all employees for a tenant
 * @param {string} tenantId - Tenant UUID
 * @returns {Promise<Array>} - List of employee records
 */
export async function getEmployees(tenantId) {
  const result = await query(
    'SELECT * FROM employees WHERE tenant_id::text = $1::text ORDER BY name',
    [tenantId]
  );
  return result.rows.map(row => ({
    ...row,
    salary: parseFloat(row.salary),
    leaveBalance: parseFloat(row.leave_balance),
    joinDate: row.join_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new employee record
 * @param {Object} data - Employee details
 * @returns {Promise<Object>} - Created employee record
 */
export async function createEmployee({ tenantId, name, code, department, designation, joinDate, shift, salary, email }) {
  const sql = `
    INSERT INTO employees (tenant_id, name, code, department, designation, join_date, shift, salary, leave_balance)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 12)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId,
    name,
    code,
    department || null,
    designation || null,
    joinDate || null,
    shift || null,
    salary || 0,
  ]);

  const employee = result.rows[0];

  // IF IT IS A DOCTOR, PROVISION USER AUTOMATICALLY
  if (designation?.toLowerCase() === 'doctor' && email) {
    try {
      await createUser({
        tenantId,
        name,
        email,
        role: 'Doctor'
      });
    } catch (err) {
      console.error('[AUTH_SYNC_FAILURE] Could not provision user for doctor:', err);
    }
  }

  return {
    ...employee,
    salary: parseFloat(employee.salary),
    leaveBalance: parseFloat(employee.leave_balance),
    joinDate: employee.join_date,
    createdAt: employee.created_at,
    updatedAt: employee.updated_at,
  };
}

/**
 * Get all employee leaves for a tenant
 * @param {string} tenantId - Tenant UUID
 * @returns {Promise<Array>} - List of leave records
 */
export async function getEmployeeLeaves(tenantId) {
  const result = await query(
    'SELECT * FROM employee_leaves WHERE tenant_id::text = $1::text ORDER BY from_date DESC',
    [tenantId]
  );
  return result.rows.map(row => ({
    ...row,
    from: row.from_date,
    to: row.to_date,
    type: row.leave_type,
    employeeId: row.employee_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Record a new employee leave
 * @param {Object} data - Leave details
 * @returns {Promise<Object>} - Created leave record
 */
export async function createEmployeeLeave({ tenantId, employeeId, from, to, type }) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

  const sql = `
    INSERT INTO employee_leaves (tenant_id, employee_id, leave_type, from_date, to_date, days, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId,
    employeeId,
    type,
    from,
    to,
    days,
  ]);

  const leave = result.rows[0];
  return {
    ...leave,
    from: leave.from_date,
    to: leave.to_date,
    type: leave.leave_type,
    employeeId: leave.employee_id,
    createdAt: leave.created_at,
    updatedAt: leave.updated_at,
  };
}
