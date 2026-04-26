/**
 * User Management Service
 * Handles all user-related database operations
 */

import { query } from './connection.js';

/**
 * Get all users, optionally filtered by tenant
 * @param {string|null} tenantId - Tenant UUID or null for all users
 * @returns {Promise<Array>} - List of user records
 */
export async function getUsers(tenantId = null) {
  let users = [];
  if (tenantId) {
    const result = await query(
      'SELECT id, tenant_id, email, name, role, is_active, created_at, last_login FROM nexus.users WHERE tenant_id::text = $1::text ORDER BY name',
      [tenantId]
    );
    users = result.rows;
    return result.rows;

  }

  const result = await query(
    'SELECT id, tenant_id, email, name, role, is_active, created_at, last_login FROM nexus.users ORDER BY name'
  );
  return result.rows;
}

/**
 * Get a user by ID
 * @param {string} id - User UUID
 * @returns {Promise<Object|null>} - User record or null
 */
export async function getUserById(id) {
  const result = await query(
    'SELECT id, tenant_id, email, name, role, is_active, created_at, last_login FROM nexus.users WHERE id::text = $1::text',
    [id]
  );
  return result.rows[0];
}

/**
 * Get a user by email, optionally restricted to a tenant
 * @param {string} email - User email address
 * @param {string|null} tenantId - Tenant UUID or null for platform-level search
 * @returns {Promise<Object|null>} - User record or null
 */
export async function getUserByEmail(email, tenantId = null) {
  let sql, params;

  if (tenantId === null) {
    // Superadmin login (no tenant_id)
    sql = 'SELECT * FROM nexus.users WHERE LOWER(email) = LOWER($1) AND tenant_id IS NULL';
    params = [email];
  } else {
    // Tenant user login
    sql = 'SELECT * FROM nexus.users WHERE LOWER(email) = LOWER($1) AND tenant_id::text = $2::text';
    params = [email, tenantId];
  }

  const result = await query(sql, params);
  return result.rows[0];
}

/**
 * Create a new user
 * @param {Object} userData - User details
 * @returns {Promise<Object>} - Created user record
 */
export async function createUser({ tenantId, email, passwordHash, name, role }) {
  const sql = `
    INSERT INTO nexus.users (tenant_id, email, password_hash, name, role, is_active)
    VALUES ($1, $2, $3, $4, $5, true)
    RETURNING id, tenant_id, email, name, role, is_active, created_at
  `;

  const result = await query(sql, [
    tenantId || null,
    email,
    passwordHash,
    name,
    role,
  ]);

  return result.rows[0];
}

/**
 * Update user's last login timestamp
 * @param {string} userId - User UUID
 * @returns {Promise<void>}
 */
export async function updateUserLastLogin(userId) {
  await query('UPDATE nexus.users SET last_login = NOW() WHERE id::text = $1::text', [userId]);
}

/**
 * Update user status
 * @param {string} userId - User UUID
 * @param {boolean} isActive - New status
 * @returns {Promise<Object>} - Updated user record
 */
export async function updateUserStatus(userId, isActive) {
  const result = await query(
    'UPDATE nexus.users SET is_active = $1, updated_at = NOW() WHERE id::text = $2::text RETURNING id, is_active',
    [isActive, userId]
  );
  return result.rows[0];
}
