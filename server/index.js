import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './db/connection.js';
import { hashPassword, comparePassword, generateToken } from './services/auth.service.js';
import { authenticate, requireRole, requireTenant, requirePermission, restrictPatientAccess } from './middleware/auth.middleware.js';
import { evaluateAllFeatures, featureGate, moduleGate } from './middleware/featureFlag.middleware.js';
import * as repo from './db/repository.js';
import { createAuditLog } from './db/repository.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Only start listening when running directly (not when imported as a module)
const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

app.use(cors());
app.use(express.json());

// DEBUG: Log all requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

// Test database connection on startup
testConnection();

// =====================================================
// PUBLIC ROUTES (No authentication required)
// =====================================================

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'emr-api',
    version: '2.0.0',
    database: 'postgresql',
    now: new Date().toISOString()
  });
});

app.post('/api/login', async (req, res) => {
  try {
    const { tenantId, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user;

    // Handle superadmin login
    if (tenantId === 'superadmin') {
      user = await repo.getUserByEmail(email, null);

      if (!user || user.role !== 'Superadmin') {
        return res.status(401).json({ error: 'Invalid superadmin credentials' });
      }

      const isValidPassword = await comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Normalize role for consistency
      const normalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();

      const token = generateToken({
        userId: user.id,
        tenantId: null,
        role: normalizedRole,
        email: user.email,
      });

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: normalizedRole,
        },
        tenantId: null,
        role: normalizedRole,
      });
    }

    // Handle tenant user login
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required for tenant login' });
    }

    // Resolve tenant code to UUID if needed
    let resolvedTenantId = tenantId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(tenantId)) {
      const tenant = await repo.getTenantByCode(tenantId);
      if (!tenant) {
        console.log(`[LOGIN] Invalid tenant code: ${tenantId}`);
        return res.status(400).json({ error: 'Invalid tenant' });
      }
      resolvedTenantId = tenant.id;
    }

    user = await repo.getUserByEmail(email, resolvedTenantId);

    if (!user) {
      console.log(`[LOGIN] User not found: ${email} for tenant: ${tenantId}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      console.log(`[LOGIN] User inactive: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      console.log(`[LOGIN] Password mismatch for: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await repo.updateUserLastLogin(user.id);
    await createAuditLog({
      tenantId: user.tenant_id,
      userId: user.id,
      userName: user.name,
      action: 'auth.login',
    });

    // Normalize role for consistency
    const normalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
    // Special handling for multi-word roles
    const finalRole = normalizedRole === 'Front office' ? 'Front Office' : (normalizedRole === 'Support staff' ? 'Support Staff' : normalizedRole);

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: finalRole,
      email: user.email,
      patientId: user.patient_id,
    });

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
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// =====================================================
// PROTECTED ROUTES (Authentication required)
// =====================================================

// Apply authentication to all /api routes below this point
app.use('/api', authenticate);

// Apply feature flag evaluation to all authenticated routes
app.use('/api', evaluateAllFeatures);

app.post('/api/tenants', requireRole('Superadmin'), async (req, res) => {
  try {
    const { name, code, subdomain, primaryColor, accentColor } = req.body;

    if (!name || !code || !subdomain) {
      return res.status(400).json({ error: 'name, code, and subdomain are required' });
    }

    const theme = {
      primary: primaryColor || '#0f5a6e',
      accent: accentColor || '#f57f17',
    };

    const tenant = await repo.createTenant({ name, code, subdomain, theme });

    await repo.createAuditLog({
      tenantId: tenant.id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'tenant.create',
      entityName: 'tenant',
      entityId: tenant.id,
    });

    res.status(201).json(tenant);
  } catch (error) {
    console.error('Error creating tenant:', error);
    if (error.constraint) {
      return res.status(409).json({ error: 'Tenant code or subdomain already exists' });
    }
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

app.patch('/api/tenants/:id/settings', requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, primaryColor, accentColor, featureInventory, featureTelehealth, subscriptionTier } = req.body;

    const theme = (primaryColor || accentColor) ? {
      primary: primaryColor,
      accent: accentColor,
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
      subscriptionTier
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
    console.error('Error updating tenant settings:', error);
    res.status(500).json({ error: 'Failed to update tenant settings' });
  }
});

// =====================================================
// USERS
// =====================================================

app.get('/api/users', authenticate, async (req, res) => {
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

app.post('/api/users', async (req, res) => {
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

    await createAuditLog({
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
app.get('/api/admin/subscription-catalog', requireRole('Superadmin'), async (req, res) => {
  try {
    const catalog = [
      {
        id: 'basic',
        name: 'Basic',
        displayName: 'Basic Plan',
        description: 'Essential EMR functionality for small practices',
        price: '$99/month',
        features: ['permission-core_engine-access'],
        color: '#6b7280',
        icon: '🩺',
        popular: false,
        tier: 'Basic'
      },
      {
        id: 'professional',
        name: 'Professional',
        displayName: 'Professional Plan',
        description: 'Enhanced EMR with customer support features',
        price: '$299/month',
        features: ['permission-core_engine-access', 'permission-customer_support-access'],
        color: '#3b82f6',
        icon: '⭐',
        popular: true,
        tier: 'Professional'
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        displayName: 'Enterprise Plan',
        description: 'Complete EMR solution with all advanced features',
        price: '$599/month',
        features: ['permission-core_engine-access', 'permission-customer_support-access', 'permission-hr_payroll-access', 'permission-accounts-access'],
        color: '#10b981',
        icon: '🏢',
        popular: false,
        tier: 'Enterprise'
      }
    ];

    res.json(catalog);
  } catch (error) {
    console.error('Error fetching subscription catalog:', error);
    res.status(500).json({ error: 'Failed to fetch subscription catalog' });
  }
});

app.post('/api/admin/subscription-catalog', requireRole('Superadmin'), async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.id) {
      return res.status(400).json({ error: 'Subscription data is required' });
    }

    // In a real implementation, this would save to database
    console.log('Saving subscription:', subscription);

    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 500));

    res.json({
      message: 'Subscription saved successfully',
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

    await createAuditLog({
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

// =====================================================
// PATIENTS
// =====================================================

app.post('/api/patients', requireTenant, requirePermission('patients'), async (req, res) => {
  try {
    const {
      firstName, lastName, dob, gender, phone, email, address,
      bloodGroup, emergencyContact, insurance,
      chronicConditions, allergies, surgeries, familyHistory
    } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'firstName and lastName are required' });
    }

    const medicalHistory = {
      chronicConditions: chronicConditions || '',
      allergies: allergies || '',
      surgeries: surgeries || '',
      familyHistory: familyHistory || '',
    };

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

app.patch('/api/patients/:id/clinical', requireTenant, restrictPatientAccess, async (req, res) => {
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

app.get('/api/patients/search', requireTenant, async (req, res) => {
  try {
    const { text, date, type, status } = req.query;
    console.log('Patient search:', { text, date, type, status });

    const patients = await repo.searchPatients(req.tenantId, { text, date, type, status });
    res.json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

app.get('/api/patients/:id/print/:docType', requireTenant, restrictPatientAccess, async (req, res) => {
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
        rows: patient.testReports,
      });
    }

    return res.status(400).json({ error: 'Invalid docType' });
  } catch (error) {
    console.error('Error fetching print data:', error);
    res.status(500).json({ error: 'Failed to fetch print data' });
  }
});

// =====================================================
// WALK-INS
// =====================================================

app.post('/api/walkins', requireTenant, requirePermission('appointments'), async (req, res) => {
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

app.post('/api/walkins/:id/convert', requireTenant, requirePermission('patients'), async (req, res) => {
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

app.post('/api/appointments', requireTenant, requirePermission('appointments'), async (req, res) => {
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

app.post('/api/appointments/self', requireTenant, async (req, res) => {
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

app.patch('/api/appointments/:id/status', requireTenant, requirePermission('appointments'), async (req, res) => {
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

app.patch('/api/appointments/:id/reschedule', requireTenant, async (req, res) => {
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
// ENCOUNTERS (EMR)
// =====================================================

// =====================================================
// ENCOUNTERS (EMR)
// =====================================================

app.get('/api/encounters', requireTenant, async (req, res) => {
  try {
    const encounters = await repo.getEncounters(req.tenantId);
    res.json(encounters);
  } catch (error) {
    console.error('Error fetching encounters:', error);
    res.status(500).json({ error: 'Failed to fetch encounters' });
  }
});

app.post('/api/encounters', requireTenant, requirePermission('emr'), async (req, res) => {
  try {
    const { patientId, providerId, type, complaint, diagnosis, notes } = req.body;

    if (!patientId || !providerId || !type) {
      return res.status(400).json({ error: 'patientId, providerId, and type are required' });
    }

    const validTypes = ['Out-patient', 'In-patient', 'Emergency'];
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

app.post('/api/encounters/:id/discharge', requireTenant, requirePermission('emr'), async (req, res) => {
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

// =====================================================
// PHARMACY & PRESCRIPTIONS
// =====================================================

app.get('/api/prescriptions', requireTenant, async (req, res) => {
  try {
    const { status, patientId } = req.query;
    const prescriptions = await repo.getPrescriptions(req.tenantId, { status, patientId });
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

app.get('/api/prescriptions/:id', requireTenant, async (req, res) => {
  try {
    const prescription = await repo.getPrescriptionById(req.params.id, req.tenantId);
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });
    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

app.post('/api/prescriptions', requireTenant, requirePermission('emr'), async (req, res) => {
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

app.get('/api/prescriptions', requireTenant, async (req, res) => {
  try {
    const { status, patientId } = req.query;
    const prescriptions = await repo.getPrescriptions(req.tenantId, { status, patientId });
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

app.patch('/api/prescriptions/:id/status', requireTenant, requirePermission('inventory'), async (req, res) => {
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

app.post('/api/prescriptions/:id/dispense', requireTenant, requirePermission('inventory'), async (req, res) => {
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

app.post('/api/inventory-items', requireTenant, requirePermission('inventory'), async (req, res) => {
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

app.get('/api/inventory-items', requireTenant, requirePermission('inventory'), async (req, res) => {
  try {
    const items = await repo.getInventoryItems(req.tenantId);
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

app.patch('/api/inventory-items/:id/stock', requireTenant, requirePermission('inventory'), async (req, res) => {
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

app.get('/api/reports/summary', requireTenant, requirePermission('reports'), async (req, res) => {
  try {
    const summary = await repo.getReportSummary(req.tenantId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching report summary:', error);
    res.status(500).json({ error: 'Failed to fetch report summary' });
  }
});

app.get('/api/reports/payouts', requireTenant, requirePermission('reports'), async (req, res) => {
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

app.post('/api/attendance', requireTenant, requirePermission('employees'), async (req, res) => {
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

app.get('/api/attendance', requireTenant, requirePermission('employees'), async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const records = await repo.getAttendance(req.tenantId, date);
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

app.post('/api/expenses', requireTenant, requirePermission('billing'), async (req, res) => {
  try {
    /* Expected body: { category, description, amount, date, paymentMethod, reference } */
    const expense = await repo.addExpense({ ...req.body, tenantId: req.tenantId, recordedBy: req.user.id });

    await repo.createAuditLog({
      tenantId: req.tenantId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'expense.create',
      entityName: 'expense',
      entityId: expense.id,
      details: { category: req.body.category, amount: req.body.amount, paymentMethod: req.body.paymentMethod },
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

app.get('/api/expenses', requireTenant, requirePermission('billing'), async (req, res) => {
  try {
    const month = req.query.month || null;
    const expenses = await repo.getExpenses(req.tenantId, { month });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.get('/api/reports/financials', requireTenant, requirePermission('reports'), async (req, res) => {
  try {
    /* Expected query: ?month=YYYY-MM-01 */
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

app.get('/api/insurance/providers', requireTenant, requirePermission('billing'), async (req, res) => {
  try {
    const providers = await repo.getInsuranceProviders(req.tenantId);
    res.json(providers);
  } catch (error) {
    console.error('Error fetching insurance providers:', error);
    res.status(500).json({ error: 'Failed to fetch insurance providers' });
  }
});

app.post('/api/insurance/providers', requireTenant, requirePermission('billing'), async (req, res) => {
  try {
    const provider = await repo.createInsuranceProvider({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(provider);
  } catch (error) {
    console.error('Error creating insurance provider:', error);
    res.status(500).json({ error: 'Failed to create insurance provider' });
  }
});

app.get('/api/insurance/claims', requireTenant, requirePermission('billing'), async (req, res) => {
  try {
    const { status } = req.query;
    const claims = await repo.getClaims(req.tenantId, { status });
    res.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

app.post('/api/insurance/claims', requireTenant, requirePermission('billing'), async (req, res) => {
  try {
    const claim = await repo.createClaim({ ...req.body, tenantId: req.tenantId });
    res.status(201).json(claim);
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

// =====================================================
// REALTIME TICK (For demo/development)
// =====================================================

app.get('/api/realtime-tick', requireTenant, async (req, res) => {
  try {
    // This is a placeholder - in production you'd use WebSockets or Server-Sent Events
    const data = await repo.getBootstrapData(req.tenantId, req.user.id);
    res.json({
      patients: data.patients,
      appointments: data.appointments,
      encounters: data.encounters,
      invoices: data.invoices,
      inventory: data.inventory,
    });
  } catch (error) {
    console.error('Error fetching realtime data:', error);
    res.status(500).json({ error: 'Failed to fetch realtime data' });
  }
});


if (isDirectRun) {
  // =====================================================
  // SERVE FRONTEND (Production)
  // =====================================================

  // Handle 404 for API routes specifically
  app.all('/api/*', (req, res) => {
    console.log(`[404] API Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'API route not found' });
  });

  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });

  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler (Only for serverless/API mode. In direct run, we handle frontend below)
if (!isDirectRun) {
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// =====================================================
// START SERVER
// =====================================================

// Export the app for serverless use (Netlify Functions)
export { app };
export default app;




