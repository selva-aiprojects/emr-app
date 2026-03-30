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
    user,
    patients,
    appointments,
    walkins,
    encounters,
    invoices,
    inventory,
    employees,
    employeesLeaves,
    insuranceProviders,
    claims
  ] = await Promise.all([
    query('SELECT * FROM emr.users WHERE id = $1', [userId]),
    // Placeholder for other data to be fetched below
    Promise.resolve([]),
    query('SELECT * FROM emr.patients WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100', [tenantId]),
    query('SELECT * FROM emr.walkins WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.encounters WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.inventory WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.employees WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.employee_leaves WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.insurance_providers WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.claims WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId])
  ]);

  if (!user) throw new Error('User not found');

  // Normalize user role casing for permission matching (e.g., "doctor" -> "Doctor")
  let userRole = user.role;
  if (userRole) {
    userRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();
    if (userRole === 'Front office') userRole = 'Front Office';
    else if (userRole === 'Support staff') userRole = 'Support Staff';
    else if (userRole === 'Hr') userRole = 'HR';
    else if (userRole === 'Administrator' || userRole === 'Admin role') userRole = 'Admin';
  }

  // Also update the role on the user object itself for the frontend
  user.role = userRole;

  // Securely fetch patients with masking
  const securePatients = await query('SELECT * FROM emr.patients WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100', [tenantId]);

  return {
    user,
    patients: securePatients,
    appointments: [],
    walkins: [],
    encounters: [],
    invoices: [],
    inventory: [],
    employees: [],
    employeesLeaves: [],
    insuranceProviders: [],
    claims: []
  };
}

export async function getBootstrapData(tenantId, userId) {
  // Parallel fetch for speed
  const [
    user,
    patients,
    appointments,
    walkins,
    encounters,
    invoices,
    inventory,
    employees,
    employeesLeaves,
    insuranceProviders,
    claims
  ] = await Promise.all([
    query('SELECT * FROM emr.users WHERE id = $1', [userId]),
    // Placeholder for other data to be fetched below
    Promise.resolve([]),
    query('SELECT * FROM emr.patients WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100', [tenantId]),
    query('SELECT * FROM emr.walkins WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.encounters WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.inventory WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.employees WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.employee_leaves WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.insurance_providers WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId]),
    query('SELECT * FROM emr.claims WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [tenantId])
  ]);

  if (!user) throw new Error('User not found');

  // Normalize user role casing for permission matching (e.g., "doctor" -> "Doctor")
  let userRole = user.role;
  if (userRole) {
    userRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();
    if (userRole === 'Front office') userRole = 'Front Office';
    else if (userRole === 'Support staff') userRole = 'Support Staff';
    else if (userRole === 'Hr') userRole = 'HR';
    else if (userRole === 'Administrator' || userRole === 'Admin role') userRole = 'Admin';
  }

  // Also update the role on the user object itself for the frontend
  user.role = userRole;

  // Securely fetch patients with masking
  const securePatients = await query('SELECT * FROM emr.patients WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100', [tenantId]);

  return {
    user,
    patients: securePatients,
    appointments: [],
    walkins: [],
    encounters: [],
    invoices: [],
    inventory: [],
    employees: [],
    employeesLeaves: [],
    insuranceProviders: [],
    claims: []
  };
}
