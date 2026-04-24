import express from 'express';
const router = express.Router();
import menuService from '../services/menuService.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Get user's complete menu structure
router.get('/user-menu', authenticate, async (req, res) => {
  try {
    const { role } = req.user;
    const tenantId = req.user.tenant_id || null;
    const subscriptionPlan = req.user.subscription_tier || null;
    
    const menuStructure = await menuService.getUserMenu(role, tenantId, subscriptionPlan);
    
    res.json({
      success: true,
      data: menuStructure
    });
  } catch (error) {
    console.error('Error fetching user menu:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu structure'
    });
  }
});

// Get user's allowed modules (backward compatibility)
router.get('/allowed-modules', authenticate, async (req, res) => {
  try {
    const { role } = req.user;
    const tenantId = req.user.tenant_id || null;
    const subscriptionPlan = req.user.subscription_tier || null;
    
    const modules = await menuService.getUserAllowedModules(role, tenantId, subscriptionPlan);
    
    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    console.error('Error fetching allowed modules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch allowed modules'
    });
  }
});

// Check module access
router.get('/check-access/:moduleCode', authenticate, async (req, res) => {
  try {
    const { moduleCode } = req.params;
    const { role } = req.user;
    const tenantId = req.user.tenant_id || null;
    const subscriptionPlan = req.user.subscription_tier || null;
    
    const hasAccess = await menuService.hasModuleAccess(moduleCode, role, tenantId, subscriptionPlan);
    
    res.json({
      success: true,
      data: { hasAccess }
    });
  } catch (error) {
    console.error('Error checking module access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check module access'
    });
  }
});

// Get menu headers (admin only)
router.get('/headers', authenticate, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    const tenantId = req.user.tenant_id || null;
    const headers = await menuService.getMenuHeaders(tenantId);
    
    res.json({
      success: true,
      data: headers
    });
  } catch (error) {
    console.error('Error fetching menu headers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu headers'
    });
  }
});

// Get menu items for a header (admin only)
router.get('/items/:headerId', authenticate, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    const { headerId } = req.params;
    const tenantId = req.user.tenant_id || null;
    const subscriptionPlan = req.user.subscription_tier || null;
    
    const items = await menuService.getMenuItems(headerId, 'admin', tenantId, subscriptionPlan);
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu items'
    });
  }
});

// Create or update menu header (admin only)
router.post('/headers', authenticate, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    const headerData = {
      ...req.body,
      tenant_id: req.user.tenant_id || null
    };
    
    const header = await menuService.upsertMenuHeader(headerData);
    
    res.json({
      success: true,
      data: header
    });
  } catch (error) {
    console.error('Error upserting menu header:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save menu header'
    });
  }
});

// Create or update menu item (admin only)
router.post('/items', authenticate, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    const itemData = {
      ...req.body,
      tenant_id: req.user.tenant_id || null
    };
    
    const item = await menuService.upsertMenuItem(itemData);
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error upserting menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save menu item'
    });
  }
});

// Update role menu access (admin only)
router.post('/role-access', authenticate, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    const { roleName, menuItemId, isVisible } = req.body;
    const tenantId = req.user.tenant_id || null;
    
    const access = await menuService.updateRoleMenuAccess(roleName, menuItemId, isVisible, tenantId);
    
    res.json({
      success: true,
      data: access
    });
  } catch (error) {
    console.error('Error updating role menu access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update role menu access'
    });
  }
});

// Delete menu header (admin only)
router.delete('/headers/:headerId', authenticate, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    const { headerId } = req.params;
    const header = await menuService.deleteMenuHeader(headerId);
    
    res.json({
      success: true,
      data: header
    });
  } catch (error) {
    console.error('Error deleting menu header:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete menu header'
    });
  }
});

// Delete menu item (admin only)
router.delete('/items/:itemId', authenticate, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    const { itemId } = req.params;
    const item = await menuService.deleteMenuItem(itemId);
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete menu item'
    });
  }
});

// Get menu item workflow data for EMR navigation
router.get('/workflow-data/:moduleCode', authenticate, async (req, res) => {
  try {
    const { moduleCode } = req.params;
    const { role } = req.user;
    const tenantId = req.user.tenant_id || null;
    const subscriptionPlan = req.user.subscription_tier || null;
    
    const workflowData = await menuService.getMenuItemWorkflowData(moduleCode, role, tenantId, subscriptionPlan);
    
    res.json({
      success: true,
      data: { workflow_data: workflowData }
    });
  } catch (error) {
    console.error('Error fetching workflow data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow data'
    });
  }
});

export default router;
