/**
 * Inventory Management Service
 * Handles all stock, items, and transaction database operations
 */

import { query } from './connection.js';

/**
 * Get all inventory items for a tenant
 * @param {string} tenantId - Tenant UUID
 * @returns {Promise<Array>} - List of inventory items
 */
export async function getInventoryItems(tenantId) {
  const result = await query(
    'SELECT * FROM nexus.inventory_items WHERE tenant_id::text = $1::text ORDER BY name',
    [tenantId]
  );
  return result.rows.map(row => ({
    ...row,
    code: row.item_code,
    stock: parseFloat(row.current_stock),
    reorder: parseFloat(row.reorder_level),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new inventory item
 * @param {Object} data - Item details
 * @returns {Promise<Object>} - Created item record
 */
export async function createInventoryItem({ tenantId, userId, code, name, category, stock = 0, reorder = 0 }) {
  const sql = `
    INSERT INTO nexus.inventory_items (tenant_id, item_code, name, category, current_stock, reorder_level)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId,
    code,
    name,
    category || null,
    stock,
    reorder,
  ]);

  const item = result.rows[0];

  return {
    ...item,
    code: item.item_code,
    stock: parseFloat(item.current_stock),
    reorder: parseFloat(item.reorder_level),
  };
}

/**
 * Adjust stock level for an item
 * @param {Object} data - Update details
 * @returns {Promise<Object>} - Updated item record
 */
export async function updateInventoryStock({ itemId, tenantId, userId, delta }) {
  const sql = `
    UPDATE nexus.inventory_items
    SET current_stock = GREATEST(0, current_stock + $1), updated_at = NOW()
    WHERE id::text = $2 AND tenant_id::text = $3
    RETURNING *
  `;

  const result = await query(sql, [delta, itemId, tenantId]);

  if (result.rows.length === 0) {
    throw new Error('Inventory item not found');
  }

  const transactionType = delta > 0 ? 'receipt' : 'issue';

  // Create transaction record
  await query(
    `INSERT INTO nexus.inventory_transactions (tenant_id, item_id, transaction_type, quantity, created_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [tenantId, itemId, transactionType, Math.abs(delta), userId]
  );

  const item = result.rows[0];
  return {
    ...item,
    code: item.item_code,
    stock: parseFloat(item.current_stock),
    reorder: parseFloat(item.reorder_level),
  };
}
