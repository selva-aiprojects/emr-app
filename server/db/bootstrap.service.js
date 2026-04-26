/**
 * Bootstrap Service
 * Handles all bootstrap data aggregation for dashboard initialization
 */

import { query } from './connection.js';
import menuService from '../services/menuService.js';

// Self-healing migration for communication tracking
export async function runMigrations() {
  try {
    // 1. Ensure extensions
    await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    
    // 2. Communications table
    await query(`
      CREATE TABLE IF NOT EXISTS nexus.communications (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES nexus.management_tenants(id) ON DELETE SET NULL,
          type VARCHAR(50) DEFAULT 'email',
          direction VARCHAR(10) DEFAULT 'outbound',
          sender TEXT,
          recipient TEXT,
          subject TEXT,
          content TEXT,
          status VARCHAR(20) DEFAULT 'sent',
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    await query('CREATE INDEX IF NOT EXISTS idx_communications_tenant_id ON nexus.communications(tenant_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_communications_created_at ON nexus.communications(created_at DESC)');

    // 3. Menu items
    await query(`
      DO $$
      DECLARE
          h_id VARCHAR(255);
          m_id VARCHAR(255);
      BEGIN
          -- 1. Ensure Header exists
          INSERT INTO nexus.menu_header (name, code, icon_name, sort_order)
          VALUES ('Reports & Communication', 'reports_comm', 'BarChart3', 6)
          ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, icon_name = EXCLUDED.icon_name
          RETURNING id INTO h_id;

          -- 2. Ensure Menu Item exists
          INSERT INTO nexus.menu_item (header_id, name, code, icon_name, route, sort_order)
          VALUES (h_id, 'Signal History', 'comm_history', 'History', '/superadmin/signal-history', 10)
          ON CONFLICT (code) DO UPDATE SET header_id = EXCLUDED.header_id, route = EXCLUDED.route
          RETURNING id INTO m_id;

          -- 3. Ensure Superadmin has access
          INSERT INTO nexus.role_menu_access (role_name, menu_item_id, is_visible)
          VALUES ('Superadmin', m_id, true)
          ON CONFLICT (role_name, menu_item_id, tenant_id) DO UPDATE SET is_visible = true;
      END $$;
    `);
    
    console.log("✅ [MIGRATION_SUCCESS] Communications system synchronized.");
  } catch (err) {
    console.error("[MIGRATION_ERROR] Communications system:", err.message);
  }
}

function snakeToCamel(obj) {
  if (Array.isArray(obj)) return obj.map(v => snakeToCamel(v));
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('_', ''));
      result[camelKey] = snakeToCamel(obj[key]);
      return result;
    }, {});
  }
  return obj;
}

// =====================================================
// BOOTSTRAP
// =====================================================

export async function getBootstrapData(tenantId, userId, providedRole = null) {
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
    encountersResult,
    invoicesResult,
    inventoryResult,
    employeesResult,
    employeesLeavesResult,
    claimsResult,
    tenantResult,
  ] = await Promise.all([
    runSafeQuery('SELECT * FROM nexus.users WHERE id::text = $1::text', [userId]),
    tenantId ? runSafeQuery('SELECT * FROM patients WHERE tenant_id::text = $1::text ORDER BY created_at DESC LIMIT 100', [tenantId]) : Promise.resolve({ rows: [] }),
    tenantId ? runSafeQuery(`SELECT e.*, TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) as patient_name, u.name as provider_name FROM encounters e LEFT JOIN patients p ON e.patient_id::text = p.id::text LEFT JOIN nexus.users u ON e.provider_id::text = u.id::text WHERE e.tenant_id::text = $1::text ORDER BY e.created_at DESC LIMIT 50`, [tenantId]) : Promise.resolve({ rows: [] }),
    tenantId ? runSafeQuery('SELECT * FROM invoices WHERE tenant_id::text = $1::text ORDER BY created_at DESC LIMIT 50', [tenantId]) : Promise.resolve({ rows: [] }),
    tenantId ? runSafeQuery('SELECT * FROM inventory_items WHERE tenant_id::text = $1::text ORDER BY created_at DESC LIMIT 50', [tenantId]) : Promise.resolve({ rows: [] }),
    tenantId ? runSafeQuery('SELECT * FROM employees WHERE tenant_id::text = $1::text ORDER BY first_name', [tenantId]) : Promise.resolve({ rows: [] }),
    tenantId ? runSafeQuery('SELECT * FROM employee_leaves WHERE tenant_id::text = $1::text ORDER BY created_at DESC LIMIT 50', [tenantId]) : Promise.resolve({ rows: [] }),
    tenantId ? runSafeQuery('SELECT * FROM claims WHERE tenant_id::text = $1::text ORDER BY created_at DESC LIMIT 50', [tenantId]) : Promise.resolve({ rows: [] }),
    tenantId ? runSafeQuery('SELECT * FROM nexus.management_tenants WHERE id::text = $1::text', [tenantId]) : Promise.resolve({ rows: [] }),
  ]);

  const user = userResult.rows[0];
  const tenant = tenantResult.rows[0];
  const isSuperadmin = (providedRole || '').toLowerCase() === 'superadmin' || (userId && userId.toLowerCase() === '44000000-0000-0000-0000-000000000001');
  const isE2EAdmin = isSuperadmin;
  
  // Now fetch menu with the correct context
  const menuStructure = await menuService.getUserMenu(
    user?.role || (isSuperadmin ? 'Superadmin' : 'Receptionist'), 
    tenantId, 
    tenant?.subscription_tier || 'Enterprise'
  );

  if (!user && !isE2EAdmin) {
    // If user is not found, it might be a session mismatch after a db reset
    console.error(`[BOOTSTRAP_ERROR] User ${userId} not found in database.`);
    throw new Error(`User session invalid (${userId}). Please re-login.`);
  }

  // Use mock user for E2E identity bypass
  const effectiveUser = user || {
    id: userId,
    role: isSuperadmin ? 'Superadmin' : 'Receptionist',
    name: isSuperadmin ? 'Platform Superadmin' : 'Bootstrap User',
    email: isSuperadmin ? 'superadmin@emr.local' : 'user@emr.local',
    tenant_id: tenantId
  };

  // Normalize user role casing for permission matching
  let userRole = effectiveUser.role;
  if (userRole) {
    // Handle both "Superadmin" and other roles
    if (userRole.toLowerCase() === 'superadmin') {
      userRole = 'Superadmin';
    } else {
      userRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();

      if (userRole === 'Front office') userRole = 'Front Office';
      else if (userRole === 'Support staff') userRole = 'Support Staff';
      else if (userRole === 'Hr') userRole = 'HR';
      else if (userRole === 'Administrator' || userRole === 'Admin role') userRole = 'Admin';
    }
  }

  return {
    user: snakeToCamel({ ...effectiveUser, role: userRole }),
    patients: snakeToCamel(patientsResult.rows),
    appointments: [], 
    walkins: [],
    encounters: snakeToCamel(encountersResult.rows),
    invoices: snakeToCamel(invoicesResult.rows),
    inventory: snakeToCamel(inventoryResult.rows),
    employees: snakeToCamel(employeesResult.rows),
    employeesLeaves: snakeToCamel(employeesLeavesResult.rows),
    insuranceProviders: [],
    claims: snakeToCamel(claimsResult.rows),
    tenant: snakeToCamel(tenantResult.rows[0] || {}),
    menuStructure: menuStructure,
  };
}