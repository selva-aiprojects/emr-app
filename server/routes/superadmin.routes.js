import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { 
  getConsolidatedStats, 
  getManagementOverview,
  getGlobalSupportTickets, 
  provisionTenantUser, 
  globalPasswordReset,
  createNewTenant,
  deleteTenant
} from '../controllers/superadmin.controller.js';

const router = express.Router();

// All routes require SuperAdmin role
router.use(authenticate, requireRole('Superadmin'));

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
router.get('/overview', getManagementOverview);
router.get('/overview-fixed', getManagementOverview);

/**
 * Signal History / Communications Audit
 */
router.get('/communication', async (req, res) => {
  const { getCommunications } = await import('../controllers/superadmin.controller.js');
  return getCommunications(req, res);
});

/**
 * User Provisioning for a specific tenant
 */
router.post('/users/provision', provisionTenantUser);

/**
 * Universal Global Password Reset
 */
router.post('/users/reset-password', globalPasswordReset);

// TODO: Add missing controller functions for these routes
// router.post('/sync-infra', syncLegacyTenants);
// router.post('/sync-metrics', syncManagementMetrics);
router.post('/tenants', createNewTenant);
// router.patch('/tenants/:id', updateTenant);
router.delete('/tenants/:id', deleteTenant);
// router.post('/broadcast', broadcastToAllTenants);
// router.post('/communicate', sendCommunication);
// router.get('/tenants/:id/admin', getTenantAdmin);
// router.post('/audit', platformAudit);
// router.post('/revoke-sessions', revokePlatformSessions);
// router.patch('/tenants/:id/subscription', updateTenantSubscription);

/**
 * System Logs Audit
 */
router.get('/logs', async (req, res) => {
  const { query } = await import('../db/connection.js');
  try {
    const logs = await query('SELECT * FROM management_system_logs ORDER BY created_at DESC LIMIT 100');
    res.json(logs.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mega Seed — Full institutional lifecycle simulation
 */
router.post('/mega-seed', async (req, res) => {
  try {
    const { runMegaSeed } = await import('../scripts/mega_seeder.js');
    const result = await runMegaSeed();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
