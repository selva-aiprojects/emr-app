const API_BASE = import.meta.env.VITE_API_BASE || '/api';

class MenuService {
  /**
   * Get user's complete menu structure from database
   */
  async getUserMenu() {
    try {
      const response = await fetch(`${API_BASE}/menu/user-menu`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch menu structure');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching user menu:', error);
      // Return fallback empty menu structure
      return [];
    }
  }

  /**
   * Get menu item workflow data for EMR navigation
   */
  async getMenuItemWorkflowData(moduleCode) {
    try {
      const response = await fetch(`${API_BASE}/menu/workflow-data/${moduleCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.data?.workflow_data || null;
    } catch (error) {
      console.error('Error fetching workflow data:', error);
      return null;
    }
  }

  /**
   * Get user's allowed modules (backward compatibility)
   */
  async getUserAllowedModules() {
    try {
      const response = await fetch(`${API_BASE}/menu/allowed-modules`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch allowed modules');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching allowed modules:', error);
      // Return fallback empty array
      return [];
    }
  }

  /**
   * Check if user has access to specific module
   */
  async hasModuleAccess(moduleCode) {
    try {
      const response = await fetch(`${API_BASE}/menu/check-access/${moduleCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check module access');
      }

      const result = await response.json();
      return result.data?.hasAccess || false;
    } catch (error) {
      console.error('Error checking module access:', error);
      // Return false on error (safer default)
      return false;
    }
  }

  /**
   * Get menu headers (admin only)
   */
  async getMenuHeaders() {
    try {
      const response = await fetch(`${API_BASE}/menu/headers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch menu headers');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching menu headers:', error);
      return [];
    }
  }

  /**
   * Get menu items for a header (admin only)
   */
  async getMenuItems(headerId) {
    try {
      const response = await fetch(`${API_BASE}/menu/items/${headerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  }

  /**
   * Create or update menu header (admin only)
   */
  async upsertMenuHeader(headerData) {
    try {
      const response = await fetch(`${API_BASE}/menu/headers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(headerData)
      });

      if (!response.ok) {
        throw new Error('Failed to save menu header');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error saving menu header:', error);
      throw error;
    }
  }

  /**
   * Create or update menu item (admin only)
   */
  async upsertMenuItem(itemData) {
    try {
      const response = await fetch(`${API_BASE}/menu/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        throw new Error('Failed to save menu item');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error saving menu item:', error);
      throw error;
    }
  }

  /**
   * Update role menu access (admin only)
   */
  async updateRoleMenuAccess(roleName, menuItemId, isVisible) {
    try {
      const response = await fetch(`${API_BASE}/menu/role-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ roleName, menuItemId, isVisible })
      });

      if (!response.ok) {
        throw new Error('Failed to update role menu access');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating role menu access:', error);
      throw error;
    }
  }

  /**
   * Delete menu header (admin only)
   */
  async deleteMenuHeader(headerId) {
    try {
      const response = await fetch(`${API_BASE}/menu/headers/${headerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu header');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error deleting menu header:', error);
      throw error;
    }
  }

  /**
   * Delete menu item (admin only)
   */
  async deleteMenuItem(itemId) {
    try {
      const response = await fetch(`${API_BASE}/menu/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu item');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }
}

export const menuService = new MenuService();
