import { query } from '../db/connection.js';

class MenuService {
  /**
   * Get menu headers for a specific tenant or global headers
   */
  async getMenuHeaders(tenantId = null) {
    const sql = `
      SELECT DISTINCT ON (code) id, name, code, description, sort_order, icon_name, is_active
      FROM nexus.menu_header 
      WHERE is_active = true 
        AND (tenant_id = $1 OR tenant_id IS NULL)
      ORDER BY code, (tenant_id IS NOT NULL) DESC, sort_order ASC
    `;
    
    const result = await query(sql, [tenantId]);
    // Sort again by sort_order because DISTINCT ON requires ordering by the distinct column first
    return result.rows.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }

  /**
   * Get menu items for a specific header, filtered by role and subscription
   */
  async getMenuItems(headerId, roleName, tenantId = null, subscriptionPlan = null) {
    let sql = `
      SELECT DISTINCT ON (mi.code)
        mi.id, 
        mi.name, 
        mi.code, 
        mi.description, 
        mi.icon_name, 
        mi.route, 
        mi.sort_order,
        mi.requires_subscription,
        mi.subscription_plans,
        rma.is_visible
      FROM nexus.menu_item mi
      LEFT JOIN nexus.role_menu_access rma ON mi.id = rma.menu_item_id 
        AND LOWER(rma.role_name) = LOWER($2) 

        AND (rma.tenant_id = $3 OR rma.tenant_id IS NULL)
      WHERE mi.header_id = $1 
        AND mi.is_active = true 
        AND (mi.tenant_id = $3 OR mi.tenant_id IS NULL)
        AND (rma.is_visible = true OR rma.is_visible IS NULL)
    `;
    
    const params = [headerId, roleName, tenantId];
    
    // Add subscription filter if required
    if (subscriptionPlan) {
      sql += ` AND (
        NOT mi.requires_subscription 
        OR mi.subscription_plans::jsonb ? $4
      )`;
      params.push(subscriptionPlan.toLowerCase());
    } else {
      sql += ` AND NOT mi.requires_subscription`;
    }
    
    sql += ` ORDER BY mi.code, (mi.tenant_id IS NOT NULL) DESC, mi.sort_order ASC`;
    
    const result = await query(sql, params);
    // Final sort by order_index
    return result.rows.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }

  /**
   * Get complete menu structure for a user
   */
  async getUserMenu(userRole, tenantId = null, subscriptionPlan = null) {
    const headers = await this.getMenuHeaders(tenantId);
    
    const menuStructure = [];
    
    for (const header of headers) {
      const menuItems = await this.getMenuItems(header.id, userRole, tenantId, subscriptionPlan);
      
      if (menuItems.length > 0) {
        menuStructure.push({
          id: header.id,
          name: header.name,
          code: header.code,
          description: header.description,
          icon_name: header.icon_name,
          sort_order: header.sort_order,
          items: menuItems
        });
      }
    }
    
    return menuStructure;
  }

  /**
   * Get user's allowed modules (backward compatibility)
   */
  async getUserAllowedModules(userRole, tenantId = null, subscriptionPlan = null) {
    const menuStructure = await this.getUserMenu(userRole, tenantId, subscriptionPlan);
    
    const modules = [];
    menuStructure.forEach(header => {
      header.items.forEach(item => {
        modules.push(item.code);
      });
    });
    
    return modules;
  }

  /**
   * Check if user has access to specific module
   */
  async hasModuleAccess(moduleCode, userRole, tenantId = null, subscriptionPlan = null) {
    const sql = `
      SELECT COUNT(*) as count
      FROM nexus.menu_item mi
      LEFT JOIN nexus.role_menu_access rma ON mi.id = rma.menu_item_id 
        AND LOWER(rma.role_name) = LOWER($2) 

        AND (rma.tenant_id = $3 OR rma.tenant_id IS NULL)
      WHERE mi.code = $1 
        AND mi.is_active = true 
        AND (mi.tenant_id = $3 OR mi.tenant_id IS NULL)
        AND (rma.is_visible = true OR rma.is_visible IS NULL)
        AND (
          NOT mi.requires_subscription 
          OR mi.subscription_plans::jsonb ? $4
        )
    `;
    
    const result = await query(sql, [
      moduleCode, 
      userRole, 
      tenantId, 
      subscriptionPlan ? subscriptionPlan.toLowerCase() : null
    ]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Create or update menu header
   */
  async upsertMenuHeader(headerData) {
    const { id, name, code, description, sort_order, icon_name, is_active, tenant_id } = headerData;
    
    if (id) {
      // Update existing
      const sql = `
        UPDATE nexus.menu_header 
        SET name = $1, code = $2, description = $3, sort_order = $4, 
            icon_name = $5, is_active = $6, tenant_id = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `;
      const result = await query(sql, [name, code, description, sort_order, icon_name, is_active, tenant_id, id]);
      return result.rows[0];
    } else {
      // Create new
      const sql = `
        INSERT INTO nexus.menu_header (name, code, description, sort_order, icon_name, is_active, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await query(sql, [name, code, description, sort_order, icon_name, is_active, tenant_id]);
      return result.rows[0];
    }
  }

  /**
   * Create or update menu item
   */
  async upsertMenuItem(itemData) {
    const { 
      id, header_id, name, code, description, icon_name, route, sort_order, 
      is_active, requires_subscription, subscription_plans, tenant_id 
    } = itemData;
    
    if (id) {
      // Update existing
      const sql = `
        UPDATE nexus.menu_item 
        SET header_id = $1, name = $2, code = $3, description = $4, icon_name = $5, 
            route = $6, sort_order = $7, is_active = $8, requires_subscription = $9, 
            subscription_plans = $10, tenant_id = $11, updated_at = NOW()
        WHERE id = $12
        RETURNING *
      `;
      const result = await query(sql, [
        header_id, name, code, description, icon_name, route, sort_order, 
        is_active, requires_subscription, subscription_plans, tenant_id, id
      ]);
      return result.rows[0];
    } else {
      // Create new
      const sql = `
        INSERT INTO nexus.menu_item (
          header_id, name, code, description, icon_name, route, sort_order, 
          is_active, requires_subscription, subscription_plans, tenant_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const result = await query(sql, [
        header_id, name, code, description, icon_name, route, sort_order, 
        is_active, requires_subscription, subscription_plans, tenant_id
      ]);
      return result.rows[0];
    }
  }

  /**
   * Update role menu access
   */
  async updateRoleMenuAccess(roleName, menuItemId, isVisible, tenantId = null) {
    const sql = `
      INSERT INTO nexus.role_menu_access (role_name, menu_item_id, is_visible, tenant_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (role_name, menu_item_id, tenant_id) 
      DO UPDATE SET is_visible = $3, updated_at = NOW()
      RETURNING *
    `;
    
    const result = await query(sql, [roleName, menuItemId, isVisible, tenantId]);
    return result.rows[0];
  }

  /**
   * Delete menu header (and associated items)
   */
  async deleteMenuHeader(headerId) {
    const sql = 'DELETE FROM nexus.menu_header WHERE id = $1 RETURNING *';
    const result = await query(sql, [headerId]);
    return result.rows[0];
  }

  /**
   * Delete menu item
   */
  async deleteMenuItem(itemId) {
    const sql = 'DELETE FROM nexus.menu_item WHERE id = $1 RETURNING *';
    const result = await query(sql, [itemId]);
    return result.rows[0];
  }

  /**
   * Get menu item workflow data for EMR navigation
   */
  async getMenuItemWorkflowData(moduleCode, userRole, tenantId = null, subscriptionPlan = null) {
    const sql = `
      SELECT mi.workflow_data
      FROM nexus.menu_item mi
      LEFT JOIN nexus.role_menu_access rma ON mi.id = rma.menu_item_id 
        AND LOWER(rma.role_name) = LOWER($2) 
        AND (rma.tenant_id = $3 OR rma.tenant_id IS NULL)
      WHERE mi.code = $1 
        AND mi.is_active = true 
        AND (mi.tenant_id = $3 OR mi.tenant_id IS NULL)
        AND (rma.is_visible = true OR rma.is_visible IS NULL)
        AND (
          NOT mi.requires_subscription 
          OR mi.subscription_plans::jsonb ? $4
        )
    `;
    
    const result = await query(sql, [
      moduleCode, 
      userRole, 
      tenantId, 
      subscriptionPlan ? subscriptionPlan.toLowerCase() : null
    ]);
    
    return result.rows.length > 0 ? result.rows[0].workflow_data : null;
  }
}

export default new MenuService();
