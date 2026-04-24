import dotenv from 'dotenv';
// Heartbeat: 2026-04-09 04:35:00 UTC
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool, { testConnection, query } from './db/connection.js';

import { hashPassword, comparePassword, generateToken } from './services/auth.service.js';
import { authenticate, requireRole, requireTenant, requirePermission, restrictPatientAccess, getPermissions } from './middleware/auth.middleware.js';
import { evaluateAllFeatures, featureGate, moduleGate } from './middleware/featureFlag.middleware.js';
import * as repo from './db/repository.js';
import { createAuditLog, calculatePerformanceScore } from './db/repository.js';
import { sendTenantWelcomeEmail } from './services/mail.service.js';
import { ensureManagementPlaneInfrastructure } from './services/superadminMetrics.service.js';


// Route Imports
import superadminRoutes from './routes/superadmin.routes.js';
import superadminFixedRoutes from './routes/superadmin-fixed.routes.js';
import patientRoutes from './routes/patient.routes.js';
import encounterRoutes from './routes/encounter.routes.js';
import billingRoutes from './routes/billing.routes.js';
import pharmacyRoutes from './routes/pharmacy.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import infrastructureRoutes from './routes/infrastructure.routes.js';
import reportRoutes from './routes/report.routes.js';
import hrRoutes from './routes/hr.routes.js';
import insuranceRoutes from './routes/insurance.routes.js';
import masterRoutes from './routes/master.routes.js';
import communicationRoutes from './routes/communication.routes.js';
import laboratoryRoutes from './routes/laboratory.routes.js';
import documentRoutes from './routes/document.routes.js';
import supportRoutes from './routes/support.routes.js';
import ambulanceRoutes from './routes/ambulance.routes.js';
import bloodbankRoutes from './routes/bloodbank.routes.js';
import clinicalRoutes from './routes/clinical.routes.js';
import adminRoutes from './routes/admin.routes.js';
import aiRoutes from './routes/ai.routes.js';
import menuRoutes from './routes/menu.js';

const app = express();

// 1. ABSOLUTE TOP: Body Parser (Must be first to capture raw stream)
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  if (req.path.includes('/api/') && req.method === 'POST') {
    console.log(`[BODY_PARSED] ${new Date().toISOString()} | ${req.path}`);
  }
  next();
});

// 2. Traffic Logger & Preflight Unblocker
app.use((req, res, next) => {
  if (req.path.includes('/api/')) {
    console.log(`[NETWORK_PULSE] ${new Date().toISOString()} | ${req.method} ${req.path}`);
    
    // Explicit Preflight Handling for E2E Stability
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id');
      return res.status(200).send();
    }

    // Provisioning routes deploy 55+ SQL statements — they need more time
    const isProvisioningRoute = req.method === 'POST' && req.path.includes('/superadmin/tenants');
    const watchdogMs = isProvisioningRoute ? 180000 : 120000; // 3min for provisioning, 2min for standard

    // Prevent ERR_HTTP_HEADERS_SENT crashes if route finishes AFTER watchdog fires
    const originalJson = res.json;
    res.json = function(body) {
      if (!res.headersSent) {
        return originalJson.call(this, body);
      }
      console.warn(`[WATCHDOG_INTERCEPT] Prevented late response crash on ${req.method} ${req.path}`);
      return this;
    };

    const timeout = setTimeout(() => {
       if (!res.headersSent) {
          console.error(`[CRITICAL_HANG] Request stuck for ${watchdogMs/1000}s: ${req.method} ${req.path}`);
          res.status(503).json({ error: 'Backend Pipeline Deadlock (Watchdog)' });
       }
    }, watchdogMs);
    
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
  }
  next();
});

const PORT = process.env.PORT || 4005;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Routes
app.use('/api/superadmin', superadminRoutes);
app.use('/api/superadmin', superadminFixedRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/encounters', encounterRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api', infrastructureRoutes); // Fixed: Frontend calls /api/wards, not /api/infrastructure/wards
app.use('/api/reports', reportRoutes);
app.use('/api', hrRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api', masterRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/laboratory', laboratoryRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/blood-bank', bloodbankRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/menu', menuRoutes);

app.get('/api/version', (req, res) => res.json({ version: '1.5.0-MODULAR-FINAL' }));

try {
  // Robust check: Render or other environments might call the script in different ways.
  const currentFilePath = fileURLToPath(import.meta.url);
  const isDirectRun =
    process.argv[1] === currentFilePath ||
    process.argv[1]?.endsWith('server/index.js') ||
    process.argv[1]?.endsWith('server\\index.js') ||
    !!process.env.RENDER;

  // Test database connection on startup
  await testConnection();

  async function ensureTenantColumns() {
    try {
      const tableCheck = await query("SELECT to_regclass('emr.tenants') as exists");
      if (tableCheck.rows[0]?.exists) {
        const checkSql = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'emr' AND table_name = 'tenants'
        `;
        const res = await query(checkSql);
        const columns = res.rows.map(r => r.column_name);
        const missing = [];
        if (!columns.includes('logo_url')) missing.push('ADD COLUMN logo_url TEXT');
        if (!columns.includes('status')) missing.push('ADD COLUMN status VARCHAR(32) DEFAULT \'active\'');
        if (!columns.includes('theme')) missing.push('ADD COLUMN theme JSONB DEFAULT \'{}\'');
        if (!columns.includes('features')) missing.push('ADD COLUMN features JSONB DEFAULT \'{}\'');
        if (!columns.includes('billing_config')) missing.push('ADD COLUMN billing_config JSONB DEFAULT \'{}\'');
        
        if (missing.length > 0) {
          await query(`ALTER TABLE emr.tenants ${missing.join(', ')}`);
        }
      }
    } catch (err) {
      console.warn('[SCHEMA_FIX] Failed to verify tenant columns:', err.message);
    }
  }

  async function ensureGlobalRoles() {
    try {
      // Create master emr.roles and emr.users to stabilize system logic
      await query(`
        CREATE TABLE IF NOT EXISTS emr.roles (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id uuid,
            name text NOT NULL,
            description text,
            is_system boolean DEFAULT false,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            UNIQUE(tenant_id, name)
        );
      `);
      await query(`
        CREATE TABLE IF NOT EXISTS emr.users (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id uuid,
            email text NOT NULL UNIQUE,
            password_hash text NOT NULL,
            name text NOT NULL,
            role text,
            role_id uuid,
            is_active boolean DEFAULT true,
            created_at timestamp with time zone DEFAULT now()
        );
      `);
      
      // Seed fallback default roles on master plane without explicit tenant_id (hence nullable)
      await query(`
        INSERT INTO emr.roles (name, description, is_system) VALUES 
        ('Admin', 'Global System Admin', true),
        ('Doctor', 'Clinical Staff', true),
        ('Nurse', 'Nursing Staff', true)
        ON CONFLICT DO NOTHING;
      `);
    } catch(err) {
      console.warn('[SCHEMA_FIX] Failed to align emr.roles/users plane:', err.message);
    }
  }

  // Global initialization Logic (Silent Boot)
  (async () => {
    try {
       await ensureTenantColumns();
       await ensureGlobalRoles();
       ensureManagementPlaneInfrastructure().catch(err => {
         console.warn('⚠️ [STARTUP] Management plane setup deferred:', err.message);
       });
       console.log('🚀 [STARTUP] Multi-Tenant Orchestrator initialized.');
    } catch (err) {
       console.warn('⚠️ [STARTUP_WARNING] Initialization sequence failed:', err.message);
    }
  })();

  if (isDirectRun) {
    // Handle 404 for API routes specifically
    app.all('/api/*', (req, res) => {
      res.status(404).json({ error: 'API route not found' });
    });

    const clientDistPath = path.join(__dirname, '../client/dist');
    const rootDistPath = path.join(__dirname, '../dist');
    const frontendDistPath = fs.existsSync(clientDistPath) ? clientDistPath : rootDistPath;

    app.use(express.static(frontendDistPath));
    app.get('*', (req, res) => {
      if (req.url.startsWith('/api/')) return res.status(404).json({ error: 'API not found' });
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 [BACKEND_READY] v1.5.7-STATE-SYNC | Port ${PORT}`);
    });
  }

  const errorHandler = (err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  };

  app.use(errorHandler);

} catch (bootstrapError) {
  console.error('❌ [BOOTSTRAP_CRITICAL_ERROR]', bootstrapError);
  process.exit(1);
}

export { app };
export default app;

