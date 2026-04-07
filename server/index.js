import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { testConnection, query } from './db/connection.js';
import { hashPassword, comparePassword, generateToken } from './services/auth.service.js';
import { authenticate, requireRole, requireTenant, requirePermission, restrictPatientAccess, getPermissions } from './middleware/auth.middleware.js';
import { evaluateAllFeatures, featureGate, moduleGate } from './middleware/featureFlag.middleware.js';
import * as repo from './db/repository.js';
import { createAuditLog, calculatePerformanceScore } from './db/repository.js';
import { sendTenantWelcomeEmail } from './services/mail.service.js';
import { ensureManagementPlaneInfrastructure } from './services/superadminMetrics.service.js';
import { runAutoMigration } from './auto_migrate.js';

// Route Imports
import superadminRoutes from './routes/superadmin.routes.js';
// import pharmacyRoutes from './routes/pharmacy.routes.js'; // Not found in routes dir
import aiRoutes from './routes/ai.routes.js';

const app = express();

app.get('/api/debug-patients-schema', async (req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM nah.patients LIMIT 1`);
    res.json({ ok: true, patient: rows[0] });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});
const PORT = process.env.PORT || 4001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/superadmin', superadminRoutes);

app.get('/api/version', (req, res) => res.json({ version: '1.0.6-ISOLATED' }));

app.get('/api/debug-db', async (req, res) => {
  try {
    const { query } = await import('./db/connection.js');
    let output = {};
    const tenantsRes = await query('SELECT id, code, schema_name FROM emr.management_tenants');
    output.tenants = tenantsRes.rows;
    for (const t of tenantsRes.rows) {
      if (['NAH', 'EHS', 'KCH'].includes(t.code)) {
        const schema = t.schema_name;
        output[schema] = {};
        try {
          const userRes = await query('SELECT role, count(*) FROM emr.users WHERE tenant_id = $1 GROUP BY role', [t.id]);
          output[schema].users = userRes.rows;
          
          const tables = await query(`SELECT table_name FROM information_schema.tables WHERE table_schema = $1`, [schema]);
          output[schema].tables = [];
          
          for (const tbl of tables.rows) {
             const cols = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`, [schema, tbl.table_name]);
             output[schema].tables.push({
               table: tbl.table_name,
               columns: cols.rows
             });
          }
        } catch (e) {
          output[schema].error = e.message;
        }
      }
    }
    res.json(output);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/seed-v2', async (req, res) => {
  try {
    const tenantsRes = await query("SELECT id, code, subdomain FROM emr.tenants WHERE status = 'active'");
    const logs = [];
    
    for (const tenant of tenantsRes.rows) {
      const schema = tenant.code.toLowerCase();
      const legacyId = tenant.id;
      
      // Attempt to find the management plane ID to prevent drift
      let managementId = legacyId;
      try {
        const mgmtRes = await query("SELECT id FROM emr.management_tenants WHERE code = $1", [tenant.code]);
        if (mgmtRes.rows.length > 0) {
          managementId = mgmtRes.rows[0].id;
          logs.push(`Found management ID for ${tenant.code}: ${managementId}`);
        }
      } catch (e) {
        logs.push(`Management plane check failed for ${tenant.code}: ${e.message}`);
      }
      
      // Choose the ID that is most likely to be in the User JWT
      // Usually, the app prefers managementId if available
      const activeId = managementId;

      const roles = [
        { email: `doctor1@${schema}.com`, name: 'Dr. Ryan Cardiologist', role: 'Doctor' },
        { email: `nurse1@${schema}.com`, name: 'Nurse Joy', role: 'Nurse' },
        { email: `admin1@${schema}.com`, name: 'Admin One', role: 'Admin' }
      ];
      
      const DB_PASSWORD_HASH = '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC'; // admin123
      
      for (const r of roles) {
        // Seed user with BOTH IDs to be safe
        await query(`INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active) 
                    VALUES ($1, $2, $3, $4, $5, true) 
                    ON CONFLICT (tenant_id, email) DO NOTHING`, [activeId, r.email, DB_PASSWORD_HASH, r.name, r.role]);
        
        if (legacyId !== activeId) {
          await query(`INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active) 
                      VALUES ($1, $2, $3, $4, $5, true) 
                      ON CONFLICT (tenant_id, email) DO NOTHING`, [legacyId, r.email, DB_PASSWORD_HASH, r.name, r.role]);
        }
      }
      
      await query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      await query(`CREATE TABLE IF NOT EXISTS "${schema}".patients (LIKE emr.patients INCLUDING ALL)`);
      await query(`CREATE TABLE IF NOT EXISTS "${schema}".appointments (LIKE emr.appointments INCLUDING ALL)`);
      await query(`CREATE TABLE IF NOT EXISTS "${schema}".encounters (LIKE emr.encounters INCLUDING ALL)`);
      await query(`CREATE TABLE IF NOT EXISTS "${schema}".invoices (LIKE emr.invoices INCLUDING ALL)`);
      await query(`CREATE TABLE IF NOT EXISTS "${schema}".service_requests (LIKE emr.service_requests INCLUDING ALL)`);
      
      for(let i=1; i<=15; i++) {
        const mrn = `${tenant.code}-PT-00${i}`;
        const patientEmail = `pt${i}@${schema}.com`;
        
        try {
          // Insert with BOTH legacy and active IDs for maximum visibility
          await query(`INSERT INTO "${schema}".patients (tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, created_at) 
                      VALUES ($1, $2, 'Patient', $3, '1980-01-01', 'Male', '555-0000', $4, CURRENT_DATE) 
                      ON CONFLICT (tenant_id, mrn) DO NOTHING`, [activeId, mrn, i, patientEmail]);
          
          const ptRes = await query(`SELECT id FROM "${schema}".patients WHERE mrn = $1 AND tenant_id = $2`, [mrn, activeId]);
          if (ptRes.rows.length > 0) {
            const pId = ptRes.rows[0].id;
            const uniqueInvStr = `INV-${i}-${Date.now().toString().slice(-4)}`;
            
            await query(`INSERT INTO "${schema}".appointments (tenant_id, patient_id, scheduled_start, scheduled_end, status, created_at) 
                        VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'completed', CURRENT_TIMESTAMP)`, [activeId, pId]);
            
            await query(`INSERT INTO "${schema}".encounters (tenant_id, patient_id, encounter_type, visit_date, status) 
                        VALUES ($1, $2, 'OPD', CURRENT_DATE, 'closed')`, [activeId, pId]);
            
            await query(`INSERT INTO "${schema}".invoices (tenant_id, patient_id, invoice_number, total, paid, status) 
                        VALUES ($1, $2, $3, 1500, 1500, 'paid') ON CONFLICT DO NOTHING`, [activeId, pId, uniqueInvStr]);
            
            // Add some Service Requests for "Critical Alerts"
            if (i % 5 === 0) {
              await query(`INSERT INTO "${schema}".service_requests (tenant_id, patient_id, category, intent, status, notes, created_at) 
                          VALUES ($1, $2, 'lab', 'order', 'pending', '{"criticalFlag": "true"}', CURRENT_TIMESTAMP)`, [activeId, pId]);
            }
          }
        } catch(e) {
          logs.push(`Patient insertion error for pt ${i}: ${e.message}`);
        }
      }
    }
    res.json({ success: true, message: "Advanced Seeding Completed", logs });
  } catch(e) {
    res.json({ error: e.message });
  }
});

app.get('/api/admin/audit-all-shards', async (req, res) => {
  try {
    const { query } = await import('./db/connection.js');
    const logs = [];
    
    // Check known schemas (Dynamic Discovery)
    const { rows: schemasRes } = await query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'emr')");
    const schemas = ['emr', ...schemasRes.map(r => r.schema_name)];
    const results = {};
    
    for (const sc of schemas) {
      try {
        const pRes = await query(`SELECT count(*) FROM ${sc}.patients`);
        results[`${sc}_patients`] = pRes.rows[0].count;
      } catch(e) { results[`${sc}_patients`] = 'N/A'; }
      
      try {
        const uRes = await query(`SELECT count(*) FROM ${sc}.users`);
        results[`${sc}_users`] = uRes.rows[0].count;
      } catch(e) { results[`${sc}_users`] = 'N/A'; }
    }

    // Check Management Plane
    try {
      const mtRes = await query('SELECT count(*) FROM emr.management_tenants');
      results.management_tenants = mtRes.rows[0].count;
      const msRes = await query('SELECT count(*) FROM emr.management_dashboard_summary WHERE summary_key = \'global\'');
      results.management_summary = msRes.rows;
    } catch(e) { results.management_plane_error = e.message; }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/check-nah', async (req, res) => {
  try {
    const tenantId = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'; 
    const nahCount = await query('SELECT count(*) FROM nah.patients').catch(() => ({ rows: [{count: 'N/A'}]}));
    const dotNahCount = await query('SELECT count(*) FROM "nah.healthezee.com".patients').catch(() => ({ rows: [{count: 'N/A'}]}));
    const mgmtSchema = await query("SELECT schema_name FROM emr.management_tenants WHERE id = $1", [tenantId]);
    
    res.json({
      nah_simple_count: nahCount.rows[0].count,
      nah_dot_count: dotNahCount.rows[0].count,
      registry_schema_name: mgmtSchema.rows[0].schema_name
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// Robust check: Render or other environments might call the script in different ways.
const currentFilePath = fileURLToPath(import.meta.url);
const isDirectRun =
  process.argv[1] === currentFilePath ||
  process.argv[1]?.endsWith('server/index.js') ||
  !!process.env.RENDER; // Force listen if on Render

// Test database connection on startup
await testConnection();

async function verifyFeatureFlagSchema() {
  try {
    const result = await query(`
      SELECT
        to_regclass('emr.tenant_features') AS tenant_features,
        to_regclass('emr.global_kill_switches') AS global_kill_switches,
        to_regclass('emr.tenant_feature_status') AS tenant_feature_status
    `);
    const row = result.rows[0] || {};
    const missing = [];
    if (!row.tenant_features) missing.push('emr.tenant_features');
    if (!row.global_kill_switches) missing.push('emr.global_kill_switches');
    if (!row.tenant_feature_status) missing.push('emr.tenant_feature_status');

    if (missing.length) {
      console.warn(`[FEATURE_FLAGS] Missing schema objects: ${missing.join(', ')}. Feature flags may not work as expected.`);
    } else {
      console.log('[FEATURE_FLAGS] Schema check passed.');
    }
  } catch (error) {
    console.warn('[FEATURE_FLAGS] Schema check failed:', error.message);
  }
}

// Startup handled in global initialization block below

async function ensureTenantColumns() {
  try {
    // Check if emr.tenants exists
    const tableCheck = await query("SELECT to_regclass('emr.tenants') as exists");
    if (!tableCheck.rows[0].exists) {
      console.warn('[SCHEMA_FIX] emr.tenants table missing. Attempting to create foundational structure.');
      await query(`
         CREATE TABLE IF NOT EXISTS emr.tenants (
           id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
           name text NOT NULL,
           code varchar(32) NOT NULL UNIQUE,
           subdomain varchar(128) NOT NULL UNIQUE,
           status varchar(16) DEFAULT 'active',
           created_at timestamptz DEFAULT now()
         )
       `);
    }

    // Check for missing columns in emr.tenants
    const checkSql = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'emr' AND table_name = 'tenants'
    `;
    const res = await query(checkSql);
    const columns = res.rows.map(r => r.column_name);
    const missing = [];
    if (!columns.includes('logo_url')) missing.push('ADD COLUMN logo_url TEXT');
    if (!columns.includes('contact_email')) missing.push('ADD COLUMN contact_email VARCHAR(255)');
    if (!columns.includes('status')) missing.push('ADD COLUMN status VARCHAR(32) DEFAULT \'active\'');
    if (!columns.includes('subscription_tier')) missing.push('ADD COLUMN subscription_tier VARCHAR(32) DEFAULT \'Professional\'');
    if (!columns.includes('billing_config')) missing.push('ADD COLUMN billing_config JSONB DEFAULT \'{}\'::JSONB');
    if (!columns.includes('theme')) missing.push('ADD COLUMN theme JSONB DEFAULT \'{}\'::JSONB');
    if (!columns.includes('features')) missing.push('ADD COLUMN features JSONB DEFAULT \'{}\'::JSONB');

    if (missing.length > 0) {
      console.log(`[SCHEMA_FIX] Synchronizing emr.tenants structure: ${missing.length} columns`);
      const alterSql = `ALTER TABLE emr.tenants ${missing.join(', ')}`;
      await query(alterSql);
    }

    // Also ensure patients table exists for the count subquery
    await query("CREATE TABLE IF NOT EXISTS emr.patients (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid REFERENCES emr.tenants(id), created_at timestamptz DEFAULT now())");

  } catch (err) {
    console.warn('[SCHEMA_FIX] Failed to verify/fix tenant columns:', err.message);
  }
}

// Global initialization Logic (Silent Boot)
(async () => {
  try {
     console.log('🚀 [STARTUP] Multi-Tenant Node initialized. (Background sync active)');
     await ensureTenantColumns();
     // Create management plane tables (non-blocking)
     ensureManagementPlaneInfrastructure().then(() => {
       console.log('✅ [STARTUP] Management plane tables ready');
     }).catch(err => {
       console.warn('⚠️ [STARTUP] Management plane setup deferred:', err.message);
     });
  } catch (err) {
     console.warn('⚠️ [STARTUP_WARNING] Basic schema check failed:', err.message);
  }
})();

// =====================================================
// PUBLIC ROUTES (No authentication required)
// =====================================================

app.get('/api/health', async (_req, res) => {
  const dbStatus = await testConnection();
  res.json({
    ok: true,
    service: 'emr-api',
    version: '2.0.1',
    database: dbStatus ? 'connected' : 'ERROR',
    env: process.env.NODE_ENV,
    now: new Date().toISOString()
  });
});

app.post('/api/login', async (req, res) => {
  try {
    const { tenantId, email, password } = req.body;
    console.log(`[LOGIN_DEBUG] Attempting login: tenantId=${tenantId}, email=${email}`);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user;

    // Handle superadmin login
    if (tenantId === 'superadmin') {
      user = await repo.getUserByEmail(email, null);

      if (!user || user.role.toLowerCase() !== 'superadmin') {
        return res.status(401).json({ error: 'Invalid superadmin credentials' });
      }

      const isValidPassword = await comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Normalize role for consistency
      const normalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
      const finalRole = normalizedRole === 'Hr' ? 'HR' : normalizedRole;

      // Handle 2FA if enabled
      if (user.is_2fa_enabled) {
        const challengeId = `mfa_${Math.random().toString(36).substr(2, 9)}`;
        // In a real app, send OTP here via notify.sendNotification
        console.log(`[MFA_CHALLENGE] Sending OTP for user ${user.email}`);

        return res.json({
          mfaRequired: true,
          challengeId,
          method: 'SMS',
          recipient: '***-***-1234' // Placeholder for UI
        });
      }

      const token = generateToken({
        userId: user.id,
        tenantId: null,
        role: finalRole,
        email: user.email,
      });

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: finalRole,
        },
        tenantId: null,
        role: finalRole,
      });
    }

    // Handle tenant user login
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required for tenant login' });
    }

    let resolvedTenantId = tenantId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (tenantId === 'superadmin') {
      resolvedTenantId = null;
    } else if (!uuidRegex.test(tenantId)) {
      const tenant = await repo.getTenantByCode(tenantId);
      if (!tenant) {
        console.log(`[LOGIN] Invalid tenant code: ${tenantId}`);
        return res.status(400).json({ error: 'Invalid tenant' });
      }
      resolvedTenantId = tenant.id;
    }

    user = await repo.getUserByEmail(email, resolvedTenantId);

    if (!user) {
      console.log(`❌ [AUTH_FAIL] User not found: ${email} for tenant: ${resolvedTenantId}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      console.log(`❌ [AUTH_FAIL] User inactive: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      console.log(`❌ [AUTH_FAIL] Invalid password attempt for: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`✅ [AUTH_SUCCESS] User verified: ${email} (Role: ${user.role})`);

    await repo.updateUserLastLogin(user.id);
    await repo.createAuditLog({
      tenantId: user.tenant_id,
      userId: user.id,
      userName: user.name,
      action: 'auth.login',
    });

    // Normalize role for consistency
    const normalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
    // Special handling for multi-word roles
    const finalRole = normalizedRole === 'Front office'
      ? 'Front Office'
      : (normalizedRole === 'Support staff'
        ? 'Support Staff'
        : (normalizedRole === 'Hr' ? 'HR' : normalizedRole));

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: finalRole,
      email: user.email,
      patientId: user.patient_id,
    });

    let rolePermissions = [];
    try {
      const allPermissions = getPermissions();
      rolePermissions = allPermissions[finalRole] || [];
      const roleResult = await query(
        `SELECT rp.permission 
         FROM emr.role_permissions rp
         JOIN emr.roles r ON rp.role_id = r.id
         WHERE r.name = $1 AND (r.tenant_id = $2 OR r.is_system = true)`,
        [finalRole, user.tenant_id]
      );
      if (roleResult.rows.length > 0) {
        rolePermissions = roleResult.rows.map(r => r.permission);
      }
    } catch (err) {
      console.warn('Failed to resolve dynamic role permissions:', err.message);
    }

    let featureFlags = null;
    try {
      const { getFeatureFlagStatus } = await import('./services/featureFlag.service.js');
      featureFlags = await getFeatureFlagStatus(user.tenant_id);
    } catch (err) {
      console.warn('Failed to load feature flags at login:', err.message);
    }

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: finalRole,
        patientId: user.patient_id,
      },
      tenantId: user.tenant_id,
      role: finalRole,
      permissions: { [finalRole]: rolePermissions },
      featureFlags,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: typeof error === 'string' ? error : error.message, detail: error.message, stack: error.stack?.split('\n').slice(0, 3) });
  }
});



// DEBUG TOKEN (Diagnostic only)
// =====================================================

app.get('/api/debug-token', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ error: 'Token query param required' });

    // Directly use the utility functions
    const { verifyToken, decodeToken } = (await import('./services/auth.service.js'));
    const decoded = decodeToken(token);

    let verified = false;
    let verifyError = null;
    try {
      verifyToken(token);
      verified = true;
    } catch (e) {
      verifyError = e.message;
    }

    let userInDb = null;
    if (decoded?.userId) {
      const result = await query('SELECT id, email, role, is_active FROM emr.users WHERE id = $1', [decoded.userId]);
      userInDb = result.rows[0];
    }

    res.json({
      tokenProvided: !!token,
      decoded,
      verified,
      verifyError,
      userInDb,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasSecret: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// PUBLIC ROUTES (for login page)
// =====================================================

app.get('/api/tenants', async (_req, res) => {
  try {
    const tenants = await repo.getTenants();
    if (tenants.length > 1) {
      console.log('DEBUG: Second tenant ID type:', typeof tenants[1].id);
      console.log('DEBUG: Second tenant ID value:', tenants[1].id);
    }
    res.json(tenants);
  } catch (error) {
    console.error('❌ [FATAL_TENANT_LOAD_ERROR]:', {
      message: error.message,
      stack: error.stack,
      hint: 'Check if emr schema or tenants table was affected by recent migrations'
    });
    res.status(500).json({ error: 'Failed to fetch tenants: ' + error.message });
  }
});

// =====================================
// MFA VERIFICATION ENDPOINT
// =====================================
app.post('/api/login/mfa-verify', async (req, res) => {
  try {
    const { challengeId, otp, email, tenantId } = req.body;

    // Demo verification logic: any 6-digit code works for demonstration
    if (!otp || otp.length !== 6) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    // Resolve user again
    const user = await repo.getUserByEmail(email, tenantId === 'superadmin' ? null : tenantId);
    if (!user) return res.status(401).json({ error: 'Session expired' });

    const normalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
    const finalRole = normalizedRole === 'Hr' ? 'HR' : normalizedRole;

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: finalRole,
      email: user.email,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: finalRole,
      },
      tenantId: user.tenant_id,
      role: finalRole,
    });
  } catch (error) {
    res.status(500).json({ error: 'MFA Verification failed' });
  }
});

// =====================================================
// PROTECTED ROUTES (Authentication required)
// =====================================================

// Apply authentication to all /api routes below this point
app.use('/api', authenticate);

// Apply feature flag evaluation to all authenticated routes
app.use('/api', evaluateAllFeatures);

// Pharmacy microservice routes
// app.use('/api/pharmacy/v1', requireTenant, pharmacyRoutes);
app.use('/api/ai/v1', requireTenant, aiRoutes);

app.post('/api/tenants', requireRole('Superadmin'), async (req, res) => {
  try {
    const { name, code, subdomain, contactEmail, primaryColor, accentColor, subscriptionTier } = req.body;

    if (!name || !code || !subdomain || !contactEmail) {
      return res.status(400).json({ error: 'name, code, subdomain, and contactEmail are required' });
    }

    const theme = {
      primary: primaryColor || '#0f5a6e',
      accent: accentColor || '#f57f17',
    };

    // 1. Create the tenant record
    const tenant = await repo.createTenant({ name, code, subdomain, contactEmail, theme });

    // 2. Automate Schema Provisioning (Isolated clinical data plane)
    const provisioningResult = await repo.provisionTenantSchema(tenant.id, code.toLowerCase());
    console.log(`[PROVISIONING] Result for ${code}:`, provisioningResult.success ? 'SUCCESS' : 'FAILED');

    // 3. Apply subscription tier if provided
    if (subscriptionTier && ['Free', 'Basic', 'Professional', 'Enterprise'].includes(subscriptionTier)) {
      await repo.setTenantTier(tenant.id, subscriptionTier);
      tenant.subscription_tier = subscriptionTier;
    }

    // 3. Create Default Administrator User for the new tenant
    // IMPLEMENTED: Default password "Medflow@2026"
    const defaultPassword = "Medflow@2026";
    const passwordHash = await hashPassword(defaultPassword);

    const adminLoginEmail = `admin@${subdomain}.com`;

    const adminUser = await repo.createUser({
      tenantId: tenant.id,
      email: adminLoginEmail,
      passwordHash,
      name: `${name} Administrator`,
      role: 'Admin',
    });

    // 4. Dispatch Activation Email
    const mailResult = await sendTenantWelcomeEmail(
      contactEmail,
      name,
      subdomain,
      { email: adminLoginEmail, password: defaultPassword }
    ).catch(e => {
      console.error('Email sending failed:', e.message);
      return { success: false };
    });

    await repo.createAuditLog({
      tenantId: tenant.id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'tenant.create',
      entityName: 'tenant',
      entityId: tenant.id,
      details: {
        code,
        schemaName: code.toLowerCase(),
        provisioningStatus: provisioningResult.success ? 'success' : 'failed',
        provisioningLog: provisioningResult.log,
        subscriptionTier: subscriptionTier || 'Basic',
        adminProvisioned: !!adminUser,
        emailStatus: mailResult?.success ? 'sent' : 'failed',
        defaultPassword: "Medflow@2026"
      },
    });

    res.status(201).json({
      ...tenant,
      adminProvisioned: true,
      emailSent: mailResult?.success || false,
      adminLoginEmail,
      defaultPassword: "Medflow@2026"
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    if (error.constraint || error.code === '23505') {
      return res.status(409).json({ error: 'Tenant code or subdomain already exists.' });
    }
    res.status(500).json({ error: 'Failed to create tenant: ' + error.message });
  }
});

/**
 * Superadmin endpoint to reset a tenant user's password
 */
app.post('/api/admin/tenants/:id/reset-password', authenticate, requireRole('Superadmin'), async (req, res) => {
  try {
    const { id: tenantId } = req.params;
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'email and newPassword are required' });
    }

    const existingUser = await repo.getUserByEmail(email, tenantId);
    if (!existingUser) {
      return res.status(404).json({ error: 'No user found with this email for the selected tenant' });
    }

    const passwordHash = await hashPassword(newPassword);

    await query(
      'UPDATE emr.users SET password_hash = $1 WHERE email = $2 AND tenant_id = $3',
      [passwordHash, email.toLowerCase(), tenantId]
    );

    await repo.createAuditLog({
      tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'user.password_reset',
      entityName: 'user',
      entityId: existingUser.id,
      details: { email, resetBy: req.user.email },
    });

    res.json({ success: true, message: `Password reset successfully for ${existingUser.name}` });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password: ' + error.message });
  }
});

/**
 * Superadmin endpoint to manually provision a tenant admin
 */
app.post('/api/admin/tenants/:id/provision-admin', authenticate, requireRole('Superadmin'), async (req, res) => {
  try {
    const { id: tenantId } = req.params;
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    // Default password "Medflow@2026" if not provided
    const userPassword = password || "Medflow@2026";
    const passwordHash = await hashPassword(userPassword);

    // Check if user already exists
    const existingUser = await repo.getUserByEmail(email, tenantId);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists for this tenant' });
    }

    const user = await repo.createUser({
      tenantId,
      email,
      passwordHash,
      name,
      role: 'Admin',
    });

    await repo.createAuditLog({
      tenantId: req.user.id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'tenant.admin.provision',
      entityName: 'user',
      entityId: user.id,
      details: { email, role: 'Admin', provisionMode: 'manual_ui' },
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      defaultPassword: userPassword
    });
  } catch (error) {
    console.error('Error provisioning tenant admin:', error);
    res.status(500).json({ error: 'Failed to provision tenant admin: ' + error.message });
  }
});

app.put('/api/tenants/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    const tenant = await repo.updateTenantStatus(id, status);

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Error updating tenant status:', error);
    res.status(500).json({ error: 'Failed to update tenant status' });
  }
});

app.patch('/api/tenants/:id/settings', requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, primaryColor: newPrimaryColor, accentColor: newAccentColor, logo_url, featureInventory, featureTelehealth, subscriptionTier, billingConfig } = req.body;
 
     const theme = (newPrimaryColor || newAccentColor) ? {
       primary: newPrimaryColor,
       accent: newAccentColor,
     } : null;
 
     const features = (featureInventory !== undefined || featureTelehealth !== undefined) ? {
       inventory: Boolean(featureInventory),
       telehealth: Boolean(featureTelehealth),
     } : null;
 
     const tenant = await repo.updateTenantSettings({
       tenantId: id,
       displayName,
       theme,
       features,
       subscriptionTier,
       billingConfig,
       logo_url
     });


    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    await repo.createAuditLog({
      tenantId: id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'tenant.settings.update',
      entityName: 'tenant',
      entityId: id,
    });

    res.json(tenant);
  } catch (error) {
    console.error('[SETTINGS_UPDATE_ERROR] Full Error:', error);
    if (error.code) console.error('[SETTINGS_UPDATE_ERROR] DB Code:', error.code);
    if (error.detail) console.error('[SETTINGS_UPDATE_ERROR] DB Detail:', error.detail);

    res.status(500).json({
      error: 'Failed to update tenant settings',
      details: error.message,
      code: error.code
    });
  }
});

// =====================================================
// USERS
// =====================================================

app.get('/api/users', async (req, res) => {
  try {
    const { tenantId } = req.query;
    console.log('DEBUG: tenantId from query:', tenantId, 'Type:', typeof tenantId);
    const users = await repo.getUsers(tenantId || null);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', authenticate, requireTenant, requirePermission('users'), async (req, res) => {
  try {
    const { tenantId, name, email, role, patientId, password } = req.body;

    if (!tenantId || !name || !email || !role) {
      return res.status(400).json({ error: 'tenantId, name, email, and role are required' });
    }

    // Default password if not provided
    const userPassword = password || `${name.split(' ')[0]}@123`;
    const passwordHash = await hashPassword(userPassword);

    const user = await repo.createUser({
      tenantId,
      email,
      passwordHash,
      name,
      role,
      patientId: patientId || null,
    });

    await repo.createAuditLog({
      tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'user.create',
      entityName: 'user',
      entityId: user.id,
      details: { email, role },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.constraint === 'users_tenant_id_email_key') {
      return res.status(409).json({ error: 'Email already exists for this tenant' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// =====================================================
// FEATURE FLAGS
// =====================================================

app.get('/api/tenants/:id/features', requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { getFeatureFlagStatus } = await import('./services/featureFlag.service.js');
    const flags = await getFeatureFlagStatus(id);
    res.json(flags);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
});

// Admin endpoints for managing tenant-specific features (Superadmin only)
app.get('/api/admin/tenants/:id/features', authenticate, requireRole('Superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { getFeatureFlagStatus } = await import('./services/featureFlag.service.js');
    const flags = await getFeatureFlagStatus(id);
    res.json(flags);
  } catch (error) {
    console.error('Error fetching tenant features (admin):', error);
    res.status(500).json({ error: 'Failed to fetch tenant features' });
  }
});

app.patch('/api/admin/tenants/:id/tier', authenticate, requireRole('Superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;

    if (!tier) return res.status(400).json({ error: 'tier is required' });

    const { setTenantTier } = await import('./db/repository.js');
    const tenant = await setTenantTier(id, tier);

    await repo.createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'tenant.tier_update',
      entityName: 'tenant',
      entityId: id,
      details: { tier }
    });

    res.json(tenant);
  } catch (error) {
    console.error('Error updating tenant tier:', error);
    res.status(500).json({ error: 'Failed to update tier' });
  }
});

app.post('/api/admin/tenants/:id/features', authenticate, requireRole('Superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { featureFlag, enabled } = req.body;

    if (!featureFlag || typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'featureFlag and enabled are required' });
    }

    const { setTenantFeatureOverride } = await import('./db/repository.js');
    const override = await setTenantFeatureOverride(id, featureFlag, enabled);

    await repo.createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'tenant.feature_override',
      entityName: 'tenant',
      entityId: id,
      details: { featureFlag, enabled }
    });

    res.json(override);
  } catch (error) {
    console.error('Error updating tenant feature override:', error);
    res.status(500).json({ error: 'Failed to update feature override' });
  }
});


// Admin endpoints for managing kill switches (Superadmin only)
app.get('/api/admin/kill-switches', authenticate, requireRole('Superadmin'), async (req, res) => {
  try {
    const { getGlobalKillSwitches } = await import('./services/featureFlag.service.js');
    const killSwitches = await getGlobalKillSwitches();
    res.json(killSwitches);
  } catch (error) {
    console.error('Error fetching kill switches:', error);
    res.status(500).json({ error: 'Failed to fetch kill switches' });
  }
});

app.post('/api/admin/kill-switches', authenticate, requireRole('Superadmin'), async (req, res) => {
  try {
    const { featureFlag, enabled, reason } = req.body;

    if (!featureFlag || typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'featureFlag and enabled are required' });
    }

    const { setGlobalKillSwitch } = await import('./services/featureFlag.service.js');
    const success = await setGlobalKillSwitch(featureFlag, enabled, req.user.id, reason);

    if (!success) {
      return res.status(500).json({ error: 'Failed to update kill switch' });
    }

    await repo.createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'kill_switch.update',
      entityName: 'feature_flag',
      entityId: featureFlag,
      details: { enabled, reason }
    });

    res.json({ message: 'Kill switch updated successfully', featureFlag, enabled });
  } catch (error) {
    console.error('Error updating kill switch:', error);
    res.status(500).json({ error: 'Failed to update kill switch' });
  }
});

// Subscription Catalog Management
app.get('/api/admin/subscription-catalog', authenticate, requireRole('Superadmin'), async (req, res) => {
  try {
    const { rows: catalog } = await query('SELECT * FROM emr.management_subscriptions WHERE is_active = true ORDER BY created_at');
    
    // Map database fields to frontend expected ones
    const mappedCatalog = catalog.map(plan => ({
      id: plan.tier,
      name: plan.plan_name,
      displayName: plan.plan_name,
      description: `Support tier for ${plan.tier} node deployments`,
      price: plan.price,
      features: Array.isArray(plan.features) ? plan.features : [],
      color: plan.tier === 'free' ? '#6b7280' : 
             plan.tier === 'basic' ? '#6366f1' : 
             plan.tier === 'professional' ? '#10b981' : '#f43f5e',
      icon: plan.tier === 'free' ? '🩺' : 
            plan.tier === 'basic' ? '⭐' : 
            plan.tier === 'professional' ? 'Zap' : 'Rocket',
      tier: plan.tier,
      limit_users: plan.limit_users
    }));

    res.json(mappedCatalog);
  } catch (error) {
    console.error('Error fetching subscription catalog:', error);
    res.status(500).json({ error: 'Failed to fetch subscription catalog' });
  }
});

app.post('/api/admin/subscription-catalog', authenticate, requireRole('Superadmin'), async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.tier) {
      return res.status(400).json({ error: 'Subscription tier is required' });
    }

    const { query } = await import('./db/connection.js');
    await query(`
      INSERT INTO emr.management_subscriptions (tier, plan_name, price, features, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (id) DO UPDATE SET 
        plan_name = EXCLUDED.plan_name,
        price = EXCLUDED.price,
        features = EXCLUDED.features,
        updated_at = NOW()
    `, [
      subscription.tier || subscription.id,
      subscription.name || subscription.displayName,
      subscription.price,
      JSON.stringify(subscription.features || [])
    ]);

    res.json({
      message: 'Subscription shard updated successfully',
      subscription
    });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

app.post('/api/admin/apply-subscription-bundle', requireRole('Superadmin'), async (req, res) => {
  try {
    const { subscriptionId, features } = req.body;

    if (!subscriptionId || !features) {
      return res.status(400).json({ error: 'subscriptionId and features are required' });
    }

    // Get all tenants
    const tenants = await repo.getTenants();

    let updatedCount = 0;

    for (const tenant of tenants) {
      // Update tenant subscription tier based on the bundle
      await repo.updateTenantSettings({
        tenantId: tenant.id,
        subscriptionTier: subscriptionId
      });

      // Clear existing custom features and add the bundle features
      await query(`
        DELETE FROM emr.tenant_features 
        WHERE tenant_id = $1
      `, [tenant.id]);

      // Insert new features from the bundle
      for (const feature of features) {
        await query(`
          INSERT INTO emr.tenant_features (tenant_id, feature_flag, enabled, created_at, updated_at)
          VALUES ($1, $2, true, NOW(), NOW())
        `, [tenant.id, feature]);
      }

      updatedCount++;
    }

    await repo.createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'subscription_bundle.apply',
      entityName: 'subscription',
      entityId: subscriptionId,
      details: {
        features,
        tenantsUpdated: updatedCount,
        tenantIds: tenants.map(t => t.id)
      }
    });

    res.json({
      success: true,
      message: `Subscription bundle applied to ${updatedCount} tenants`,
      tenantsUpdated: updatedCount
    });
  } catch (error) {
    console.error('Error applying subscription bundle:', error);
    res.status(500).json({ error: 'Failed to apply subscription bundle' });
  }
});

// =====================================================
// BOOTSTRAP (Initial data load for frontend)
// =====================================================

app.get('/api/bootstrap', requireTenant, async (req, res) => {
  try {
    const { userId } = req.query;
    const data = await repo.getBootstrapData(req.tenantId, userId || req.user.id);
    res.json(data);
  } catch (error) {
    console.error('Error fetching bootstrap data:', error);
    res.status(500).json({ error: 'Failed to fetch bootstrap data' });
  }
});

// =====================================================
// REPORTS
// =====================================================

app.get('/api/reports/summary/:id', authenticate, requireTenant, async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure user has access to this tenant's reports
    if (req.user.role !== 'Superadmin' && req.tenantId !== id) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

    const summary = await repo.getReportSummary(id);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching report summary:', error);
    res.status(500).json({ error: 'Failed to fetch report summary' });
  }
});

// =====================================================
// SUPERADMIN
// =====================================================

app.get('/api/superadmin/overview', authenticate, requireRole('Superadmin'), async (_req, res) => {
  try {
    const overview = await repo.getSuperadminOverview();
    res.json(overview);
  } catch (error) {
    console.error('Error fetching superadmin overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

app.post('/api/superadmin/sync-metrics', authenticate, requireRole('Superadmin'), async (_req, res) => {
  try {
    const { ensureManagementPlaneInfrastructure } = await import('./services/superadminMetrics.service.js');
    await ensureManagementPlaneInfrastructure();
    await query('SELECT emr.refresh_all_management_tenant_metrics()');
    const overview = await repo.getSuperadminOverview();
    res.json({ success: true, overview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import { getRealtimeDashboardMetrics } from './enhanced_dashboard_metrics_fixed.mjs';

// =====================================================
// DASHBOARD METRICS
// =====================================================

app.get('/api/dashboard/metrics', authenticate, requireTenant, requirePermission('dashboard'), async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const { timeFilter = 'daily' } = req.query;

    // Get real-time metrics from enhanced dashboard module
    const metrics = await getRealtimeDashboardMetrics(tenantId);

    // Total Patients count (all time)
    const trueTotalPatients = await query(`SELECT COUNT(*)::int as count FROM patients WHERE tenant_id = $1`, [tenantId]).catch(() => ({ rows: [{ count: 0 }] }));
    const trueTotalAppointments = await query(`SELECT COUNT(*)::int as count FROM appointments WHERE tenant_id = $1`, [tenantId]).catch(() => ({ rows: [{ count: 0 }] }));
    const trueTotalRevenue = await query(`SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE tenant_id = $1 AND status = 'paid'`, [tenantId]).catch(() => ({ rows: [{ total: 0 }] }));

    const totalPatients = parseInt(trueTotalPatients.rows[0]?.count || 0);
    const totalAppointments = parseInt(trueTotalAppointments.rows[0]?.count || 0);
    const totalRevenue = parseFloat(trueTotalRevenue.rows[0]?.total || 0);

    // Helper for safe query execution inside this route
    const safeQuery = async (q, p) => {
      try { return await query(q, p); }
      catch (e) { return { rows: [] }; }
    };

    // Get additional statistics for enhanced dashboard
    const [patientStatsResult, appointmentStatsResult, bedOccupancyResult] = await Promise.all([
      safeQuery(`
        SELECT 
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_patients,
          COUNT(CASE WHEN created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as returning_patients
        FROM patients 
        WHERE tenant_id = $1
      `, [tenantId]),

      safeQuery(`
        SELECT 
          COUNT(CASE WHEN status = 'scheduled' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END) as scheduled_today,
          COUNT(CASE WHEN status = 'completed' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END) as completed_today,
          COUNT(CASE WHEN status = 'cancelled' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END) as cancelled_today,
          COUNT(CASE WHEN status = 'no-show' AND DATE(scheduled_start) = CURRENT_DATE THEN 1 END) as no_show_today
        FROM appointments 
        WHERE tenant_id = $1
      `, [tenantId]),

      safeQuery(`
        SELECT 
          COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available
        FROM beds 
        WHERE tenant_id = $1
      `, [tenantId])
    ]);

    // Get department distribution
    const departmentResult = await safeQuery(`
      SELECT role as department, COUNT(*) as count 
      FROM users 
      WHERE tenant_id = $1 AND role IS NOT NULL
      GROUP BY role
      ORDER BY count DESC, role
    `, [tenantId]);

    const departmentDistribution = departmentResult.rows.map(row => ({
      label: row.department || 'General',
      value: Number(row.count || 0)
    }));

    // Get available doctors
    const doctorsResult = await safeQuery(`
      SELECT
        u.id,
        u.name,
        u.role,
        u.is_active,
        COUNT(a.id) as consultations,
        COALESCE(
          ROUND(
            AVG(EXTRACT(EPOCH FROM (a.scheduled_end - a.scheduled_start)) / 60)
              FILTER (WHERE a.status = 'completed' AND a.scheduled_end IS NOT NULL)
          ),
          0
        ) as avg_time,
        0 as satisfaction
      FROM users u
      LEFT JOIN appointments a ON a.provider_id = u.id AND a.tenant_id = u.tenant_id
      WHERE u.tenant_id = $1 AND lower(COALESCE(u.role, '')) = 'doctor'
      GROUP BY u.id, u.name, u.role, u.is_active
      ORDER BY consultations DESC, u.name
    `, [tenantId]);

    // Optional enrichments (safe)
    const [
      staffStatsResult,
      masterCountsResult,
      journeyResult,
      revenueTrendResult,
      patientTrendResult,
      noShowTrendResult,
      topDiagnosesResult,
      topServicesResult
    ] = await Promise.all([
      safeQuery(`
        SELECT designation, COUNT(*) as count 
        FROM employees 
        WHERE tenant_id = $1 AND designation IS NOT NULL
        GROUP BY designation
        ORDER BY count DESC
      `, [tenantId]),

      safeQuery(`
        SELECT
          (SELECT COUNT(*) FROM departments WHERE tenant_id = $1) as departments,
          (SELECT COUNT(*) FROM wards WHERE tenant_id = $1) as wards,
          (SELECT COUNT(*) FROM beds WHERE tenant_id = $1) as beds,
          (SELECT COUNT(*) FROM services WHERE tenant_id = $1) as services,
          (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_staff
      `, [tenantId]),

      safeQuery(`
        SELECT status, COUNT(*) as count 
        FROM encounters 
        WHERE tenant_id = $1
        GROUP BY status
      `, [tenantId]),

      query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
            date_trunc('month', CURRENT_DATE),
            INTERVAL '1 month'
          ) AS month_start
        )
        SELECT
          TO_CHAR(months.month_start, 'Mon') as label,
          COALESCE(SUM(i.total), 0) as value
        FROM months
        LEFT JOIN invoices i
          ON date_trunc('month', i.created_at) = months.month_start
         AND i.tenant_id = $1
         AND i.status = 'paid'
        GROUP BY months.month_start
        ORDER BY months.month_start
      `, [tenantId]).catch(() => ({ rows: [] }))
      ,

      query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
            date_trunc('month', CURRENT_DATE),
            INTERVAL '1 month'
          ) AS month_start
        ),
        new_patients AS (
          SELECT date_trunc('month', created_at) AS month_start, COUNT(*)::int AS count
          FROM patients
          WHERE tenant_id = $1
          GROUP BY 1
        ),
        returning_patients AS (
          SELECT date_trunc('month', visit_date) AS month_start, COUNT(DISTINCT patient_id)::int AS count
          FROM encounters
          WHERE tenant_id = $1 AND patient_id IS NOT NULL
          GROUP BY 1
        )
        SELECT
          TO_CHAR(months.month_start, 'Mon') as label,
          COALESCE(new_patients.count, 0) as value1,
          GREATEST(COALESCE(returning_patients.count, 0) - COALESCE(new_patients.count, 0), 0) as value2
        FROM months
        LEFT JOIN new_patients ON new_patients.month_start = months.month_start
        LEFT JOIN returning_patients ON returning_patients.month_start = months.month_start
        ORDER BY months.month_start
      `, [tenantId]).catch(() => ({ rows: [] })),

      query(`
        WITH days AS (
          SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') AS day_start
        )
        SELECT
          TO_CHAR(days.day_start, 'DD Mon') as label,
          COUNT(a.id) FILTER (WHERE lower(COALESCE(a.status, '')) = 'no-show')::int as "noShow",
          COALESCE(
            ROUND(
              (
                COUNT(a.id) FILTER (WHERE lower(COALESCE(a.status, '')) = 'no-show')::numeric
                / NULLIF(COUNT(a.id), 0)
              ) * 100,
              1
            ),
            0
          ) as rate
        FROM days
        LEFT JOIN appointments a
          ON DATE(a.scheduled_start) = DATE(days.day_start)
         AND a.tenant_id = $1
        GROUP BY days.day_start
        ORDER BY days.day_start
      `, [tenantId]).catch(() => ({ rows: [] })),

      query(`
        SELECT
          diagnosis as name,
          COUNT(*)::int as value
        FROM encounters
        WHERE tenant_id = $1
          AND diagnosis IS NOT NULL
          AND BTRIM(diagnosis) <> ''
        GROUP BY diagnosis
        ORDER BY value DESC, diagnosis
        LIMIT 10
      `, [tenantId]).catch(() => ({ rows: [] })),

      query(`
        SELECT
          display_name as name,
          COUNT(*)::int as value
        FROM service_requests
        WHERE tenant_id = $1
          AND display_name IS NOT NULL
          AND BTRIM(display_name) <> ''
        GROUP BY display_name
        ORDER BY value DESC, display_name
        LIMIT 8
      `, [tenantId]).catch(async () => {
        try {
          return await query(`
            SELECT
              description as name,
              COALESCE(SUM(total), 0)::int as value
            FROM invoices
            WHERE tenant_id = $1
              AND description IS NOT NULL
              AND BTRIM(description) <> ''
            GROUP BY description
            ORDER BY value DESC, description
            LIMIT 8
          `, [tenantId]);
        } catch {
          return { rows: [] };
        }
      })
    ]);

    const patientStats = patientStatsResult.rows[0] || {};
    const appointmentStats = appointmentStatsResult.rows[0] || {};
    const bedOccupancy = bedOccupancyResult.rows[0] || {};
    const doctors = (doctorsResult.rows || []).map((doctor) => ({
      ...doctor,
      consultations: Number(doctor.consultations || 0),
      avgTime: Number(doctor.avg_time || 0),
      satisfaction: Number(doctor.satisfaction || 0)
    }));
    const staffStats = (staffStatsResult.rows || []).length > 0
      ? staffStatsResult.rows
      : departmentResult.rows.map((row) => ({
          designation: row.department,
          count: Number(row.count || 0)
        }));
    const masterStats = {
      departments: Number(masterCountsResult.rows?.[0]?.departments || 0),
      wards: Number(masterCountsResult.rows?.[0]?.wards || 0),
      beds: Number(masterCountsResult.rows?.[0]?.beds || 0),
      services: Number(masterCountsResult.rows?.[0]?.services || 0),
      total_staff: Number(masterCountsResult.rows?.[0]?.total_staff || 0)
    };

    const occupancyRate = metrics.totalBeds > 0
      ? Math.round((metrics.occupiedBeds / metrics.totalBeds) * 100)
      : 0;

    const response = {
      // Real-time metrics
      ...metrics,
      totalPatients,
      totalAppointments,
      totalRevenue,
      criticalAlerts: Number(metrics.criticalLabResults || 0),

      // Enhanced statistics
      patientStats: {
        new_patients: Number(patientStats.new_patients || 0),
        returning_patients: Number(patientStats.returning_patients || 0),
        admitted_today: Number(metrics.todayAdmissions || 0),
        discharged_today: Number(metrics.todayDischarges || 0)
      },
      appointmentStats: {
        scheduled_today: Number(appointmentStats.scheduled_today || 0),
        completed_today: Number(appointmentStats.completed_today || 0),
        cancelled_today: Number(appointmentStats.cancelled_today || 0),
        no_show_today: Number(appointmentStats.no_show_today || 0)
      },
      bedOccupancy: {
        occupied: Number(bedOccupancy.occupied || 0),
        available: Number(bedOccupancy.available || 0),
        total: Number(metrics.totalBeds || 0),
        occupancy_rate: occupancyRate
      },

      departmentDistribution,
      doctors,

      // Optional extras
      staffStats,
      staffDistribution: staffStats,
      masterStats,
      masterCounts: masterStats,
      patientJourney: journeyResult.rows || [],
      revenueTrend: revenueTrendResult.rows || [],
      patientTrend: patientTrendResult.rows || [],
      noShowTrend: noShowTrendResult.rows || [],
      topDiagnoses: topDiagnosesResult.rows || [],
      topServices: topServicesResult.rows || [],

      // Additional calculated metrics
      occupancyRate,
      availabilityRate: metrics.totalBeds > 0
        ? Math.round((metrics.availableBeds / metrics.totalBeds) * 100)
        : 0,

      performanceScore: calculatePerformanceScore(metrics),
      utilizationRate: occupancyRate,
      revenuePerBed: metrics.totalBeds > 0
        ? Math.round((metrics.todayRevenue || 0) / metrics.totalBeds)
        : 0,

      lastUpdated: new Date().toISOString(),
      timeFilter
    };

    return res.json(response);

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return res.status(500).json({ error: 'Failed to load dashboard metrics' });
  }
});

// =====================================================
// CLINICAL AI INTELLIGENCE & SAFETY
// =====================================================

app.post('/api/ai/lab-interpretation', requireTenant, requirePermission('lab'), moduleGate('lab'), async (req, res) => {
  try {
    const { labOrderId, resultsData } = req.body;
    if (!labOrderId || !resultsData) {
      return res.status(400).json({ error: 'labOrderId and resultsData are required' });
    }
    const analysis = await ai.interpretLabResults(req.tenantId, labOrderId, resultsData);
    res.json({ analysis });
  } catch (error) {
    console.error('AI Lab interpretation failed:', error);
    res.status(500).json({ error: 'AI Analysis failed' });
  }
});

app.post('/api/ai/drug-check', requireTenant, requirePermission('emr'), moduleGate('emr'), async (req, res) => {
  try {
    const { medications } = req.body;
    if (!medications || !Array.isArray(medications)) {
      return res.status(400).json({ error: 'medications array is required' });
    }
    const safetyReport = await ai.checkDrugInteractions(req.tenantId, medications);
    res.json({ safetyReport });
  } catch (error) {
    console.error('AI Interaction check failed:', error);
    res.status(500).json({ error: 'Clinical safety check failed' });
  }
});

/**
 * ARCHIVE AUTOMATION ENGINE (Mocked for Demo)
 * Scheduled task to archive appointments > 30 days old with status 'requested' or 'scheduled'
 */
async function runAutoArchival() {
  try {
    console.log('[AUTO_ARCHIVE_ENGINE] Checking for aged lifecycle records...');
    // Real implementation: const count = await repo.autoArchiveAgedAppointments();
    // For demo, we just log a pulse.
    console.log('[AUTO_ARCHIVE_ENGINE] Complete. Cleaned 0 records.');
  } catch (error) {
    console.error('Auto-archival task failed:', error);
  }
}

// In production, use nodes-cron or similar
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
  setInterval(runAutoArchival, 1000 * 60 * 60 * 24); // Once a day
}

// =====================================================
// PATIENTS
// =====================================================


app.patch('/api/patients/:id/clinical', requireTenant, restrictPatientAccess, moduleGate('patients'), async (req, res) => {
  try {
    const { id } = req.params;
    const { section, payload } = req.body;

    const validSections = ['caseHistory', 'medications', 'prescriptions', 'recommendations', 'feedbacks', 'testReports'];
    if (!section || !validSections.includes(section)) {
      return res.status(400).json({ error: 'Invalid section' });
    }

    if (!payload) {
      return res.status(400).json({ error: 'payload is required' });
    }
    if (section === 'prescriptions' && req.user?.role !== 'Doctor') {
      return res.status(403).json({ error: 'Only doctors can author prescriptions' });
    }

    await repo.addClinicalRecord({
      tenantId: req.tenantId,
      userId: req.user.id,
      patientId: id,
      section,
      content: payload,
    });

    const patient = await repo.getPatientById(id, req.tenantId);
    res.json(patient);
  } catch (error) {
    console.error('Error adding clinical record:', error);
    res.status(500).json({ error: 'Failed to add clinical record' });
  }
});

app.get('/api/patients', authenticate, requireTenant, moduleGate('patients'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const includeArchived = req.query.includeArchived === 'true';
    const patients = await repo.getPatients(req.tenantId, req.user.role, limit, offset, includeArchived);
    res.json(patients);

  } catch (error) {
    console.error('Error fetching paginated patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

app.get('/api/appointments', authenticate, requireTenant, moduleGate('appointments'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const appointments = await repo.getAppointments(req.tenantId, limit, offset);
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching paginated appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

app.get('/api/patients/search', authenticate, requireTenant, moduleGate('patients'), async (req, res) => {
  try {
    const { text, date, type, status, includeArchived } = req.query;
    console.log('Patient search:', { text, date, type, status, includeArchived });

    const patients = await repo.searchPatients(req.tenantId, { text, date, type, status, includeArchived: includeArchived === 'true' });
    res.json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

app.get('/api/patients/:id', authenticate, requireTenant, moduleGate('patients'), async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await repo.getPatientById(id, req.tenantId, req.user.role);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

app.get('/api/patients/:id/print/:docType', authenticate, requireTenant, restrictPatientAccess, moduleGate('patients'), async (req, res) => {
  try {
    const { id, docType } = req.params;

    const patient = await repo.getPatientById(id, req.tenantId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (docType === 'invoice') {
      const invoices = await repo.getInvoices(req.tenantId);
      const patientInvoices = invoices.filter(i => i.patient_id === id);

      return res.json({
        title: 'Patient Invoice Statement',
        patient,
        rows: patientInvoices,
      });
    }

    if (docType === 'health-record') {
      return res.json({
        title: 'Patient Health Record',
        patient,
        rows: [
          ...patient.caseHistory,
          ...patient.medications,
          ...patient.prescriptions,
          ...patient.recommendations,
        ],
      });
    }

    if (docType === 'test-reports') {
      return res.json({
        title: 'Patient Test Reports',
        patient,
        rows: patient.testReports || [],
      });
    }

    return res.status(400).json({ error: 'Invalid docType' });
  } catch (error) {
    console.error('Error fetching print data:', error);
    res.status(500).json({ error: 'Failed to fetch print data' });
  }
});

app.post('/api/patients', authenticate, requireTenant, requirePermission('patients'), moduleGate('patients'), async (req, res) => {
  try {
    const { firstName, lastName, dob, gender, phone, email, address, bloodGroup, emergencyContact, insurance, medicalHistory } = req.body;

    if (!firstName || !lastName || !phone) {
      return res.status(400).json({ error: 'firstName, lastName, and phone are required' });
    }

    const patient = await repo.createPatient({
      tenantId: req.tenantId,
      userId: req.user.id,
      firstName,
      lastName,
      dob,
      gender,
      phone,
      email,
      address,
      bloodGroup,
      emergencyContact,
      insurance,
      medicalHistory,
    });

    res.status(201).json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

app.patch('/api/patients/:id/archive', requireTenant, requirePermission('patients'), moduleGate('patients'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const patient = await repo.archivePatient({
      tenantId: req.tenantId,
      userId: req.user.id,
      patientId: id,
      reason,
    });

    res.json(patient);
  } catch (error) {
    console.error('Error archiving patient:', error);
    res.status(500).json({ error: error.message || 'Failed to archive patient' });
  }
});

app.patch('/api/patients/:id/approval', requireTenant, requireRole('Admin'), moduleGate('patients'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    const patient = await repo.setPatientApprovalStatus({
      tenantId: req.tenantId,
      userId: req.user.id,
      patientId: id,
      status,
    });

    res.json(patient);
  } catch (error) {
    console.error('Error setting patient approval:', error);
    res.status(500).json({ error: error.message || 'Failed to set approval status' });
  }
});


// =====================================================
// WALK-INS
// =====================================================

app.post('/api/walkins', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { name, phone, reason } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'name and phone are required' });
    }

    const walkin = await repo.createWalkin({
      tenantId: req.tenantId,
      userId: req.user.id,
      name,
      phone,
      reason,
    });

    res.status(201).json(walkin);
  } catch (error) {
    console.error('Error creating walk-in:', error);
    res.status(500).json({ error: 'Failed to create walk-in' });
  }
});

app.post('/api/walkins/:id/convert', requireTenant, requirePermission('patients'), moduleGate('patients'), async (req, res) => {
  try {
    const { id } = req.params;
    const { dob, gender } = req.body;

    const patient = await repo.convertWalkinToPatient({
      walkinId: id,
      tenantId: req.tenantId,
      userId: req.user.id,
      dob,
      gender,
    });

    res.status(201).json(patient);
  } catch (error) {
    console.error('Error converting walk-in:', error);
    res.status(500).json({ error: 'Failed to convert walk-in' });
  }
});

// =====================================================
// APPOINTMENTS
// =====================================================

app.post('/api/appointments', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { patientId, providerId, start, end, reason } = req.body;

    if (!patientId || !providerId || !start || !end) {
      return res.status(400).json({ error: 'patientId, providerId, start, and end are required' });
    }

    if (new Date(end) <= new Date(start)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const appointment = await repo.createAppointment({
      tenantId: req.tenantId,
      userId: req.user.id,
      patientId,
      providerId,
      start,
      end,
      reason,
      source: 'staff',
      status: 'scheduled',
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

app.post('/api/appointments/self', requireTenant, moduleGate('appointments'), async (req, res) => {
  try {
    const { patientId, providerId, start, end, reason } = req.body;

    if (!patientId || !providerId || !start || !end) {
      return res.status(400).json({ error: 'patientId, providerId, start, and end are required' });
    }

    // Verify patient can only book for themselves
    if (req.user.role === 'Patient' && req.user.patientId !== patientId) {
      return res.status(403).json({ error: 'You can only book appointments for yourself' });
    }

    if (new Date(end) <= new Date(start)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const appointment = await repo.createAppointment({
      tenantId: req.tenantId,
      userId: req.user.id,
      patientId,
      providerId,
      start,
      end,
      reason,
      source: 'self',
      status: 'requested',
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating self appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

app.patch('/api/appointments/:id/status', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['requested', 'scheduled', 'checked_in', 'completed', 'cancelled', 'no_show'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const appointment = await repo.updateAppointmentStatus({
      appointmentId: id,
      tenantId: req.tenantId,
      userId: req.user.id,
      status,
    });

    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

app.patch('/api/appointments/:id/reschedule', requireTenant, moduleGate('appointments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end, reason } = req.body;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end are required' });
    }

    if (new Date(end) <= new Date(start)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const appointment = await repo.rescheduleAppointment({
      appointmentId: id,
      tenantId: req.tenantId,
      userId: req.user.id,
      start,
      end,
      reason,
    });

    res.json(appointment);
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

// =====================================================
// DOCTOR AVAILABILITY FOR OPD SCHEDULING
// =====================================================

// Get doctor availability slots
app.get('/api/doctor-availability', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    const availability = await repo.getDoctorAvailability(
      req.tenantId,
      doctorId || null,
      date || null
    );

    res.json(availability);
  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    res.status(500).json({ error: 'Failed to fetch doctor availability' });
  }
});

// Get available slots for a specific doctor on a specific date
app.get('/api/doctor-availability/slots', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ error: 'doctorId and date are required' });
    }

    const slots = await repo.getAvailableSlotsForDoctor(req.tenantId, doctorId, date);
    res.json(slots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// Get doctor availability calendar
app.get('/api/doctor-availability/calendar', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { doctorId, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const calendar = await repo.getDoctorAvailabilityCalendar(
      req.tenantId,
      doctorId || null,
      startDate,
      endDate
    );

    res.json(calendar);
  } catch (error) {
    console.error('Error fetching availability calendar:', error);
    res.status(500).json({ error: 'Failed to fetch availability calendar' });
  }
});

// Create doctor availability (for admin/doctor to set their schedule)
app.post('/api/doctor-availability', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime, slotDurationMinutes = 15, maxAppointments = 1, notes } = req.body;

    if (!doctorId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'doctorId, date, startTime, and endTime are required' });
    }

    // Generate slots automatically
    const slots = await repo.generateDoctorAvailabilitySlots({
      tenantId: req.tenantId,
      doctorId,
      date,
      startTime,
      endTime,
      slotDurationMinutes,
      maxAppointmentsPerSlot: maxAppointments,
      createdBy: req.user.id
    });

    res.status(201).json(slots);
  } catch (error) {
    console.error('Error creating doctor availability:', error);
    res.status(500).json({ error: 'Failed to create doctor availability' });
  }
});

// Update doctor availability slot
app.patch('/api/doctor-availability/:id', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const availability = await repo.updateDoctorAvailabilitySlot(id, req.tenantId, updates);

    if (!availability) {
      return res.status(404).json({ error: 'Availability slot not found' });
    }

    res.json(availability);
  } catch (error) {
    console.error('Error updating doctor availability:', error);
    res.status(500).json({ error: 'Failed to update doctor availability' });
  }
});

// Delete doctor availability slot
app.delete('/api/doctor-availability/:id', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { id } = req.params;

    const availability = await repo.deleteDoctorAvailability(id, req.tenantId);

    if (!availability) {
      return res.status(404).json({ error: 'Availability slot not found' });
    }

    res.json({ message: 'Availability slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor availability:', error);
    if (error.message.includes('Cannot delete availability slot with existing appointments')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete doctor availability' });
  }
});

// =====================================================
// OPD TOKEN QUEUE SYSTEM
// =====================================================

// Generate new OPD token
app.post('/api/opd-tokens', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { patientId, departmentId, doctorId, priority = 'general', visitType = 'new', chiefComplaint, appointmentId } = req.body;

    if (!patientId || !departmentId) {
      return res.status(400).json({ error: 'patientId and departmentId are required' });
    }

    const token = await repo.generateOPDToken({
      tenantId: req.tenantId,
      patientId,
      departmentId,
      doctorId,
      priority,
      visitType,
      chiefComplaint,
      appointmentId,
      createdBy: req.user.id
    });

    await createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'opd.token.create',
      entityName: 'opd_token',
      entityId: token.id,
      details: { tokenNumber: token.full_token, priority, visitType }
    });

    res.status(201).json(token);
  } catch (error) {
    console.error('Error creating OPD token:', error);
    res.status(500).json({ error: 'Failed to create OPD token' });
  }
});

// Get OPD tokens with filters
app.get('/api/opd-tokens', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { status, departmentId, doctorId, date, priority } = req.query;

    const tokens = await repo.getOPDTokens(req.tenantId, {
      status,
      departmentId,
      doctorId,
      date,
      priority
    });

    res.json(tokens);
  } catch (error) {
    console.error('Error fetching OPD tokens:', error);
    res.status(500).json({ error: 'Failed to fetch OPD tokens' });
  }
});

// Get specific OPD token
app.get('/api/opd-tokens/:id', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { id } = req.params;

    const token = await repo.getOPDTokenById(id, req.tenantId);

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json(token);
  } catch (error) {
    console.error('Error fetching OPD token:', error);
    res.status(500).json({ error: 'Failed to fetch OPD token' });
  }
});

// Update token status
app.patch('/api/opd-tokens/:id/status', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, doctorId } = req.body;

    const validStatuses = ['waiting', 'called', 'in_progress', 'completed', 'cancelled', 'no_show'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const token = await repo.updateTokenStatus(id, req.tenantId, status, { doctorId });

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    await createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'opd.token.update_status',
      entityName: 'opd_token',
      entityId: id,
      details: { oldStatus: token.status, newStatus: status }
    });

    res.json(token);
  } catch (error) {
    console.error('Error updating token status:', error);
    res.status(500).json({ error: 'Failed to update token status' });
  }
});

// Call next token
app.post('/api/opd-tokens/call-next', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { departmentId, doctorId } = req.body;

    if (!departmentId) {
      return res.status(400).json({ error: 'departmentId is required' });
    }

    const token = await repo.callNextToken(req.tenantId, departmentId, doctorId);

    if (!token) {
      return res.status(404).json({ error: 'No tokens waiting in queue' });
    }

    await createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'opd.token.call_next',
      entityName: 'opd_token',
      entityId: token.id,
      details: { tokenNumber: token.full_token }
    });

    res.json(token);
  } catch (error) {
    console.error('Error calling next token:', error);
    res.status(500).json({ error: 'Failed to call next token' });
  }
});

// Get queue statistics
app.get('/api/opd-tokens/stats', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { departmentId, doctorId, date } = req.query;

    const stats = await repo.getTokenQueueStats(req.tenantId, {
      departmentId,
      doctorId,
      date
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching token stats:', error);
    res.status(500).json({ error: 'Failed to fetch token statistics' });
  }
});

// Get active tokens by department
app.get('/api/opd-tokens/department-summary', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const departmentStats = await repo.getActiveTokensByDepartment(req.tenantId);
    res.json(departmentStats);
  } catch (error) {
    console.error('Error fetching department summary:', error);
    res.status(500).json({ error: 'Failed to fetch department summary' });
  }
});

// Update token vitals
app.post('/api/opd-tokens/:id/vitals', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { id } = req.params;
    const vitalsData = req.body;

    const token = await repo.updateTokenVitals(id, req.tenantId, {
      ...vitalsData,
      createdBy: req.user.id
    });

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    await createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'opd.token.vitals_recorded',
      entityName: 'opd_token',
      entityId: id,
      details: vitalsData
    });

    res.json(token);
  } catch (error) {
    console.error('Error updating token vitals:', error);
    res.status(500).json({ error: 'Failed to update token vitals' });
  }
});

// Get token history for patient
app.get('/api/opd-tokens/patient/:patientId/history', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 10 } = req.query;

    const history = await repo.getTokenHistory(req.tenantId, patientId, parseInt(limit));
    res.json(history);
  } catch (error) {
    console.error('Error fetching token history:', error);
    res.status(500).json({ error: 'Failed to fetch token history' });
  }
});

// Delete OPD token
app.delete('/api/opd-tokens/:id', requireTenant, requirePermission('appointments'), moduleGate('appointments'), async (req, res) => {
  try {
    const { id } = req.params;

    const token = await repo.deleteOPDToken(id, req.tenantId);

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    await createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'opd.token.delete',
      entityName: 'opd_token',
      entityId: id,
      details: { tokenNumber: token.full_token }
    });

    res.json({ message: 'Token deleted successfully' });
  } catch (error) {
    console.error('Error deleting OPD token:', error);
    res.status(500).json({ error: 'Failed to delete OPD token' });
  }
});

// =====================================================
// ENCOUNTERS (EMR)
// =====================================================

// =====================================================
// ENCOUNTERS (EMR)
// =====================================================

app.get('/api/encounters', requireTenant, moduleGate('emr'), async (req, res) => {
  try {
    const encounters = await repo.getEncounters(req.tenantId);
    res.json(encounters);
  } catch (error) {
    console.error('Error fetching encounters:', error);
    res.status(500).json({ error: 'Failed to fetch encounters' });
  }
});

app.post('/api/encounters', requireTenant, requirePermission('emr'), moduleGate('emr'), async (req, res) => {
  try {
    const { patientId, providerId, type, complaint, diagnosis, notes } = req.body;

    if (!patientId || !providerId || !type) {
      return res.status(400).json({ error: 'patientId, providerId, and type are required' });
    }

    const validTypes = ['Out-patient', 'In-patient', 'Emergency', 'OPD', 'IPD'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid encounter type: ${type}. Must be one of ${validTypes.join(', ')}` });
    }

    const encounter = await repo.createEncounter({
      tenantId: req.tenantId,
      userId: req.user.id,
      patientId,
      providerId,
      type,
      complaint,
      diagnosis,
      notes,
    });

    res.status(201).json(encounter);
  } catch (error) {
    console.error('Error creating encounter:', error);
    res.status(500).json({ error: 'Failed to create encounter' });
  }
});

app.post('/api/encounters/:id/discharge', requireTenant, requirePermission('emr'), moduleGate('emr'), async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, notes } = req.body;

    const encounter = await repo.dischargePatient({
      tenantId: req.tenantId,
      userId: req.user.id,
      encounterId: id,
      diagnosis,
      notes,
    });

    res.json(encounter);
  } catch (error) {
    console.error('Error discharging patient:', error);
    res.status(500).json({ error: error.message || 'Failed to discharge patient' });
  }
});

// =====================================================
// INVOICES
// =====================================================

app.post('/api/invoices', requireTenant, requirePermission('billing'), moduleGate('billing'), async (req, res) => {
  try {
    const { patientId, description, amount, taxPercent, paymentMethod } = req.body;

    if (!patientId || amount == null) {
      return res.status(400).json({ error: 'patientId and amount are required' });
    }

    const invoice = await repo.createInvoice({
      tenantId: req.tenantId,
      userId: req.user.id,
      patientId,
      description,
      amount,
      taxPercent: taxPercent || 0,
      paymentMethod
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

app.patch('/api/invoices/:id/pay', requireTenant, requirePermission('billing'), moduleGate('billing'), async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const invoice = await repo.payInvoice({
      invoiceId: id,
      tenantId: req.tenantId,
      userId: req.user.id,
      paymentMethod
    });

    res.json(invoice);
  } catch (error) {
    console.error('Error paying invoice:', error);
    res.status(500).json({ error: 'Failed to pay invoice' });
  }
});

app.get('/api/invoices', requireTenant, requirePermission('billing'), moduleGate('billing'), async (req, res) => {
  try {
    const invoices = await repo.getInvoices(req.tenantId);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// =====================================================
// PHARMACY & PRESCRIPTIONS
// =====================================================

app.get('/api/prescriptions', requireTenant, requireRole('Nurse', 'Lab', 'Pharmacy'), moduleGate('pharmacy'), async (req, res) => {
  try {
    const { status, patientId } = req.query;
    const prescriptions = await repo.getPrescriptions(req.tenantId, { status, patientId });
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

app.get('/api/prescriptions/:id', requireTenant, moduleGate('pharmacy'), async (req, res) => {
  try {
    const prescription = await repo.getPrescriptionById(req.params.id, req.tenantId);
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

app.post('/api/prescriptions', requireTenant, requireRole('Doctor'), moduleGate('pharmacy'), async (req, res) => {
  try {
    const { encounter_id, drug_name, dosage, frequency, duration, instructions, is_followup, followup_date, followup_notes } = req.body;

    if (!encounter_id || !drug_name) {
      return res.status(400).json({ error: 'encounter_id and drug_name are required' });
    }

    const prescription = await repo.createPrescription({
      tenantId: req.tenantId,
      encounter_id,
      drug_name,
      dosage,
      frequency,
      duration,
      instructions,
      is_followup,
      followup_date,
      followup_notes,
    });

    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'prescription.create',
      entityName: 'prescription',
      entityId: prescription.id,
    });

    res.status(201).json(prescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

app.get('/api/prescriptions', requireTenant, requireRole('Nurse', 'Lab', 'Pharmacy'), moduleGate('pharmacy'), async (req, res) => {
  try {
    const { status, patientId } = req.query;
    const prescriptions = await repo.getPrescriptions(req.tenantId, { status, patientId });
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

app.patch('/api/prescriptions/:id/status', requireTenant, requirePermission('inventory'), moduleGate('pharmacy'), async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const validStatuses = ['Pending', 'Dispensed', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const prescription = await repo.updatePrescriptionStatus({
      id,
      tenantId: req.tenantId,
      userId: req.user.id,
      status,
    });

    res.json(prescription);
  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({ error: 'Failed to update prescription status' });
  }
});

app.post('/api/prescriptions/:id/dispense', requireTenant, requirePermission('inventory'), moduleGate('pharmacy'), async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, quantity } = req.body;

    const prescription = await repo.dispensePrescription({
      id,
      tenantId: req.tenantId,
      userId: req.user.id,
      itemId,
      quantity,
    });

    res.json(prescription);
  } catch (error) {
    console.error('Error dispensing prescription:', error);
    res.status(500).json({ error: error.message || 'Failed to dispense prescription' });
  }
});

// =====================================================
// INVENTORY
// =====================================================

app.post('/api/inventory-items', requireTenant, requirePermission('inventory'), moduleGate('inventory'), async (req, res) => {
  try {
    const { code, name, category, stock, reorder } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }

    const item = await repo.createInventoryItem({
      tenantId: req.tenantId,
      userId: req.user.id,
      code,
      name,
      category,
      stock: stock || 0,
      reorder: reorder || 0,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    if (error.constraint === 'inventory_items_tenant_id_item_code_key') {
      return res.status(409).json({ error: 'Item code already exists' });
    }
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

app.get('/api/inventory-items', requireTenant, requirePermission('inventory'), moduleGate('inventory'), async (req, res) => {
  try {
    const items = await repo.getInventoryItems(req.tenantId);
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

app.patch('/api/inventory-items/:id/stock', requireTenant, requirePermission('inventory'), moduleGate('inventory'), async (req, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body;

    if (delta == null || isNaN(Number(delta))) {
      return res.status(400).json({ error: 'delta must be a number' });
    }

    const item = await repo.updateInventoryStock({
      itemId: id,
      tenantId: req.tenantId,
      userId: req.user.id,
      delta: Number(delta),
    });

    res.json(item);
  } catch (error) {
    console.error('Error updating inventory stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// =====================================================
// EMPLOYEES
// =====================================================

app.post('/api/employees', requireTenant, requirePermission('employees'), moduleGate('employees'), async (req, res) => {
  try {
    const { name, code, department, designation, joinDate, shift, salary } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'name and code are required' });
    }

    const employee = await repo.createEmployee({
      tenantId: req.tenantId,
      name,
      code,
      department,
      designation,
      joinDate,
      shift,
      salary: salary || 0,
    });

    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'employee.create',
      entityName: 'employee',
      entityId: employee.id,
      details: { code },
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.constraint === 'employees_tenant_id_code_key') {
      return res.status(409).json({ error: 'Employee code already exists' });
    }
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

app.post('/api/employees/:id/leaves', requireTenant, requirePermission('employees'), moduleGate('employees'), async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, type } = req.body;

    if (!from || !to || !type) {
      return res.status(400).json({ error: 'from, to, and type are required' });
    }

    const validTypes = ['Casual', 'Sick', 'Earned', 'Unpaid'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid leave type' });
    }

    const leave = await repo.createEmployeeLeave({
      tenantId: req.tenantId,
      employeeId: id,
      from,
      to,
      type,
    });

    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'employee.leave.apply',
      entityName: 'employee_leave',
      entityId: leave.id,
      details: { employeeId: id, type },
    });

    res.status(201).json(leave);
  } catch (error) {
    console.error('Error creating employee leave:', error);
    res.status(500).json({ error: 'Failed to create leave' });
  }
});

// =====================================================
// BOOTSTRAP
// =====================================================

app.get('/api/bootstrap', authenticate, async (req, res) => {
  try {
    const { tenantId, userId } = req.query;

    // Safety check - use req.tenantId if from token, otherwise query
    const targetTenantId = req.tenantId || tenantId;
    const targetUserId = req.user?.id || userId;

    if (!targetTenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const data = await repo.getBootstrapData(targetTenantId, targetUserId);
    res.json(data);
  } catch (error) {
    console.error('Error bootstrapping data:', error);
    res.status(500).json({ error: 'Failed to bootstrap data' });
  }
});

// =====================================================
// TENANTS
// =====================================================

// =====================================================
// REPORTS
// =====================================================

app.get('/api/reports/summary', requireTenant, requirePermission('reports'), moduleGate('reports'), async (req, res) => {
  try {
    const summary = await repo.getReportSummary(req.tenantId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching report summary:', error);
    res.status(500).json({ error: 'Failed to fetch report summary' });
  }
});

app.get('/api/reports/payouts', requireTenant, requirePermission('reports'), moduleGate('reports'), async (req, res) => {
  try {
    const payouts = await repo.getDoctorPayouts(req.tenantId);
    res.json(payouts);
  } catch (error) {
    console.error('Error fetching doctor payouts:', error);
    res.status(500).json({ error: 'Failed to fetch doctor payouts' });
  }
});

// =====================================================
// HR & ACCOUNTS
// =====================================================

app.post('/api/attendance', requireTenant, requirePermission('employees'), moduleGate('employees'), async (req, res) => {
  try {
    /* Expected body: { employeeId, date, timeIn, timeOut, status } */
    const record = await repo.recordAttendance({ ...req.body, tenantId: req.tenantId });

    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'attendance.record',
      entityName: 'attendance',
      entityId: record.id,
      details: { employeeId: req.body.employeeId, status: req.body.status },
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

app.get('/api/attendance', requireTenant, requirePermission('employees'), moduleGate('employees'), async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const records = await repo.getAttendance(req.tenantId, date);
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

app.post('/api/expenses', requireTenant, requirePermission('billing'), moduleGate('billing'), async (req, res) => {
  try {
    const expense = await repo.addExpense({ ...req.body, tenantId: req.tenantId, recordedBy: req.user.id });
    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'expense.create',
      entityName: 'expense',
      entityId: expense.id,
      details: { category: req.body.category, amount: req.body.amount }
    });
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

app.get('/api/expenses', requireTenant, requirePermission('billing'), moduleGate('billing'), async (req, res) => {
  try {
    const { month } = req.query;
    const expenses = await repo.getExpenses(req.tenantId, { month });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.get('/api/reports/financials', requireTenant, requirePermission('reports'), moduleGate('reports'), async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 8) + '01';
    const summary = await repo.getFinancialSummary(req.tenantId, month);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching financials:', error);
    res.status(500).json({ error: 'Failed to fetch financials' });
  }
});

// =====================================================
// INSURANCE
// =====================================================

app.get('/api/insurance/providers', requireTenant, requirePermission('insurance'), moduleGate('insurance'), async (req, res) => {
  try {
    const providers = await repo.getInsuranceProviders(req.tenantId);
    res.json(providers);
  } catch (error) {
    console.error('Error fetching insurance providers:', error);
    res.status(500).json({ error: 'Failed to fetch insurance providers' });
  }
});

app.post('/api/insurance/providers', requireTenant, requirePermission('insurance'), moduleGate('insurance'), async (req, res) => {
  try {
    const provider = await repo.createInsuranceProvider({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(provider);
  } catch (error) {
    console.error('Error creating insurance provider:', error);
    res.status(500).json({ error: 'Failed to create insurance provider' });
  }
});

app.get('/api/insurance/claims', requireTenant, requirePermission('insurance'), moduleGate('insurance'), async (req, res) => {
  try {
    const { status } = req.query;
    const claims = await repo.getClaims(req.tenantId, { status });
    res.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

app.post('/api/insurance/claims', requireTenant, requirePermission('insurance'), moduleGate('insurance'), async (req, res) => {
  try {
    const claim = await repo.createClaim({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(claim);
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

// =====================================================
// ADMINISTRATIVE MASTERS
// =====================================================

app.get('/api/departments', requireTenant, async (req, res) => {
  try {
    const depts = await repo.getDepartments(req.tenantId);
    res.json(depts);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

app.get('/api/employees', requireTenant, requirePermission('employees'), moduleGate('employees'), async (req, res) => {
  try {
    const employees = await repo.getEmployees(req.tenantId);
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.post('/api/employees', requireTenant, requirePermission('employees'), moduleGate('employees'), async (req, res) => {
  try {
    const employee = await repo.createEmployee({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

app.post('/api/departments', requireTenant, requirePermission('admin'), async (req, res) => {
  try {
    const dept = await repo.createDepartment({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(dept);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

app.get('/api/wards', requireTenant, async (req, res) => {
  try {
    const wards = await repo.getWards(req.tenantId);
    res.json(wards);
  } catch (error) {
    console.error('Error fetching wards:', error);
    res.status(500).json({ error: 'Failed to fetch wards' });
  }
});

app.post('/api/wards', requireTenant, requirePermission('admin'), async (req, res) => {
  try {
    const ward = await repo.createWard({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(ward);
  } catch (error) {
    console.error('Error creating ward:', error);
    res.status(500).json({ error: 'Failed to create ward' });
  }
});

app.get('/api/beds', requireTenant, async (req, res) => {
  try {
    const { wardId } = req.query;
    if (!wardId) return res.status(400).json({ error: 'wardId is required' });
    const beds = await repo.getBeds(wardId);
    res.json(beds);
  } catch (error) {
    console.error('Error fetching beds:', error);
    res.status(500).json({ error: 'Failed to fetch beds' });
  }
});

app.post('/api/beds', requireTenant, requirePermission('admin'), async (req, res) => {
  try {
    const bed = await repo.createBed({ ...req.body, tenant_id: req.tenantId });
    res.status(201).json(bed);
  } catch (error) {
    console.error('Error creating bed:', error);
    res.status(500).json({ error: 'Failed to create bed' });
  }
});

app.get('/api/services', requireTenant, async (req, res) => {
  try {
    const { getServices } = await import('./services/service.service.js');
    const services = await getServices(req.tenantId);
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.post('/api/services', requireTenant, requirePermission('admin'), async (req, res) => {
  try {
    const { createService } = await import('./services/service.service.js');
    const service = await createService(req.tenantId, req.body);
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// AMBULANCE HUB
app.get('/api/ambulances', requireTenant, moduleGate('ambulance'), async (req, res) => {
  try {
    const fleet = await repo.getAmbulances(req.tenantId);
    res.json(fleet);
  } catch (error) {
    console.error('Error fetching fleet:', error);
    res.status(500).json({ error: 'Failed to fetch fleet' });
  }
});

app.post('/api/ambulances', requireTenant, requirePermission('admin'), async (req, res) => {
  try {
    const ambulance = await repo.createAmbulance({ ...req.body, tenantId: req.tenantId, userId: req.user.id });
    res.status(201).json(ambulance);
  } catch (error) {
    console.error('Error creating ambulance:', error);
    res.status(500).json({ error: 'Failed to register ambulance in fleet' });
  }
});

app.post('/api/ambulances/dispatch', requireTenant, moduleGate('ambulance'), async (req, res) => {
  try {
    const dispatchResult = await repo.dispatchAmbulance({ ...req.body, tenantId: req.tenantId });
    res.status(200).json(dispatchResult);
  } catch (error) {
    console.error('Dispatch Error:', error);
    res.status(500).json({ error: 'Systemic Dispatch Failure' });
  }
});

app.patch('/api/ambulances/:id/status', requireTenant, moduleGate('ambulance'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, lat, lng } = req.body;
    const updated = await repo.updateAmbulanceStatus(id, req.tenantId, status, lat, lng);
    res.json(updated);
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ error: 'Failed to update unit status' });
  }
});

// BLOOD BANK
app.get('/api/blood-bank/units', requireTenant, moduleGate('inventory'), async (req, res) => {
  try {
    const units = await repo.getBloodUnits(req.tenantId);
    res.json(units);
  } catch (error) {
    console.error('Error fetching blood units:', error);
    res.status(500).json({ error: 'Failed to fetch blood bank inventory' });
  }
});

app.post('/api/blood-bank/units', requireTenant, requirePermission('inventory'), moduleGate('inventory'), async (req, res) => {
  try {
    const unit = await repo.createBloodUnit({ ...req.body, tenantId: req.tenantId, userId: req.user.id });
    res.status(201).json(unit);
  } catch (error) {
    console.error('Error adding blood unit:', error);
    res.status(500).json({ error: 'Failed to record blood unit' });
  }
});

app.get('/api/blood-bank/requests', requireTenant, moduleGate('inventory'), async (req, res) => {
  try {
    const requests = await repo.getBloodRequests(req.tenantId);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching blood requests:', error);
    res.status(500).json({ error: 'Failed to fetch blood requests' });
  }
});

// =====================================================
// LABORATORY MODULE
// =====================================================

app.get('/api/lab/orders', requireTenant, moduleGate('lab'), async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT sr.*, p.first_name as patient_first_name, p.last_name as patient_last_name, u.name as ordered_by_name
      FROM emr.service_requests sr
      LEFT JOIN emr.patients p ON sr.patient_id = p.id
      LEFT JOIN emr.users u ON sr.requester_id = u.id
      WHERE sr.tenant_id = $1 AND sr.category = 'lab'
    `;
    const params = [req.tenantId];
    if (status) { sql += ` AND sr.status = $2`; params.push(status); }
    sql += ' ORDER BY sr.created_at DESC LIMIT 100';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching lab orders:', error);
    res.status(500).json({ error: 'Failed to fetch lab orders' });
  }
});

app.post('/api/lab/orders', requireTenant, moduleGate('lab'), async (req, res) => {
  try {
    const { patientId, encounterId, tests, priority = 'routine', notes } = req.body;
    if (!patientId || !tests || !tests.length) return res.status(400).json({ error: 'patientId and tests are required' });
    const orders = [];
    try {
      await query('BEGIN');
      for (const test of tests) {
        const r = await query(
          `INSERT INTO emr.service_requests (tenant_id, patient_id, encounter_id, requester_id, category, code, display, status, priority, notes)
           VALUES ($1,$2,$3,$4,'lab',$5,$6,'pending',$7,$8) RETURNING *`,
          [req.tenantId, patientId, encounterId || null, req.user.id, test.code || 'LAB', test.name || test.display, priority, notes || null]
        );
        orders.push(r.rows[0]);
      }
      await query('COMMIT');
    } catch (e) {
      await query('ROLLBACK');
      throw e;
    }
    res.status(201).json(orders);
  } catch (error) {
    console.error('Error creating lab order:', error);
    res.status(500).json({ error: 'Failed to create lab order' });
  }
});

app.patch('/api/lab/orders/:id/status', requireTenant, moduleGate('lab'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const r = await query(
      `UPDATE emr.service_requests SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, req.tenantId]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(r.rows[0]);
  } catch (error) {
    console.error('Error updating lab order status:', error);
    res.status(500).json({ error: 'Failed to update lab order status' });
  }
});

app.post('/api/lab/orders/:id/results', requireTenant, moduleGate('lab'), async (req, res) => {
  try {
    const { id } = req.params;
    const { results, notes, criticalFlag = false } = req.body;
    const r = await query(
      `UPDATE emr.service_requests SET status = 'completed', notes = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [JSON.stringify({ results, criticalFlag, enteredBy: req.user.id, enteredAt: new Date(), notes }), id, req.tenantId]
    );
    await repo.createAuditLog({
      tenantId: req.tenantId, userId: req.user.id, userName: req.user.name,
      action: criticalFlag ? 'lab.result.record_critical' : 'lab.result.record',
      entityName: 'service_request', entityId: id, details: { criticalFlag }
    });
    if (!r.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(r.rows[0]);
  } catch (error) {
    console.error('Error recording lab results:', error);
    res.status(500).json({ error: 'Failed to record lab results' });
  }
});

// =====================================================
// COMMUNICATION (NOTICE BOARD)
// =====================================================

app.get('/api/notices', requireTenant, async (req, res) => {
  try {
    const { status = 'published' } = req.query;
    const role = req.user.role;
    const statusCondition = status === 'all' ? '' : 'AND n.status = $3';
    const params = status === 'all' ? [req.tenantId, role] : [req.tenantId, role, status];
    const result = await query(
      `SELECT n.*, u.name AS created_by_name FROM emr.notices n LEFT JOIN emr.users u ON u.id = n.created_by
       WHERE n.tenant_id = $1 AND (jsonb_array_length(n.audience_roles) = 0 OR n.audience_roles ? $2) ${statusCondition}
       ORDER BY n.priority DESC, n.starts_at DESC, n.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
});

app.post('/api/notices', requireTenant, requireRole('Admin', 'Management', 'HR'), async (req, res) => {
  try {
    const { title, body, audienceRoles = [], audienceDepartments = [], startsAt, endsAt, status = 'published', priority = 'normal' } = req.body;
    if (!title || !body || !startsAt) return res.status(400).json({ error: 'title, body and startsAt are required' });
    const created = await query(
      `INSERT INTO emr.notices (tenant_id, title, body, audience_roles, audience_departments, starts_at, ends_at, status, priority, created_by)
       VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10) RETURNING *`,
      [req.tenantId, title, body, JSON.stringify(audienceRoles), JSON.stringify(audienceDepartments), startsAt, endsAt || null, status, priority, req.user.id]
    );
    res.status(201).json(created.rows[0]);
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ error: 'Failed to create notice' });
  }
});

app.patch('/api/notices/:id/status', requireTenant, requireRole('Admin', 'Management', 'HR'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['draft', 'published', 'archived'].includes(status)) return res.status(400).json({ error: 'Invalid status value' });
    const updated = await query(
      `UPDATE emr.notices SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, req.tenantId]
    );
    if (!updated.rows.length) return res.status(404).json({ error: 'Notice not found' });
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating notice status:', error);
    res.status(500).json({ error: 'Failed to update notice status' });
  }
});

// =====================================================
// DOCUMENT VAULT
// =====================================================

app.get('/api/documents', requireTenant, async (req, res) => {
  try {
    const { category, includeDeleted = 'false', patientId } = req.query;
    const conditions = ['d.tenant_id = $1'];
    const params = [req.tenantId];
    if (category) { params.push(category); conditions.push(`d.category = $${params.length}`); }
    if (patientId) { params.push(patientId); conditions.push(`d.patient_id = $${params.length}`); }
    if (String(includeDeleted).toLowerCase() !== 'true') conditions.push('d.is_deleted = false');
    const result = await query(
      `SELECT d.*, CASE WHEN p.id IS NULL THEN NULL ELSE CONCAT(p.first_name, ' ', p.last_name) END AS patient_name
       FROM emr.documents d LEFT JOIN emr.patients p ON p.id = d.patient_id
       WHERE ${conditions.join(' AND ')} ORDER BY d.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

app.post('/api/documents', requireTenant, requireRole('Admin', 'Doctor', 'Nurse', 'Lab', 'Pharmacy', 'Front Office'), async (req, res) => {
  try {
    const { patientId = null, encounterId = null, category = 'other', title, fileName, mimeType = null, storageKey = null, sizeBytes = 0, tags = [] } = req.body;
    if (!title || !fileName) return res.status(400).json({ error: 'title and fileName are required' });
    const inserted = await query(
      `INSERT INTO emr.documents (tenant_id, patient_id, encounter_id, category, title, file_name, mime_type, storage_key, size_bytes, tags, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11) RETURNING *`,
      [req.tenantId, patientId, encounterId, category, title, fileName, mimeType, storageKey || `manual://${fileName}`, Number(sizeBytes || 0), JSON.stringify(tags), req.user.id]
    );
    await query(`INSERT INTO emr.document_audit_logs (tenant_id, document_id, action, actor_id, metadata) VALUES ($1, $2, 'upload', $3, $4::jsonb)`,
      [req.tenantId, inserted.rows[0].id, req.user.id, JSON.stringify({ category })]
    );
    res.status(201).json(inserted.rows[0]);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document metadata' });
  }
});

app.patch('/api/documents/:id/delete', requireTenant, requireRole('Admin', 'Doctor', 'Nurse', 'Lab', 'Pharmacy', 'Front Office'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isDeleted = true } = req.body;
    const updated = await query(`UPDATE emr.documents SET is_deleted = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [Boolean(isDeleted), id, req.tenantId]
    );
    if (!updated.rows.length) return res.status(404).json({ error: 'Notice not found' });
    await query(`INSERT INTO emr.document_audit_logs (tenant_id, document_id, action, actor_id, metadata) VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [req.tenantId, id, isDeleted ? 'delete' : 'restore', req.user.id, JSON.stringify({ softDelete: true })]
    );
    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Error updating document deletion state:', error);
    res.status(500).json({ error: 'Failed to update document state' });
  }
});

// =====================================================
// SUPPORT TICKETS
// =====================================================

app.get('/api/support/tickets', authenticate, (req, res, next) => {
  const tenantId = req.query.tenantId || req.header('x-tenant-id');
  if (req.user.role === 'Superadmin' && !tenantId) { req.tenantId = null; return next(); }
  requireTenant(req, res, next);
}, (req, res, next) => {
  if (!req.tenantId) return next();
  return moduleGate('support')(req, res, next);
}, async (req, res) => {
  try {
    const tickets = await repo.getSupportTickets(req.tenantId);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

app.post('/api/support/tickets', requireTenant, moduleGate('support'), async (req, res) => {
  try {
    const { type, location, description, priority } = req.body;
    if (!type || !description) return res.status(400).json({ error: 'type and description are required' });
    const ticket = await repo.createSupportTicket({ tenantId: req.tenantId, userId: req.user.id, type, location, description, priority });
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

app.patch('/api/support/tickets/:id/status', requireTenant, moduleGate('support'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ticket = await repo.updateSupportTicketStatus({ id, tenantId: req.tenantId, userId: req.user.id, status });
    res.json(ticket);
  } catch (error) {
    console.error('Error updating support ticket status:', error);
    res.status(500).json({ error: 'Failed to update support ticket status' });
  }
});

// =====================================================
// INPATIENT BRIDGE
// =====================================================

app.post('/api/inpatient/:id/discharge-invoice', requireTenant, moduleGate('inpatient'), async (req, res) => {
  try {
    const { id } = req.params;
    const { patientId, amount = 0, description } = req.body;
    if (!patientId) return res.status(400).json({ error: 'patientId is required' });
    const invoice = await repo.createInvoice({
      tenantId: req.tenantId, userId: req.user.id, patientId,
      description: description || 'Inpatient Admission & Healthcare Services',
      amount: amount || 0, taxPercent: 0, paymentMethod: 'Insurance', status: 'unpaid'
    });
    await repo.createAuditLog({
      tenantId: req.tenantId, userId: req.user.id, userName: req.user.name,
      action: 'inpatient.discharge.invoice_created', entityName: 'invoice', entityId: invoice.id, details: { encounterId: id, patientId }
    });
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating discharge invoice:', error);
    res.status(500).json({ error: 'Failed to create discharge invoice' });
  }
});

app.get('/api/realtime-tick', requireTenant, async (req, res) => {
  try {
    const data = await repo.getBootstrapData(req.tenantId, req.user.id);
    res.json({ patients: data.patients, appointments: data.appointments, encounters: data.encounters, invoices: data.invoices, inventory: data.inventory });
  } catch (error) {
    console.error('Error fetching realtime data:', error);
    res.status(500).json({ error: 'Failed to fetch realtime data' });
  }
});

if (isDirectRun) {
  // Handle 404 for API routes specifically
  app.all('/api/*', (req, res) => {
    console.log(`[404] API Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'API route not found' });
  });

  const clientDistPath = path.join(__dirname, '../client/dist');
  const rootDistPath = path.join(__dirname, '../dist');
  const frontendDistPath = fs.existsSync(clientDistPath) ? clientDistPath : rootDistPath;

  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Frontend bundle path: ${frontendDistPath}`);
  });
}

// ERROR HANDLING
if (!isDirectRun) {
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});


// Temporary administrative endpoint for multi-schema migration
app.post('/api/admin/migrate-multi-schema', async (req, res) => {
  try {
    const CLINICAL_TABLES = [
      'patients', 'appointments', 'encounters', 'clinical_records',
      'billing', 'invoices', 'accounts_receivable', 'accounts_payable',
      'expenses', 'revenue', 'inventory', 'services', 'departments',
      'employees', 'salary', 'attendance', 'payroll', 'fhir_resources'
    ];

    const pool = await import('./db/connection.js').then(m => m.default);
    const client = await pool.connect();

    try {
      // 1. Get all tenants
      const tenantsResult = await client.query('SELECT id, name, code FROM emr.tenants');
      const tenants = tenantsResult.rows;
      const logs = [];

      for (const tenant of tenants) {
        const sanitizedId = tenant.id.replace(/-/g, '');
        const schemaName = `tenant_${sanitizedId.substring(0, 16)}`;
        logs.push(`Processing tenant: ${tenant.name} (${tenant.code}) -> Schema: ${schemaName}`);

        // 2. Create schema
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

        // 3. Replicate tables and migrate data
        for (const table of CLINICAL_TABLES) {
          try {
            // Check if table exists in emr schema
            const tableExists = await client.query(
              "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = $1)",
              [table]
            );

            if (!tableExists.rows[0].exists) continue;

            // Create table in new schema by copying structure
            await client.query(`CREATE TABLE IF NOT EXISTS ${schemaName}.${table} (LIKE emr.${table} INCLUDING ALL)`);
            
            // Move data
            const moveResult = await client.query(`
              INSERT INTO ${schemaName}.${table} 
              SELECT * FROM emr.${table} 
              WHERE tenant_id = $1
              ON CONFLICT DO NOTHING
            `, [tenant.id]);

            logs.push(`   - Migrated ${moveResult.rowCount} rows to ${schemaName}.${table}`);
          } catch (err) {
            logs.push(`   - Error migrating table ${table}: ${err.message}`);
          }
        }
      }

      return res.json({ success: true, logs });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Migration endpoint error:', error);
    return res.status(500).json({ error: error.message });
  }
});



// Force Multi-Tenancy Isolation and Cleanup
// Force Multi-Tenancy Isolation (Legacy Bridge Endpoint)
app.get('/force-isolate', async (req, res) => {
  res.redirect('/api/admin/force-shard-isolation');
});


// Debug endpoint for migration status
app.get('/api/admin/debug-migration', async (req, res) => {
  try {
    const { query } = await import('./db/connection.js');
    const tenantCount = await query('SELECT COUNT(*) FROM emr.tenants');
    const resourceTable = await query("SELECT to_regclass('emr.tenant_resources') as exists");
    
    res.json({
      timestamp: new Date().toISOString(),
      tenantCount: tenantCount.rows[0].count,
      hasResourceTable: !!resourceTable.rows[0].exists,
      systemMessage: 'Migration check complete.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { app };
export default app;

