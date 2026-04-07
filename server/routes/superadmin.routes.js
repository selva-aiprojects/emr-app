import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { 
  getConsolidatedStats, 
  getManagementOverview,
  getGlobalSupportTickets, 
  provisionTenantUser, 
  globalPasswordReset, 
  createNewTenant,
  syncLegacyTenants,
  syncManagementMetrics,
  sendCommunication
} from '../controllers/superadmin.controller.js';

const router = express.Router();

// All routes require SuperAdmin role
router.use(authenticate, requireRole('Superadmin'));

/**
 * Sync legacy tenants to Management Plane
 */
router.post('/sync-infra', syncLegacyTenants);
router.post('/sync-metrics', syncManagementMetrics);

/**
 * High-level consolidated stats (Patients, Doctors, Depts counts)
 */
router.get('/dashboard-stats', getConsolidatedStats);

/**
 * Manage Global Support Tickets
 */
router.get('/tickets', getGlobalSupportTickets);

/**
 * Dashboard Overview Aggregator
 */
router.get('/overview', async (req, res) => {
  return getManagementOverview(req, res);
});

/**
 * Create/Provision new Tenant
 */
router.post('/tenants', createNewTenant);

/**
 * User Provisioning for a specific tenant
 */
router.post('/users/provision', provisionTenantUser);

/**
 * Universal Global Password Reset
 */
router.post('/users/reset-password', globalPasswordReset);

/**
 * System Logs Audit
 */
router.get('/logs', async (req, res) => {
  const { query } = await import('../db/connection.js');
  try {
    const logs = await query('SELECT * FROM emr.management_system_logs ORDER BY created_at DESC LIMIT 100');
    res.json(logs.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
