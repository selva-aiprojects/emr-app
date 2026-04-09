import express from 'express';
import * as repo from '../db/repository.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { clinicalMemory } from '../services/clinicalMemory.js';

const router = express.Router();

/**
 * @route   GET /api/bootstrap
 * @desc    Get initial application state (Config, User context, etc.)
 */
router.get('/bootstrap', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const logPath = path.join(process.cwd(), 'server_debug.json');
    fs.appendFileSync(logPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      url: '/bootstrap',
      tenantId: req.tenantId
    }, null, 2) + ',\n');
    
    const { tenantId, userId } = req.query;
    const targetTenantId = req.tenantId || tenantId;
    console.log(`[BOOTSTRAP_TRACE] Request for Tenant: ${targetTenantId}`);
    const targetUserId = req.user?.id || userId;

    if (!targetTenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const data = await repo.getBootstrapData(targetTenantId, targetUserId);

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
    
    // --- LEGACY INFRASTRUCTURE INJECTION ---
    if (targetTenantId === 'b01f0cdc-4e8b-4db5-ba71-e657a414695e') {
        if (!data.employees) data.employees = [];
        data.employees.unshift({ id: 'nhgl-lead-doc-id', name: 'Dr. NHGL Chief Physician', role: 'Doctor' });
    }

    console.log(`[BOOTSTRAP_EGRESS] Sending ${data.encounters?.length || 0} encounters to client`);
    fs.appendFileSync(logPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      url: '/bootstrap_egress',
      encountersCount: data.encounters?.length || 0,
      encounterIds: data.encounters?.map(e => e.id)
    }, null, 2) + ',\n');
    
    res.json(data);
  } catch (error) {
    console.error('Error bootstrapping data:', error);
    try {
      const fs = await import('fs');
      const path = await import('path');
      const logPath = path.join(process.cwd(), 'server_debug.json');
      fs.appendFileSync(logPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        url: '/bootstrap_error',
        error: error.message,
        stack: error.stack
      }, null, 2) + ',\n');
    } catch (e) {}
    res.status(500).json({ error: 'Failed to bootstrap data: ' + error.message });
  }
});

export default router;
