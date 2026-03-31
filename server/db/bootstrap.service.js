/**
 * Bootstrap Service
 * Handles all bootstrap data aggregation for dashboard initialization
 */

import { query } from './connection.js';

// =====================================================
// BOOTSTRAP
// =====================================================

export async function getBootstrapData(tenantId, userId) {
  // Parallel fetch for speed
  const [
    userResult,
    patientsResult,
    walkinsResult,
    encountersResult,
    invoicesResult,
    inventoryResult,
    employeesResult,
    employeesLeavesResult,
    insuranceProvidersResult,
    claimsResult,
  ] = await Promise.all([
    query('SELECT * FROM emr.users WHERE id = $1', [userId]),
    query(
      'SELECT * FROM emr.patients WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100',
      [tenantId]
    ),
    query(
      'SELECT * FROM emr.walkins WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    query(
      'SELECT * FROM emr.encounters WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    query(
      'SELECT * FROM emr.invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    query(
      'SELECT * FROM emr.inventory WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    query(
      'SELECT * FROM emr.employees WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    query(
      'SELECT * FROM emr.employee_leaves WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    query(
      'SELECT * FROM emr.insurance_providers WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    query(
      'SELECT * FROM emr.claims WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
  ]);

  const user = userResult.rows[0];
  if (!user) throw new Error('User not found');

  // Normalize user role casing for permission matching
  let userRole = user.role;
  if (userRole) {
    userRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();

    if (userRole === 'Front office') userRole = 'Front Office';
    else if (userRole === 'Support staff') userRole = 'Support Staff';
    else if (userRole === 'Hr') userRole = 'HR';
    else if (userRole === 'Administrator' || userRole === 'Admin role') userRole = 'Admin';
  }

  user.role = userRole;

  return {
    user,
    patients: patientsResult.rows,
    appointments: [], // Add appointment query later if needed
    walkins: walkinsResult.rows,
    encounters: encountersResult.rows,
    invoices: invoicesResult.rows,
    inventory: inventoryResult.rows,
    employees: employeesResult.rows,
    employeesLeaves: employeesLeavesResult.rows,
    insuranceProviders: insuranceProvidersResult.rows,
    claims: claimsResult.rows,
  };
}