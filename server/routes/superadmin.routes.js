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
  sendCommunication,
  deleteTenant,
  updateTenant,
  broadcastToAllTenants,
  getTenantAdmin,
  platformAudit,
  revokePlatformSessions,
  updateTenantSubscription
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
 * Update Tenant metadata (name, subdomain, tier, contactEmail)
 */
router.patch('/tenants/:id', updateTenant);

/**
 * Delete/Decommission a Tenant (with schema purge)
 */
router.delete('/tenants/:id', deleteTenant);

/**
 * User Provisioning for a specific tenant
 */
router.post('/users/provision', provisionTenantUser);

/**
 * Universal Global Password Reset
 */
router.post('/users/reset-password', globalPasswordReset);

/**
 * Global Broadcast — emails all active tenants
 */
router.post('/broadcast', broadcastToAllTenants);

/**
 * Targeted communication dispatch (single tenant)
 */
router.post('/communicate', sendCommunication);

/**
 * Identity Discovery for Individual Shards
 */
router.get('/tenants/:id/admin', getTenantAdmin);

/**
 * Universal Security Operations
 */
router.post('/audit', platformAudit);
router.post('/revoke-sessions', revokePlatformSessions);

/**
 * Subscription Propagation
 */
router.patch('/tenants/:id/subscription', updateTenantSubscription);

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
