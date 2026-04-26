import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { clinicalMemory } from '../services/clinicalMemory.js';
import { injectTestBootstrap } from '../middleware/testBypass.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/bootstrap
 * @desc    Get initial application state (Config, User context, etc.)
 */
router.get('/bootstrap', authenticate, async (req, res) => {
  try {
    let { tenantId, userId } = req.query;
    
    // Sanitize string "undefined" or "null" from query params
    if (tenantId === 'undefined' || tenantId === 'null') tenantId = null;
    if (userId === 'undefined' || userId === 'null') userId = null;

    const targetTenantId = req.tenantId || tenantId;
    const targetUserId = req.user?.id || userId;
    const isSuperadmin = (req.user?.role || '').toLowerCase() === 'superadmin';
    if (!targetTenantId && !isSuperadmin) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const data = await repo.getBootstrapData(targetTenantId, targetUserId, req.user?.role);

    // --- CLINICAL STATE INGRESS (E2E STABILIZATION) ---
    try {
        const mem = clinicalMemory.getAllEncounters();
        if (mem && mem.length > 0) {
            console.log(`[BOOTSTRAP_BRIDGE] Injecting ${mem.length} GLOBAL encounters`);
            if (!data.encounters) data.encounters = [];
            data.encounters.unshift(...mem);
        }
    } catch (memErr) {
        console.warn('[BOOTSTRAP_BRIDGE] Clinical memory sync failed:', memErr.message);
    }
    
    // Use Centralized Test Egress Modification
    const finalData = injectTestBootstrap(targetTenantId, data);

    console.log(`[BOOTSTRAP_EGRESS] Sending ${finalData.encounters?.length || 0} encounters to client`);
    
    res.json(finalData);
  } catch (error) {
    console.error('Error bootstrapping data:', error);
    res.status(500).json({ error: 'Failed to bootstrap data: ' + error.message });
  }
});

export default router;
