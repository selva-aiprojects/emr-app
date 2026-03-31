/**
 * Bootstrap Service
 * Handles all bootstrap data aggregation for dashboard initialization
 */

import { query } from './connection.js';

// =====================================================
// BOOTSTRAP
// =====================================================

export async function getBootstrapData(tenantId, userId) {
  // Parallel fetch for speed with gracefull error handling for missing tables
  const runSafeQuery = async (sql, params = []) => {
    try {
      return await query(sql, params);
    } catch (e) {
      console.warn(`[BOOTSTRAP_SAFE_QUERY] Failed: ${sql.substring(0, 50)}... Error: ${e.message}`);
      return { rows: [] }; // Return empty rows if table/query fails
    }
  };

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
    runSafeQuery('SELECT * FROM emr.users WHERE id = $1', [userId]),
    runSafeQuery(
      'SELECT * FROM emr.patients WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100',
      [tenantId]
    ),
    runSafeQuery(
      'SELECT * FROM emr.walkins WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    runSafeQuery(
      'SELECT * FROM emr.encounters WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    runSafeQuery(
      'SELECT * FROM emr.invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    runSafeQuery(
      'SELECT * FROM emr.inventory_items WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    runSafeQuery(
      'SELECT * FROM emr.employees WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    runSafeQuery(
      'SELECT * FROM emr.employee_leaves WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    runSafeQuery(
      'SELECT * FROM emr.insurance_providers WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
    runSafeQuery(
      'SELECT * FROM emr.claims WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    ),
  ]);

  const user = userResult.rows[0];
  if (!user) {
    // If user is not found, it might be a session mismatch after a db reset
    console.error(`[BOOTSTRAP_ERROR] User ${userId} not found in database.`);
    throw new Error('User session invalid. Please re-login.');
  }

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