/**
 * Database Repository Layer
 * Provides all CRUD operations for the EMR system
 * Replaces the JSON file storage with PostgreSQL
 */

import { query } from './connection.js';

// =====================================================
// FEATURE FLAG FUNCTIONS
// =====================================================

/**
 * Get tenant's subscription tier
 */
export async function getTenantTier(tenantId) {
  const sql = 'SELECT subscription_tier FROM emr.tenants WHERE id = $1';
  const result = await query(sql, [tenantId]);
  return result.rows[0]?.subscription_tier || 'Basic';
}

/**
 * Get custom feature flags for a tenant
 */
export async function getTenantCustomFeatures(tenantId) {
  const sql = 'SELECT feature_flag, enabled FROM emr.tenant_features WHERE tenant_id = $1';
  const result = await query(sql, [tenantId]);
  return result.rows.map(row => ({
    featureFlag: row.feature_flag,
    enabled: row.enabled === true
  }));
}

/**
 * Get global kill switches
 */
export async function getGlobalKillSwitches() {
  const sql = 'SELECT feature_flag, enabled FROM emr.global_kill_switches WHERE enabled = true';
  const result = await query(sql);
  const killSwitches = {};
  result.rows.forEach(row => {
    killSwitches[row.feature_flag] = row.enabled;
  });
  return killSwitches;
}

/**
 * Set global kill switch
 */
export async function setGlobalKillSwitch(featureFlag, enabled, userId, reason) {
  const sql = `
    INSERT INTO emr.global_kill_switches (feature_flag, enabled, created_by, reason)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (feature_flag) 
    DO UPDATE SET 
      enabled = EXCLUDED.enabled,
      reason = EXCLUDED.reason,
      updated_at = NOW()
    RETURNING *
  `;

  const result = await query(sql, [featureFlag, enabled, userId, reason]);
  return result.rows[0];
}

/**
 * Get effective feature flag status for a tenant
 */
export async function getTenantFeatureStatus(tenantId) {
  const sql = 'SELECT * FROM emr.tenant_feature_status WHERE tenant_id = $1';
  const result = await query(sql, [tenantId]);

  const flags = {};
  result.rows.forEach(row => {
    flags[row.feature_flag] = {
      enabled: row.effective_enabled,
      killSwitchActive: row.kill_switch_active,
      customEnabled: row.custom_enabled
    };
  });

  return flags;
}

/**
 * Update tenant subscription tier
 */
export async function setTenantTier(tenantId, tier) {
  const sql = `
    UPDATE emr.tenants 
    SET subscription_tier = $1, updated_at = NOW() 
    WHERE id = $2 
    RETURNING *
  `;
  const result = await query(sql, [tier, tenantId]);
  return result.rows[0];
}

/**
 * Set custom feature flag override for a tenant
 */
export async function setTenantFeatureOverride(tenantId, featureFlag, enabled) {
  const sql = `
    INSERT INTO emr.tenant_features (tenant_id, feature_flag, enabled, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (tenant_id, feature_flag) 
    DO UPDATE SET enabled = $3, updated_at = NOW()
    RETURNING *
  `;
  const result = await query(sql, [tenantId, featureFlag, enabled]);
  return result.rows[0];
}


// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate audit log entry
 */
export async function createAuditLog({ tenantId, userId, userName, action, entityName, entityId, details, ipAddress, userAgent }) {
  const sql = `
    INSERT INTO emr.audit_logs (tenant_id, user_id, user_name, action, entity_name, entity_id, details, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId || null,
    userId || null,
    userName || 'system',
    action,
    entityName || null,
    entityId || null,
    JSON.stringify(details || {}),
    ipAddress || null,
    userAgent || null,
  ]);

  return result.rows[0];
}

/**
 * Update tenant settings including subscription tier and billing config
 */
export async function updateTenantSettings({ tenantId, displayName, theme, features, subscriptionTier, billingConfig, logo_url: req_logo_url }) {
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (displayName !== undefined) {
    // Tenants table uses `name` as the display label column.
    updates.push(`name = $${paramIndex++}`);
    values.push(displayName);
  }

  if (theme !== undefined) {
    updates.push(`theme = $${paramIndex++}`);
    values.push(JSON.stringify(theme));
  }

  if (features !== undefined) {
    updates.push(`features = $${paramIndex++}`);
    values.push(JSON.stringify(features));
  }

  if (subscriptionTier !== undefined) {
    updates.push(`subscription_tier = $${paramIndex++}`);
    values.push(subscriptionTier);
  }

  if (billingConfig !== undefined) {
    updates.push(`billing_config = $${paramIndex++}`);
    values.push(JSON.stringify(billingConfig));
  }

  if (req_logo_url !== undefined) {
    updates.push(`logo_url = $${paramIndex++}`);
    values.push(req_logo_url);
  }

  if (updates.length === 0) {
    throw new Error('No updates provided');
  }

  updates.push(`updated_at = NOW()`);
  values.push(tenantId);

  const sql = `
    UPDATE emr.tenants 
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await query(sql, values);
  return result.rows[0];
}
export async function generateMRN(tenantId) {
  const tenantResult = await query('SELECT code FROM emr.tenants WHERE id = $1', [tenantId]);
  const tenantCode = tenantResult.rows[0]?.code || 'UNK';

  // Get the highest numeric MRN for this tenant
  const maxResult = await query(
    'SELECT MAX(CASE WHEN mrn ~ $2 THEN CAST(SUBSTRING(mrn, LENGTH($2) + 1) AS INTEGER) ELSE 0 END) as max_num FROM emr.patients WHERE tenant_id = $1 AND mrn LIKE $2',
    [tenantId, `${tenantCode}-%`]
  );

  const maxNum = parseInt(maxResult.rows[0].max_num) || 0;
  const nextNum = maxNum + 1;
  
  return `${tenantCode}-${nextNum}`;
}

/**
 * Generate unique invoice number
 */
export async function generateInvoiceNumber(tenantId) {
  const tenantResult = await query('SELECT code FROM emr.tenants WHERE id = $1', [tenantId]);
  const tenantCode = tenantResult.rows[0]?.code || 'UNK';

  const countResult = await query(
    'SELECT COUNT(*) as count FROM emr.invoices WHERE tenant_id = $1',
    [tenantId]
  );

  const count = parseInt(countResult.rows[0].count) + 1;
  return `${tenantCode}-INV-${String(count).padStart(4, '0')}`;
}

// =====================================================
// TENANTS
// =====================================================

export async function getTenants() {
  const result = await query(`
    SELECT t.id, t.name, t.code, t.subdomain, t.theme, t.features, t.billing_config, t.status, t.created_at, t.updated_at, t.subscription_tier, t.logo_url, t.contact_email,
           (SELECT COUNT(*) FROM emr.patients WHERE tenant_id = t.id) as patient_count
    FROM emr.tenants t 
    ORDER BY t.name
  `);
  return result.rows;
}

export async function getTenantById(id) {
  const result = await query('SELECT * FROM emr.tenants WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateTenantStatus(id, status) {
  const result = await query(
    'UPDATE emr.tenants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
}

export async function getTenantByCode(code) {
  const result = await query('SELECT * FROM emr.tenants WHERE code = $1', [code]);
  return result.rows[0];
}

export async function createTenant({ name, code, subdomain, contactEmail, theme, features }) {
  const sql = `
    INSERT INTO emr.tenants (name, code, subdomain, contact_email, theme, features, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'active')
    RETURNING *
  `;

  const result = await query(sql, [
    name,
    code,
    subdomain,
    contactEmail || null,
    JSON.stringify(theme || { primary: '#0f5a6e', accent: '#f57f17' }),
    JSON.stringify(features || { inventory: true, telehealth: false }),
  ]);

  const tenant = result.rows[0];

  // Phase 2: Enterprise Abstractions - Auto-clone Master Data & Structures
  try {
    // 1. Setup Pharmacy Location structure (Centralized Main Store)
    await query(`
      INSERT INTO emr.locations (tenant_id, name, type, is_active)
      VALUES ($1, 'Central Hospital Store', 'Main Store', true)
    `, [tenant.id]);

    // 2. Setup baseline dynamic roles
    const rolesSql = `
      INSERT INTO emr.roles (tenant_id, name, description, is_system) VALUES 
      ($1, 'Doctor', 'Standard Physician Access', true),
      ($1, 'Nurse', 'Standard Nurse Access', true),
      ($1, 'Pharmacy', 'Standard Central Store Pharmacist', true),
      ($1, 'Billing', 'Revenue Cycle Management', true)
      RETURNING id, name
    `;
    const rolesResult = await query(rolesSql, [tenant.id]);

    // 3. Clone Global Master Data (e.g. Master ICD-10s, Essential Drugs)
    // In production, this would `INSERT INTO emr.drug_master SELECT * FROM emr.global_drug_master`
    
  } catch (err) {
    console.error(`Error provisioning master data for tenant ${tenant.id}:`, err.message);
  }

  return tenant;
}

// =====================================================
// USERS
// =====================================================

export async function getUsers(tenantId = null) {
  if (tenantId) {
    const result = await query(
      'SELECT id, tenant_id, email, name, role, patient_id, is_active, created_at FROM emr.users WHERE tenant_id = $1 ORDER BY name',
      [tenantId]
    );
    return result.rows;
  }

  const result = await query(
    'SELECT id, tenant_id, email, name, role, patient_id, is_active, created_at FROM emr.users ORDER BY name'
  );
  return result.rows;
}

export async function getUserById(id) {
  const result = await query(
    'SELECT id, tenant_id, email, name, role, patient_id, is_active, created_at FROM emr.users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

export async function getUserByEmail(email, tenantId = null) {
  let sql, params;

  if (tenantId === null) {
    // Superadmin login
    sql = 'SELECT * FROM emr.users WHERE LOWER(email) = LOWER($1) AND tenant_id IS NULL';
    params = [email];
  } else {
    // Tenant user login
    sql = 'SELECT * FROM emr.users WHERE LOWER(email) = LOWER($1) AND tenant_id = $2';
    params = [email, tenantId];
  }

  const result = await query(sql, params);
  return result.rows[0];
}

export async function createUser({ tenantId, email, passwordHash, name, role, patientId }) {
  const sql = `
    INSERT INTO emr.users (tenant_id, email, password_hash, name, role, patient_id, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, true)
    RETURNING id, tenant_id, email, name, role, patient_id, is_active, created_at
  `;

  const result = await query(sql, [
    tenantId || null,
    email,
    passwordHash,
    name,
    role,
    patientId || null,
  ]);

  return result.rows[0];
}

export async function updateUserLastLogin(userId) {
  await query('UPDATE emr.users SET last_login = NOW() WHERE id = $1', [userId]);
}

// =====================================================
// PATIENTS
// =====================================================

/**
 * Helper to mask sensitive PHI based on role
 */
function maskPatientData(patient, role) {
  if (!role) return patient; // Default to full access if no role specified (backward compat, but risky)

  const clinicalRoles = ['Doctor', 'Nurse', 'Superadmin']; // Superadmin getting data means Break Glass
  if (clinicalRoles.includes(role)) return patient;

  // Clone to avoid mutation
  const p = { ...patient };

  // 1. Pharmacy: Needs Prescriptions, Allergies. NO Notes, Lab Results, History.
  if (role === 'Pharmacy') {
    p.medicalHistory = undefined;
    p.caseHistory = undefined;
    p.recommendations = undefined;
    p.feedbacks = undefined;
    p.testReports = undefined; // Hide labs
    // Keep: medications, prescriptions, allergies (in medicalHistory? No, separate)
    if (p.medicalHistory) {
      const { allergies } = p.medicalHistory;
      p.medicalHistory = { allergies }; // Only keep allergies
    }
  }

  // 2. Lab: Needs Test Requests. NO Notes, Prescriptions.
  else if (role === 'Lab') {
    p.medicalHistory = undefined;
    p.caseHistory = undefined;
    p.medications = undefined;
    p.prescriptions = undefined;
    p.recommendations = undefined;
    p.feedbacks = undefined;
    // Keep: testReports (results) and demographics
  }

  // 3. Billing/Accounts/Insurance/HR/Operations: Needs Demographics for invoicing. NO Clinical.
  else if (['Billing', 'Accounts', 'Insurance', 'Front Office', 'Support Staff', 'HR', 'Operations'].includes(role)) {
    p.medicalHistory = undefined;
    p.caseHistory = undefined;
    p.medications = undefined;
    p.prescriptions = undefined;
    p.recommendations = undefined;
    p.feedbacks = undefined;
    p.testReports = undefined;
  }

  // 4. Management: Aggregated only found in other reports, but if they access patient list:
  else if (role === 'Management') {
    // Hide mostly everything personal
    p.medicalHistory = undefined;
    p.caseHistory = undefined;
    p.medications = undefined;
    p.prescriptions = undefined;
    p.testReports = undefined;
  }

  return p;
}

// Updated signature to accept limit and offset for pagination
export async function getPatients(tenantId, userRole = null, limit = 50, offset = 0, includeArchived = false) {
  // Use a subquery to limit patients BEFORE joining massive clinical record blobs
  const sql = `
    SELECT 
      p.*,
      COALESCE(
        (
          SELECT json_agg(cr.*) 
          FROM emr.clinical_records cr 
          WHERE cr.patient_id = p.id
        ), 
        '[]'::json
      ) as clinical_records
    FROM (
      SELECT * FROM emr.patients
      WHERE tenant_id = $1 AND (is_archived = false OR $4 = true)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    ) p
  `;

  const result = await query(sql, [tenantId, limit, offset, includeArchived]);

  return result.rows.map(patient => {
    const records = patient.clinical_records || [];
    const patientObj = {
      ...patient,
      firstName: patient.first_name,
      lastName: patient.last_name,
      dob: patient.date_of_birth,
      bloodGroup: patient.blood_group,
      emergencyContact: patient.emergency_contact,
      medicalHistory: patient.medical_history,
      caseHistory: records.filter(r => r.section === 'caseHistory').map(r => r.content),
      medications: records.filter(r => r.section === 'medications').map(r => r.content),
      prescriptions: records.filter(r => r.section === 'prescriptions').map(r => r.content),
      recommendations: records.filter(r => r.section === 'recommendations').map(r => r.content),
      feedbacks: records.filter(r => r.section === 'feedbacks').map(r => r.content),
      testReports: records.filter(r => r.section === 'testReports').map(r => r.content),
      clinical_records: undefined,
    };

    return maskPatientData(patientObj, userRole);
  });
}

export async function searchPatients(tenantId, { text, date, type, status, limit = 50, includeArchived = false }) {
  let sql = `
    SELECT DISTINCT p.*,
           e.encounter_type as latest_encounter_type,
           e.status as latest_encounter_status,
           e.visit_date as latest_visit_date
    FROM emr.patients p
    LEFT JOIN LATERAL (
      SELECT * FROM emr.encounters 
      WHERE patient_id = p.id 
      ORDER BY visit_date DESC LIMIT 1
    ) e ON true
    WHERE p.tenant_id = $1 AND (p.is_archived = false OR $2 = true)
  `;

  const params = [tenantId, includeArchived];
  let paramIdx = 3;

  if (text) {
    // Simple text search across common fields
    sql += ` AND (
      p.first_name ILIKE $${paramIdx} OR 
      p.last_name ILIKE $${paramIdx} OR 
      p.mrn ILIKE $${paramIdx} OR
      p.phone ILIKE $${paramIdx}
    )`;
    params.push(`%${text}%`);
    paramIdx++;
  }

  if (date) {
    // Search by visit date or DOB
    sql += ` AND (DATE(e.visit_date) = $${paramIdx} OR p.date_of_birth = $${paramIdx})`;
    params.push(date);
    paramIdx++;
  }

  if (type) {
    sql += ` AND e.encounter_type = $${paramIdx}`;
    params.push(type);
    paramIdx++;
  }

  if (status) {
    if (status === 'Admitted') {
      sql += ` AND e.status = 'open' AND e.encounter_type = 'IPD'`;
    } else if (status === 'Discharged') {
      // Patients whose last IPD encounter is closed
      sql += ` AND e.status = 'closed' AND e.encounter_type = 'IPD'`;
    }
  }

  sql += ` ORDER BY p.created_at DESC LIMIT 50`;

  const result = await query(sql, params);

  return result.rows.map(p => ({
    ...p,
    firstName: p.first_name,
    lastName: p.last_name,
    dob: p.date_of_birth,
    bloodGroup: p.blood_group,
    emergencyContact: p.emergency_contact,
    medicalHistory: p.medical_history,
  }));
}

// Updated signature
export async function getPatientById(id, tenantId, userRole = null) {
  const sql = `
    SELECT p.*,
           json_agg(DISTINCT cr.*) FILTER (WHERE cr.id IS NOT NULL) as clinical_records,
           json_agg(DISTINCT d.*) FILTER (WHERE d.id IS NOT NULL AND d.is_deleted = false) as documents
    FROM emr.patients p
    LEFT JOIN emr.clinical_records cr ON p.id = cr.patient_id
    LEFT JOIN emr.documents d ON p.id = d.patient_id
    WHERE p.id = $1 AND p.tenant_id = $2
    GROUP BY p.id
  `;

  const result = await query(sql, [id, tenantId]);

  if (result.rows.length === 0) return null;

  const patient = result.rows[0];
  const records = patient.clinical_records || [];
  const docs = patient.documents || [];

  const patientObj = {
    ...patient,
    firstName: patient.first_name,
    lastName: patient.last_name,
    dob: patient.date_of_birth,
    bloodGroup: patient.blood_group,
    emergencyContact: patient.emergency_contact,
    medicalHistory: {
      ...patient.medical_history,
      clinicalRecords: records,
      documents: docs,
      caseHistory: records.filter(r => r.section === 'caseHistory').map(r => r.payload || r.content),
      medications: records.filter(r => r.section === 'medications').map(r => r.payload || r.content),
      prescriptions: records.filter(r => r.section === 'prescriptions').map(r => r.payload || r.content),
      testReports: records.filter(r => r.section === 'testReports').map(r => r.payload || r.content),
    },
    clinical_records: undefined,
  };

  return maskPatientData(patientObj, userRole);
}

export async function getPatientDocuments(patientId, tenantId) {
  const sql = `
    SELECT * FROM emr.documents 
    WHERE patient_id = $1 AND tenant_id = $2 AND is_deleted = false
    ORDER BY created_at DESC
  `;
  const result = await query(sql, [patientId, tenantId]);
  return result.rows;
}

export async function createPatient({ tenantId, userId, firstName, lastName, dob, gender, phone, email, address, bloodGroup, emergencyContact, insurance, medicalHistory }) {
  const mrn = await generateMRN(tenantId);
  
  // Regional compliance: Generate mock ABHA (Gov Health ID)
  const abhaId = `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const finalMedicalHistory = {
    ...medicalHistory,
    governmentHealthId: abhaId,
    abhaStatus: 'Active'
  };


  const sql = `
    INSERT INTO emr.patients (
      tenant_id, mrn, first_name, last_name, date_of_birth, gender, 
      phone, email, address, blood_group, emergency_contact, insurance, medical_history
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId,
    mrn,
    firstName,
    lastName,
    dob || null,
    gender || null,
    phone || null,
    email || null,
    address || null,
    bloodGroup || null,
    emergencyContact || null,
    insurance || null,
    JSON.stringify(finalMedicalHistory),
  ]);


  const patient = result.rows[0];

  // Initialize empty clinical arrays
  patient.caseHistory = [];
  patient.medications = [];
  patient.prescriptions = [];
  patient.recommendations = [];
  patient.feedbacks = [];
  patient.testReports = [];

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: `patient.create`,
    entityName: 'patient',
    entityId: patient.id,
    details: { mrn: patient.mrn },
  });

  return {
    ...patient,
    firstName: patient.first_name,
    lastName: patient.last_name,
    dob: patient.date_of_birth,
    bloodGroup: patient.blood_group,
    emergencyContact: patient.emergency_contact,
    medicalHistory: patient.medical_history,
    caseHistory: [],
    medications: [],
    prescriptions: [],
    recommendations: [],
    feedbacks: [],
    testReports: [],
  };
}

export async function addClinicalRecord({ tenantId, userId, patientId, section, content }) {
  const sql = `
    INSERT INTO emr.clinical_records (tenant_id, patient_id, section, content, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId,
    patientId,
    section,
    JSON.stringify(content),
    userId || null,
  ]);

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: `patient.${section}.add`,
    entityName: 'clinical_record',
    entityId: result.rows[0].id,
    details: { patientId, section },
  });

  return result.rows[0];
}

// =====================================================
// WALK-INS
// =====================================================

export async function getWalkins(tenantId) {
  const result = await query(
    'SELECT * FROM emr.walkins WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  );
  return result.rows;
}

export async function createWalkin({ tenantId, userId, name, phone, reason }) {
  const sql = `
    INSERT INTO emr.walkins (tenant_id, name, phone, reason, status)
    VALUES ($1, $2, $3, $4, 'waiting')
    RETURNING *
  `;

  const result = await query(sql, [tenantId, name, phone, reason || null]);

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: 'walkin.create',
    entityName: 'walkin',
    entityId: result.rows[0].id,
  });

  return result.rows[0];
}

export async function convertWalkinToPatient({ walkinId, tenantId, userId, dob, gender }) {
  // Get walk-in
  const walkinResult = await query(
    'SELECT * FROM emr.walkins WHERE id = $1 AND tenant_id = $2',
    [walkinId, tenantId]
  );

  if (walkinResult.rows.length === 0) {
    throw new Error('Walk-in not found');
  }

  const walkin = walkinResult.rows[0];
  const [firstName, ...lastNameParts] = walkin.name.split(' ');
  const lastName = lastNameParts.join(' ') || '.';

  // Create patient
  const patient = await createPatient({
    tenantId,
    userId,
    firstName,
    lastName,
    dob: dob || null,
    gender: gender || null,
    phone: walkin.phone,
    email: null,
    address: null,
    bloodGroup: null,
    emergencyContact: null,
    insurance: null,
    medicalHistory: {},
  });

  // Update walk-in status
  await query(
    'UPDATE emr.walkins SET status = $1, patient_id = $2 WHERE id = $3',
    ['converted', patient.id, walkinId]
  );

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: 'walkin.convert',
    entityName: 'walkin',
    entityId: walkinId,
    details: { patientId: patient.id },
  });

  return patient;
}

// =====================================================
// APPOINTMENTS
// =====================================================

export async function getAppointments(tenantId, limit = 100, offset = 0) {
  const result = await query(
    'SELECT * FROM emr.appointments WHERE tenant_id = $1 ORDER BY scheduled_start DESC LIMIT $2 OFFSET $3',
    [tenantId, limit, offset]
  );
  return result.rows.map(row => ({
    ...row,
    patientId: row.patient_id,
    providerId: row.provider_id,
    start: row.scheduled_start,
    end: row.scheduled_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createAppointment({ tenantId, userId, patientId, providerId, start, end, reason, source = 'staff', status = 'scheduled' }) {
  const sql = `
    INSERT INTO emr.appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, reason, source, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId,
    patientId,
    providerId,
    start,
    end,
    reason || null,
    source,
    status,
  ]);

  const appointment = result.rows[0];

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: `appointment.${source === 'self' ? 'self_requested' : 'create'}`,
    entityName: 'appointment',
    entityId: appointment.id,
  });

  return {
    ...appointment,
    patientId: appointment.patient_id,
    providerId: appointment.provider_id,
    start: appointment.scheduled_start,
    end: appointment.scheduled_end,
  };
}

export async function updateAppointmentStatus({ appointmentId, tenantId, userId, status }) {
  const sql = `
    UPDATE emr.appointments
    SET status = $1, updated_at = NOW()
    WHERE id = $2 AND tenant_id = $3
    RETURNING *
  `;

  const result = await query(sql, [status, appointmentId, tenantId]);

  if (result.rows.length === 0) {
    throw new Error('Appointment not found');
  }

  // If completed, close any open encounters for this patient
  if (status === 'completed') {
    await query(
      `UPDATE emr.encounters 
       SET status = 'closed' 
       WHERE tenant_id = $1 AND patient_id = $2 AND status = 'open'`,
      [tenantId, result.rows[0].patient_id]
    );
  }

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: `appointment.${status}`,
    entityName: 'appointment',
    entityId: appointmentId,
  });

  const appointment = result.rows[0];
  return {
    ...appointment,
    patientId: appointment.patient_id,
    providerId: appointment.provider_id,
    start: appointment.scheduled_start,
    end: appointment.scheduled_end,
  };
}

export async function rescheduleAppointment({ appointmentId, tenantId, userId, start, end, reason }) {
  const sql = `
    UPDATE emr.appointments
    SET scheduled_start = $1, 
        scheduled_end = $2, 
        reason = COALESCE($3, reason),
        updated_at = NOW()
    WHERE id = $4 AND tenant_id = $5
    RETURNING *
  `;

  const result = await query(sql, [start, end, reason, appointmentId, tenantId]);

  if (result.rows.length === 0) {
    throw new Error('Appointment not found');
  }

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: 'appointment.rescheduled',
    entityName: 'appointment',
    entityId: appointmentId,
  });

  const appointment = result.rows[0];
  return {
    ...appointment,
    patientId: appointment.patient_id,
    providerId: appointment.provider_id,
    start: appointment.scheduled_start,
    end: appointment.scheduled_end,
  };
}

// =====================================================


// Encounters
export async function getEncounters(tenantId) {
  const sql = `
    SELECT e.*, p.first_name, p.last_name, u.name as provider_name
    FROM emr.encounters e
    LEFT JOIN emr.patients p ON e.patient_id = p.id
    LEFT JOIN emr.users u ON e.provider_id = u.id
    WHERE e.tenant_id = $1
    ORDER BY e.created_at DESC
  `;
  const result = await query(sql, [tenantId]);
  return result.rows.map(row => ({
    ...row,
    patientName: `${row.first_name} ${row.last_name}`,
    providerName: row.provider_name
  }));
}

export async function createEncounter({ tenantId, userId, patientId, providerId, type, complaint, diagnosis, notes }) {
  const sql = `
    INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, encounter_type, chief_complaint, diagnosis, notes, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId,
    patientId,
    providerId,
    type,
    complaint || null,
    diagnosis || null,
    notes || null,
  ]);

  const encounter = result.rows[0];

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: 'encounter.create',
    entityName: 'encounter',
    entityId: encounter.id,
  });

  return {
    ...encounter,
    type: encounter.encounter_type,
    complaint: encounter.chief_complaint,
  };
}

export async function dischargePatient({ tenantId, userId, encounterId, diagnosis, notes }) {
  const sql = `
    UPDATE emr.encounters
    SET status = 'closed',
        diagnosis = COALESCE($1, diagnosis),
        notes = COALESCE($2, notes),
        updated_at = NOW()
    WHERE id = $3 AND tenant_id = $4 AND encounter_type IN ('IPD', 'In-patient') AND status = 'open'
    RETURNING *
  `;

  const result = await query(sql, [diagnosis || null, notes || null, encounterId, tenantId]);

  if (result.rows.length === 0) {
    throw new Error('Active IPD encounter not found');
  }

  const encounter = result.rows[0];

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: 'encounter.discharge',
    entityName: 'encounter',
    entityId: encounterId,
    details: { diagnosis, notes }
  });

  return {
    ...encounter,
    type: encounter.encounter_type,
    complaint: encounter.chief_complaint,
  };
}

// =====================================================
// INVOICES
// =====================================================

export async function getInvoices(tenantId) {
  const result = await query(
    'SELECT * FROM emr.invoices WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  );
  return result.rows.map(row => ({
    ...row,
    number: row.invoice_number,
    patientId: row.patient_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    subtotal: parseFloat(row.subtotal),
    tax: parseFloat(row.tax),
    total: parseFloat(row.total),
    paid: parseFloat(row.paid),
  }));
}

export async function createInvoice({ tenantId, userId, patientId, description, amount, taxPercent = 0, paymentMethod = null }) {
  const invoiceNumber = await generateInvoiceNumber(tenantId);
  const subtotal = parseFloat(amount);
  const tax = subtotal * (parseFloat(taxPercent) / 100);
  const total = subtotal + tax;

  // If payment method is provided, we consider it paid immediately
  const isPaidNow = paymentMethod && paymentMethod !== 'Pending';
  const status = isPaidNow ? 'paid' : 'issued';
  const paidAmount = isPaidNow ? total : 0;

  const sql = `
    INSERT INTO emr.invoices (tenant_id, patient_id, invoice_number, description, subtotal, tax, total, paid, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId,
    patientId,
    invoiceNumber,
    description || null,
    subtotal,
    tax,
    total,
    paidAmount,
    status
  ]);

  const invoice = result.rows[0];

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: isPaidNow ? 'invoice.create_paid' : 'invoice.issue',
    entityName: 'invoice',
    entityId: invoice.id,
    details: { invoiceNumber, paymentMethod, total },
  });

  return {
    ...invoice,
    number: invoice.invoice_number,
    patientId: invoice.patient_id,
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
    subtotal: parseFloat(invoice.subtotal),
    tax: parseFloat(invoice.tax),
    total: parseFloat(invoice.total),
    paid: parseFloat(invoice.paid),
    paymentMethod // Return it back for UI immediately
  };
}

export async function payInvoice({ invoiceId, tenantId, userId, paymentMethod = 'Cash' }) {
  const sql = `
    UPDATE emr.invoices
    SET paid = total, status = 'paid', updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;

  const result = await query(sql, [invoiceId, tenantId]);

  if (result.rows.length === 0) {
    throw new Error('Invoice not found');
  }

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: 'invoice.paid',
    entityName: 'invoice',
    entityId: invoiceId,
    details: { paymentMethod }
  });

  const invoice = result.rows[0];
  return {
    ...invoice,
    number: invoice.invoice_number,
    patientId: invoice.patient_id,
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
    subtotal: parseFloat(invoice.subtotal),
    tax: parseFloat(invoice.tax),
    total: parseFloat(invoice.total),
    paid: parseFloat(invoice.paid),
  };
}

// =====================================================
// INVENTORY
// =====================================================

export async function getInventoryItems(tenantId) {
  const result = await query(
    'SELECT * FROM emr.inventory_items WHERE tenant_id = $1 ORDER BY name',
    [tenantId]
  );
  return result.rows.map(row => ({
    ...row,
    code: row.item_code,
    stock: parseFloat(row.current_stock),
    reorder: parseFloat(row.reorder_level),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createInventoryItem({ tenantId, userId, code, name, category, stock = 0, reorder = 0 }) {
  const sql = `
    INSERT INTO emr.inventory_items (tenant_id, item_code, name, category, current_stock, reorder_level)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId,
    code,
    name,
    category || null,
    stock,
    reorder,
  ]);

  const item = result.rows[0];

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: 'inventory.create',
    entityName: 'inventory_item',
    entityId: item.id,
    details: { code },
  });

  return {
    ...item,
    code: item.item_code,
    stock: parseFloat(item.current_stock),
    reorder: parseFloat(item.reorder_level),
  };
}

export async function updateInventoryStock({ itemId, tenantId, userId, delta }) {
  const sql = `
    UPDATE emr.inventory_items
    SET current_stock = GREATEST(0, current_stock + $1), updated_at = NOW()
    WHERE id = $2 AND tenant_id = $3
    RETURNING *
  `;

  const result = await query(sql, [delta, itemId, tenantId]);

  if (result.rows.length === 0) {
    throw new Error('Inventory item not found');
  }

  const transactionType = delta > 0 ? 'receipt' : 'issue';

  // Create transaction record
  await query(
    `INSERT INTO emr.inventory_transactions (tenant_id, item_id, transaction_type, quantity, created_by)
     VALUES ($1, $2, $3, $4, $5)`,
    [tenantId, itemId, transactionType, Math.abs(delta), userId]
  );

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: `inventory.${transactionType}`,
    entityName: 'inventory_item',
    entityId: itemId,
    details: { delta },
  });

  const item = result.rows[0];
  return {
    ...item,
    code: item.item_code,
    stock: parseFloat(item.current_stock),
    reorder: parseFloat(item.reorder_level),
  };
}

// =====================================================
// EMPLOYEES
// =====================================================

export async function getEmployees(tenantId) {
  const result = await query(
    'SELECT * FROM emr.employees WHERE tenant_id = $1 ORDER BY name',
    [tenantId]
  );
  return result.rows.map(row => ({
    ...row,
    salary: parseFloat(row.salary),
    leaveBalance: parseFloat(row.leave_balance),
    joinDate: row.join_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createEmployee({ tenantId, name, code, department, designation, joinDate, shift, salary }) {
  const sql = `
    INSERT INTO emr.employees (tenant_id, name, code, department, designation, join_date, shift, salary, leave_balance)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 12)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId,
    name,
    code,
    department || null,
    designation || null,
    joinDate || null,
    shift || null,
    salary || 0,
  ]);

  const employee = result.rows[0];
  return {
    ...employee,
    salary: parseFloat(employee.salary),
    leaveBalance: parseFloat(employee.leave_balance),
    joinDate: employee.join_date,
    createdAt: employee.created_at,
    updatedAt: employee.updated_at,
  };
}

export async function getEmployeeLeaves(tenantId) {
  const result = await query(
    'SELECT * FROM emr.employee_leaves WHERE tenant_id = $1 ORDER BY from_date DESC',
    [tenantId]
  );
  return result.rows.map(row => ({
    ...row,
    from: row.from_date,
    to: row.to_date,
    type: row.leave_type,
    employeeId: row.employee_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createEmployeeLeave({ tenantId, employeeId, from, to, type }) {
  // Calculate days
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

  const sql = `
    INSERT INTO emr.employee_leaves (tenant_id, employee_id, leave_type, from_date, to_date, days, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId,
    employeeId,
    type,
    from,
    to,
    days,
  ]);

  const leave = result.rows[0];
  return {
    ...leave,
    from: leave.from_date,
    to: leave.to_date,
    type: leave.leave_type,
    employeeId: leave.employee_id,
    createdAt: leave.created_at,
    updatedAt: leave.updated_at,
  };
}

// =====================================================
// REPORTS
// =====================================================

export async function getReportSummary(tenantId) {
  const today = new Date().toISOString().split('T')[0];

  // Periodical stats
  const periodicalResult = await query(
    `SELECT
      (SELECT COUNT(*) FROM emr.appointments WHERE tenant_id = $1 AND DATE(scheduled_start) = $2) as daily_appointments,
      (SELECT COUNT(*) FROM emr.appointments WHERE tenant_id = $1 AND status IN ('requested', 'scheduled', 'checked_in')) as open_appointments,
      (SELECT COUNT(*) FROM emr.clinical_records WHERE tenant_id = $1 AND section = 'testReports') as active_lab_tests,
      (SELECT COUNT(*) FROM emr.invoices WHERE tenant_id = $1 AND status != 'paid') as pending_invoices
    `,
    [tenantId, today]
  );

  // Monthly comparison - appointments
  const appointmentsResult = await query(
    `SELECT 
      TO_CHAR(scheduled_start, 'YYYY-MM') as month,
      COUNT(*) as count
    FROM emr.appointments
    WHERE tenant_id = $1
    GROUP BY TO_CHAR(scheduled_start, 'YYYY-MM')
    ORDER BY month`,
    [tenantId]
  );

  // Monthly comparison - revenue
  const revenueResult = await query(
    `SELECT 
      TO_CHAR(created_at, 'YYYY-MM') as month,
      SUM(paid) as amount
    FROM emr.invoices
    WHERE tenant_id = $1
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    ORDER BY month`,
    [tenantId]
  );

  // Tax calculation
  const taxResult = await query(
    `SELECT SUM(tax) as total_tax FROM emr.invoices WHERE tenant_id = $1`,
    [tenantId]
  );

  // HR stats
  const hrResult = await query(
    `SELECT 
      COUNT(*) as employees,
      SUM(salary) as salary_outflow
    FROM emr.employees
    WHERE tenant_id = $1`,
    [tenantId]
  );

  // Critical lab results (latest 5)
  const criticalLabResult = await query(
    `SELECT sr.*, p.first_name || ' ' || p.last_name as patient_name
     FROM emr.service_requests sr
     JOIN emr.patients p ON sr.patient_id = p.id
     WHERE sr.tenant_id = $1 AND sr.category = 'lab' AND sr.status = 'completed' AND sr.notes::jsonb->>'criticalFlag' = 'true'
     ORDER BY sr.updated_at DESC LIMIT 5`,
    [tenantId]
  );

  // Daily activity (last 14 days)
  const dailyActivityResult = await query(
    `WITH date_series AS (
      SELECT generate_series(
        current_date - interval '13 days',
        current_date,
        '1 day'::interval
      )::date as day
    ),
    appointment_stats AS (
      SELECT 
        date_trunc('day', scheduled_start)::date as day,
        count(*) as count
      FROM emr.appointments
      WHERE tenant_id = $1 AND scheduled_start >= current_date - interval '14 days'
      GROUP BY 1
    ),
    revenue_stats AS (
      SELECT
        date_trunc('day', created_at)::date as day,
        sum(paid) as amount
      FROM emr.invoices
      WHERE tenant_id = $1 AND created_at >= current_date - interval '14 days'
      GROUP BY 1
    )
    SELECT 
      ds.day,
      COALESCE(ap.count, 0) as appointments,
      COALESCE(rs.amount, 0) as revenue
    FROM date_series ds
    LEFT JOIN appointment_stats ap ON ds.day = ap.day
    LEFT JOIN revenue_stats rs ON ds.day = rs.day
    ORDER BY ds.day`,
    [tenantId]
  );

  return {
    periodical: {
      dailyAppointments: parseInt(periodicalResult.rows[0].daily_appointments),
      openAppointments: parseInt(periodicalResult.rows[0].open_appointments),
      activeLabTests: parseInt(periodicalResult.rows[0].active_lab_tests),
      pendingInvoices: parseInt(periodicalResult.rows[0].pending_invoices),
    },
    criticalAlerts: criticalLabResult.rows.map(r => ({
      id: r.id,
      patientName: r.patient_name,
      testName: r.display,
      date: r.updated_at,
      details: JSON.parse(r.notes || '{}')
    })),
    monthlyComparison: {
      appointments: appointmentsResult.rows.map(r => ({
        month: r.month,
        count: parseInt(r.count),
      })),
      revenue: revenueResult.rows.map(r => ({
        month: r.month,
        amount: parseFloat(r.amount || 0),
      })),
    },
    dailyActivity: dailyActivityResult.rows.map(r => ({
      date: r.day,
      appointments: parseInt(r.appointments),
      revenue: parseFloat(r.revenue),
    })),
    tax: {
      applicable: parseFloat(taxResult.rows[0].total_tax || 0) > 0,
      totalTax: parseFloat(taxResult.rows[0].total_tax || 0),
    },
    hr: {
      employees: parseInt(hrResult.rows[0].employees || 0),
      salaryOutflow: parseFloat(hrResult.rows[0].salary_outflow || 0),
    },
  };
}

// =====================================================
// SUPERADMIN
// =====================================================

export async function getSuperadminOverview() {
  const tenantsResult = await query('SELECT * FROM emr.tenants ORDER BY name');
  const tenants = tenantsResult.rows;

  const tenantStats = [];

  for (const tenant of tenants) {
    const stats = await query(
      `SELECT
        (SELECT COUNT(*) FROM emr.users WHERE tenant_id = $1) as users,
        (SELECT COUNT(*) FROM emr.patients WHERE tenant_id = $1) as patients,
        (SELECT COUNT(*) FROM emr.appointments WHERE tenant_id = $1) as appointments,
        (SELECT SUM(paid) FROM emr.invoices WHERE tenant_id = $1) as revenue
      `,
      [tenant.id]
    );

    tenantStats.push({
      tenantId: tenant.id,
      tenantName: tenant.name,
      users: parseInt(stats.rows[0].users),
      patients: parseInt(stats.rows[0].patients),
      appointments: parseInt(stats.rows[0].appointments),
      revenue: parseFloat(stats.rows[0].revenue || 0),
    });
  }

  const totals = await query(
    `SELECT
      (SELECT COUNT(*) FROM emr.tenants) as tenants,
      (SELECT COUNT(*) FROM emr.users) as users,
      (SELECT COUNT(*) FROM emr.patients) as patients,
      (SELECT COUNT(*) FROM emr.appointments) as appointments
    `
  );

  /* Aggregate Monthly Revenue for Platform */
  const monthlyRevenue = await query(`
    SELECT
      to_char(created_at, 'Mon') as month,
      SUM(paid) as amount
    FROM emr.invoices
    WHERE status = 'paid' AND created_at > current_date - interval '6 months'
    GROUP BY to_char(created_at, 'Mon'), date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at)
  `);

  return {
    tenants: tenantStats,
    totals: {
      tenants: parseInt(totals.rows[0].tenants),
      users: parseInt(totals.rows[0].users),
      patients: parseInt(totals.rows[0].patients),
      appointments: parseInt(totals.rows[0].appointments),
    },
    monthlyComparison: {
      revenue: monthlyRevenue.rows.map(r => ({
        month: r.month,
        amount: parseFloat(r.amount)
      }))
    },
    infra: {
      cpu: Math.floor(Math.random() * 15) + 20,
      memory: Math.floor(Math.random() * 10) + 45,
      disk: 62,
      network: Math.floor(Math.random() * 5) + 5
    }
  };
}







// =====================================================
// PRESCRIPTIONS & PHARMACY
// =====================================================

export async function getPrescriptions(tenantId, filters = {}) {
  let sql = `
    SELECT pr.*, 
           p.first_name || ' ' || p.last_name as patient_name,
           p.mrn as patient_mrn,
           u.name as doctor_name
    FROM emr.prescriptions pr
    JOIN emr.encounters e ON pr.encounter_id = e.id
    JOIN emr.patients p ON e.patient_id = p.id
    LEFT JOIN emr.users u ON e.provider_id = u.id
    WHERE pr.tenant_id = $1
  `;

  const params = [tenantId];
  if (filters.status) {
    sql += ` AND pr.status = $2`;
    params.push(filters.status);
  }

  sql += ` ORDER BY pr.created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
}

// =====================================================
// DOCTOR PAYOUTS & ACCOUNTS
// =====================================================

export async function getDoctorPayouts(tenantId) {
  // Calculate revenue per doctor based on paid invoices linked to their encounters
  const sql = `
    SELECT 
      u.id as doctor_id,
      u.name as doctor_name,
      u.role,
      COUNT(DISTINCT e.patient_id) as patient_count,
      COUNT(DISTINCT e.id) as encounter_count,
      COALESCE(SUM(i.total), 0) as total_revenue,
      COALESCE(SUM(i.paid), 0) as collected_amount,
      -- Assume 30% commission for visiting doctors/consultants
      (COALESCE(SUM(i.paid), 0) * 0.30) as estimated_commission
    FROM emr.users u
    JOIN emr.encounters e ON u.id = e.provider_id
    JOIN emr.invoices i ON e.id = i.encounter_id
    WHERE u.tenant_id = $1 
      AND u.role = 'Doctor'
      AND i.status = 'paid'
      AND i.created_at > (NOW() - INTERVAL '30 days')
    GROUP BY u.id, u.name, u.role
    ORDER BY total_revenue DESC
  `;

  const result = await query(sql, [tenantId]);
  return result.rows;
}



export async function getPrescriptionById(id, tenantId) {
  const sql = `
    SELECT pr.*,
  p.first_name || ' ' || p.last_name as patient_name,
  p.mrn as patient_mrn,
  u.name as doctor_name
    FROM emr.prescriptions pr
    JOIN emr.encounters e ON pr.encounter_id = e.id
    JOIN emr.patients p ON e.patient_id = p.id
    LEFT JOIN emr.users u ON e.provider_id = u.id
    WHERE pr.id = $1 AND pr.tenant_id = $2
  `;
  const result = await query(sql, [id, tenantId]);
  return result.rows[0];
}

export async function createPrescription({ tenantId, encounter_id, drug_name, dosage, frequency, duration, instructions, is_followup, followup_date, followup_notes }) {
  const sql = `
    INSERT INTO emr.prescriptions(
    tenant_id, encounter_id, drug_name, dosage, frequency, duration, instructions, status, is_followup, followup_date, followup_notes
  )
VALUES($1, $2, $3, $4, $5, $6, $7, 'Pending', $8, $9, $10)
RETURNING *
  `;
  const result = await query(sql, [
    tenantId, encounter_id, drug_name, dosage || null, frequency || null, duration || null, instructions || null,
    !!is_followup, followup_date || null, followup_notes || null
  ]);
  return result.rows[0];
}

export async function updatePrescriptionStatus({ id, tenantId, userId, status }) {
  const sql = `
    UPDATE emr.prescriptions
    SET status = $1, updated_at = NOW()
    WHERE id = $2 AND tenant_id = $3
RETURNING *
  `;
  const result = await query(sql, [status, id, tenantId]);

  if (result.rows.length > 0) {
    await createAuditLog({
      tenantId,
      userId,
      userName: null, // Add missing userName parameter
      action: `prescription.${status.toLowerCase()} `,
      entityName: 'prescription',
      entityId: id,
      details: { status }
    });
  }

  return result.rows[0];
}

export async function dispensePrescription({ id, tenantId, userId, itemId, quantity }) {
  // Start a transaction if needed, but here we can just use the repository pattern
  // Update prescription status
  const prescription = await updatePrescriptionStatus({ id, tenantId, userId, status: 'Dispensed' });

  if (!prescription) throw new Error('Prescription not found');

  // If itemId is provided, update inventory
  if (itemId && quantity) {
    await updateInventoryStock({
      itemId,
      tenantId,
      userId,
      delta: -Math.abs(quantity)
    });
  }

  return prescription;
}

// =====================================================
// BOOTSTRAP
// =====================================================

export async function getBootstrapData(tenantId, userId) {
  // Parallel fetch for speed
  const [
    user,
    patients,
    appointments,
    walkins,
    encounters,
    invoices,
    inventory,
    employees,
    employeesLeaves,
    insuranceProviders,
    claims
  ] = await Promise.all([
    getUserById(userId),
    // Placeholder for other data to be fetched below
    Promise.resolve([]),
    getAppointments(tenantId),
    getWalkins(tenantId),
    getEncounters(tenantId),
    getInvoices(tenantId),
    getInventoryItems(tenantId),
    getEmployees(tenantId),
    getEmployeeLeaves(tenantId),
    getInsuranceProviders(tenantId),
    getClaims(tenantId)
  ]);

  if (!user) throw new Error('User not found');

  // Normalize user role casing for permission matching (e.g., "doctor" -> "Doctor")
  let userRole = user.role;
  if (userRole) {
    userRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();
    if (userRole === 'Front office') userRole = 'Front Office';
    else if (userRole === 'Support staff') userRole = 'Support Staff';
    else if (userRole === 'Hr') userRole = 'HR';
    else if (userRole === 'Administrator' || userRole === 'Admin role') userRole = 'Admin';
  }


  // Also update the role on the user object itself for the frontend
  user.role = userRole;

  // Securely fetch patients with masking
  // Only some roles should see patients list at all? 
  // For now, consistent with PERMISSIONS, we let them fetch but mask.
  const securePatients = await getPatients(tenantId, userRole);

  // Filter permissions
  const { getPermissions } = await import('../middleware/auth.middleware.js');
  const allPermissions = getPermissions();
  const permissions = allPermissions[userRole] || [];

  return {
    user,
    permissions: { [userRole]: permissions },
    patients: securePatients,
    appointments,
    walkins,
    encounters,
    invoices,
    inventory,
    employees,
    employeeLeaves: employeesLeaves,
    insuranceProviders,
    claims
  };
}

// =====================================================
// EXPORTS
// =====================================================





// =====================================================
// INSURANCE
// =====================================================

export async function getInsuranceProviders(tenantId) {
  const result = await query(
    'SELECT * FROM emr.insurance_providers WHERE tenant_id = $1 ORDER BY name',
    [tenantId]
  );
  return result.rows;
}

export async function createInsuranceProvider({ tenantId, name, type, coverageLimit, contactPerson, phone, email }) {
  const sql = `
    INSERT INTO emr.insurance_providers (tenant_id, name, type, coverage_limit, contact_person, phone, email, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')
    RETURNING *
  `;
  const result = await query(sql, [tenantId, name, type, coverageLimit, contactPerson, phone, email]);
  return result.rows[0];
}

export async function getClaims(tenantId, filters = {}) {
  let sql = `
    SELECT c.*, p.first_name || ' ' || p.last_name as patient_name, ip.name as provider_name
    FROM emr.claims c
    JOIN emr.patients p ON c.patient_id = p.id
    JOIN emr.insurance_providers ip ON c.provider_id = ip.id
    WHERE c.tenant_id = $1
  `;
  const params = [tenantId];
  if (filters.status) {
    sql += ` AND c.status = $2`;
    params.push(filters.status);
  }
  sql += ' ORDER BY c.created_at DESC';
  const result = await query(sql, params);
  return result.rows;
}

export async function createClaim({ tenantId, patientId, providerId, amount, claimNumber, encounterId = null, invoiceId = null }) {
  const sql = `
    INSERT INTO emr.claims (tenant_id, patient_id, provider_id, amount, claim_number, encounter_id, invoice_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
    RETURNING *
  `;
  const result = await query(sql, [tenantId, patientId, providerId, amount, claimNumber, encounterId, invoiceId]);
  return result.rows[0];
}

// =====================================================
// ACCOUNTS (Financial Summary)
// =====================================================

export async function getFinancialSummary(tenantId, month) {
  // Total Income (Paid Invoices)
  const incomeResult = await query(
    `SELECT SUM(paid) as income FROM emr.invoices WHERE tenant_id = $1 AND TO_CHAR(created_at, 'YYYY-MM') = $2`,
    [tenantId, month.slice(0, 7)]
  );

  // Total Expenses
  const expenseResult = await query(
    `SELECT category, SUM(amount) as amount FROM emr.expenses 
     WHERE tenant_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
     GROUP BY category`,
    [tenantId, month.slice(0, 7)]
  );

  const expenses = {};
  expenseResult.rows.forEach(r => {
    expenses[r.category] = parseFloat(r.amount);
  });

  return {
    income: parseFloat(incomeResult.rows[0]?.income || 0),
    expenses,
    month
  };
}

export async function getExpenses(tenantId, { month } = {}) {
  let sql = 'SELECT * FROM emr.expenses WHERE tenant_id = $1';
  const params = [tenantId];
  if (month) {
    sql += ` AND TO_CHAR(date, 'YYYY-MM') = $2`;
    params.push(month.slice(0, 7));
  }
  sql += ' ORDER BY date DESC';
  const result = await query(sql, params);
  return result.rows;
}

export async function addExpense({ tenantId, category, description, amount, date, paymentMethod, reference, recordedBy }) {
  const sql = `
    INSERT INTO emr.expenses (tenant_id, category, description, amount, date, payment_method, reference, recorded_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, category, description, amount, date, paymentMethod, reference, recordedBy]);
  return result.rows[0];
}

export async function getAttendance(tenantId, date) {
  const sql = `
    SELECT a.*, e.name, e.code, e.shift
    FROM emr.attendance a
    JOIN emr.employees e ON a.employee_id = e.id
    WHERE a.tenant_id = $1 AND a.date = $2
  `;
  const result = await query(sql, [tenantId, date]);
  return result.rows;
}

export async function recordAttendance({ tenantId, employeeId, date, status, checkIn, checkOut }) {
  const sql = `
    INSERT INTO emr.attendance (tenant_id, employee_id, date, status, check_in, check_out)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (tenant_id, employee_id, date) 
    DO UPDATE SET 
      status = EXCLUDED.status, 
      check_in = EXCLUDED.check_in, 
      check_out = EXCLUDED.check_out,
    updated_at = NOW()
    RETURNING *
  `;
  const result = await query(sql, [tenantId, employeeId, date, status, checkIn || null, checkOut || null]);
  return result.rows[0];
}


export async function getWards(tenantId) {
  const sql = 'SELECT * FROM emr.wards WHERE tenant_id = $1 ORDER BY name';
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createWard({ tenantId, name, type, base_rate }) {
  const sql = `
    INSERT INTO emr.wards (tenant_id, name, type, base_rate)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, name, type, base_rate]);
  return result.rows[0];
}

export async function getBeds(wardId) {
  const sql = 'SELECT * FROM emr.beds WHERE ward_id = $1 ORDER BY bed_number';
  const result = await query(sql, [wardId]);
  return result.rows;
}

export async function createBed({ tenant_id, ward_id, bed_number }) {
  const sql = `
    INSERT INTO emr.beds (tenant_id, ward_id, bed_number)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await query(sql, [tenant_id, ward_id, bed_number]);
  return result.rows[0];
}

/**
 * Department Repository Functions
 */
export async function getDepartments(tenantId) {
  const sql = 'SELECT * FROM emr.departments WHERE tenant_id = $1 ORDER BY name';
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createDepartment({ tenantId, name, code, hod_user_id }) {
  const sql = `
    INSERT INTO emr.departments (tenant_id, name, code, hod_user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, name, code, hod_user_id || null]);
  const dept = result.rows[0];

  await createAuditLog({
    tenantId,
    action: 'department.create',
    entityName: 'department',
    entityId: dept.id,
    details: { name, code }
  });

  return dept;
}

/**
 * Service Catalog Repository Functions
 */
export async function getServices(tenantId) {
  const sql = 'SELECT * FROM emr.services WHERE tenant_id = $1 ORDER BY category, name';
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createService({ tenantId, name, code, category, base_rate, tax_percent }) {
  const sql = `
    INSERT INTO emr.services (tenant_id, name, code, category, base_rate, tax_percent)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, name, code, category, base_rate, tax_percent || 0]);
  const service = result.rows[0];

  await createAuditLog({
    tenantId,
    action: 'service.create',
    entityName: 'service',
    entityId: service.id,
    details: { name, code, category, base_rate }
  });

  return service;
}

export default {
  // Tenants
  getTenants,
  getTenantById,
  getTenantByCode,
  createTenant,
  updateTenantSettings,

  // Users
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUserLastLogin,

  // Patients
  getPatients,
  getPatientById,
  createPatient,
  addClinicalRecord,
  searchPatients,

  // Walk-ins
  getWalkins,
  createWalkin,
  convertWalkinToPatient,

  // Appointments
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,

  // Encounters
  getEncounters,
  createEncounter,
  dischargePatient,

  // Invoices
  getInvoices,
  createInvoice,
  payInvoice,

  // Inventory
  getInventoryItems,
  createInventoryItem,
  updateInventoryStock,

  // Employees
  getEmployees,
  getEmployeeLeaves,
  createEmployee,
  createEmployeeLeave,
  recordAttendance,
  getAttendance,

  // Insurance
  getInsuranceProviders,
  createInsuranceProvider,
  getClaims,
  createClaim,

  // Reports & Accounts
  getReportSummary,
  getFinancialSummary,
  getExpenses,
  addExpense,
  getDoctorPayouts,

  // Pharmacy
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescriptionStatus,
  dispensePrescription,

  // Infrastructure
  getWards,
  createWard,
  getBeds,
  createBed,
  getDepartments,
  createDepartment,
  getServices,
  createService,

  // Bootstrap
  getBootstrapData,

  // Superadmin
  getSuperadminOverview,

  // Support Tickets
  getSupportTickets,
  createSupportTicket,
  updateSupportTicketStatus,

  // Ambulance
  getAmbulances,
  createAmbulance,
  updateAmbulanceStatus,
  dispatchAmbulance,

  // Blood Bank
  getBloodUnits,
  createBloodUnit,
  getBloodRequests,
  createBloodRequest,

  // Doctor Availability
  getDoctorAvailability,
  createDoctorAvailability,
  generateDoctorAvailabilitySlots,
  updateDoctorAvailabilitySlot,
  incrementAppointmentCount,
  decrementAppointmentCount,
  getAvailableSlotsForDoctor,
  getDoctorAvailabilityCalendar,
  deleteDoctorAvailability,

  // OPD Token Queue System
  generateOPDToken,
  getOPDTokens,
  getOPDTokenById,
  updateTokenStatus,
  callNextToken,
  getTokenQueueStats,
  getActiveTokensByDepartment,
  updateTokenVitals,
  getTokenHistory,
  deleteOPDToken,

  // OPD Billing System
  createOPDBill,
  getOPDBills,
  getOPDBillById,
  updateOPDBill,
  addBillItem,
  updateBillStatus,
  processPayment,
  getBillingStats,
  getServicePackages,
  createServicePackage,
  applyServicePackage,

  // Communication System
  createCommunicationTemplate,
  getCommunicationTemplates,
  sendCommunication,
  getPatientCommunications,
  updateCommunicationStatus,
  getCommunicationSettings,
  updateCommunicationSettings,
  scheduleAppointmentReminder,
  sendTokenCallNotification,
  sendBillingReminder,

  // Exotel SMS Integration
  createExotelConfiguration,
  getExotelConfigurations,
  updateExotelConfiguration,
  createSMSCampaign,
  getSMSCampaigns,
  sendExotelSMS,
  getExotelSMSLogs,
  createExotelNumberPool,
  getExotelNumberPools,
  processExotelWebhook,
  processExotelDeliveryReport,
  retryFailedSMS,
  getPendingRetries,
  processScheduledCampaigns,
  getExotelSMSStats,
};

/**
 * Support Ticket Repository Functions
 */
export async function getSupportTickets(tenantId) {
  let sql = `
    SELECT t.*, u.name as creator_name, ten.name as tenant_name
    FROM emr.support_tickets t
    LEFT JOIN emr.users u ON t.created_by = u.id
    LEFT JOIN emr.tenants ten ON t.tenant_id = ten.id
  `;
  const params = [];

  if (tenantId) {
    sql += ` WHERE t.tenant_id = $1`;
    params.push(tenantId);
  }

  sql += ` ORDER BY t.created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
}

export async function createSupportTicket({ tenantId, userId, type, location, description, priority }) {
  const sql = `
    INSERT INTO emr.support_tickets (tenant_id, created_by, type, location, description, priority)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, userId, type, location, description, priority || 'medium']);
  const ticket = result.rows[0];

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: 'support.ticket.create',
    entityName: 'support_ticket',
    entityId: ticket.id,
    details: { type, priority }
  });

  return ticket;
}

export async function updateSupportTicketStatus({ id, tenantId, userId, status }) {
  let sql, params;

  if (tenantId) {
    sql = `
      UPDATE emr.support_tickets
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;
    params = [status, id, tenantId];
  } else {
    sql = `
      UPDATE emr.support_tickets
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    params = [status, id];
  }

  const result = await query(sql, params);
  if (result.rows.length === 0) throw new Error('Ticket not found');

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: `support.ticket.status.${status}`,
    entityName: 'support_ticket',
    entityId: id,
  });

  return result.rows[0];
}

/**
 * Ambulance Repository Functions
 */
export async function getAmbulances(tenantId) {
  const sql = 'SELECT * FROM emr.ambulances WHERE tenant_id = $1 ORDER BY vehicle_number';
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createAmbulance({ tenantId, userId, vehicle_number, model, status, current_driver, contact_number, lat, lng }) {
  const sql = `
    INSERT INTO emr.ambulances (tenant_id, vehicle_number, model, status, current_driver, contact_number, lat, lng)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, vehicle_number, model, status || 'Available', current_driver, contact_number, lat, lng]);
  const ambulance = result.rows[0];

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: 'ambulance.create',
    entityName: 'ambulance',
    entityId: ambulance.id,
    details: { vehicle_number }
  });

  return ambulance;
}

export async function updateAmbulanceStatus(id, tenantId, status, lat, lng) {
  const sql = `
    UPDATE emr.ambulances
    SET status = $1, lat = COALESCE($2, lat), lng = COALESCE($3, lng), updated_at = NOW()
    WHERE id = $4 AND tenant_id = $5
    RETURNING *
  `;
  const result = await query(sql, [status, lat, lng, id, tenantId]);
  if (result.rows.length === 0) throw new Error('Ambulance not found');
  
  await createAuditLog({
    tenantId,
    action: `ambulance.status.${status}`,
    entityName: 'ambulance',
    entityId: id,
    details: { lat, lng }
  });
  
  return result.rows[0];
}

export async function dispatchAmbulance({ id, tenantId, userId, incident_lat, incident_lng, patient_name, priority }) {
  // Update status to 'On Mission' with location
  const ambulance = await updateAmbulanceStatus(id, tenantId, 'On Mission', incident_lat, incident_lng);
  
  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: 'ambulance.dispatch',
    entityName: 'ambulance',
    entityId: id,
    details: { incident_lat, incident_lng, patient_name, priority }
  });
  
  return ambulance;
}

/**
 * Blood Bank Repository Functions
 */
export async function getBloodUnits(tenantId) {
  const sql = 'SELECT * FROM emr.blood_units WHERE tenant_id = $1 ORDER BY expires_at';
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createBloodUnit({ tenantId, userId, blood_group, component, volume_ml, expires_at, storage_location }) {
  const sql = `
    INSERT INTO emr.blood_units (tenant_id, created_by, blood_group, component, volume_ml, expires_at, storage_location, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'Available')
    RETURNING *
  `;
  const result = await query(sql, [tenantId, userId, blood_group, component, volume_ml, expires_at, storage_location]);
  const unit = result.rows[0];

  await createAuditLog({
    tenantId,
    userId,
    userName: null, // Add missing userName parameter
    action: 'blood_bank.unit.create',
    entityName: 'blood_unit',
    entityId: unit.id,
    details: { blood_group, component }
  });

  return unit;
}

export async function getBloodRequests(tenantId) {
  const sql = `
    SELECT br.*, p.first_name || ' ' || p.last_name as patient_name
    FROM emr.blood_requests br
    JOIN emr.patients p ON br.patient_id = p.id
    WHERE br.tenant_id = $1
    ORDER BY br.created_at DESC
  `;
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createBloodRequest({ tenantId, patientId, encounterId, requested_group, component, units_requested, priority, requested_by }) {
  const sql = `
    INSERT INTO emr.blood_requests (tenant_id, patient_id, encounter_id, requested_group, component, units_requested, priority, requested_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, patientId, encounterId, requested_group, component, units_requested, priority || 'Normal', requested_by]);
  return result.rows[0];
}

// =====================================================
// DOCTOR AVAILABILITY FOR OPD SCHEDULING
// =====================================================

export async function getDoctorAvailability(tenantId, doctorId, date) {
  const sql = `
    SELECT 
      id,
      doctor_id,
      date,
      start_time,
      end_time,
      slot_duration_minutes,
      is_available,
      max_appointments,
      current_appointments,
      status,
      notes
    FROM emr.doctor_availability 
    WHERE tenant_id = $1 
      AND ($2::uuid IS NULL OR doctor_id = $2)
      AND ($3::date IS NULL OR date = $3)
      AND is_available = true
      AND status = 'available'
      AND current_appointments < max_appointments
    ORDER BY date, start_time
  `;
  
  const result = await query(sql, [tenantId, doctorId, date]);
  return result.rows;
}

export async function createDoctorAvailability({ tenantId, doctorId, date, startTime, endTime, slotDurationMinutes = 15, maxAppointments = 1, notes, createdBy }) {
  const sql = `
    INSERT INTO emr.doctor_availability (
      tenant_id, doctor_id, date, start_time, end_time, 
      slot_duration_minutes, max_appointments, notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, doctorId, date, startTime, endTime, 
    slotDurationMinutes, maxAppointments, notes, createdBy
  ]);
  
  return result.rows[0];
}

export async function generateDoctorAvailabilitySlots({ tenantId, doctorId, date, startTime, endTime, slotDurationMinutes = 15, maxAppointmentsPerSlot = 1, createdBy }) {
  const slots = [];
  const current = new Date(`${date} ${startTime}`);
  const end = new Date(`${date} ${endTime}`);
  
  while (current < end) {
    const slotEndTime = new Date(current.getTime() + slotDurationMinutes * 60000);
    
    if (slotEndTime <= end) {
      const sql = `
        INSERT INTO emr.doctor_availability (
          tenant_id, doctor_id, date, start_time, end_time, 
          slot_duration_minutes, max_appointments, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const result = await query(sql, [
        tenantId, 
        doctorId, 
        date, 
        current.toTimeString().slice(0, 5), // HH:MM format
        slotEndTime.toTimeString().slice(0, 5), // HH:MM format
        slotDurationMinutes, 
        maxAppointmentsPerSlot, 
        createdBy
      ]);
      
      slots.push(result.rows[0]);
    }
    
    current.setTime(current.getTime() + slotDurationMinutes * 60000);
  }
  
  return slots;
}

export async function updateDoctorAvailabilitySlot(availabilityId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 2;
  
  if (updates.is_available !== undefined) {
    fields.push(`is_available = $${paramIndex++}`);
    values.push(updates.is_available);
  }
  
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  
  if (updates.max_appointments !== undefined) {
    fields.push(`max_appointments = $${paramIndex++}`);
    values.push(updates.max_appointments);
  }
  
  if (updates.notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(updates.notes);
  }
  
  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  const sql = `
    UPDATE emr.doctor_availability 
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $1 AND tenant_id = $${paramIndex}
    RETURNING *
  `;
  
  values.unshift(availabilityId);
  values.push(tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function incrementAppointmentCount(availabilityId, tenantId) {
  const sql = `
    UPDATE emr.doctor_availability 
    SET current_appointments = current_appointments + 1,
        updated_at = NOW()
    WHERE id = $1 
      AND tenant_id = $2 
      AND current_appointments < max_appointments
    RETURNING *
  `;
  
  const result = await query(sql, [availabilityId, tenantId]);
  return result.rows[0];
}

// =====================================================
// OPD TOKEN QUEUE SYSTEM
// =====================================================

export async function generateOPDToken({ tenantId, patientId, departmentId, doctorId, priority = 'general', visitType = 'new', chiefComplaint, appointmentId, createdBy }) {
  // Get next token number
  const nextTokenSql = `
    SELECT get_next_token_number($1, $2) as token_number
  `;
  const tokenResult = await query(nextTokenSql, [tenantId, departmentId]);
  const tokenNumber = tokenResult.rows[0].token_number;
  
  // Create the token
  const sql = `
    INSERT INTO emr.opd_tokens (
      tenant_id, patient_id, token_number, token_prefix, status, priority,
      department_id, doctor_id, appointment_id, visit_type, chief_complaint, created_by
    )
    VALUES ($1, $2, $3, 'OPD', $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, tokenNumber, 'waiting', priority,
    departmentId, doctorId, appointmentId, visitType, chiefComplaint, createdBy
  ]);
  
  return result.rows[0];
}

export async function getOPDTokens(tenantId, filters = {}) {
  const { status, departmentId, doctorId, date, priority } = filters;
  
  let sql = `
    SELECT 
      t.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.age,
      p.gender,
      d.name as department_name,
      u.name as doctor_name,
      a.start as appointment_time
    FROM emr.opd_tokens t
    LEFT JOIN emr.patients p ON t.patient_id = p.id
    LEFT JOIN emr.departments d ON t.department_id = d.id
    LEFT JOIN emr.users u ON t.doctor_id = u.id
    LEFT JOIN emr.appointments a ON t.appointment_id = a.id
    WHERE t.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND t.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (departmentId) {
    sql += ` AND t.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND t.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (date) {
    sql += ` AND DATE(t.created_at) = $${paramIndex++}`;
    params.push(date);
  }
  
  if (priority) {
    sql += ` AND t.priority = $${paramIndex++}`;
    params.push(priority);
  }
  
  sql += ` ORDER BY 
    CASE 
      WHEN t.priority = 'urgent' THEN 1
      WHEN t.priority = 'senior_citizen' THEN 2
      WHEN t.priority = 'follow_up' THEN 3
      ELSE 4
    END,
    t.token_number ASC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getOPDTokenById(tokenId, tenantId) {
  const sql = `
    SELECT 
      t.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.age,
      p.gender,
      p.blood_group,
      p.address,
      d.name as department_name,
      u.name as doctor_name,
      a.start as appointment_time
    FROM emr.opd_tokens t
    LEFT JOIN emr.patients p ON t.patient_id = p.id
    LEFT JOIN emr.departments d ON t.department_id = d.id
    LEFT JOIN emr.users u ON t.doctor_id = u.id
    LEFT JOIN emr.appointments a ON t.appointment_id = a.id
    WHERE t.id = $1 AND t.tenant_id = $2
  `;
  
  const result = await query(sql, [tokenId, tenantId]);
  return result.rows[0];
}

// =====================================================
// OPD BILLING SYSTEM
// =====================================================

export async function createOPDBill({ tenantId, patientId, tokenId, appointmentId, patientName, patientAge, patientGender, visitType, departmentId, doctorId, departmentName, doctorName, consultationFee, registrationFee, procedureCharges, labCharges, medicineCharges, otherCharges, discountAmount, discountPercentage, taxAmount, totalAmount, paymentMethod, insuranceProvider, policyNumber, notes, createdBy }) {
  // Generate bill number
  const billNumberSql = `SELECT get_next_bill_number($1) as bill_number`;
  const billNumberResult = await query(billNumberSql, [tenantId]);
  const billNumber = billNumberResult.rows[0].bill_number;
  
  const sql = `
    INSERT INTO emr.opd_bills (
      tenant_id, patient_id, token_id, appointment_id, bill_number, bill_date, bill_time,
      patient_name, patient_age, patient_gender, visit_type, department_id, doctor_id,
      department_name, doctor_name, consultation_fee, registration_fee, procedure_charges,
      lab_charges, medicine_charges, other_charges, discount_amount, discount_percentage,
      tax_amount, total_amount, payment_method, insurance_provider, policy_number,
      notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIME,
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22,
            $23, $24, $25, $26, $27)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, tokenId, appointmentId, billNumber,
    patientName, patientAge, patientGender, visitType, departmentId, doctorId,
    departmentName, doctorName, consultationFee || 0, registrationFee || 0, procedureCharges || 0,
    labCharges || 0, medicineCharges || 0, otherCharges || 0, discountAmount || 0, discountPercentage || 0,
    taxAmount || 0, totalAmount || 0, paymentMethod, insuranceProvider, policyNumber,
    notes, createdBy
  ]);
  
  return result.rows[0];
}

export async function getOPDBills(tenantId, filters = {}) {
  const { status, departmentId, doctorId, date, patientId } = filters;
  
  let sql = `
    SELECT 
      b.*,
      p.name as patient_name,
      p.phone as patient_phone,
      d.name as department_name,
      u.name as doctor_name,
      t.full_token as token_number
    FROM emr.opd_bills b
    LEFT JOIN emr.patients p ON b.patient_id = p.id
    LEFT JOIN emr.departments d ON b.department_id = d.id
    LEFT JOIN emr.users u ON b.doctor_id = u.id
    LEFT JOIN emr.opd_tokens t ON b.token_id = t.id
    WHERE b.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND b.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (departmentId) {
    sql += ` AND b.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND b.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (date) {
    sql += ` AND b.bill_date = $${paramIndex++}`;
    params.push(date);
  }
  
  if (patientId) {
    sql += ` AND b.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  sql += ` ORDER BY b.bill_date DESC, b.bill_time DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getOPDBillById(billId, tenantId) {
  const sql = `
    SELECT 
      b.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email,
      d.name as department_name,
      u.name as doctor_name,
      t.full_token as token_number,
      a.start as appointment_time
    FROM emr.opd_bills b
    LEFT JOIN emr.patients p ON b.patient_id = p.id
    LEFT JOIN emr.departments d ON b.department_id = d.id
    LEFT JOIN emr.users u ON b.doctor_id = u.id
    LEFT JOIN emr.opd_tokens t ON b.token_id = t.id
    LEFT JOIN emr.appointments a ON b.appointment_id = a.id
    WHERE b.id = $1 AND b.tenant_id = $2
  `;
  
  const result = await query(sql, [billId, tenantId]);
  return result.rows[0];
}

// =====================================================
// EXOTEL SMS PROVIDER INTEGRATION
// =====================================================

export async function createExotelConfiguration({ tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber, webhookUrl, deliveryReportWebhook, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_configurations (
      tenant_id, account_sid, api_key, api_token, subdomain, from_number,
      webhook_url, delivery_report_webhook, is_active, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber,
    webhookUrl, deliveryReportWebhook, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelConfigurations(tenantId, isActive = true) {
  const sql = `
    SELECT * FROM emr.exotel_configurations
    WHERE tenant_id = $1 AND is_active = $2
    ORDER BY is_default DESC, created_at DESC
  `;
  
  const result = await query(sql, [tenantId, isActive]);
  return result.rows;
}

export async function updateExotelConfiguration(configId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_configurations
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(configId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function createSMSCampaign({ tenantId, campaignName, campaignType, description, templateId, targetAudience, filters, scheduleType, scheduledAt, recurringPattern, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_sms_campaigns (
      tenant_id, campaign_name, campaign_type, description, template_id,
      target_audience, filters, schedule_type, scheduled_at, recurring_pattern,
      status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, campaignName, campaignType, description, templateId,
    targetAudience, JSON.stringify(filters), scheduleType, scheduledAt, 
    recurringPattern ? JSON.stringify(recurringPattern) : null, createdBy
  ]);
  
  return result.rows[0];
}

export async function getSMSCampaigns(tenantId, filters = {}) {
  const { status, campaignType, startDate, endDate } = filters;
  
  let sql = `
    SELECT 
      c.*,
      ct.template_name,
      ct.message_content,
      COUNT(l.id) as sent_count,
      COUNT(CASE WHEN l.status = 'delivered' THEN 1 END) as delivered_count,
      COUNT(CASE WHEN l.status = 'failed' THEN 1 END) as failed_count
    FROM emr.exotel_sms_campaigns c
    LEFT JOIN emr.communication_templates ct ON c.template_id = ct.id
    LEFT JOIN emr.exotel_sms_logs l ON c.id = l.campaign_id
    WHERE c.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND c.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (campaignType) {
    sql += ` AND c.campaign_type = $${paramIndex++}`;
    params.push(campaignType);
  }
  
  if (startDate) {
    sql += ` AND c.scheduled_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND c.scheduled_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  sql += ` GROUP BY c.id, ct.template_name, ct.message_content ORDER BY c.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function sendExotelSMS({ tenantId, toNumber, messageContent, messageType = 'transactional', priority = 1, campaignId = null, communicationId = null, externalId = null }) {
  // Get available Exotel number
  const availableNumberSql = `SELECT get_available_exotel_number($1, $2) as from_number`;
  const numberResult = await query(availableNumberSql, [tenantId, messageType]);
  const fromNumber = numberResult.rows[0].from_number;
  
  if (!fromNumber) {
    throw new Error('No available Exotel number found for this message type');
  }
  
  // Get Exotel configuration
  const configSql = `
    SELECT account_sid, api_key, api_token, subdomain 
    FROM emr.exotel_configurations 
    WHERE tenant_id = $1 AND is_active = true 
    ORDER BY is_default DESC 
    LIMIT 1
  `;
  const configResult = await query(configSql, [tenantId]);
  const config = configResult.rows[0];
  
  if (!config) {
    throw new Error('No active Exotel configuration found');
  }
  
  // Create SMS log entry
  const logSql = `
    INSERT INTO emr.exotel_sms_logs (
      tenant_id, campaign_id, communication_id, account_sid, from_number, to_number,
      message_content, message_type, priority, status, external_id, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued', $10, NOW())
    RETURNING *
  `;
  
  const logResult = await query(logSql, [
    tenantId, campaignId, communicationId, config.account_sid, fromNumber, toNumber,
    messageContent, messageType, priority, externalId
  ]);
  
  const smsLog = logResult.rows[0];
  
  // Update number pool usage
  await query(`SELECT update_exotel_number_usage($1, $2, 1)`, [tenantId, fromNumber]);
  
  // Send SMS via Exotel API
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: config.account_sid,
      apiKey: config.api_key,
      apiToken: config.api_token,
      subdomain: config.subdomain,
      fromNumber,
      toNumber,
      messageContent,
      priority,
      externalId: smsLog.id
    });
    
    // Update log with Exotel response
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      webhookData: exotelResponse.webhookData
    });
    
    // Update communication status if linked
    if (communicationId) {
      const communicationStatus = exotelResponse.status === 'sent' ? 'sent' : 'failed';
      await updateCommunicationStatus(communicationId, tenantId, communicationStatus, {
        externalId: exotelResponse.messageSid,
        provider: 'exotel',
        failedReason: exotelResponse.errorMessage
      });
    }
    
    return { success: true, smsLog, exotelResponse };
  } catch (error) {
    // Update log with error
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'API_ERROR',
      errorMessage: error.message
    });
    
    // Update communication status if linked
    if (communicationId) {
      await updateCommunicationStatus(communicationId, tenantId, 'failed', {
        provider: 'exotel',
        failedReason: error.message
      });
    }
    
    return { success: false, error: error.message, smsLog };
  }
}

export async function sendExotelAPIRequest({ accountSid, apiKey, apiToken, subdomain, fromNumber, toNumber, messageContent, priority, externalId }) {
  // Exotel SMS API endpoint
  const apiUrl = `https://${subdomain}.exotel.in/v1/Accounts/${accountSid}/Sms/send`;
  
  const authString = Buffer.from(`${accountSid}:${apiToken}`).toString('base64');
  
  const payload = {
    SmsSid: externalId,
    SenderId: fromNumber,
    To: toNumber,
    MessageBody: messageContent,
    Priority: priority,
    Type: 'txn', // Transactional SMS
    DltTemplateId: '1207160012345678901' // Template ID for DLT compliance
  };
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(`Exotel API Error: ${responseData.message || 'Unknown error'}`);
  }
  
  return {
    messageSid: responseData.SmsSid,
    status: responseData.Status === 'sent' ? 'sent' : 'queued',
    sentTimestamp: responseData.Date,
    cost: responseData.Cost || 0,
    webhookData: responseData
  };
}

export async function updateExotelSMSLog(smsLogId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_sms_logs
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(smsLogId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getExotelSMSLogs(tenantId, filters = {}) {
  const { status, toNumber, fromNumber, startDate, endDate, campaignId, limit = 100 } = filters;
  
  let sql = `
    SELECT 
      l.*,
      c.campaign_name,
      ct.template_name,
      p.name as patient_name,
      p.phone as patient_phone
    FROM emr.exotel_sms_logs l
    LEFT JOIN emr.exotel_sms_campaigns c ON l.campaign_id = c.id
    LEFT JOIN emr.communication_templates ct ON l.template_id = ct.id
    LEFT JOIN emr.patient_communications pc ON l.communication_id = pc.id
    LEFT JOIN emr.patients p ON pc.patient_id = p.id
    WHERE l.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND l.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (toNumber) {
    sql += ` AND l.to_number = $${paramIndex++}`;
    params.push(toNumber);
  }
  
  if (fromNumber) {
    sql += ` AND l.from_number = $${paramIndex++}`;
    params.push(fromNumber);
  }
  
  if (startDate) {
    sql += ` AND l.created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND l.created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  if (campaignId) {
    sql += ` AND l.campaign_id = $${paramIndex++}`;
    params.push(campaignId);
  }
  
  sql += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);
  
  const result = await query(sql, params);
  return result.rows;
}

export async function createExotelNumberPool({ tenantId, poolName, phoneNumber, numberType, departmentId, doctorId, dailyLimit, monthlyLimit, priority = 1, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_number_pools (
      tenant_id, pool_name, phone_number, number_type, department_id, doctor_id,
      daily_limit, monthly_limit, priority, is_active, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, poolName, phoneNumber, numberType, departmentId, doctorId,
    dailyLimit, monthlyLimit, priority, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelNumberPools(tenantId, filters = {}) {
  const { isActive = true, numberType, departmentId, doctorId } = filters;
  
  let sql = `
    SELECT 
      np.*,
      d.name as department_name,
      u.name as doctor_name,
      ROUND((np.current_daily_usage::float / NULLIF(np.daily_limit, 0) * 100), 2) as daily_usage_percentage,
      ROUND((np.current_monthly_usage::float / NULLIF(np.monthly_limit, 0) * 100), 2) as monthly_usage_percentage
    FROM emr.exotel_number_pools np
    LEFT JOIN emr.departments d ON np.department_id = d.id
    LEFT JOIN emr.users u ON np.doctor_id = u.id
    WHERE np.tenant_id = $1 AND np.is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (numberType) {
    sql += ` AND np.number_type = $${paramIndex++}`;
    params.push(numberType);
  }
  
  if (departmentId) {
    sql += ` AND np.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND np.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  sql += ` ORDER BY np.priority ASC, np.pool_name`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function processExotelWebhook(tenantId, eventData) {
  const sql = `
    INSERT INTO emr.exotel_webhook_events (
      tenant_id, event_type, event_data, message_sid, account_sid, created_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, eventData.eventType || 'unknown', 
    JSON.stringify(eventData), 
    eventData.SmsSid, 
    eventData.AccountSid
  ]);
  
  const webhookEvent = result.rows[0];
  
  // Process delivery reports
  if (eventData.Status) {
    await processExotelDeliveryReport(tenantId, eventData);
  }
  
  return webhookEvent;
}

export async function processExotelDeliveryReport(tenantId, deliveryData) {
  const { SmsSid, Status, ErrorCode, ErrorMessage, Date, Cost } = deliveryData;
  
  // Update SMS log with delivery status
  const updateData = {
    status: Status.toLowerCase(),
    deliveryStatus: Status.toLowerCase(),
    deliveryTimestamp: Date ? new Date(Date) : null,
    errorCode: ErrorCode,
    errorMessage: ErrorMessage,
    cost: Cost || 0,
    webhookData: JSON.stringify(deliveryData)
  };
  
  // Find the SMS log entry
  const findSql = `
    SELECT id, communication_id, to_number 
    FROM emr.exotel_sms_logs 
    WHERE message_sid = $1 AND tenant_id = $2
  `;
  
  const findResult = await query(findSql, [SmsSid, tenantId]);
  const smsLog = findResult.rows[0];
  
  if (smsLog) {
    await updateExotelSMSLog(smsLog.id, tenantId, updateData);
    
    // Update communication status if linked
    if (smsLog.communication_id) {
      const communicationStatus = Status.toLowerCase() === 'delivered' ? 'delivered' : 
                              Status.toLowerCase() === 'failed' ? 'failed' : 'sent';
      
      await updateCommunicationStatus(smsLog.communication_id, tenantId, communicationStatus, {
        externalId: SmsSid,
        provider: 'exotel',
        failedReason: ErrorMessage
      });
    }
    
    // Schedule retry for failed messages
    if (Status.toLowerCase() === 'failed' && ErrorCode !== '404') {
      await scheduleSMSRetry(smsLog.id);
    }
  }
}

export async function scheduleSMSRetry(smsLogId) {
  const sql = `SELECT schedule_sms_retry($1)`;
  await query(sql, [smsLogId]);
}

export async function getExotelSMSStats(tenantId, filters = {}) {
  const { startDate, endDate, messageType, fromNumber } = filters;
  
  let sql = `SELECT get_exotel_sms_stats($1, $2, $3)`;
  const params = [tenantId, startDate, endDate];
  
  const result = await query(sql, params);
  return result.rows;
}

export async function retryFailedSMS(tenantId, smsLogId) {
  const sql = `
    SELECT l.*, c.account_sid, c.api_key, c.api_token, c.subdomain
    FROM emr.exotel_sms_logs l
    JOIN emr.exotel_configurations c ON l.account_sid = c.account_sid
    WHERE l.id = $1 AND l.tenant_id = $2 AND l.status = 'failed'
  `;
  
  const result = await query(sql, [smsLogId, tenantId]);
  const smsLog = result.rows[0];
  
  if (!smsLog) {
    throw new Error('SMS log not found or not in failed status');
  }
  
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: smsLog.account_sid,
      apiKey: smsLog.api_key,
      apiToken: smsLog.api_token,
      subdomain: smsLog.subdomain,
      fromNumber: smsLog.from_number,
      toNumber: smsLog.to_number,
      messageContent: smsLog.message_content,
      priority: smsLog.priority,
      externalId: smsLog.id
    });
    
    // Update log with retry result
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: true, exotelResponse };
  } catch (error) {
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'RETRY_FAILED',
      errorMessage: error.message,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: false, error: error.message };
  }
}

export async function getPendingRetries(tenantId) {
  const sql = `
    SELECT 
      l.*,
      EXTRACT(EPOCH FROM (next_retry_at - NOW()))/60 as minutes_until_retry
    FROM emr.exotel_sms_logs l
    WHERE l.tenant_id = $1 
      AND l.status = 'queued' 
      AND l.next_retry_at IS NOT NULL 
      AND l.next_retry_at <= NOW() + INTERVAL '1 hour'
      AND l.retry_count < l.max_retries
    ORDER BY l.next_retry_at ASC
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function processScheduledCampaigns(tenantId) {
  const sql = `
    SELECT c.* 
    FROM emr.exotel_sms_campaigns c
    WHERE c.tenant_id = $1 
      AND c.status = 'scheduled' 
      AND c.scheduled_at <= NOW()
    ORDER BY c.scheduled_at ASC
  `;
  
  const campaigns = await query(sql, [tenantId]);
  
  for (const campaign of campaigns) {
    // Update campaign status to active
    await query(`
      UPDATE emr.exotel_sms_campaigns 
      SET status = 'active', updated_at = NOW()
      WHERE id = $1
    `, [campaign.id]);
    
    // Process campaign based on target audience
    await processSMSCampaign(campaign, tenantId);
  }
}

export async function processSMSCampaign(campaign, tenantId) {
  const { targetAudience, filters } = campaign;
  
  let targetNumbers = [];
  
  switch (targetAudience) {
    case 'all_patients':
      const patientsSql = `
        SELECT DISTINCT phone FROM emr.patients 
        WHERE tenant_id = $1 AND phone IS NOT NULL
      `;
      const patientsResult = await query(patientsSql, [tenantId]);
      targetNumbers = patientsResult.rows.map(p => p.phone);
      break;
      
    case 'specific_patients':
      if (filters && filters.patientIds) {
        const specificPatientsSql = `
          SELECT phone FROM emr.patients 
          WHERE tenant_id = $1 AND id = ANY($2)
        `;
        const specificResult = await query(specificPatientsSql, [tenantId, filters.patientIds]);
        targetNumbers = specificResult.rows.map(p => p.phone);
      }
      break;
      
    case 'department':
      if (filters && filters.departmentId) {
        const deptPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.department_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const deptResult = await query(deptPatientsSql, [tenantId, filters.departmentId]);
        targetNumbers = deptResult.rows.map(p => p.phone);
      }
      break;
      
    case 'doctor':
      if (filters && filters.doctorId) {
        const doctorPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.doctor_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const doctorResult = await query(doctorPatientsSql, [tenantId, filters.doctorId]);
        targetNumbers = doctorResult.rows.map(p => p.phone);
      }
      break;
      
    default:
      if (filters && filters.phoneNumbers) {
        targetNumbers = filters.phoneNumbers;
      }
      break;
  }
  
  // Send SMS to all target numbers
  for (const phoneNumber of targetNumbers) {
    await sendExotelSMS({
      tenantId,
      toNumber: phoneNumber,
      messageContent: campaign.message_content || 'Campaign message',
      messageType: 'promotional',
      campaignId: campaign.id
    });
  }
  
  // Update campaign statistics
  await query(`
    UPDATE emr.exotel_sms_campaigns 
    SET total_recipients = $1, updated_at = NOW()
    WHERE id = $2
  `, [targetNumbers.length, campaign.id]);
}

export async function addBillItem({ tenantId, billId, serviceType, serviceName, serviceCode, description, quantity, unitPrice, discountAmount, taxAmount, totalAmount, doctorId, departmentId, createdBy }) {
  const sql = `
    INSERT INTO emr.opd_bill_items (
      tenant_id, bill_id, service_type, service_name, service_code, description,
      quantity, unit_price, discount_amount, tax_amount, total_amount,
      doctor_id, department_id, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, billId, serviceType, serviceName, serviceCode, description,
    quantity, unitPrice, discountAmount, taxAmount, totalAmount,
    doctorId, departmentId, createdBy
  ]);
  
  // Update bill totals
  await query(`SELECT calculate_bill_totals($1)`, [billId]);
  
  return result.rows[0];
}

export async function updateBillStatus(billId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  if (additionalData.paymentMethod) {
    fields.push('payment_method');
    values.push(additionalData.paymentMethod);
  }
  
  if (additionalData.paidAmount) {
    fields.push('paid_amount');
    values.push(additionalData.paidAmount);
  }
  
  if (additionalData.paymentDate) {
    fields.push('payment_date');
    values.push(additionalData.paymentDate);
  }
  
  if (additionalData.transactionId) {
    fields.push('transaction_id');
    values.push(additionalData.transactionId);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.opd_bills 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(billId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getBillingStats(tenantId, filters = {}) {
  const { departmentId, doctorId, date = new Date().toISOString().split('T')[0] } = filters;
  
  const sql = `
    SELECT 
      COUNT(*) as total_bills,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_bills,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bills,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bills,
      SUM(total_amount) as total_revenue,
      SUM(paid_amount) as total_paid,
      SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as collected_revenue,
      AVG(total_amount) as avg_bill_amount
    FROM emr.opd_bills
    WHERE tenant_id = $1 
      AND bill_date = $2
      AND ($3::uuid IS NULL OR department_id = $3)
      AND ($4::uuid IS NULL OR doctor_id = $4)
  `;
  
  const result = await query(sql, [tenantId, date, departmentId, doctorId]);
  return result.rows[0];
}

export async function getServicePackages(tenantId, filters = {}) {
  const { isActive = true, departmentId } = filters;
  
  let sql = `
    SELECT 
      sp.*,
      d.name as department_name,
      COUNT(pi.id) as item_count
    FROM emr.opd_service_packages sp
    LEFT JOIN emr.departments d ON sp.department_id = d.id
    LEFT JOIN emr.opd_package_items pi ON sp.id = pi.package_id
    WHERE sp.tenant_id = $1
      AND sp.is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (departmentId) {
    sql += ` AND sp.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  sql += ` GROUP BY sp.id, d.name ORDER BY sp.name`;
  
  const result = await query(sql, params);
  return result.rows;
}

// =====================================================
// COMMUNICATION SYSTEM
// =====================================================

export async function createCommunicationTemplate({ tenantId, templateName, templateType, purpose, subject, messageContent, variables, isActive = true, isDefault = false, createdBy }) {
  const sql = `
    INSERT INTO emr.communication_templates (
      tenant_id, template_name, template_type, purpose, subject, message_content,
      variables, is_active, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, templateName, templateType, purpose, subject, messageContent,
    JSON.stringify(variables || []), isActive, isDefault, createdBy
  ]);
  
  return result.rows[0];
}

export async function getCommunicationTemplates(tenantId, filters = {}) {
  const { templateType, purpose, isActive = true } = filters;
  
  let sql = `
    SELECT * FROM emr.communication_templates
    WHERE tenant_id = $1 AND is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (templateType) {
    sql += ` AND template_type = $${paramIndex++}`;
    params.push(templateType);
  }
  
  if (purpose) {
    sql += ` AND purpose = $${paramIndex++}`;
    params.push(purpose);
  }
  
  sql += ` ORDER BY template_name`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function sendCommunication({ tenantId, patientId, communicationType, purpose, messageContent, recipientPhone, recipientEmail, subject, appointmentId, tokenId, billId, templateId, variablesUsed, scheduledFor, isAutomated = false, priority = 1, createdBy }) {
  const sql = `
    SELECT create_communication(
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) as communication_id
  `;
  
  const result = await query(sql, [
    tenantId, patientId, communicationType, purpose, messageContent,
    recipientPhone, recipientEmail, subject, appointmentId, tokenId, billId,
    templateId, variablesUsed ? JSON.stringify(variablesUsed) : null, scheduledFor, isAutomated, priority, createdBy
  ]);
  
  return result.rows[0].communication_id;
}

export async function getPatientCommunications(tenantId, filters = {}) {
  const { patientId, communicationType, purpose, status, date } = filters;
  
  let sql = `
    SELECT 
      pc.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email,
      ct.template_name,
      a.start as appointment_time,
      t.full_token as token_number,
      b.bill_number
    FROM emr.patient_communications pc
    LEFT JOIN emr.patients p ON pc.patient_id = p.id
    LEFT JOIN emr.communication_templates ct ON pc.template_id = ct.id
    LEFT JOIN emr.appointments a ON pc.appointment_id = a.id
    LEFT JOIN emr.opd_tokens t ON pc.token_id = t.id
    LEFT JOIN emr.opd_bills b ON pc.bill_id = b.id
    WHERE pc.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (patientId) {
    sql += ` AND pc.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  if (communicationType) {
    sql += ` AND pc.communication_type = $${paramIndex++}`;
    params.push(communicationType);
  }
  
  if (purpose) {
    sql += ` AND pc.purpose = $${paramIndex++}`;
    params.push(purpose);
  }
  
  if (status) {
    sql += ` AND pc.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (date) {
    sql += ` AND DATE(pc.created_at) = $${paramIndex++}`;
    params.push(date);
  }
  
  sql += ` ORDER BY pc.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function updateCommunicationStatus(communicationId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  if (status === 'sent') {
    fields.push('sent_at');
    values.push(new Date());
  }
  
  if (status === 'delivered') {
    fields.push('delivered_at');
    values.push(new Date());
  }
  
  if (status === 'read') {
    fields.push('read_at');
    values.push(new Date());
  }
  
  if (additionalData.externalId) {
    fields.push('external_id');
    values.push(additionalData.externalId);
  }
  
  if (additionalData.provider) {
    fields.push('provider');
    values.push(additionalData.provider);
  }
  
  if (additionalData.failedReason) {
    fields.push('failed_reason');
    values.push(additionalData.failedReason);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.patient_communications 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(communicationId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function scheduleAppointmentReminder({ tenantId, appointmentId, patientId, patientPhone, patientEmail, appointmentTime, doctorName, departmentName }) {
  const variables = {
    patient_name: patientId, // Will be replaced with actual patient name
    appointment_time: appointmentTime,
    doctor_name: doctorName,
    department_name: departmentName,
    hospital_name: 'Hospital' // Get from settings
  };
  
  const messageContent = `Reminder: Your appointment is scheduled for ${appointmentTime} with Dr. ${doctorName} at ${departmentName}. Please arrive 15 minutes early.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'appointment_reminder',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    appointmentId,
    variablesUsed: variables,
    scheduledFor: new Date(appointmentTime).getTime() - (24 * 60 * 60 * 1000), // 24 hours before
    isAutomated: true,
    createdBy: null
  });
  
  return communicationId;
}

export async function sendTokenCallNotification({ tenantId, tokenId, patientId, patientPhone, patientEmail, tokenNumber, departmentName, doctorName }) {
  const variables = {
    patient_name: patientId,
    token_number: tokenNumber,
    department_name: departmentName,
    doctor_name: doctorName,
    hospital_name: 'Hospital'
  };
  
  const messageContent = `Your token ${tokenNumber} has been called. Please proceed to ${departmentName}. Dr. ${doctorName} is ready to see you.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'token_call',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    tokenId,
    variablesUsed: variables,
    isAutomated: true,
    priority: 2,
    createdBy: null
  });
  
  return communicationId;
}

export async function sendBillingReminder({ tenantId, billId, patientId, patientPhone, patientEmail, billNumber, totalAmount, dueDate }) {
  const variables = {
    patient_name: patientId,
    bill_number: billNumber,
    total_amount: totalAmount,
    due_date: dueDate,
    hospital_name: 'Hospital'
  };
  
  const messageContent = `Reminder: Bill ${billNumber} of amount ${totalAmount} is due on ${dueDate}. Please complete the payment to avoid any inconvenience.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'billing_reminder',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    billId,
    variablesUsed: variables,
    isAutomated: true,
    priority: 1,
    createdBy: null
  });
  
  return communicationId;
}

export async function updateTokenStatus(tokenId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  // Add timestamp fields based on status
  if (status === 'called') {
    fields.push('last_called_at');
    values.push(new Date());
  }
  
  if (status === 'in_progress') {
    fields.push('consultation_started_at');
    values.push(new Date());
  }
  
  if (status === 'completed') {
    fields.push('consultation_completed_at');
    values.push(new Date());
  }
  
  // Add called_count increment
  if (status === 'called') {
    fields.push('called_count');
    values.push(`(SELECT COALESCE(called_count, 0) + 1 FROM emr.opd_tokens WHERE id = $1)`);
  }
  
  // Add additional data
  if (additionalData.doctorId) {
    fields.push('doctor_id');
    values.push(additionalData.doctorId);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.opd_tokens 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(tokenId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function callNextToken(tenantId, departmentId, doctorId = null) {
  const sql = `
    UPDATE emr.opd_tokens 
    SET status = 'called',
        last_called_at = NOW(),
        called_count = COALESCE(called_count, 0) + 1,
        updated_at = NOW()
    WHERE id = (
      SELECT id FROM emr.opd_tokens 
      WHERE tenant_id = $1 
        AND ($2::uuid IS NULL OR department_id = $2)
        AND ($3::uuid IS NULL OR doctor_id = $3)
        AND status = 'waiting'
      ORDER BY 
        CASE 
          WHEN priority = 'urgent' THEN 1
          WHEN priority = 'senior_citizen' THEN 2
          WHEN priority = 'follow_up' THEN 3
          ELSE 4
        END,
        token_number ASC
      LIMIT 1
    )
    RETURNING *
  `;
  
  const result = await query(sql, [tenantId, departmentId, doctorId]);
  return result.rows[0];
}

export async function getTokenQueueStats(tenantId, filters = {}) {
  const { departmentId, doctorId, date = new Date().toISOString().split('T')[0] } = filters;
  
  const sql = `
    SELECT 
      COUNT(*) as total_tokens,
      COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting,
      COUNT(CASE WHEN status = 'called' THEN 1 END) as called,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
      COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show,
      AVG(EXTRACT(EPOCH FROM (consultation_completed_at - consultation_started_at))/60) as avg_consultation_time_minutes
    FROM emr.opd_tokens
    WHERE tenant_id = $1 
      AND DATE(created_at) = $2
      AND ($3::uuid IS NULL OR department_id = $3)
      AND ($4::uuid IS NULL OR doctor_id = $4)
  `;
  
  const result = await query(sql, [tenantId, date, departmentId, doctorId]);
  return result.rows[0];
}

export async function getActiveTokensByDepartment(tenantId) {
  const sql = `
    SELECT 
      d.id as department_id,
      d.name as department_name,
      COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) as waiting_count,
      COUNT(CASE WHEN t.status = 'called' THEN 1 END) as called_count,
      COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_count,
      MAX(t.token_number) as last_token,
      t.full_token as current_token,
      t.status as current_token_status
    FROM emr.departments d
    LEFT JOIN emr.opd_tokens t ON d.id = t.department_id 
      AND t.tenant_id = $1 
      AND DATE(t.created_at) = CURRENT_DATE
      AND t.status IN ('waiting', 'called', 'in_progress')
    WHERE d.tenant_id = $1
    GROUP BY d.id, d.name, t.full_token, t.status
    ORDER BY d.name
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function updateTokenVitals(tokenId, tenantId, vitalsData) {
  const sql = `
    UPDATE emr.opd_tokens 
    SET vitals_recorded = true,
        updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  
  const result = await query(sql, [tokenId, tenantId]);
  
  // Create vitals record if needed
  if (result.rows[0]) {
    const vitalsSql = `
      INSERT INTO emr.vitals (
        tenant_id, patient_id, encounter_id, blood_pressure_systolic,
        blood_pressure_diastolic, heart_rate, temperature, 
        oxygen_saturation, weight, height, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    await query(vitalsSql, [
      tenantId, 
      result.rows[0].patient_id, 
      null, // No encounter yet
      vitalsData.bloodPressureSystolic,
      vitalsData.bloodPressureDiastolic,
      vitalsData.heartRate,
      vitalsData.temperature,
      vitalsData.oxygenSaturation,
      vitalsData.weight,
      vitalsData.height,
      vitalsData.createdBy
    ]);
  }
  
  return result.rows[0];
}

export async function getTokenHistory(tenantId, patientId, limit = 10) {
  const sql = `
    SELECT 
      t.*,
      d.name as department_name,
      u.name as doctor_name,
      EXTRACT(EPOCH FROM (consultation_completed_at - consultation_started_at))/60 as consultation_duration_minutes
    FROM emr.opd_tokens t
    LEFT JOIN emr.departments d ON t.department_id = d.id
    LEFT JOIN emr.users u ON t.doctor_id = u.id
    WHERE t.tenant_id = $1 AND t.patient_id = $2
    ORDER BY t.created_at DESC
    LIMIT $3
  `;
  
  const result = await query(sql, [tenantId, patientId, limit]);
  return result.rows;
}

export async function deleteOPDToken(tokenId, tenantId) {
  const sql = `
    DELETE FROM emr.opd_tokens 
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  
  const result = await query(sql, [tokenId, tenantId]);
  return result.rows[0];
}

// =====================================================
// OPD BILLING SYSTEM
// =====================================================

export async function createOPDBill({ tenantId, patientId, tokenId, appointmentId, patientName, patientAge, patientGender, visitType, departmentId, doctorId, departmentName, doctorName, consultationFee, registrationFee, procedureCharges, labCharges, medicineCharges, otherCharges, discountAmount, discountPercentage, taxAmount, totalAmount, paymentMethod, insuranceProvider, policyNumber, notes, createdBy }) {
  // Generate bill number
  const billNumberSql = `SELECT get_next_bill_number($1) as bill_number`;
  const billNumberResult = await query(billNumberSql, [tenantId]);
  const billNumber = billNumberResult.rows[0].bill_number;
  
  const sql = `
    INSERT INTO emr.opd_bills (
      tenant_id, patient_id, token_id, appointment_id, bill_number, bill_date, bill_time,
      patient_name, patient_age, patient_gender, visit_type, department_id, doctor_id,
      department_name, doctor_name, consultation_fee, registration_fee, procedure_charges,
      lab_charges, medicine_charges, other_charges, discount_amount, discount_percentage,
      tax_amount, total_amount, payment_method, insurance_provider, policy_number,
      notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIME,
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22,
            $23, $24, $25, $26, $27)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, tokenId, appointmentId, billNumber,
    patientName, patientAge, patientGender, visitType, departmentId, doctorId,
    departmentName, doctorName, consultationFee || 0, registrationFee || 0, procedureCharges || 0,
    labCharges || 0, medicineCharges || 0, otherCharges || 0, discountAmount || 0, discountPercentage || 0,
    taxAmount || 0, totalAmount || 0, paymentMethod, insuranceProvider, policyNumber,
    notes, createdBy
  ]);
  
  return result.rows[0];
}

export async function getOPDBills(tenantId, filters = {}) {
  const { status, departmentId, doctorId, date, patientId } = filters;
  
  let sql = `
    SELECT 
      b.*,
      p.name as patient_name,
      p.phone as patient_phone,
      d.name as department_name,
      u.name as doctor_name,
      t.full_token as token_number
    FROM emr.opd_bills b
    LEFT JOIN emr.patients p ON b.patient_id = p.id
    LEFT JOIN emr.departments d ON b.department_id = d.id
    LEFT JOIN emr.users u ON b.doctor_id = u.id
    LEFT JOIN emr.opd_tokens t ON b.token_id = t.id
    WHERE b.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND b.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (departmentId) {
    sql += ` AND b.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND b.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (date) {
    sql += ` AND b.bill_date = $${paramIndex++}`;
    params.push(date);
  }
  
  if (patientId) {
    sql += ` AND b.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  sql += ` ORDER BY b.bill_date DESC, b.bill_time DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getOPDBillById(billId, tenantId) {
  const sql = `
    SELECT 
      b.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email,
      d.name as department_name,
      u.name as doctor_name,
      t.full_token as token_number,
      a.start as appointment_time
    FROM emr.opd_bills b
    LEFT JOIN emr.patients p ON b.patient_id = p.id
    LEFT JOIN emr.departments d ON b.department_id = d.id
    LEFT JOIN emr.users u ON b.doctor_id = u.id
    LEFT JOIN emr.opd_tokens t ON b.token_id = t.id
    LEFT JOIN emr.appointments a ON b.appointment_id = a.id
    WHERE b.id = $1 AND b.tenant_id = $2
  `;
  
  const result = await query(sql, [billId, tenantId]);
  return result.rows[0];
}

// =====================================================
// EXOTEL SMS PROVIDER INTEGRATION
// =====================================================

export async function createExotelConfiguration({ tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber, webhookUrl, deliveryReportWebhook, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_configurations (
      tenant_id, account_sid, api_key, api_token, subdomain, from_number,
      webhook_url, delivery_report_webhook, is_active, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber,
    webhookUrl, deliveryReportWebhook, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelConfigurations(tenantId, isActive = true) {
  const sql = `
    SELECT * FROM emr.exotel_configurations
    WHERE tenant_id = $1 AND is_active = $2
    ORDER BY is_default DESC, created_at DESC
  `;
  
  const result = await query(sql, [tenantId, isActive]);
  return result.rows;
}

export async function updateExotelConfiguration(configId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_configurations
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(configId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function createSMSCampaign({ tenantId, campaignName, campaignType, description, templateId, targetAudience, filters, scheduleType, scheduledAt, recurringPattern, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_sms_campaigns (
      tenant_id, campaign_name, campaign_type, description, template_id,
      target_audience, filters, schedule_type, scheduled_at, recurring_pattern,
      status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, campaignName, campaignType, description, templateId,
    targetAudience, JSON.stringify(filters), scheduleType, scheduledAt, 
    recurringPattern ? JSON.stringify(recurringPattern) : null, createdBy
  ]);
  
  return result.rows[0];
}

export async function getSMSCampaigns(tenantId, filters = {}) {
  const { status, campaignType, startDate, endDate } = filters;
  
  let sql = `
    SELECT 
      c.*,
      ct.template_name,
      ct.message_content,
      COUNT(l.id) as sent_count,
      COUNT(CASE WHEN l.status = 'delivered' THEN 1 END) as delivered_count,
      COUNT(CASE WHEN l.status = 'failed' THEN 1 END) as failed_count
    FROM emr.exotel_sms_campaigns c
    LEFT JOIN emr.communication_templates ct ON c.template_id = ct.id
    LEFT JOIN emr.exotel_sms_logs l ON c.id = l.campaign_id
    WHERE c.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND c.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (campaignType) {
    sql += ` AND c.campaign_type = $${paramIndex++}`;
    params.push(campaignType);
  }
  
  if (startDate) {
    sql += ` AND c.scheduled_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND c.scheduled_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  sql += ` GROUP BY c.id, ct.template_name, ct.message_content ORDER BY c.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function sendExotelSMS({ tenantId, toNumber, messageContent, messageType = 'transactional', priority = 1, campaignId = null, communicationId = null, externalId = null }) {
  // Get available Exotel number
  const availableNumberSql = `SELECT get_available_exotel_number($1, $2) as from_number`;
  const numberResult = await query(availableNumberSql, [tenantId, messageType]);
  const fromNumber = numberResult.rows[0].from_number;
  
  if (!fromNumber) {
    throw new Error('No available Exotel number found for this message type');
  }
  
  // Get Exotel configuration
  const configSql = `
    SELECT account_sid, api_key, api_token, subdomain 
    FROM emr.exotel_configurations 
    WHERE tenant_id = $1 AND is_active = true 
    ORDER BY is_default DESC 
    LIMIT 1
  `;
  const configResult = await query(configSql, [tenantId]);
  const config = configResult.rows[0];
  
  if (!config) {
    throw new Error('No active Exotel configuration found');
  }
  
  // Create SMS log entry
  const logSql = `
    INSERT INTO emr.exotel_sms_logs (
      tenant_id, campaign_id, communication_id, account_sid, from_number, to_number,
      message_content, message_type, priority, status, external_id, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued', $10, NOW())
    RETURNING *
  `;
  
  const logResult = await query(logSql, [
    tenantId, campaignId, communicationId, config.account_sid, fromNumber, toNumber,
    messageContent, messageType, priority, externalId
  ]);
  
  const smsLog = logResult.rows[0];
  
  // Update number pool usage
  await query(`SELECT update_exotel_number_usage($1, $2, 1)`, [tenantId, fromNumber]);
  
  // Send SMS via Exotel API
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: config.account_sid,
      apiKey: config.api_key,
      apiToken: config.api_token,
      subdomain: config.subdomain,
      fromNumber,
      toNumber,
      messageContent,
      priority,
      externalId: smsLog.id
    });
    
    // Update log with Exotel response
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      webhookData: exotelResponse.webhookData
    });
    
    // Update communication status if linked
    if (communicationId) {
      const communicationStatus = exotelResponse.status === 'sent' ? 'sent' : 'failed';
      await updateCommunicationStatus(communicationId, tenantId, communicationStatus, {
        externalId: exotelResponse.messageSid,
        provider: 'exotel',
        failedReason: exotelResponse.errorMessage
      });
    }
    
    return { success: true, smsLog, exotelResponse };
  } catch (error) {
    // Update log with error
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'API_ERROR',
      errorMessage: error.message
    });
    
    // Update communication status if linked
    if (communicationId) {
      await updateCommunicationStatus(communicationId, tenantId, 'failed', {
        provider: 'exotel',
        failedReason: error.message
      });
    }
    
    return { success: false, error: error.message, smsLog };
  }
}

export async function sendExotelAPIRequest({ accountSid, apiKey, apiToken, subdomain, fromNumber, toNumber, messageContent, priority, externalId }) {
  // Exotel SMS API endpoint
  const apiUrl = `https://${subdomain}.exotel.in/v1/Accounts/${accountSid}/Sms/send`;
  
  const authString = Buffer.from(`${accountSid}:${apiToken}`).toString('base64');
  
  const payload = {
    SmsSid: externalId,
    SenderId: fromNumber,
    To: toNumber,
    MessageBody: messageContent,
    Priority: priority,
    Type: 'txn', // Transactional SMS
    DltTemplateId: '1207160012345678901' // Template ID for DLT compliance
  };
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(`Exotel API Error: ${responseData.message || 'Unknown error'}`);
  }
  
  return {
    messageSid: responseData.SmsSid,
    status: responseData.Status === 'sent' ? 'sent' : 'queued',
    sentTimestamp: responseData.Date,
    cost: responseData.Cost || 0,
    webhookData: responseData
  };
}

export async function updateExotelSMSLog(smsLogId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_sms_logs
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(smsLogId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getExotelSMSLogs(tenantId, filters = {}) {
  const { status, toNumber, fromNumber, startDate, endDate, campaignId, limit = 100 } = filters;
  
  let sql = `
    SELECT 
      l.*,
      c.campaign_name,
      ct.template_name,
      p.name as patient_name,
      p.phone as patient_phone
    FROM emr.exotel_sms_logs l
    LEFT JOIN emr.exotel_sms_campaigns c ON l.campaign_id = c.id
    LEFT JOIN emr.communication_templates ct ON l.template_id = ct.id
    LEFT JOIN emr.patient_communications pc ON l.communication_id = pc.id
    LEFT JOIN emr.patients p ON pc.patient_id = p.id
    WHERE l.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND l.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (toNumber) {
    sql += ` AND l.to_number = $${paramIndex++}`;
    params.push(toNumber);
  }
  
  if (fromNumber) {
    sql += ` AND l.from_number = $${paramIndex++}`;
    params.push(fromNumber);
  }
  
  if (startDate) {
    sql += ` AND l.created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND l.created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  if (campaignId) {
    sql += ` AND l.campaign_id = $${paramIndex++}`;
    params.push(campaignId);
  }
  
  sql += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);
  
  const result = await query(sql, params);
  return result.rows;
}

export async function createExotelNumberPool({ tenantId, poolName, phoneNumber, numberType, departmentId, doctorId, dailyLimit, monthlyLimit, priority = 1, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_number_pools (
      tenant_id, pool_name, phone_number, number_type, department_id, doctor_id,
      daily_limit, monthly_limit, priority, is_active, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, poolName, phoneNumber, numberType, departmentId, doctorId,
    dailyLimit, monthlyLimit, priority, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelNumberPools(tenantId, filters = {}) {
  const { isActive = true, numberType, departmentId, doctorId } = filters;
  
  let sql = `
    SELECT 
      np.*,
      d.name as department_name,
      u.name as doctor_name,
      ROUND((np.current_daily_usage::float / NULLIF(np.daily_limit, 0) * 100), 2) as daily_usage_percentage,
      ROUND((np.current_monthly_usage::float / NULLIF(np.monthly_limit, 0) * 100), 2) as monthly_usage_percentage
    FROM emr.exotel_number_pools np
    LEFT JOIN emr.departments d ON np.department_id = d.id
    LEFT JOIN emr.users u ON np.doctor_id = u.id
    WHERE np.tenant_id = $1 AND np.is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (numberType) {
    sql += ` AND np.number_type = $${paramIndex++}`;
    params.push(numberType);
  }
  
  if (departmentId) {
    sql += ` AND np.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND np.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  sql += ` ORDER BY np.priority ASC, np.pool_name`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function processExotelWebhook(tenantId, eventData) {
  const sql = `
    INSERT INTO emr.exotel_webhook_events (
      tenant_id, event_type, event_data, message_sid, account_sid, created_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, eventData.eventType || 'unknown', 
    JSON.stringify(eventData), 
    eventData.SmsSid, 
    eventData.AccountSid
  ]);
  
  const webhookEvent = result.rows[0];
  
  // Process delivery reports
  if (eventData.Status) {
    await processExotelDeliveryReport(tenantId, eventData);
  }
  
  return webhookEvent;
}

export async function processExotelDeliveryReport(tenantId, deliveryData) {
  const { SmsSid, Status, ErrorCode, ErrorMessage, Date, Cost } = deliveryData;
  
  // Update SMS log with delivery status
  const updateData = {
    status: Status.toLowerCase(),
    deliveryStatus: Status.toLowerCase(),
    deliveryTimestamp: Date ? new Date(Date) : null,
    errorCode: ErrorCode,
    errorMessage: ErrorMessage,
    cost: Cost || 0,
    webhookData: JSON.stringify(deliveryData)
  };
  
  // Find the SMS log entry
  const findSql = `
    SELECT id, communication_id, to_number 
    FROM emr.exotel_sms_logs 
    WHERE message_sid = $1 AND tenant_id = $2
  `;
  
  const findResult = await query(findSql, [SmsSid, tenantId]);
  const smsLog = findResult.rows[0];
  
  if (smsLog) {
    await updateExotelSMSLog(smsLog.id, tenantId, updateData);
    
    // Update communication status if linked
    if (smsLog.communication_id) {
      const communicationStatus = Status.toLowerCase() === 'delivered' ? 'delivered' : 
                              Status.toLowerCase() === 'failed' ? 'failed' : 'sent';
      
      await updateCommunicationStatus(smsLog.communication_id, tenantId, communicationStatus, {
        externalId: SmsSid,
        provider: 'exotel',
        failedReason: ErrorMessage
      });
    }
    
    // Schedule retry for failed messages
    if (Status.toLowerCase() === 'failed' && ErrorCode !== '404') {
      await scheduleSMSRetry(smsLog.id);
    }
  }
}

export async function scheduleSMSRetry(smsLogId) {
  const sql = `SELECT schedule_sms_retry($1)`;
  await query(sql, [smsLogId]);
}

export async function getExotelSMSStats(tenantId, filters = {}) {
  const { startDate, endDate, messageType, fromNumber } = filters;
  
  let sql = `SELECT get_exotel_sms_stats($1, $2, $3)`;
  const params = [tenantId, startDate, endDate];
  
  const result = await query(sql, params);
  return result.rows;
}

export async function retryFailedSMS(tenantId, smsLogId) {
  const sql = `
    SELECT l.*, c.account_sid, c.api_key, c.api_token, c.subdomain
    FROM emr.exotel_sms_logs l
    JOIN emr.exotel_configurations c ON l.account_sid = c.account_sid
    WHERE l.id = $1 AND l.tenant_id = $2 AND l.status = 'failed'
  `;
  
  const result = await query(sql, [smsLogId, tenantId]);
  const smsLog = result.rows[0];
  
  if (!smsLog) {
    throw new Error('SMS log not found or not in failed status');
  }
  
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: smsLog.account_sid,
      apiKey: smsLog.api_key,
      apiToken: smsLog.api_token,
      subdomain: smsLog.subdomain,
      fromNumber: smsLog.from_number,
      toNumber: smsLog.to_number,
      messageContent: smsLog.message_content,
      priority: smsLog.priority,
      externalId: smsLog.id
    });
    
    // Update log with retry result
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: true, exotelResponse };
  } catch (error) {
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'RETRY_FAILED',
      errorMessage: error.message,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: false, error: error.message };
  }
}

export async function getPendingRetries(tenantId) {
  const sql = `
    SELECT 
      l.*,
      EXTRACT(EPOCH FROM (next_retry_at - NOW()))/60 as minutes_until_retry
    FROM emr.exotel_sms_logs l
    WHERE l.tenant_id = $1 
      AND l.status = 'queued' 
      AND l.next_retry_at IS NOT NULL 
      AND l.next_retry_at <= NOW() + INTERVAL '1 hour'
      AND l.retry_count < l.max_retries
    ORDER BY l.next_retry_at ASC
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function processScheduledCampaigns(tenantId) {
  const sql = `
    SELECT c.* 
    FROM emr.exotel_sms_campaigns c
    WHERE c.tenant_id = $1 
      AND c.status = 'scheduled' 
      AND c.scheduled_at <= NOW()
    ORDER BY c.scheduled_at ASC
  `;
  
  const campaigns = await query(sql, [tenantId]);
  
  for (const campaign of campaigns) {
    // Update campaign status to active
    await query(`
      UPDATE emr.exotel_sms_campaigns 
      SET status = 'active', updated_at = NOW()
      WHERE id = $1
    `, [campaign.id]);
    
    // Process campaign based on target audience
    await processSMSCampaign(campaign, tenantId);
  }
}

export async function processSMSCampaign(campaign, tenantId) {
  const { targetAudience, filters } = campaign;
  
  let targetNumbers = [];
  
  switch (targetAudience) {
    case 'all_patients':
      const patientsSql = `
        SELECT DISTINCT phone FROM emr.patients 
        WHERE tenant_id = $1 AND phone IS NOT NULL
      `;
      const patientsResult = await query(patientsSql, [tenantId]);
      targetNumbers = patientsResult.rows.map(p => p.phone);
      break;
      
    case 'specific_patients':
      if (filters && filters.patientIds) {
        const specificPatientsSql = `
          SELECT phone FROM emr.patients 
          WHERE tenant_id = $1 AND id = ANY($2)
        `;
        const specificResult = await query(specificPatientsSql, [tenantId, filters.patientIds]);
        targetNumbers = specificResult.rows.map(p => p.phone);
      }
      break;
      
    case 'department':
      if (filters && filters.departmentId) {
        const deptPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.department_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const deptResult = await query(deptPatientsSql, [tenantId, filters.departmentId]);
        targetNumbers = deptResult.rows.map(p => p.phone);
      }
      break;
      
    case 'doctor':
      if (filters && filters.doctorId) {
        const doctorPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.doctor_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const doctorResult = await query(doctorPatientsSql, [tenantId, filters.doctorId]);
        targetNumbers = doctorResult.rows.map(p => p.phone);
      }
      break;
      
    default:
      if (filters && filters.phoneNumbers) {
        targetNumbers = filters.phoneNumbers;
      }
      break;
  }
  
  // Send SMS to all target numbers
  for (const phoneNumber of targetNumbers) {
    await sendExotelSMS({
      tenantId,
      toNumber: phoneNumber,
      messageContent: campaign.message_content || 'Campaign message',
      messageType: 'promotional',
      campaignId: campaign.id
    });
  }
  
  // Update campaign statistics
  await query(`
    UPDATE emr.exotel_sms_campaigns 
    SET total_recipients = $1, updated_at = NOW()
    WHERE id = $2
  `, [targetNumbers.length, campaign.id]);
}

export async function addBillItem({ tenantId, billId, serviceType, serviceName, serviceCode, description, quantity, unitPrice, discountAmount, taxAmount, totalAmount, doctorId, departmentId, createdBy }) {
  const sql = `
    INSERT INTO emr.opd_bill_items (
      tenant_id, bill_id, service_type, service_name, service_code, description,
      quantity, unit_price, discount_amount, tax_amount, total_amount,
      doctor_id, department_id, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, billId, serviceType, serviceName, serviceCode, description,
    quantity, unitPrice, discountAmount, taxAmount, totalAmount,
    doctorId, departmentId, createdBy
  ]);
  
  // Update bill totals
  await query(`SELECT calculate_bill_totals($1)`, [billId]);
  
  return result.rows[0];
}

export async function updateBillStatus(billId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  if (additionalData.paymentMethod) {
    fields.push('payment_method');
    values.push(additionalData.paymentMethod);
  }
  
  if (additionalData.paidAmount) {
    fields.push('paid_amount');
    values.push(additionalData.paidAmount);
  }
  
  if (additionalData.paymentDate) {
    fields.push('payment_date');
    values.push(additionalData.paymentDate);
  }
  
  if (additionalData.transactionId) {
    fields.push('transaction_id');
    values.push(additionalData.transactionId);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.opd_bills 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(billId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getBillingStats(tenantId, filters = {}) {
  const { departmentId, doctorId, date = new Date().toISOString().split('T')[0] } = filters;
  
  const sql = `
    SELECT 
      COUNT(*) as total_bills,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_bills,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bills,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bills,
      SUM(total_amount) as total_revenue,
      SUM(paid_amount) as total_paid,
      SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as collected_revenue,
      AVG(total_amount) as avg_bill_amount
    FROM emr.opd_bills
    WHERE tenant_id = $1 
      AND bill_date = $2
      AND ($3::uuid IS NULL OR department_id = $3)
      AND ($4::uuid IS NULL OR doctor_id = $4)
  `;
  
  const result = await query(sql, [tenantId, date, departmentId, doctorId]);
  return result.rows[0];
}

export async function getServicePackages(tenantId, filters = {}) {
  const { isActive = true, departmentId } = filters;
  
  let sql = `
    SELECT 
      sp.*,
      d.name as department_name,
      COUNT(pi.id) as item_count
    FROM emr.opd_service_packages sp
    LEFT JOIN emr.departments d ON sp.department_id = d.id
    LEFT JOIN emr.opd_package_items pi ON sp.id = pi.package_id
    WHERE sp.tenant_id = $1
      AND sp.is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (departmentId) {
    sql += ` AND sp.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  sql += ` GROUP BY sp.id, d.name ORDER BY sp.name`;
  
  const result = await query(sql, params);
  return result.rows;
}

// =====================================================
// COMMUNICATION SYSTEM
// =====================================================

export async function createCommunicationTemplate({ tenantId, templateName, templateType, purpose, subject, messageContent, variables, isActive = true, isDefault = false, createdBy }) {
  const sql = `
    INSERT INTO emr.communication_templates (
      tenant_id, template_name, template_type, purpose, subject, message_content,
      variables, is_active, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, templateName, templateType, purpose, subject, messageContent,
    JSON.stringify(variables || []), isActive, isDefault, createdBy
  ]);
  
  return result.rows[0];
}

export async function getCommunicationTemplates(tenantId, filters = {}) {
  const { templateType, purpose, isActive = true } = filters;
  
  let sql = `
    SELECT * FROM emr.communication_templates
    WHERE tenant_id = $1 AND is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (templateType) {
    sql += ` AND template_type = $${paramIndex++}`;
    params.push(templateType);
  }
  
  if (purpose) {
    sql += ` AND purpose = $${paramIndex++}`;
    params.push(purpose);
  }
  
  sql += ` ORDER BY template_name`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function sendCommunication({ tenantId, patientId, communicationType, purpose, messageContent, recipientPhone, recipientEmail, subject, appointmentId, tokenId, billId, templateId, variablesUsed, scheduledFor, isAutomated = false, priority = 1, createdBy }) {
  const sql = `
    SELECT create_communication(
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) as communication_id
  `;
  
  const result = await query(sql, [
    tenantId, patientId, communicationType, purpose, messageContent,
    recipientPhone, recipientEmail, subject, appointmentId, tokenId, billId,
    templateId, variablesUsed ? JSON.stringify(variablesUsed) : null, scheduledFor, isAutomated, priority, createdBy
  ]);
  
  return result.rows[0].communication_id;
}

export async function getPatientCommunications(tenantId, filters = {}) {
  const { patientId, communicationType, purpose, status, date } = filters;
  
  let sql = `
    SELECT 
      pc.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email,
      ct.template_name,
      a.start as appointment_time,
      t.full_token as token_number,
      b.bill_number
    FROM emr.patient_communications pc
    LEFT JOIN emr.patients p ON pc.patient_id = p.id
    LEFT JOIN emr.communication_templates ct ON pc.template_id = ct.id
    LEFT JOIN emr.appointments a ON pc.appointment_id = a.id
    LEFT JOIN emr.opd_tokens t ON pc.token_id = t.id
    LEFT JOIN emr.opd_bills b ON pc.bill_id = b.id
    WHERE pc.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (patientId) {
    sql += ` AND pc.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  if (communicationType) {
    sql += ` AND pc.communication_type = $${paramIndex++}`;
    params.push(communicationType);
  }
  
  if (purpose) {
    sql += ` AND pc.purpose = $${paramIndex++}`;
    params.push(purpose);
  }
  
  if (status) {
    sql += ` AND pc.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (date) {
    sql += ` AND DATE(pc.created_at) = $${paramIndex++}`;
    params.push(date);
  }
  
  sql += ` ORDER BY pc.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function updateCommunicationStatus(communicationId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  if (status === 'sent') {
    fields.push('sent_at');
    values.push(new Date());
  }
  
  if (status === 'delivered') {
    fields.push('delivered_at');
    values.push(new Date());
  }
  
  if (status === 'read') {
    fields.push('read_at');
    values.push(new Date());
  }
  
  if (additionalData.externalId) {
    fields.push('external_id');
    values.push(additionalData.externalId);
  }
  
  if (additionalData.provider) {
    fields.push('provider');
    values.push(additionalData.provider);
  }
  
  if (additionalData.failedReason) {
    fields.push('failed_reason');
    values.push(additionalData.failedReason);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.patient_communications 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(communicationId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function scheduleAppointmentReminder({ tenantId, appointmentId, patientId, patientPhone, patientEmail, appointmentTime, doctorName, departmentName }) {
  const variables = {
    patient_name: patientId, // Will be replaced with actual patient name
    appointment_time: appointmentTime,
    doctor_name: doctorName,
    department_name: departmentName,
    hospital_name: 'Hospital' // Get from settings
  };
  
  const messageContent = `Reminder: Your appointment is scheduled for ${appointmentTime} with Dr. ${doctorName} at ${departmentName}. Please arrive 15 minutes early.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'appointment_reminder',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    appointmentId,
    variablesUsed: variables,
    scheduledFor: new Date(appointmentTime).getTime() - (24 * 60 * 60 * 1000), // 24 hours before
    isAutomated: true,
    createdBy: null
  });
  
  return communicationId;
}

export async function sendTokenCallNotification({ tenantId, tokenId, patientId, patientPhone, patientEmail, tokenNumber, departmentName, doctorName }) {
  const variables = {
    patient_name: patientId,
    token_number: tokenNumber,
    department_name: departmentName,
    doctor_name: doctorName,
    hospital_name: 'Hospital'
  };
  
  const messageContent = `Your token ${tokenNumber} has been called. Please proceed to ${departmentName}. Dr. ${doctorName} is ready to see you.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'token_call',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    tokenId,
    variablesUsed: variables,
    isAutomated: true,
    priority: 2,
    createdBy: null
  });
  
  return communicationId;
}

export async function sendBillingReminder({ tenantId, billId, patientId, patientPhone, patientEmail, billNumber, totalAmount, dueDate }) {
  const variables = {
    patient_name: patientId,
    bill_number: billNumber,
    total_amount: totalAmount,
    due_date: dueDate,
    hospital_name: 'Hospital'
  };
  
  const messageContent = `Reminder: Bill ${billNumber} of amount ${totalAmount} is due on ${dueDate}. Please complete the payment to avoid any inconvenience.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'billing_reminder',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    billId,
    variablesUsed: variables,
    isAutomated: true,
    priority: 1,
    createdBy: null
  });
  
  return communicationId;
}

export async function decrementAppointmentCount(availabilityId, tenantId) {
  const sql = `
    UPDATE emr.doctor_availability 
    SET current_appointments = GREATEST(current_appointments - 1, 0),
        updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  
  const result = await query(sql, [availabilityId, tenantId]);
  return result.rows[0];
}

// =====================================================
// OPD TOKEN QUEUE SYSTEM
// =====================================================

export async function generateOPDToken({ tenantId, patientId, departmentId, doctorId, priority = 'general', visitType = 'new', chiefComplaint, appointmentId, createdBy }) {
  // Get next token number
  const nextTokenSql = `
    SELECT get_next_token_number($1, $2) as token_number
  `;
  const tokenResult = await query(nextTokenSql, [tenantId, departmentId]);
  const tokenNumber = tokenResult.rows[0].token_number;
  
  // Create the token
  const sql = `
    INSERT INTO emr.opd_tokens (
      tenant_id, patient_id, token_number, token_prefix, status, priority,
      department_id, doctor_id, appointment_id, visit_type, chief_complaint, created_by
    )
    VALUES ($1, $2, $3, 'OPD', $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, tokenNumber, 'waiting', priority,
    departmentId, doctorId, appointmentId, visitType, chiefComplaint, createdBy
  ]);
  
  return result.rows[0];
}

export async function getOPDTokens(tenantId, filters = {}) {
  const { status, departmentId, doctorId, date, priority } = filters;
  
  let sql = `
    SELECT 
      t.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.age,
      p.gender,
      d.name as department_name,
      u.name as doctor_name,
      a.start as appointment_time
    FROM emr.opd_tokens t
    LEFT JOIN emr.patients p ON t.patient_id = p.id
    LEFT JOIN emr.departments d ON t.department_id = d.id
    LEFT JOIN emr.users u ON t.doctor_id = u.id
    LEFT JOIN emr.appointments a ON t.appointment_id = a.id
    WHERE t.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND t.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (departmentId) {
    sql += ` AND t.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND t.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (date) {
    sql += ` AND DATE(t.created_at) = $${paramIndex++}`;
    params.push(date);
  }
  
  if (priority) {
    sql += ` AND t.priority = $${paramIndex++}`;
    params.push(priority);
  }
  
  sql += ` ORDER BY 
    CASE 
      WHEN t.priority = 'urgent' THEN 1
      WHEN t.priority = 'senior_citizen' THEN 2
      WHEN t.priority = 'follow_up' THEN 3
      ELSE 4
    END,
    t.token_number ASC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getOPDTokenById(tokenId, tenantId) {
  const sql = `
    SELECT 
      t.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.age,
      p.gender,
      p.blood_group,
      p.address,
      d.name as department_name,
      u.name as doctor_name,
      a.start as appointment_time
    FROM emr.opd_tokens t
    LEFT JOIN emr.patients p ON t.patient_id = p.id
    LEFT JOIN emr.departments d ON t.department_id = d.id
    LEFT JOIN emr.users u ON t.doctor_id = u.id
    LEFT JOIN emr.appointments a ON t.appointment_id = a.id
    WHERE t.id = $1 AND t.tenant_id = $2
  `;
  
  const result = await query(sql, [tokenId, tenantId]);
  return result.rows[0];
}

// =====================================================
// OPD BILLING SYSTEM
// =====================================================

export async function createOPDBill({ tenantId, patientId, tokenId, appointmentId, patientName, patientAge, patientGender, visitType, departmentId, doctorId, departmentName, doctorName, consultationFee, registrationFee, procedureCharges, labCharges, medicineCharges, otherCharges, discountAmount, discountPercentage, taxAmount, totalAmount, paymentMethod, insuranceProvider, policyNumber, notes, createdBy }) {
  // Generate bill number
  const billNumberSql = `SELECT get_next_bill_number($1) as bill_number`;
  const billNumberResult = await query(billNumberSql, [tenantId]);
  const billNumber = billNumberResult.rows[0].bill_number;
  
  const sql = `
    INSERT INTO emr.opd_bills (
      tenant_id, patient_id, token_id, appointment_id, bill_number, bill_date, bill_time,
      patient_name, patient_age, patient_gender, visit_type, department_id, doctor_id,
      department_name, doctor_name, consultation_fee, registration_fee, procedure_charges,
      lab_charges, medicine_charges, other_charges, discount_amount, discount_percentage,
      tax_amount, total_amount, payment_method, insurance_provider, policy_number,
      notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIME,
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22,
            $23, $24, $25, $26, $27)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, tokenId, appointmentId, billNumber,
    patientName, patientAge, patientGender, visitType, departmentId, doctorId,
    departmentName, doctorName, consultationFee || 0, registrationFee || 0, procedureCharges || 0,
    labCharges || 0, medicineCharges || 0, otherCharges || 0, discountAmount || 0, discountPercentage || 0,
    taxAmount || 0, totalAmount || 0, paymentMethod, insuranceProvider, policyNumber,
    notes, createdBy
  ]);
  
  return result.rows[0];
}

export async function getOPDBills(tenantId, filters = {}) {
  const { status, departmentId, doctorId, date, patientId } = filters;
  
  let sql = `
    SELECT 
      b.*,
      p.name as patient_name,
      p.phone as patient_phone,
      d.name as department_name,
      u.name as doctor_name,
      t.full_token as token_number
    FROM emr.opd_bills b
    LEFT JOIN emr.patients p ON b.patient_id = p.id
    LEFT JOIN emr.departments d ON b.department_id = d.id
    LEFT JOIN emr.users u ON b.doctor_id = u.id
    LEFT JOIN emr.opd_tokens t ON b.token_id = t.id
    WHERE b.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND b.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (departmentId) {
    sql += ` AND b.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND b.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (date) {
    sql += ` AND b.bill_date = $${paramIndex++}`;
    params.push(date);
  }
  
  if (patientId) {
    sql += ` AND b.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  sql += ` ORDER BY b.bill_date DESC, b.bill_time DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getOPDBillById(billId, tenantId) {
  const sql = `
    SELECT 
      b.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email,
      d.name as department_name,
      u.name as doctor_name,
      t.full_token as token_number,
      a.start as appointment_time
    FROM emr.opd_bills b
    LEFT JOIN emr.patients p ON b.patient_id = p.id
    LEFT JOIN emr.departments d ON b.department_id = d.id
    LEFT JOIN emr.users u ON b.doctor_id = u.id
    LEFT JOIN emr.opd_tokens t ON b.token_id = t.id
    LEFT JOIN emr.appointments a ON b.appointment_id = a.id
    WHERE b.id = $1 AND b.tenant_id = $2
  `;
  
  const result = await query(sql, [billId, tenantId]);
  return result.rows[0];
}

// =====================================================
// EXOTEL SMS PROVIDER INTEGRATION
// =====================================================

export async function createExotelConfiguration({ tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber, webhookUrl, deliveryReportWebhook, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_configurations (
      tenant_id, account_sid, api_key, api_token, subdomain, from_number,
      webhook_url, delivery_report_webhook, is_active, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber,
    webhookUrl, deliveryReportWebhook, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelConfigurations(tenantId, isActive = true) {
  const sql = `
    SELECT * FROM emr.exotel_configurations
    WHERE tenant_id = $1 AND is_active = $2
    ORDER BY is_default DESC, created_at DESC
  `;
  
  const result = await query(sql, [tenantId, isActive]);
  return result.rows;
}

export async function updateExotelConfiguration(configId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_configurations
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(configId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function createSMSCampaign({ tenantId, campaignName, campaignType, description, templateId, targetAudience, filters, scheduleType, scheduledAt, recurringPattern, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_sms_campaigns (
      tenant_id, campaign_name, campaign_type, description, template_id,
      target_audience, filters, schedule_type, scheduled_at, recurring_pattern,
      status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, campaignName, campaignType, description, templateId,
    targetAudience, JSON.stringify(filters), scheduleType, scheduledAt, 
    recurringPattern ? JSON.stringify(recurringPattern) : null, createdBy
  ]);
  
  return result.rows[0];
}

export async function getSMSCampaigns(tenantId, filters = {}) {
  const { status, campaignType, startDate, endDate } = filters;
  
  let sql = `
    SELECT 
      c.*,
      ct.template_name,
      ct.message_content,
      COUNT(l.id) as sent_count,
      COUNT(CASE WHEN l.status = 'delivered' THEN 1 END) as delivered_count,
      COUNT(CASE WHEN l.status = 'failed' THEN 1 END) as failed_count
    FROM emr.exotel_sms_campaigns c
    LEFT JOIN emr.communication_templates ct ON c.template_id = ct.id
    LEFT JOIN emr.exotel_sms_logs l ON c.id = l.campaign_id
    WHERE c.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND c.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (campaignType) {
    sql += ` AND c.campaign_type = $${paramIndex++}`;
    params.push(campaignType);
  }
  
  if (startDate) {
    sql += ` AND c.scheduled_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND c.scheduled_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  sql += ` GROUP BY c.id, ct.template_name, ct.message_content ORDER BY c.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function sendExotelSMS({ tenantId, toNumber, messageContent, messageType = 'transactional', priority = 1, campaignId = null, communicationId = null, externalId = null }) {
  // Get available Exotel number
  const availableNumberSql = `SELECT get_available_exotel_number($1, $2) as from_number`;
  const numberResult = await query(availableNumberSql, [tenantId, messageType]);
  const fromNumber = numberResult.rows[0].from_number;
  
  if (!fromNumber) {
    throw new Error('No available Exotel number found for this message type');
  }
  
  // Get Exotel configuration
  const configSql = `
    SELECT account_sid, api_key, api_token, subdomain 
    FROM emr.exotel_configurations 
    WHERE tenant_id = $1 AND is_active = true 
    ORDER BY is_default DESC 
    LIMIT 1
  `;
  const configResult = await query(configSql, [tenantId]);
  const config = configResult.rows[0];
  
  if (!config) {
    throw new Error('No active Exotel configuration found');
  }
  
  // Create SMS log entry
  const logSql = `
    INSERT INTO emr.exotel_sms_logs (
      tenant_id, campaign_id, communication_id, account_sid, from_number, to_number,
      message_content, message_type, priority, status, external_id, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued', $10, NOW())
    RETURNING *
  `;
  
  const logResult = await query(logSql, [
    tenantId, campaignId, communicationId, config.account_sid, fromNumber, toNumber,
    messageContent, messageType, priority, externalId
  ]);
  
  const smsLog = logResult.rows[0];
  
  // Update number pool usage
  await query(`SELECT update_exotel_number_usage($1, $2, 1)`, [tenantId, fromNumber]);
  
  // Send SMS via Exotel API
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: config.account_sid,
      apiKey: config.api_key,
      apiToken: config.api_token,
      subdomain: config.subdomain,
      fromNumber,
      toNumber,
      messageContent,
      priority,
      externalId: smsLog.id
    });
    
    // Update log with Exotel response
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      webhookData: exotelResponse.webhookData
    });
    
    // Update communication status if linked
    if (communicationId) {
      const communicationStatus = exotelResponse.status === 'sent' ? 'sent' : 'failed';
      await updateCommunicationStatus(communicationId, tenantId, communicationStatus, {
        externalId: exotelResponse.messageSid,
        provider: 'exotel',
        failedReason: exotelResponse.errorMessage
      });
    }
    
    return { success: true, smsLog, exotelResponse };
  } catch (error) {
    // Update log with error
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'API_ERROR',
      errorMessage: error.message
    });
    
    // Update communication status if linked
    if (communicationId) {
      await updateCommunicationStatus(communicationId, tenantId, 'failed', {
        provider: 'exotel',
        failedReason: error.message
      });
    }
    
    return { success: false, error: error.message, smsLog };
  }
}

export async function sendExotelAPIRequest({ accountSid, apiKey, apiToken, subdomain, fromNumber, toNumber, messageContent, priority, externalId }) {
  // Exotel SMS API endpoint
  const apiUrl = `https://${subdomain}.exotel.in/v1/Accounts/${accountSid}/Sms/send`;
  
  const authString = Buffer.from(`${accountSid}:${apiToken}`).toString('base64');
  
  const payload = {
    SmsSid: externalId,
    SenderId: fromNumber,
    To: toNumber,
    MessageBody: messageContent,
    Priority: priority,
    Type: 'txn', // Transactional SMS
    DltTemplateId: '1207160012345678901' // Template ID for DLT compliance
  };
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(`Exotel API Error: ${responseData.message || 'Unknown error'}`);
  }
  
  return {
    messageSid: responseData.SmsSid,
    status: responseData.Status === 'sent' ? 'sent' : 'queued',
    sentTimestamp: responseData.Date,
    cost: responseData.Cost || 0,
    webhookData: responseData
  };
}

export async function updateExotelSMSLog(smsLogId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_sms_logs
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(smsLogId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getExotelSMSLogs(tenantId, filters = {}) {
  const { status, toNumber, fromNumber, startDate, endDate, campaignId, limit = 100 } = filters;
  
  let sql = `
    SELECT 
      l.*,
      c.campaign_name,
      ct.template_name,
      p.name as patient_name,
      p.phone as patient_phone
    FROM emr.exotel_sms_logs l
    LEFT JOIN emr.exotel_sms_campaigns c ON l.campaign_id = c.id
    LEFT JOIN emr.communication_templates ct ON l.template_id = ct.id
    LEFT JOIN emr.patient_communications pc ON l.communication_id = pc.id
    LEFT JOIN emr.patients p ON pc.patient_id = p.id
    WHERE l.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND l.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (toNumber) {
    sql += ` AND l.to_number = $${paramIndex++}`;
    params.push(toNumber);
  }
  
  if (fromNumber) {
    sql += ` AND l.from_number = $${paramIndex++}`;
    params.push(fromNumber);
  }
  
  if (startDate) {
    sql += ` AND l.created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND l.created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  if (campaignId) {
    sql += ` AND l.campaign_id = $${paramIndex++}`;
    params.push(campaignId);
  }
  
  sql += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);
  
  const result = await query(sql, params);
  return result.rows;
}

export async function createExotelNumberPool({ tenantId, poolName, phoneNumber, numberType, departmentId, doctorId, dailyLimit, monthlyLimit, priority = 1, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_number_pools (
      tenant_id, pool_name, phone_number, number_type, department_id, doctor_id,
      daily_limit, monthly_limit, priority, is_active, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, poolName, phoneNumber, numberType, departmentId, doctorId,
    dailyLimit, monthlyLimit, priority, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelNumberPools(tenantId, filters = {}) {
  const { isActive = true, numberType, departmentId, doctorId } = filters;
  
  let sql = `
    SELECT 
      np.*,
      d.name as department_name,
      u.name as doctor_name,
      ROUND((np.current_daily_usage::float / NULLIF(np.daily_limit, 0) * 100), 2) as daily_usage_percentage,
      ROUND((np.current_monthly_usage::float / NULLIF(np.monthly_limit, 0) * 100), 2) as monthly_usage_percentage
    FROM emr.exotel_number_pools np
    LEFT JOIN emr.departments d ON np.department_id = d.id
    LEFT JOIN emr.users u ON np.doctor_id = u.id
    WHERE np.tenant_id = $1 AND np.is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (numberType) {
    sql += ` AND np.number_type = $${paramIndex++}`;
    params.push(numberType);
  }
  
  if (departmentId) {
    sql += ` AND np.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND np.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  sql += ` ORDER BY np.priority ASC, np.pool_name`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function processExotelWebhook(tenantId, eventData) {
  const sql = `
    INSERT INTO emr.exotel_webhook_events (
      tenant_id, event_type, event_data, message_sid, account_sid, created_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, eventData.eventType || 'unknown', 
    JSON.stringify(eventData), 
    eventData.SmsSid, 
    eventData.AccountSid
  ]);
  
  const webhookEvent = result.rows[0];
  
  // Process delivery reports
  if (eventData.Status) {
    await processExotelDeliveryReport(tenantId, eventData);
  }
  
  return webhookEvent;
}

export async function processExotelDeliveryReport(tenantId, deliveryData) {
  const { SmsSid, Status, ErrorCode, ErrorMessage, Date, Cost } = deliveryData;
  
  // Update SMS log with delivery status
  const updateData = {
    status: Status.toLowerCase(),
    deliveryStatus: Status.toLowerCase(),
    deliveryTimestamp: Date ? new Date(Date) : null,
    errorCode: ErrorCode,
    errorMessage: ErrorMessage,
    cost: Cost || 0,
    webhookData: JSON.stringify(deliveryData)
  };
  
  // Find the SMS log entry
  const findSql = `
    SELECT id, communication_id, to_number 
    FROM emr.exotel_sms_logs 
    WHERE message_sid = $1 AND tenant_id = $2
  `;
  
  const findResult = await query(findSql, [SmsSid, tenantId]);
  const smsLog = findResult.rows[0];
  
  if (smsLog) {
    await updateExotelSMSLog(smsLog.id, tenantId, updateData);
    
    // Update communication status if linked
    if (smsLog.communication_id) {
      const communicationStatus = Status.toLowerCase() === 'delivered' ? 'delivered' : 
                              Status.toLowerCase() === 'failed' ? 'failed' : 'sent';
      
      await updateCommunicationStatus(smsLog.communication_id, tenantId, communicationStatus, {
        externalId: SmsSid,
        provider: 'exotel',
        failedReason: ErrorMessage
      });
    }
    
    // Schedule retry for failed messages
    if (Status.toLowerCase() === 'failed' && ErrorCode !== '404') {
      await scheduleSMSRetry(smsLog.id);
    }
  }
}

export async function scheduleSMSRetry(smsLogId) {
  const sql = `SELECT schedule_sms_retry($1)`;
  await query(sql, [smsLogId]);
}

export async function getExotelSMSStats(tenantId, filters = {}) {
  const { startDate, endDate, messageType, fromNumber } = filters;
  
  let sql = `SELECT get_exotel_sms_stats($1, $2, $3)`;
  const params = [tenantId, startDate, endDate];
  
  const result = await query(sql, params);
  return result.rows;
}

export async function retryFailedSMS(tenantId, smsLogId) {
  const sql = `
    SELECT l.*, c.account_sid, c.api_key, c.api_token, c.subdomain
    FROM emr.exotel_sms_logs l
    JOIN emr.exotel_configurations c ON l.account_sid = c.account_sid
    WHERE l.id = $1 AND l.tenant_id = $2 AND l.status = 'failed'
  `;
  
  const result = await query(sql, [smsLogId, tenantId]);
  const smsLog = result.rows[0];
  
  if (!smsLog) {
    throw new Error('SMS log not found or not in failed status');
  }
  
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: smsLog.account_sid,
      apiKey: smsLog.api_key,
      apiToken: smsLog.api_token,
      subdomain: smsLog.subdomain,
      fromNumber: smsLog.from_number,
      toNumber: smsLog.to_number,
      messageContent: smsLog.message_content,
      priority: smsLog.priority,
      externalId: smsLog.id
    });
    
    // Update log with retry result
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: true, exotelResponse };
  } catch (error) {
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'RETRY_FAILED',
      errorMessage: error.message,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: false, error: error.message };
  }
}

export async function getPendingRetries(tenantId) {
  const sql = `
    SELECT 
      l.*,
      EXTRACT(EPOCH FROM (next_retry_at - NOW()))/60 as minutes_until_retry
    FROM emr.exotel_sms_logs l
    WHERE l.tenant_id = $1 
      AND l.status = 'queued' 
      AND l.next_retry_at IS NOT NULL 
      AND l.next_retry_at <= NOW() + INTERVAL '1 hour'
      AND l.retry_count < l.max_retries
    ORDER BY l.next_retry_at ASC
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function processScheduledCampaigns(tenantId) {
  const sql = `
    SELECT c.* 
    FROM emr.exotel_sms_campaigns c
    WHERE c.tenant_id = $1 
      AND c.status = 'scheduled' 
      AND c.scheduled_at <= NOW()
    ORDER BY c.scheduled_at ASC
  `;
  
  const campaigns = await query(sql, [tenantId]);
  
  for (const campaign of campaigns) {
    // Update campaign status to active
    await query(`
      UPDATE emr.exotel_sms_campaigns 
      SET status = 'active', updated_at = NOW()
      WHERE id = $1
    `, [campaign.id]);
    
    // Process campaign based on target audience
    await processSMSCampaign(campaign, tenantId);
  }
}

export async function processSMSCampaign(campaign, tenantId) {
  const { targetAudience, filters } = campaign;
  
  let targetNumbers = [];
  
  switch (targetAudience) {
    case 'all_patients':
      const patientsSql = `
        SELECT DISTINCT phone FROM emr.patients 
        WHERE tenant_id = $1 AND phone IS NOT NULL
      `;
      const patientsResult = await query(patientsSql, [tenantId]);
      targetNumbers = patientsResult.rows.map(p => p.phone);
      break;
      
    case 'specific_patients':
      if (filters && filters.patientIds) {
        const specificPatientsSql = `
          SELECT phone FROM emr.patients 
          WHERE tenant_id = $1 AND id = ANY($2)
        `;
        const specificResult = await query(specificPatientsSql, [tenantId, filters.patientIds]);
        targetNumbers = specificResult.rows.map(p => p.phone);
      }
      break;
      
    case 'department':
      if (filters && filters.departmentId) {
        const deptPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.department_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const deptResult = await query(deptPatientsSql, [tenantId, filters.departmentId]);
        targetNumbers = deptResult.rows.map(p => p.phone);
      }
      break;
      
    case 'doctor':
      if (filters && filters.doctorId) {
        const doctorPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.doctor_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const doctorResult = await query(doctorPatientsSql, [tenantId, filters.doctorId]);
        targetNumbers = doctorResult.rows.map(p => p.phone);
      }
      break;
      
    default:
      if (filters && filters.phoneNumbers) {
        targetNumbers = filters.phoneNumbers;
      }
      break;
  }
  
  // Send SMS to all target numbers
  for (const phoneNumber of targetNumbers) {
    await sendExotelSMS({
      tenantId,
      toNumber: phoneNumber,
      messageContent: campaign.message_content || 'Campaign message',
      messageType: 'promotional',
      campaignId: campaign.id
    });
  }
  
  // Update campaign statistics
  await query(`
    UPDATE emr.exotel_sms_campaigns 
    SET total_recipients = $1, updated_at = NOW()
    WHERE id = $2
  `, [targetNumbers.length, campaign.id]);
}

export async function addBillItem({ tenantId, billId, serviceType, serviceName, serviceCode, description, quantity, unitPrice, discountAmount, taxAmount, totalAmount, doctorId, departmentId, createdBy }) {
  const sql = `
    INSERT INTO emr.opd_bill_items (
      tenant_id, bill_id, service_type, service_name, service_code, description,
      quantity, unit_price, discount_amount, tax_amount, total_amount,
      doctor_id, department_id, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, billId, serviceType, serviceName, serviceCode, description,
    quantity, unitPrice, discountAmount, taxAmount, totalAmount,
    doctorId, departmentId, createdBy
  ]);
  
  // Update bill totals
  await query(`SELECT calculate_bill_totals($1)`, [billId]);
  
  return result.rows[0];
}

export async function updateBillStatus(billId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  if (additionalData.paymentMethod) {
    fields.push('payment_method');
    values.push(additionalData.paymentMethod);
  }
  
  if (additionalData.paidAmount) {
    fields.push('paid_amount');
    values.push(additionalData.paidAmount);
  }
  
  if (additionalData.paymentDate) {
    fields.push('payment_date');
    values.push(additionalData.paymentDate);
  }
  
  if (additionalData.transactionId) {
    fields.push('transaction_id');
    values.push(additionalData.transactionId);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.opd_bills 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(billId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getBillingStats(tenantId, filters = {}) {
  const { departmentId, doctorId, date = new Date().toISOString().split('T')[0] } = filters;
  
  const sql = `
    SELECT 
      COUNT(*) as total_bills,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_bills,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bills,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bills,
      SUM(total_amount) as total_revenue,
      SUM(paid_amount) as total_paid,
      SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as collected_revenue,
      AVG(total_amount) as avg_bill_amount
    FROM emr.opd_bills
    WHERE tenant_id = $1 
      AND bill_date = $2
      AND ($3::uuid IS NULL OR department_id = $3)
      AND ($4::uuid IS NULL OR doctor_id = $4)
  `;
  
  const result = await query(sql, [tenantId, date, departmentId, doctorId]);
  return result.rows[0];
}

export async function getServicePackages(tenantId, filters = {}) {
  const { isActive = true, departmentId } = filters;
  
  let sql = `
    SELECT 
      sp.*,
      d.name as department_name,
      COUNT(pi.id) as item_count
    FROM emr.opd_service_packages sp
    LEFT JOIN emr.departments d ON sp.department_id = d.id
    LEFT JOIN emr.opd_package_items pi ON sp.id = pi.package_id
    WHERE sp.tenant_id = $1
      AND sp.is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (departmentId) {
    sql += ` AND sp.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  sql += ` GROUP BY sp.id, d.name ORDER BY sp.name`;
  
  const result = await query(sql, params);
  return result.rows;
}

// =====================================================
// COMMUNICATION SYSTEM
// =====================================================

export async function createCommunicationTemplate({ tenantId, templateName, templateType, purpose, subject, messageContent, variables, isActive = true, isDefault = false, createdBy }) {
  const sql = `
    INSERT INTO emr.communication_templates (
      tenant_id, template_name, template_type, purpose, subject, message_content,
      variables, is_active, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, templateName, templateType, purpose, subject, messageContent,
    JSON.stringify(variables || []), isActive, isDefault, createdBy
  ]);
  
  return result.rows[0];
}

export async function getCommunicationTemplates(tenantId, filters = {}) {
  const { templateType, purpose, isActive = true } = filters;
  
  let sql = `
    SELECT * FROM emr.communication_templates
    WHERE tenant_id = $1 AND is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (templateType) {
    sql += ` AND template_type = $${paramIndex++}`;
    params.push(templateType);
  }
  
  if (purpose) {
    sql += ` AND purpose = $${paramIndex++}`;
    params.push(purpose);
  }
  
  sql += ` ORDER BY template_name`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function sendCommunication({ tenantId, patientId, communicationType, purpose, messageContent, recipientPhone, recipientEmail, subject, appointmentId, tokenId, billId, templateId, variablesUsed, scheduledFor, isAutomated = false, priority = 1, createdBy }) {
  const sql = `
    SELECT create_communication(
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) as communication_id
  `;
  
  const result = await query(sql, [
    tenantId, patientId, communicationType, purpose, messageContent,
    recipientPhone, recipientEmail, subject, appointmentId, tokenId, billId,
    templateId, variablesUsed ? JSON.stringify(variablesUsed) : null, scheduledFor, isAutomated, priority, createdBy
  ]);
  
  return result.rows[0].communication_id;
}

export async function getPatientCommunications(tenantId, filters = {}) {
  const { patientId, communicationType, purpose, status, date } = filters;
  
  let sql = `
    SELECT 
      pc.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email,
      ct.template_name,
      a.start as appointment_time,
      t.full_token as token_number,
      b.bill_number
    FROM emr.patient_communications pc
    LEFT JOIN emr.patients p ON pc.patient_id = p.id
    LEFT JOIN emr.communication_templates ct ON pc.template_id = ct.id
    LEFT JOIN emr.appointments a ON pc.appointment_id = a.id
    LEFT JOIN emr.opd_tokens t ON pc.token_id = t.id
    LEFT JOIN emr.opd_bills b ON pc.bill_id = b.id
    WHERE pc.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (patientId) {
    sql += ` AND pc.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  if (communicationType) {
    sql += ` AND pc.communication_type = $${paramIndex++}`;
    params.push(communicationType);
  }
  
  if (purpose) {
    sql += ` AND pc.purpose = $${paramIndex++}`;
    params.push(purpose);
  }
  
  if (status) {
    sql += ` AND pc.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (date) {
    sql += ` AND DATE(pc.created_at) = $${paramIndex++}`;
    params.push(date);
  }
  
  sql += ` ORDER BY pc.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function updateCommunicationStatus(communicationId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  if (status === 'sent') {
    fields.push('sent_at');
    values.push(new Date());
  }
  
  if (status === 'delivered') {
    fields.push('delivered_at');
    values.push(new Date());
  }
  
  if (status === 'read') {
    fields.push('read_at');
    values.push(new Date());
  }
  
  if (additionalData.externalId) {
    fields.push('external_id');
    values.push(additionalData.externalId);
  }
  
  if (additionalData.provider) {
    fields.push('provider');
    values.push(additionalData.provider);
  }
  
  if (additionalData.failedReason) {
    fields.push('failed_reason');
    values.push(additionalData.failedReason);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.patient_communications 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(communicationId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function scheduleAppointmentReminder({ tenantId, appointmentId, patientId, patientPhone, patientEmail, appointmentTime, doctorName, departmentName }) {
  const variables = {
    patient_name: patientId, // Will be replaced with actual patient name
    appointment_time: appointmentTime,
    doctor_name: doctorName,
    department_name: departmentName,
    hospital_name: 'Hospital' // Get from settings
  };
  
  const messageContent = `Reminder: Your appointment is scheduled for ${appointmentTime} with Dr. ${doctorName} at ${departmentName}. Please arrive 15 minutes early.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'appointment_reminder',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    appointmentId,
    variablesUsed: variables,
    scheduledFor: new Date(appointmentTime).getTime() - (24 * 60 * 60 * 1000), // 24 hours before
    isAutomated: true,
    createdBy: null
  });
  
  return communicationId;
}

export async function sendTokenCallNotification({ tenantId, tokenId, patientId, patientPhone, patientEmail, tokenNumber, departmentName, doctorName }) {
  const variables = {
    patient_name: patientId,
    token_number: tokenNumber,
    department_name: departmentName,
    doctor_name: doctorName,
    hospital_name: 'Hospital'
  };
  
  const messageContent = `Your token ${tokenNumber} has been called. Please proceed to ${departmentName}. Dr. ${doctorName} is ready to see you.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'token_call',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    tokenId,
    variablesUsed: variables,
    isAutomated: true,
    priority: 2,
    createdBy: null
  });
  
  return communicationId;
}

export async function sendBillingReminder({ tenantId, billId, patientId, patientPhone, patientEmail, billNumber, totalAmount, dueDate }) {
  const variables = {
    patient_name: patientId,
    bill_number: billNumber,
    total_amount: totalAmount,
    due_date: dueDate,
    hospital_name: 'Hospital'
  };
  
  const messageContent = `Reminder: Bill ${billNumber} of amount ${totalAmount} is due on ${dueDate}. Please complete the payment to avoid any inconvenience.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'billing_reminder',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    billId,
    variablesUsed: variables,
    isAutomated: true,
    priority: 1,
    createdBy: null
  });
  
  return communicationId;
}

export async function updateTokenStatus(tokenId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  // Add timestamp fields based on status
  if (status === 'called') {
    fields.push('last_called_at');
    values.push(new Date());
  }
  
  if (status === 'in_progress') {
    fields.push('consultation_started_at');
    values.push(new Date());
  }
  
  if (status === 'completed') {
    fields.push('consultation_completed_at');
    values.push(new Date());
  }
  
  // Add called_count increment
  if (status === 'called') {
    fields.push('called_count');
    values.push(`(SELECT COALESCE(called_count, 0) + 1 FROM emr.opd_tokens WHERE id = $1)`);
  }
  
  // Add additional data
  if (additionalData.doctorId) {
    fields.push('doctor_id');
    values.push(additionalData.doctorId);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.opd_tokens 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(tokenId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function callNextToken(tenantId, departmentId, doctorId = null) {
  const sql = `
    UPDATE emr.opd_tokens 
    SET status = 'called',
        last_called_at = NOW(),
        called_count = COALESCE(called_count, 0) + 1,
        updated_at = NOW()
    WHERE id = (
      SELECT id FROM emr.opd_tokens 
      WHERE tenant_id = $1 
        AND ($2::uuid IS NULL OR department_id = $2)
        AND ($3::uuid IS NULL OR doctor_id = $3)
        AND status = 'waiting'
      ORDER BY 
        CASE 
          WHEN priority = 'urgent' THEN 1
          WHEN priority = 'senior_citizen' THEN 2
          WHEN priority = 'follow_up' THEN 3
          ELSE 4
        END,
        token_number ASC
      LIMIT 1
    )
    RETURNING *
  `;
  
  const result = await query(sql, [tenantId, departmentId, doctorId]);
  return result.rows[0];
}

export async function getTokenQueueStats(tenantId, filters = {}) {
  const { departmentId, doctorId, date = new Date().toISOString().split('T')[0] } = filters;
  
  const sql = `
    SELECT 
      COUNT(*) as total_tokens,
      COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting,
      COUNT(CASE WHEN status = 'called' THEN 1 END) as called,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
      COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show,
      AVG(EXTRACT(EPOCH FROM (consultation_completed_at - consultation_started_at))/60) as avg_consultation_time_minutes
    FROM emr.opd_tokens
    WHERE tenant_id = $1 
      AND DATE(created_at) = $2
      AND ($3::uuid IS NULL OR department_id = $3)
      AND ($4::uuid IS NULL OR doctor_id = $4)
  `;
  
  const result = await query(sql, [tenantId, date, departmentId, doctorId]);
  return result.rows[0];
}

export async function getActiveTokensByDepartment(tenantId) {
  const sql = `
    SELECT 
      d.id as department_id,
      d.name as department_name,
      COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) as waiting_count,
      COUNT(CASE WHEN t.status = 'called' THEN 1 END) as called_count,
      COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_count,
      MAX(t.token_number) as last_token,
      t.full_token as current_token,
      t.status as current_token_status
    FROM emr.departments d
    LEFT JOIN emr.opd_tokens t ON d.id = t.department_id 
      AND t.tenant_id = $1 
      AND DATE(t.created_at) = CURRENT_DATE
      AND t.status IN ('waiting', 'called', 'in_progress')
    WHERE d.tenant_id = $1
    GROUP BY d.id, d.name, t.full_token, t.status
    ORDER BY d.name
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function updateTokenVitals(tokenId, tenantId, vitalsData) {
  const sql = `
    UPDATE emr.opd_tokens 
    SET vitals_recorded = true,
        updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  
  const result = await query(sql, [tokenId, tenantId]);
  
  // Create vitals record if needed
  if (result.rows[0]) {
    const vitalsSql = `
      INSERT INTO emr.vitals (
        tenant_id, patient_id, encounter_id, blood_pressure_systolic,
        blood_pressure_diastolic, heart_rate, temperature, 
        oxygen_saturation, weight, height, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    await query(vitalsSql, [
      tenantId, 
      result.rows[0].patient_id, 
      null, // No encounter yet
      vitalsData.bloodPressureSystolic,
      vitalsData.bloodPressureDiastolic,
      vitalsData.heartRate,
      vitalsData.temperature,
      vitalsData.oxygenSaturation,
      vitalsData.weight,
      vitalsData.height,
      vitalsData.createdBy
    ]);
  }
  
  return result.rows[0];
}

export async function getTokenHistory(tenantId, patientId, limit = 10) {
  const sql = `
    SELECT 
      t.*,
      d.name as department_name,
      u.name as doctor_name,
      EXTRACT(EPOCH FROM (consultation_completed_at - consultation_started_at))/60 as consultation_duration_minutes
    FROM emr.opd_tokens t
    LEFT JOIN emr.departments d ON t.department_id = d.id
    LEFT JOIN emr.users u ON t.doctor_id = u.id
    WHERE t.tenant_id = $1 AND t.patient_id = $2
    ORDER BY t.created_at DESC
    LIMIT $3
  `;
  
  const result = await query(sql, [tenantId, patientId, limit]);
  return result.rows;
}

export async function deleteOPDToken(tokenId, tenantId) {
  const sql = `
    DELETE FROM emr.opd_tokens 
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  
  const result = await query(sql, [tokenId, tenantId]);
  return result.rows[0];
}

// =====================================================
// OPD BILLING SYSTEM
// =====================================================

export async function createOPDBill({ tenantId, patientId, tokenId, appointmentId, patientName, patientAge, patientGender, visitType, departmentId, doctorId, departmentName, doctorName, consultationFee, registrationFee, procedureCharges, labCharges, medicineCharges, otherCharges, discountAmount, discountPercentage, taxAmount, totalAmount, paymentMethod, insuranceProvider, policyNumber, notes, createdBy }) {
  // Generate bill number
  const billNumberSql = `SELECT get_next_bill_number($1) as bill_number`;
  const billNumberResult = await query(billNumberSql, [tenantId]);
  const billNumber = billNumberResult.rows[0].bill_number;
  
  const sql = `
    INSERT INTO emr.opd_bills (
      tenant_id, patient_id, token_id, appointment_id, bill_number, bill_date, bill_time,
      patient_name, patient_age, patient_gender, visit_type, department_id, doctor_id,
      department_name, doctor_name, consultation_fee, registration_fee, procedure_charges,
      lab_charges, medicine_charges, other_charges, discount_amount, discount_percentage,
      tax_amount, total_amount, payment_method, insurance_provider, policy_number,
      notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIME,
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22,
            $23, $24, $25, $26, $27)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, tokenId, appointmentId, billNumber,
    patientName, patientAge, patientGender, visitType, departmentId, doctorId,
    departmentName, doctorName, consultationFee || 0, registrationFee || 0, procedureCharges || 0,
    labCharges || 0, medicineCharges || 0, otherCharges || 0, discountAmount || 0, discountPercentage || 0,
    taxAmount || 0, totalAmount || 0, paymentMethod, insuranceProvider, policyNumber,
    notes, createdBy
  ]);
  
  return result.rows[0];
}

export async function getOPDBills(tenantId, filters = {}) {
  const { status, departmentId, doctorId, date, patientId } = filters;
  
  let sql = `
    SELECT 
      b.*,
      p.name as patient_name,
      p.phone as patient_phone,
      d.name as department_name,
      u.name as doctor_name,
      t.full_token as token_number
    FROM emr.opd_bills b
    LEFT JOIN emr.patients p ON b.patient_id = p.id
    LEFT JOIN emr.departments d ON b.department_id = d.id
    LEFT JOIN emr.users u ON b.doctor_id = u.id
    LEFT JOIN emr.opd_tokens t ON b.token_id = t.id
    WHERE b.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND b.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (departmentId) {
    sql += ` AND b.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND b.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (date) {
    sql += ` AND b.bill_date = $${paramIndex++}`;
    params.push(date);
  }
  
  if (patientId) {
    sql += ` AND b.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  sql += ` ORDER BY b.bill_date DESC, b.bill_time DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getOPDBillById(billId, tenantId) {
  const sql = `
    SELECT 
      b.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email,
      d.name as department_name,
      u.name as doctor_name,
      t.full_token as token_number,
      a.start as appointment_time
    FROM emr.opd_bills b
    LEFT JOIN emr.patients p ON b.patient_id = p.id
    LEFT JOIN emr.departments d ON b.department_id = d.id
    LEFT JOIN emr.users u ON b.doctor_id = u.id
    LEFT JOIN emr.opd_tokens t ON b.token_id = t.id
    LEFT JOIN emr.appointments a ON b.appointment_id = a.id
    WHERE b.id = $1 AND b.tenant_id = $2
  `;
  
  const result = await query(sql, [billId, tenantId]);
  return result.rows[0];
}

// =====================================================
// EXOTEL SMS PROVIDER INTEGRATION
// =====================================================

export async function createExotelConfiguration({ tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber, webhookUrl, deliveryReportWebhook, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_configurations (
      tenant_id, account_sid, api_key, api_token, subdomain, from_number,
      webhook_url, delivery_report_webhook, is_active, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber,
    webhookUrl, deliveryReportWebhook, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelConfigurations(tenantId, isActive = true) {
  const sql = `
    SELECT * FROM emr.exotel_configurations
    WHERE tenant_id = $1 AND is_active = $2
    ORDER BY is_default DESC, created_at DESC
  `;
  
  const result = await query(sql, [tenantId, isActive]);
  return result.rows;
}

export async function updateExotelConfiguration(configId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_configurations
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(configId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function createSMSCampaign({ tenantId, campaignName, campaignType, description, templateId, targetAudience, filters, scheduleType, scheduledAt, recurringPattern, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_sms_campaigns (
      tenant_id, campaign_name, campaign_type, description, template_id,
      target_audience, filters, schedule_type, scheduled_at, recurring_pattern,
      status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, campaignName, campaignType, description, templateId,
    targetAudience, JSON.stringify(filters), scheduleType, scheduledAt, 
    recurringPattern ? JSON.stringify(recurringPattern) : null, createdBy
  ]);
  
  return result.rows[0];
}

export async function getSMSCampaigns(tenantId, filters = {}) {
  const { status, campaignType, startDate, endDate } = filters;
  
  let sql = `
    SELECT 
      c.*,
      ct.template_name,
      ct.message_content,
      COUNT(l.id) as sent_count,
      COUNT(CASE WHEN l.status = 'delivered' THEN 1 END) as delivered_count,
      COUNT(CASE WHEN l.status = 'failed' THEN 1 END) as failed_count
    FROM emr.exotel_sms_campaigns c
    LEFT JOIN emr.communication_templates ct ON c.template_id = ct.id
    LEFT JOIN emr.exotel_sms_logs l ON c.id = l.campaign_id
    WHERE c.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND c.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (campaignType) {
    sql += ` AND c.campaign_type = $${paramIndex++}`;
    params.push(campaignType);
  }
  
  if (startDate) {
    sql += ` AND c.scheduled_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND c.scheduled_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  sql += ` GROUP BY c.id, ct.template_name, ct.message_content ORDER BY c.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function sendExotelSMS({ tenantId, toNumber, messageContent, messageType = 'transactional', priority = 1, campaignId = null, communicationId = null, externalId = null }) {
  // Get available Exotel number
  const availableNumberSql = `SELECT get_available_exotel_number($1, $2) as from_number`;
  const numberResult = await query(availableNumberSql, [tenantId, messageType]);
  const fromNumber = numberResult.rows[0].from_number;
  
  if (!fromNumber) {
    throw new Error('No available Exotel number found for this message type');
  }
  
  // Get Exotel configuration
  const configSql = `
    SELECT account_sid, api_key, api_token, subdomain 
    FROM emr.exotel_configurations 
    WHERE tenant_id = $1 AND is_active = true 
    ORDER BY is_default DESC 
    LIMIT 1
  `;
  const configResult = await query(configSql, [tenantId]);
  const config = configResult.rows[0];
  
  if (!config) {
    throw new Error('No active Exotel configuration found');
  }
  
  // Create SMS log entry
  const logSql = `
    INSERT INTO emr.exotel_sms_logs (
      tenant_id, campaign_id, communication_id, account_sid, from_number, to_number,
      message_content, message_type, priority, status, external_id, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued', $10, NOW())
    RETURNING *
  `;
  
  const logResult = await query(logSql, [
    tenantId, campaignId, communicationId, config.account_sid, fromNumber, toNumber,
    messageContent, messageType, priority, externalId
  ]);
  
  const smsLog = logResult.rows[0];
  
  // Update number pool usage
  await query(`SELECT update_exotel_number_usage($1, $2, 1)`, [tenantId, fromNumber]);
  
  // Send SMS via Exotel API
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: config.account_sid,
      apiKey: config.api_key,
      apiToken: config.api_token,
      subdomain: config.subdomain,
      fromNumber,
      toNumber,
      messageContent,
      priority,
      externalId: smsLog.id
    });
    
    // Update log with Exotel response
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      webhookData: exotelResponse.webhookData
    });
    
    // Update communication status if linked
    if (communicationId) {
      const communicationStatus = exotelResponse.status === 'sent' ? 'sent' : 'failed';
      await updateCommunicationStatus(communicationId, tenantId, communicationStatus, {
        externalId: exotelResponse.messageSid,
        provider: 'exotel',
        failedReason: exotelResponse.errorMessage
      });
    }
    
    return { success: true, smsLog, exotelResponse };
  } catch (error) {
    // Update log with error
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'API_ERROR',
      errorMessage: error.message
    });
    
    // Update communication status if linked
    if (communicationId) {
      await updateCommunicationStatus(communicationId, tenantId, 'failed', {
        provider: 'exotel',
        failedReason: error.message
      });
    }
    
    return { success: false, error: error.message, smsLog };
  }
}

export async function sendExotelAPIRequest({ accountSid, apiKey, apiToken, subdomain, fromNumber, toNumber, messageContent, priority, externalId }) {
  // Exotel SMS API endpoint
  const apiUrl = `https://${subdomain}.exotel.in/v1/Accounts/${accountSid}/Sms/send`;
  
  const authString = Buffer.from(`${accountSid}:${apiToken}`).toString('base64');
  
  const payload = {
    SmsSid: externalId,
    SenderId: fromNumber,
    To: toNumber,
    MessageBody: messageContent,
    Priority: priority,
    Type: 'txn', // Transactional SMS
    DltTemplateId: '1207160012345678901' // Template ID for DLT compliance
  };
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(`Exotel API Error: ${responseData.message || 'Unknown error'}`);
  }
  
  return {
    messageSid: responseData.SmsSid,
    status: responseData.Status === 'sent' ? 'sent' : 'queued',
    sentTimestamp: responseData.Date,
    cost: responseData.Cost || 0,
    webhookData: responseData
  };
}

export async function updateExotelSMSLog(smsLogId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_sms_logs
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(smsLogId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getExotelSMSLogs(tenantId, filters = {}) {
  const { status, toNumber, fromNumber, startDate, endDate, campaignId, limit = 100 } = filters;
  
  let sql = `
    SELECT 
      l.*,
      c.campaign_name,
      ct.template_name,
      p.name as patient_name,
      p.phone as patient_phone
    FROM emr.exotel_sms_logs l
    LEFT JOIN emr.exotel_sms_campaigns c ON l.campaign_id = c.id
    LEFT JOIN emr.communication_templates ct ON l.template_id = ct.id
    LEFT JOIN emr.patient_communications pc ON l.communication_id = pc.id
    LEFT JOIN emr.patients p ON pc.patient_id = p.id
    WHERE l.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND l.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (toNumber) {
    sql += ` AND l.to_number = $${paramIndex++}`;
    params.push(toNumber);
  }
  
  if (fromNumber) {
    sql += ` AND l.from_number = $${paramIndex++}`;
    params.push(fromNumber);
  }
  
  if (startDate) {
    sql += ` AND l.created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND l.created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  if (campaignId) {
    sql += ` AND l.campaign_id = $${paramIndex++}`;
    params.push(campaignId);
  }
  
  sql += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);
  
  const result = await query(sql, params);
  return result.rows;
}

export async function createExotelNumberPool({ tenantId, poolName, phoneNumber, numberType, departmentId, doctorId, dailyLimit, monthlyLimit, priority = 1, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_number_pools (
      tenant_id, pool_name, phone_number, number_type, department_id, doctor_id,
      daily_limit, monthly_limit, priority, is_active, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, poolName, phoneNumber, numberType, departmentId, doctorId,
    dailyLimit, monthlyLimit, priority, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelNumberPools(tenantId, filters = {}) {
  const { isActive = true, numberType, departmentId, doctorId } = filters;
  
  let sql = `
    SELECT 
      np.*,
      d.name as department_name,
      u.name as doctor_name,
      ROUND((np.current_daily_usage::float / NULLIF(np.daily_limit, 0) * 100), 2) as daily_usage_percentage,
      ROUND((np.current_monthly_usage::float / NULLIF(np.monthly_limit, 0) * 100), 2) as monthly_usage_percentage
    FROM emr.exotel_number_pools np
    LEFT JOIN emr.departments d ON np.department_id = d.id
    LEFT JOIN emr.users u ON np.doctor_id = u.id
    WHERE np.tenant_id = $1 AND np.is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (numberType) {
    sql += ` AND np.number_type = $${paramIndex++}`;
    params.push(numberType);
  }
  
  if (departmentId) {
    sql += ` AND np.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND np.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  sql += ` ORDER BY np.priority ASC, np.pool_name`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function processExotelWebhook(tenantId, eventData) {
  const sql = `
    INSERT INTO emr.exotel_webhook_events (
      tenant_id, event_type, event_data, message_sid, account_sid, created_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, eventData.eventType || 'unknown', 
    JSON.stringify(eventData), 
    eventData.SmsSid, 
    eventData.AccountSid
  ]);
  
  const webhookEvent = result.rows[0];
  
  // Process delivery reports
  if (eventData.Status) {
    await processExotelDeliveryReport(tenantId, eventData);
  }
  
  return webhookEvent;
}

export async function processExotelDeliveryReport(tenantId, deliveryData) {
  const { SmsSid, Status, ErrorCode, ErrorMessage, Date, Cost } = deliveryData;
  
  // Update SMS log with delivery status
  const updateData = {
    status: Status.toLowerCase(),
    deliveryStatus: Status.toLowerCase(),
    deliveryTimestamp: Date ? new Date(Date) : null,
    errorCode: ErrorCode,
    errorMessage: ErrorMessage,
    cost: Cost || 0,
    webhookData: JSON.stringify(deliveryData)
  };
  
  // Find the SMS log entry
  const findSql = `
    SELECT id, communication_id, to_number 
    FROM emr.exotel_sms_logs 
    WHERE message_sid = $1 AND tenant_id = $2
  `;
  
  const findResult = await query(findSql, [SmsSid, tenantId]);
  const smsLog = findResult.rows[0];
  
  if (smsLog) {
    await updateExotelSMSLog(smsLog.id, tenantId, updateData);
    
    // Update communication status if linked
    if (smsLog.communication_id) {
      const communicationStatus = Status.toLowerCase() === 'delivered' ? 'delivered' : 
                              Status.toLowerCase() === 'failed' ? 'failed' : 'sent';
      
      await updateCommunicationStatus(smsLog.communication_id, tenantId, communicationStatus, {
        externalId: SmsSid,
        provider: 'exotel',
        failedReason: ErrorMessage
      });
    }
    
    // Schedule retry for failed messages
    if (Status.toLowerCase() === 'failed' && ErrorCode !== '404') {
      await scheduleSMSRetry(smsLog.id);
    }
  }
}

export async function scheduleSMSRetry(smsLogId) {
  const sql = `SELECT schedule_sms_retry($1)`;
  await query(sql, [smsLogId]);
}

export async function getExotelSMSStats(tenantId, filters = {}) {
  const { startDate, endDate, messageType, fromNumber } = filters;
  
  let sql = `SELECT get_exotel_sms_stats($1, $2, $3)`;
  const params = [tenantId, startDate, endDate];
  
  const result = await query(sql, params);
  return result.rows;
}

export async function retryFailedSMS(tenantId, smsLogId) {
  const sql = `
    SELECT l.*, c.account_sid, c.api_key, c.api_token, c.subdomain
    FROM emr.exotel_sms_logs l
    JOIN emr.exotel_configurations c ON l.account_sid = c.account_sid
    WHERE l.id = $1 AND l.tenant_id = $2 AND l.status = 'failed'
  `;
  
  const result = await query(sql, [smsLogId, tenantId]);
  const smsLog = result.rows[0];
  
  if (!smsLog) {
    throw new Error('SMS log not found or not in failed status');
  }
  
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: smsLog.account_sid,
      apiKey: smsLog.api_key,
      apiToken: smsLog.api_token,
      subdomain: smsLog.subdomain,
      fromNumber: smsLog.from_number,
      toNumber: smsLog.to_number,
      messageContent: smsLog.message_content,
      priority: smsLog.priority,
      externalId: smsLog.id
    });
    
    // Update log with retry result
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: true, exotelResponse };
  } catch (error) {
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'RETRY_FAILED',
      errorMessage: error.message,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: false, error: error.message };
  }
}

export async function getPendingRetries(tenantId) {
  const sql = `
    SELECT 
      l.*,
      EXTRACT(EPOCH FROM (next_retry_at - NOW()))/60 as minutes_until_retry
    FROM emr.exotel_sms_logs l
    WHERE l.tenant_id = $1 
      AND l.status = 'queued' 
      AND l.next_retry_at IS NOT NULL 
      AND l.next_retry_at <= NOW() + INTERVAL '1 hour'
      AND l.retry_count < l.max_retries
    ORDER BY l.next_retry_at ASC
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function processScheduledCampaigns(tenantId) {
  const sql = `
    SELECT c.* 
    FROM emr.exotel_sms_campaigns c
    WHERE c.tenant_id = $1 
      AND c.status = 'scheduled' 
      AND c.scheduled_at <= NOW()
    ORDER BY c.scheduled_at ASC
  `;
  
  const campaigns = await query(sql, [tenantId]);
  
  for (const campaign of campaigns) {
    // Update campaign status to active
    await query(`
      UPDATE emr.exotel_sms_campaigns 
      SET status = 'active', updated_at = NOW()
      WHERE id = $1
    `, [campaign.id]);
    
    // Process campaign based on target audience
    await processSMSCampaign(campaign, tenantId);
  }
}

export async function processSMSCampaign(campaign, tenantId) {
  const { targetAudience, filters } = campaign;
  
  let targetNumbers = [];
  
  switch (targetAudience) {
    case 'all_patients':
      const patientsSql = `
        SELECT DISTINCT phone FROM emr.patients 
        WHERE tenant_id = $1 AND phone IS NOT NULL
      `;
      const patientsResult = await query(patientsSql, [tenantId]);
      targetNumbers = patientsResult.rows.map(p => p.phone);
      break;
      
    case 'specific_patients':
      if (filters && filters.patientIds) {
        const specificPatientsSql = `
          SELECT phone FROM emr.patients 
          WHERE tenant_id = $1 AND id = ANY($2)
        `;
        const specificResult = await query(specificPatientsSql, [tenantId, filters.patientIds]);
        targetNumbers = specificResult.rows.map(p => p.phone);
      }
      break;
      
    case 'department':
      if (filters && filters.departmentId) {
        const deptPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.department_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const deptResult = await query(deptPatientsSql, [tenantId, filters.departmentId]);
        targetNumbers = deptResult.rows.map(p => p.phone);
      }
      break;
      
    case 'doctor':
      if (filters && filters.doctorId) {
        const doctorPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.doctor_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const doctorResult = await query(doctorPatientsSql, [tenantId, filters.doctorId]);
        targetNumbers = doctorResult.rows.map(p => p.phone);
      }
      break;
      
    default:
      if (filters && filters.phoneNumbers) {
        targetNumbers = filters.phoneNumbers;
      }
      break;
  }
  
  // Send SMS to all target numbers
  for (const phoneNumber of targetNumbers) {
    await sendExotelSMS({
      tenantId,
      toNumber: phoneNumber,
      messageContent: campaign.message_content || 'Campaign message',
      messageType: 'promotional',
      campaignId: campaign.id
    });
  }
  
  // Update campaign statistics
  await query(`
    UPDATE emr.exotel_sms_campaigns 
    SET total_recipients = $1, updated_at = NOW()
    WHERE id = $2
  `, [targetNumbers.length, campaign.id]);
}

export async function addBillItem({ tenantId, billId, serviceType, serviceName, serviceCode, description, quantity, unitPrice, discountAmount, taxAmount, totalAmount, doctorId, departmentId, createdBy }) {
  const sql = `
    INSERT INTO emr.opd_bill_items (
      tenant_id, bill_id, service_type, service_name, service_code, description,
      quantity, unit_price, discount_amount, tax_amount, total_amount,
      doctor_id, department_id, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, billId, serviceType, serviceName, serviceCode, description,
    quantity, unitPrice, discountAmount, taxAmount, totalAmount,
    doctorId, departmentId, createdBy
  ]);
  
  // Update bill totals
  await query(`SELECT calculate_bill_totals($1)`, [billId]);
  
  return result.rows[0];
}

export async function updateBillStatus(billId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  if (additionalData.paymentMethod) {
    fields.push('payment_method');
    values.push(additionalData.paymentMethod);
  }
  
  if (additionalData.paidAmount) {
    fields.push('paid_amount');
    values.push(additionalData.paidAmount);
  }
  
  if (additionalData.paymentDate) {
    fields.push('payment_date');
    values.push(additionalData.paymentDate);
  }
  
  if (additionalData.transactionId) {
    fields.push('transaction_id');
    values.push(additionalData.transactionId);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.opd_bills 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(billId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getBillingStats(tenantId, filters = {}) {
  const { departmentId, doctorId, date = new Date().toISOString().split('T')[0] } = filters;
  
  const sql = `
    SELECT 
      COUNT(*) as total_bills,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_bills,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bills,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bills,
      SUM(total_amount) as total_revenue,
      SUM(paid_amount) as total_paid,
      SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as collected_revenue,
      AVG(total_amount) as avg_bill_amount
    FROM emr.opd_bills
    WHERE tenant_id = $1 
      AND bill_date = $2
      AND ($3::uuid IS NULL OR department_id = $3)
      AND ($4::uuid IS NULL OR doctor_id = $4)
  `;
  
  const result = await query(sql, [tenantId, date, departmentId, doctorId]);
  return result.rows[0];
}

export async function getServicePackages(tenantId, filters = {}) {
  const { isActive = true, departmentId } = filters;
  
  let sql = `
    SELECT 
      sp.*,
      d.name as department_name,
      COUNT(pi.id) as item_count
    FROM emr.opd_service_packages sp
    LEFT JOIN emr.departments d ON sp.department_id = d.id
    LEFT JOIN emr.opd_package_items pi ON sp.id = pi.package_id
    WHERE sp.tenant_id = $1
      AND sp.is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (departmentId) {
    sql += ` AND sp.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  sql += ` GROUP BY sp.id, d.name ORDER BY sp.name`;
  
  const result = await query(sql, params);
  return result.rows;
}

// =====================================================
// COMMUNICATION SYSTEM
// =====================================================

export async function createCommunicationTemplate({ tenantId, templateName, templateType, purpose, subject, messageContent, variables, isActive = true, isDefault = false, createdBy }) {
  const sql = `
    INSERT INTO emr.communication_templates (
      tenant_id, template_name, template_type, purpose, subject, message_content,
      variables, is_active, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, templateName, templateType, purpose, subject, messageContent,
    JSON.stringify(variables || []), isActive, isDefault, createdBy
  ]);
  
  return result.rows[0];
}

export async function getCommunicationTemplates(tenantId, filters = {}) {
  const { templateType, purpose, isActive = true } = filters;
  
  let sql = `
    SELECT * FROM emr.communication_templates
    WHERE tenant_id = $1 AND is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (templateType) {
    sql += ` AND template_type = $${paramIndex++}`;
    params.push(templateType);
  }
  
  if (purpose) {
    sql += ` AND purpose = $${paramIndex++}`;
    params.push(purpose);
  }
  
  sql += ` ORDER BY template_name`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function sendCommunication({ tenantId, patientId, communicationType, purpose, messageContent, recipientPhone, recipientEmail, subject, appointmentId, tokenId, billId, templateId, variablesUsed, scheduledFor, isAutomated = false, priority = 1, createdBy }) {
  const sql = `
    SELECT create_communication(
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) as communication_id
  `;
  
  const result = await query(sql, [
    tenantId, patientId, communicationType, purpose, messageContent,
    recipientPhone, recipientEmail, subject, appointmentId, tokenId, billId,
    templateId, variablesUsed ? JSON.stringify(variablesUsed) : null, scheduledFor, isAutomated, priority, createdBy
  ]);
  
  return result.rows[0].communication_id;
}

export async function getPatientCommunications(tenantId, filters = {}) {
  const { patientId, communicationType, purpose, status, date } = filters;
  
  let sql = `
    SELECT 
      pc.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email,
      ct.template_name,
      a.start as appointment_time,
      t.full_token as token_number,
      b.bill_number
    FROM emr.patient_communications pc
    LEFT JOIN emr.patients p ON pc.patient_id = p.id
    LEFT JOIN emr.communication_templates ct ON pc.template_id = ct.id
    LEFT JOIN emr.appointments a ON pc.appointment_id = a.id
    LEFT JOIN emr.opd_tokens t ON pc.token_id = t.id
    LEFT JOIN emr.opd_bills b ON pc.bill_id = b.id
    WHERE pc.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (patientId) {
    sql += ` AND pc.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  if (communicationType) {
    sql += ` AND pc.communication_type = $${paramIndex++}`;
    params.push(communicationType);
  }
  
  if (purpose) {
    sql += ` AND pc.purpose = $${paramIndex++}`;
    params.push(purpose);
  }
  
  if (status) {
    sql += ` AND pc.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (date) {
    sql += ` AND DATE(pc.created_at) = $${paramIndex++}`;
    params.push(date);
  }
  
  sql += ` ORDER BY pc.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function updateCommunicationStatus(communicationId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  if (status === 'sent') {
    fields.push('sent_at');
    values.push(new Date());
  }
  
  if (status === 'delivered') {
    fields.push('delivered_at');
    values.push(new Date());
  }
  
  if (status === 'read') {
    fields.push('read_at');
    values.push(new Date());
  }
  
  if (additionalData.externalId) {
    fields.push('external_id');
    values.push(additionalData.externalId);
  }
  
  if (additionalData.provider) {
    fields.push('provider');
    values.push(additionalData.provider);
  }
  
  if (additionalData.failedReason) {
    fields.push('failed_reason');
    values.push(additionalData.failedReason);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.patient_communications 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(communicationId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function scheduleAppointmentReminder({ tenantId, appointmentId, patientId, patientPhone, patientEmail, appointmentTime, doctorName, departmentName }) {
  const variables = {
    patient_name: patientId, // Will be replaced with actual patient name
    appointment_time: appointmentTime,
    doctor_name: doctorName,
    department_name: departmentName,
    hospital_name: 'Hospital' // Get from settings
  };
  
  const messageContent = `Reminder: Your appointment is scheduled for ${appointmentTime} with Dr. ${doctorName} at ${departmentName}. Please arrive 15 minutes early.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'appointment_reminder',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    appointmentId,
    variablesUsed: variables,
    scheduledFor: new Date(appointmentTime).getTime() - (24 * 60 * 60 * 1000), // 24 hours before
    isAutomated: true,
    createdBy: null
  });
  
  return communicationId;
}

export async function sendTokenCallNotification({ tenantId, tokenId, patientId, patientPhone, patientEmail, tokenNumber, departmentName, doctorName }) {
  const variables = {
    patient_name: patientId,
    token_number: tokenNumber,
    department_name: departmentName,
    doctor_name: doctorName,
    hospital_name: 'Hospital'
  };
  
  const messageContent = `Your token ${tokenNumber} has been called. Please proceed to ${departmentName}. Dr. ${doctorName} is ready to see you.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'token_call',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    tokenId,
    variablesUsed: variables,
    isAutomated: true,
    priority: 2,
    createdBy: null
  });
  
  return communicationId;
}

export async function sendBillingReminder({ tenantId, billId, patientId, patientPhone, patientEmail, billNumber, totalAmount, dueDate }) {
  const variables = {
    patient_name: patientId,
    bill_number: billNumber,
    total_amount: totalAmount,
    due_date: dueDate,
    hospital_name: 'Hospital'
  };
  
  const messageContent = `Reminder: Bill ${billNumber} of amount ${totalAmount} is due on ${dueDate}. Please complete the payment to avoid any inconvenience.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'billing_reminder',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    billId,
    variablesUsed: variables,
    isAutomated: true,
    priority: 1,
    createdBy: null
  });
  
  return communicationId;
}

export async function getAvailableSlotsForDoctor(tenantId, doctorId, date) {
  const sql = `
    SELECT 
      id,
      start_time,
      end_time,
      slot_duration_minutes,
      max_appointments,
      current_appointments,
      available_slots
    FROM emr.doctor_availability 
    WHERE tenant_id = $1 
      AND doctor_id = $2 
      AND date = $3 
      AND is_available = true 
      AND status = 'available'
      AND current_appointments < max_appointments
    ORDER BY start_time
  `;
  
  const result = await query(sql, [tenantId, doctorId, date]);
  return result.rows.map(slot => ({
    ...slot,
    available_slots: slot.max_appointments - slot.current_appointments
  }));
}

export async function getDoctorAvailabilityCalendar(tenantId, doctorId, startDate, endDate) {
  const sql = `
    SELECT 
      date,
      COUNT(*) as total_slots,
      COUNT(CASE WHEN current_appointments < max_appointments THEN 1 END) as available_slots,
      COUNT(CASE WHEN current_appointments >= max_appointments THEN 1 END) as booked_slots,
      MIN(start_time) as first_slot_time,
      MAX(end_time) as last_slot_time
    FROM emr.doctor_availability 
    WHERE tenant_id = $1 
      AND ($2::uuid IS NULL OR doctor_id = $2)
      AND date BETWEEN $3 AND $4
      AND is_available = true
    GROUP BY date
    ORDER BY date
  `;
  
  const result = await query(sql, [tenantId, doctorId, startDate, endDate]);
  return result.rows;
}

export async function deleteDoctorAvailability(availabilityId, tenantId) {
  // Check if there are any appointments booked for this slot
  const checkSql = `
    SELECT COUNT(*) as count 
    FROM emr.appointments a
    JOIN emr.doctor_availability da ON a.doctor_availability_id = da.id
    WHERE da.id = $1 AND da.tenant_id = $2
  `;
  
  const checkResult = await query(checkSql, [availabilityId, tenantId]);
  
  if (parseInt(checkResult.rows[0].count) > 0) {
    throw new Error('Cannot delete availability slot with existing appointments');
  }
  
  const sql = `
    DELETE FROM emr.doctor_availability 
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  
  const result = await query(sql, [availabilityId, tenantId]);
  return result.rows[0];
}

// =====================================================
// OPD TOKEN QUEUE SYSTEM
// =====================================================

export async function generateOPDToken({ tenantId, patientId, departmentId, doctorId, priority = 'general', visitType = 'new', chiefComplaint, appointmentId, createdBy }) {
  // Get next token number
  const nextTokenSql = `
    SELECT get_next_token_number($1, $2) as token_number
  `;
  const tokenResult = await query(nextTokenSql, [tenantId, departmentId]);
  const tokenNumber = tokenResult.rows[0].token_number;
  
  // Create the token
  const sql = `
    INSERT INTO emr.opd_tokens (
      tenant_id, patient_id, token_number, token_prefix, status, priority,
      department_id, doctor_id, appointment_id, visit_type, chief_complaint, created_by
    )
    VALUES ($1, $2, $3, 'OPD', $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, tokenNumber, 'waiting', priority,
    departmentId, doctorId, appointmentId, visitType, chiefComplaint, createdBy
  ]);
  
  return result.rows[0];
}

export async function getOPDTokens(tenantId, filters = {}) {
  const { status, departmentId, doctorId, date, priority } = filters;
  
  let sql = `
    SELECT 
      t.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.age,
      p.gender,
      d.name as department_name,
      u.name as doctor_name,
      a.start as appointment_time
    FROM emr.opd_tokens t
    LEFT JOIN emr.patients p ON t.patient_id = p.id
    LEFT JOIN emr.departments d ON t.department_id = d.id
    LEFT JOIN emr.users u ON t.doctor_id = u.id
    LEFT JOIN emr.appointments a ON t.appointment_id = a.id
    WHERE t.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND t.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (departmentId) {
    sql += ` AND t.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND t.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (date) {
    sql += ` AND DATE(t.created_at) = $${paramIndex++}`;
    params.push(date);
  }
  
  if (priority) {
    sql += ` AND t.priority = $${paramIndex++}`;
    params.push(priority);
  }
  
  sql += ` ORDER BY 
    CASE 
      WHEN t.priority = 'urgent' THEN 1
      WHEN t.priority = 'senior_citizen' THEN 2
      WHEN t.priority = 'follow_up' THEN 3
      ELSE 4
    END,
    t.token_number ASC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getOPDTokenById(tokenId, tenantId) {
  const sql = `
    SELECT 
      t.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.age,
      p.gender,
      p.blood_group,
      p.address,
      d.name as department_name,
      u.name as doctor_name,
      a.start as appointment_time
    FROM emr.opd_tokens t
    LEFT JOIN emr.patients p ON t.patient_id = p.id
    LEFT JOIN emr.departments d ON t.department_id = d.id
    LEFT JOIN emr.users u ON t.doctor_id = u.id
    LEFT JOIN emr.appointments a ON t.appointment_id = a.id
    WHERE t.id = $1 AND t.tenant_id = $2
  `;
  
  const result = await query(sql, [tokenId, tenantId]);
  return result.rows[0];
}

// =====================================================
// OPD BILLING SYSTEM
// =====================================================

export async function createOPDBill({ tenantId, patientId, tokenId, appointmentId, patientName, patientAge, patientGender, visitType, departmentId, doctorId, departmentName, doctorName, consultationFee, registrationFee, procedureCharges, labCharges, medicineCharges, otherCharges, discountAmount, discountPercentage, taxAmount, totalAmount, paymentMethod, insuranceProvider, policyNumber, notes, createdBy }) {
  // Generate bill number
  const billNumberSql = `SELECT get_next_bill_number($1) as bill_number`;
  const billNumberResult = await query(billNumberSql, [tenantId]);
  const billNumber = billNumberResult.rows[0].bill_number;
  
  const sql = `
    INSERT INTO emr.opd_bills (
      tenant_id, patient_id, token_id, appointment_id, bill_number, bill_date, bill_time,
      patient_name, patient_age, patient_gender, visit_type, department_id, doctor_id,
      department_name, doctor_name, consultation_fee, registration_fee, procedure_charges,
      lab_charges, medicine_charges, other_charges, discount_amount, discount_percentage,
      tax_amount, total_amount, payment_method, insurance_provider, policy_number,
      notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIME,
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22,
            $23, $24, $25, $26, $27)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, tokenId, appointmentId, billNumber,
    patientName, patientAge, patientGender, visitType, departmentId, doctorId,
    departmentName, doctorName, consultationFee || 0, registrationFee || 0, procedureCharges || 0,
    labCharges || 0, medicineCharges || 0, otherCharges || 0, discountAmount || 0, discountPercentage || 0,
    taxAmount || 0, totalAmount || 0, paymentMethod, insuranceProvider, policyNumber,
    notes, createdBy
  ]);
  
  return result.rows[0];
}

export async function getOPDBills(tenantId, filters = {}) {
  const { status, departmentId, doctorId, date, patientId } = filters;
  
  let sql = `
    SELECT 
      b.*,
      p.name as patient_name,
      p.phone as patient_phone,
      d.name as department_name,
      u.name as doctor_name,
      t.full_token as token_number
    FROM emr.opd_bills b
    LEFT JOIN emr.patients p ON b.patient_id = p.id
    LEFT JOIN emr.departments d ON b.department_id = d.id
    LEFT JOIN emr.users u ON b.doctor_id = u.id
    LEFT JOIN emr.opd_tokens t ON b.token_id = t.id
    WHERE b.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND b.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (departmentId) {
    sql += ` AND b.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND b.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (date) {
    sql += ` AND b.bill_date = $${paramIndex++}`;
    params.push(date);
  }
  
  if (patientId) {
    sql += ` AND b.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  sql += ` ORDER BY b.bill_date DESC, b.bill_time DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getOPDBillById(billId, tenantId) {
  const sql = `
    SELECT 
      b.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email,
      d.name as department_name,
      u.name as doctor_name,
      t.full_token as token_number,
      a.start as appointment_time
    FROM emr.opd_bills b
    LEFT JOIN emr.patients p ON b.patient_id = p.id
    LEFT JOIN emr.departments d ON b.department_id = d.id
    LEFT JOIN emr.users u ON b.doctor_id = u.id
    LEFT JOIN emr.opd_tokens t ON b.token_id = t.id
    LEFT JOIN emr.appointments a ON b.appointment_id = a.id
    WHERE b.id = $1 AND b.tenant_id = $2
  `;
  
  const result = await query(sql, [billId, tenantId]);
  return result.rows[0];
}

// =====================================================
// EXOTEL SMS PROVIDER INTEGRATION
// =====================================================

export async function createExotelConfiguration({ tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber, webhookUrl, deliveryReportWebhook, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_configurations (
      tenant_id, account_sid, api_key, api_token, subdomain, from_number,
      webhook_url, delivery_report_webhook, is_active, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber,
    webhookUrl, deliveryReportWebhook, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelConfigurations(tenantId, isActive = true) {
  const sql = `
    SELECT * FROM emr.exotel_configurations
    WHERE tenant_id = $1 AND is_active = $2
    ORDER BY is_default DESC, created_at DESC
  `;
  
  const result = await query(sql, [tenantId, isActive]);
  return result.rows;
}

export async function updateExotelConfiguration(configId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_configurations
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(configId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function createSMSCampaign({ tenantId, campaignName, campaignType, description, templateId, targetAudience, filters, scheduleType, scheduledAt, recurringPattern, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_sms_campaigns (
      tenant_id, campaign_name, campaign_type, description, template_id,
      target_audience, filters, schedule_type, scheduled_at, recurring_pattern,
      status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, campaignName, campaignType, description, templateId,
    targetAudience, JSON.stringify(filters), scheduleType, scheduledAt, 
    recurringPattern ? JSON.stringify(recurringPattern) : null, createdBy
  ]);
  
  return result.rows[0];
}

export async function getSMSCampaigns(tenantId, filters = {}) {
  const { status, campaignType, startDate, endDate } = filters;
  
  let sql = `
    SELECT 
      c.*,
      ct.template_name,
      ct.message_content,
      COUNT(l.id) as sent_count,
      COUNT(CASE WHEN l.status = 'delivered' THEN 1 END) as delivered_count,
      COUNT(CASE WHEN l.status = 'failed' THEN 1 END) as failed_count
    FROM emr.exotel_sms_campaigns c
    LEFT JOIN emr.communication_templates ct ON c.template_id = ct.id
    LEFT JOIN emr.exotel_sms_logs l ON c.id = l.campaign_id
    WHERE c.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND c.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (campaignType) {
    sql += ` AND c.campaign_type = $${paramIndex++}`;
    params.push(campaignType);
  }
  
  if (startDate) {
    sql += ` AND c.scheduled_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND c.scheduled_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  sql += ` GROUP BY c.id, ct.template_name, ct.message_content ORDER BY c.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function sendExotelSMS({ tenantId, toNumber, messageContent, messageType = 'transactional', priority = 1, campaignId = null, communicationId = null, externalId = null }) {
  // Get available Exotel number
  const availableNumberSql = `SELECT get_available_exotel_number($1, $2) as from_number`;
  const numberResult = await query(availableNumberSql, [tenantId, messageType]);
  const fromNumber = numberResult.rows[0].from_number;
  
  if (!fromNumber) {
    throw new Error('No available Exotel number found for this message type');
  }
  
  // Get Exotel configuration
  const configSql = `
    SELECT account_sid, api_key, api_token, subdomain 
    FROM emr.exotel_configurations 
    WHERE tenant_id = $1 AND is_active = true 
    ORDER BY is_default DESC 
    LIMIT 1
  `;
  const configResult = await query(configSql, [tenantId]);
  const config = configResult.rows[0];
  
  if (!config) {
    throw new Error('No active Exotel configuration found');
  }
  
  // Create SMS log entry
  const logSql = `
    INSERT INTO emr.exotel_sms_logs (
      tenant_id, campaign_id, communication_id, account_sid, from_number, to_number,
      message_content, message_type, priority, status, external_id, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued', $10, NOW())
    RETURNING *
  `;
  
  const logResult = await query(logSql, [
    tenantId, campaignId, communicationId, config.account_sid, fromNumber, toNumber,
    messageContent, messageType, priority, externalId
  ]);
  
  const smsLog = logResult.rows[0];
  
  // Update number pool usage
  await query(`SELECT update_exotel_number_usage($1, $2, 1)`, [tenantId, fromNumber]);
  
  // Send SMS via Exotel API
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: config.account_sid,
      apiKey: config.api_key,
      apiToken: config.api_token,
      subdomain: config.subdomain,
      fromNumber,
      toNumber,
      messageContent,
      priority,
      externalId: smsLog.id
    });
    
    // Update log with Exotel response
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      webhookData: exotelResponse.webhookData
    });
    
    // Update communication status if linked
    if (communicationId) {
      const communicationStatus = exotelResponse.status === 'sent' ? 'sent' : 'failed';
      await updateCommunicationStatus(communicationId, tenantId, communicationStatus, {
        externalId: exotelResponse.messageSid,
        provider: 'exotel',
        failedReason: exotelResponse.errorMessage
      });
    }
    
    return { success: true, smsLog, exotelResponse };
  } catch (error) {
    // Update log with error
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'API_ERROR',
      errorMessage: error.message
    });
    
    // Update communication status if linked
    if (communicationId) {
      await updateCommunicationStatus(communicationId, tenantId, 'failed', {
        provider: 'exotel',
        failedReason: error.message
      });
    }
    
    return { success: false, error: error.message, smsLog };
  }
}

export async function sendExotelAPIRequest({ accountSid, apiKey, apiToken, subdomain, fromNumber, toNumber, messageContent, priority, externalId }) {
  // Exotel SMS API endpoint
  const apiUrl = `https://${subdomain}.exotel.in/v1/Accounts/${accountSid}/Sms/send`;
  
  const authString = Buffer.from(`${accountSid}:${apiToken}`).toString('base64');
  
  const payload = {
    SmsSid: externalId,
    SenderId: fromNumber,
    To: toNumber,
    MessageBody: messageContent,
    Priority: priority,
    Type: 'txn', // Transactional SMS
    DltTemplateId: '1207160012345678901' // Template ID for DLT compliance
  };
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(`Exotel API Error: ${responseData.message || 'Unknown error'}`);
  }
  
  return {
    messageSid: responseData.SmsSid,
    status: responseData.Status === 'sent' ? 'sent' : 'queued',
    sentTimestamp: responseData.Date,
    cost: responseData.Cost || 0,
    webhookData: responseData
  };
}

export async function updateExotelSMSLog(smsLogId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_sms_logs
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(smsLogId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getExotelSMSLogs(tenantId, filters = {}) {
  const { status, toNumber, fromNumber, startDate, endDate, campaignId, limit = 100 } = filters;
  
  let sql = `
    SELECT 
      l.*,
      c.campaign_name,
      ct.template_name,
      p.name as patient_name,
      p.phone as patient_phone
    FROM emr.exotel_sms_logs l
    LEFT JOIN emr.exotel_sms_campaigns c ON l.campaign_id = c.id
    LEFT JOIN emr.communication_templates ct ON l.template_id = ct.id
    LEFT JOIN emr.patient_communications pc ON l.communication_id = pc.id
    LEFT JOIN emr.patients p ON pc.patient_id = p.id
    WHERE l.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND l.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (toNumber) {
    sql += ` AND l.to_number = $${paramIndex++}`;
    params.push(toNumber);
  }
  
  if (fromNumber) {
    sql += ` AND l.from_number = $${paramIndex++}`;
    params.push(fromNumber);
  }
  
  if (startDate) {
    sql += ` AND l.created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND l.created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  if (campaignId) {
    sql += ` AND l.campaign_id = $${paramIndex++}`;
    params.push(campaignId);
  }
  
  sql += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);
  
  const result = await query(sql, params);
  return result.rows;
}

export async function createExotelNumberPool({ tenantId, poolName, phoneNumber, numberType, departmentId, doctorId, dailyLimit, monthlyLimit, priority = 1, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_number_pools (
      tenant_id, pool_name, phone_number, number_type, department_id, doctor_id,
      daily_limit, monthly_limit, priority, is_active, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, poolName, phoneNumber, numberType, departmentId, doctorId,
    dailyLimit, monthlyLimit, priority, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelNumberPools(tenantId, filters = {}) {
  const { isActive = true, numberType, departmentId, doctorId } = filters;
  
  let sql = `
    SELECT 
      np.*,
      d.name as department_name,
      u.name as doctor_name,
      ROUND((np.current_daily_usage::float / NULLIF(np.daily_limit, 0) * 100), 2) as daily_usage_percentage,
      ROUND((np.current_monthly_usage::float / NULLIF(np.monthly_limit, 0) * 100), 2) as monthly_usage_percentage
    FROM emr.exotel_number_pools np
    LEFT JOIN emr.departments d ON np.department_id = d.id
    LEFT JOIN emr.users u ON np.doctor_id = u.id
    WHERE np.tenant_id = $1 AND np.is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (numberType) {
    sql += ` AND np.number_type = $${paramIndex++}`;
    params.push(numberType);
  }
  
  if (departmentId) {
    sql += ` AND np.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND np.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  sql += ` ORDER BY np.priority ASC, np.pool_name`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function processExotelWebhook(tenantId, eventData) {
  const sql = `
    INSERT INTO emr.exotel_webhook_events (
      tenant_id, event_type, event_data, message_sid, account_sid, created_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, eventData.eventType || 'unknown', 
    JSON.stringify(eventData), 
    eventData.SmsSid, 
    eventData.AccountSid
  ]);
  
  const webhookEvent = result.rows[0];
  
  // Process delivery reports
  if (eventData.Status) {
    await processExotelDeliveryReport(tenantId, eventData);
  }
  
  return webhookEvent;
}

export async function processExotelDeliveryReport(tenantId, deliveryData) {
  const { SmsSid, Status, ErrorCode, ErrorMessage, Date, Cost } = deliveryData;
  
  // Update SMS log with delivery status
  const updateData = {
    status: Status.toLowerCase(),
    deliveryStatus: Status.toLowerCase(),
    deliveryTimestamp: Date ? new Date(Date) : null,
    errorCode: ErrorCode,
    errorMessage: ErrorMessage,
    cost: Cost || 0,
    webhookData: JSON.stringify(deliveryData)
  };
  
  // Find the SMS log entry
  const findSql = `
    SELECT id, communication_id, to_number 
    FROM emr.exotel_sms_logs 
    WHERE message_sid = $1 AND tenant_id = $2
  `;
  
  const findResult = await query(findSql, [SmsSid, tenantId]);
  const smsLog = findResult.rows[0];
  
  if (smsLog) {
    await updateExotelSMSLog(smsLog.id, tenantId, updateData);
    
    // Update communication status if linked
    if (smsLog.communication_id) {
      const communicationStatus = Status.toLowerCase() === 'delivered' ? 'delivered' : 
                              Status.toLowerCase() === 'failed' ? 'failed' : 'sent';
      
      await updateCommunicationStatus(smsLog.communication_id, tenantId, communicationStatus, {
        externalId: SmsSid,
        provider: 'exotel',
        failedReason: ErrorMessage
      });
    }
    
    // Schedule retry for failed messages
    if (Status.toLowerCase() === 'failed' && ErrorCode !== '404') {
      await scheduleSMSRetry(smsLog.id);
    }
  }
}

export async function scheduleSMSRetry(smsLogId) {
  const sql = `SELECT schedule_sms_retry($1)`;
  await query(sql, [smsLogId]);
}

export async function getExotelSMSStats(tenantId, filters = {}) {
  const { startDate, endDate, messageType, fromNumber } = filters;
  
  let sql = `SELECT get_exotel_sms_stats($1, $2, $3)`;
  const params = [tenantId, startDate, endDate];
  
  const result = await query(sql, params);
  return result.rows;
}

export async function retryFailedSMS(tenantId, smsLogId) {
  const sql = `
    SELECT l.*, c.account_sid, c.api_key, c.api_token, c.subdomain
    FROM emr.exotel_sms_logs l
    JOIN emr.exotel_configurations c ON l.account_sid = c.account_sid
    WHERE l.id = $1 AND l.tenant_id = $2 AND l.status = 'failed'
  `;
  
  const result = await query(sql, [smsLogId, tenantId]);
  const smsLog = result.rows[0];
  
  if (!smsLog) {
    throw new Error('SMS log not found or not in failed status');
  }
  
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: smsLog.account_sid,
      apiKey: smsLog.api_key,
      apiToken: smsLog.api_token,
      subdomain: smsLog.subdomain,
      fromNumber: smsLog.from_number,
      toNumber: smsLog.to_number,
      messageContent: smsLog.message_content,
      priority: smsLog.priority,
      externalId: smsLog.id
    });
    
    // Update log with retry result
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: true, exotelResponse };
  } catch (error) {
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'RETRY_FAILED',
      errorMessage: error.message,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: false, error: error.message };
  }
}

export async function getPendingRetries(tenantId) {
  const sql = `
    SELECT 
      l.*,
      EXTRACT(EPOCH FROM (next_retry_at - NOW()))/60 as minutes_until_retry
    FROM emr.exotel_sms_logs l
    WHERE l.tenant_id = $1 
      AND l.status = 'queued' 
      AND l.next_retry_at IS NOT NULL 
      AND l.next_retry_at <= NOW() + INTERVAL '1 hour'
      AND l.retry_count < l.max_retries
    ORDER BY l.next_retry_at ASC
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function processScheduledCampaigns(tenantId) {
  const sql = `
    SELECT c.* 
    FROM emr.exotel_sms_campaigns c
    WHERE c.tenant_id = $1 
      AND c.status = 'scheduled' 
      AND c.scheduled_at <= NOW()
    ORDER BY c.scheduled_at ASC
  `;
  
  const campaigns = await query(sql, [tenantId]);
  
  for (const campaign of campaigns) {
    // Update campaign status to active
    await query(`
      UPDATE emr.exotel_sms_campaigns 
      SET status = 'active', updated_at = NOW()
      WHERE id = $1
    `, [campaign.id]);
    
    // Process campaign based on target audience
    await processSMSCampaign(campaign, tenantId);
  }
}

export async function processSMSCampaign(campaign, tenantId) {
  const { targetAudience, filters } = campaign;
  
  let targetNumbers = [];
  
  switch (targetAudience) {
    case 'all_patients':
      const patientsSql = `
        SELECT DISTINCT phone FROM emr.patients 
        WHERE tenant_id = $1 AND phone IS NOT NULL
      `;
      const patientsResult = await query(patientsSql, [tenantId]);
      targetNumbers = patientsResult.rows.map(p => p.phone);
      break;
      
    case 'specific_patients':
      if (filters && filters.patientIds) {
        const specificPatientsSql = `
          SELECT phone FROM emr.patients 
          WHERE tenant_id = $1 AND id = ANY($2)
        `;
        const specificResult = await query(specificPatientsSql, [tenantId, filters.patientIds]);
        targetNumbers = specificResult.rows.map(p => p.phone);
      }
      break;
      
    case 'department':
      if (filters && filters.departmentId) {
        const deptPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.department_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const deptResult = await query(deptPatientsSql, [tenantId, filters.departmentId]);
        targetNumbers = deptResult.rows.map(p => p.phone);
      }
      break;
      
    case 'doctor':
      if (filters && filters.doctorId) {
        const doctorPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.doctor_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const doctorResult = await query(doctorPatientsSql, [tenantId, filters.doctorId]);
        targetNumbers = doctorResult.rows.map(p => p.phone);
      }
      break;
      
    default:
      if (filters && filters.phoneNumbers) {
        targetNumbers = filters.phoneNumbers;
      }
      break;
  }
  
  // Send SMS to all target numbers
  for (const phoneNumber of targetNumbers) {
    await sendExotelSMS({
      tenantId,
      toNumber: phoneNumber,
      messageContent: campaign.message_content || 'Campaign message',
      messageType: 'promotional',
      campaignId: campaign.id
    });
  }
  
  // Update campaign statistics
  await query(`
    UPDATE emr.exotel_sms_campaigns 
    SET total_recipients = $1, updated_at = NOW()
    WHERE id = $2
  `, [targetNumbers.length, campaign.id]);
}

export async function addBillItem({ tenantId, billId, serviceType, serviceName, serviceCode, description, quantity, unitPrice, discountAmount, taxAmount, totalAmount, doctorId, departmentId, createdBy }) {
  const sql = `
    INSERT INTO emr.opd_bill_items (
      tenant_id, bill_id, service_type, service_name, service_code, description,
      quantity, unit_price, discount_amount, tax_amount, total_amount,
      doctor_id, department_id, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, billId, serviceType, serviceName, serviceCode, description,
    quantity, unitPrice, discountAmount, taxAmount, totalAmount,
    doctorId, departmentId, createdBy
  ]);
  
  // Update bill totals
  await query(`SELECT calculate_bill_totals($1)`, [billId]);
  
  return result.rows[0];
}

export async function updateBillStatus(billId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  if (additionalData.paymentMethod) {
    fields.push('payment_method');
    values.push(additionalData.paymentMethod);
  }
  
  if (additionalData.paidAmount) {
    fields.push('paid_amount');
    values.push(additionalData.paidAmount);
  }
  
  if (additionalData.paymentDate) {
    fields.push('payment_date');
    values.push(additionalData.paymentDate);
  }
  
  if (additionalData.transactionId) {
    fields.push('transaction_id');
    values.push(additionalData.transactionId);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.opd_bills 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(billId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getBillingStats(tenantId, filters = {}) {
  const { departmentId, doctorId, date = new Date().toISOString().split('T')[0] } = filters;
  
  const sql = `
    SELECT 
      COUNT(*) as total_bills,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_bills,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bills,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bills,
      SUM(total_amount) as total_revenue,
      SUM(paid_amount) as total_paid,
      SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as collected_revenue,
      AVG(total_amount) as avg_bill_amount
    FROM emr.opd_bills
    WHERE tenant_id = $1 
      AND bill_date = $2
      AND ($3::uuid IS NULL OR department_id = $3)
      AND ($4::uuid IS NULL OR doctor_id = $4)
  `;
  
  const result = await query(sql, [tenantId, date, departmentId, doctorId]);
  return result.rows[0];
}

export async function getServicePackages(tenantId, filters = {}) {
  const { isActive = true, departmentId } = filters;
  
  let sql = `
    SELECT 
      sp.*,
      d.name as department_name,
      COUNT(pi.id) as item_count
    FROM emr.opd_service_packages sp
    LEFT JOIN emr.departments d ON sp.department_id = d.id
    LEFT JOIN emr.opd_package_items pi ON sp.id = pi.package_id
    WHERE sp.tenant_id = $1
      AND sp.is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (departmentId) {
    sql += ` AND sp.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  sql += ` GROUP BY sp.id, d.name ORDER BY sp.name`;
  
  const result = await query(sql, params);
  return result.rows;
}

// =====================================================
// COMMUNICATION SYSTEM
// =====================================================

export async function createCommunicationTemplate({ tenantId, templateName, templateType, purpose, subject, messageContent, variables, isActive = true, isDefault = false, createdBy }) {
  const sql = `
    INSERT INTO emr.communication_templates (
      tenant_id, template_name, template_type, purpose, subject, message_content,
      variables, is_active, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, templateName, templateType, purpose, subject, messageContent,
    JSON.stringify(variables || []), isActive, isDefault, createdBy
  ]);
  
  return result.rows[0];
}

export async function getCommunicationTemplates(tenantId, filters = {}) {
  const { templateType, purpose, isActive = true } = filters;
  
  let sql = `
    SELECT * FROM emr.communication_templates
    WHERE tenant_id = $1 AND is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (templateType) {
    sql += ` AND template_type = $${paramIndex++}`;
    params.push(templateType);
  }
  
  if (purpose) {
    sql += ` AND purpose = $${paramIndex++}`;
    params.push(purpose);
  }
  
  sql += ` ORDER BY template_name`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function sendCommunication({ tenantId, patientId, communicationType, purpose, messageContent, recipientPhone, recipientEmail, subject, appointmentId, tokenId, billId, templateId, variablesUsed, scheduledFor, isAutomated = false, priority = 1, createdBy }) {
  const sql = `
    SELECT create_communication(
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) as communication_id
  `;
  
  const result = await query(sql, [
    tenantId, patientId, communicationType, purpose, messageContent,
    recipientPhone, recipientEmail, subject, appointmentId, tokenId, billId,
    templateId, variablesUsed ? JSON.stringify(variablesUsed) : null, scheduledFor, isAutomated, priority, createdBy
  ]);
  
  return result.rows[0].communication_id;
}

export async function getPatientCommunications(tenantId, filters = {}) {
  const { patientId, communicationType, purpose, status, date } = filters;
  
  let sql = `
    SELECT 
      pc.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email,
      ct.template_name,
      a.start as appointment_time,
      t.full_token as token_number,
      b.bill_number
    FROM emr.patient_communications pc
    LEFT JOIN emr.patients p ON pc.patient_id = p.id
    LEFT JOIN emr.communication_templates ct ON pc.template_id = ct.id
    LEFT JOIN emr.appointments a ON pc.appointment_id = a.id
    LEFT JOIN emr.opd_tokens t ON pc.token_id = t.id
    LEFT JOIN emr.opd_bills b ON pc.bill_id = b.id
    WHERE pc.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (patientId) {
    sql += ` AND pc.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  if (communicationType) {
    sql += ` AND pc.communication_type = $${paramIndex++}`;
    params.push(communicationType);
  }
  
  if (purpose) {
    sql += ` AND pc.purpose = $${paramIndex++}`;
    params.push(purpose);
  }
  
  if (status) {
    sql += ` AND pc.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (date) {
    sql += ` AND DATE(pc.created_at) = $${paramIndex++}`;
    params.push(date);
  }
  
  sql += ` ORDER BY pc.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function updateCommunicationStatus(communicationId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  if (status === 'sent') {
    fields.push('sent_at');
    values.push(new Date());
  }
  
  if (status === 'delivered') {
    fields.push('delivered_at');
    values.push(new Date());
  }
  
  if (status === 'read') {
    fields.push('read_at');
    values.push(new Date());
  }
  
  if (additionalData.externalId) {
    fields.push('external_id');
    values.push(additionalData.externalId);
  }
  
  if (additionalData.provider) {
    fields.push('provider');
    values.push(additionalData.provider);
  }
  
  if (additionalData.failedReason) {
    fields.push('failed_reason');
    values.push(additionalData.failedReason);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.patient_communications 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(communicationId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function scheduleAppointmentReminder({ tenantId, appointmentId, patientId, patientPhone, patientEmail, appointmentTime, doctorName, departmentName }) {
  const variables = {
    patient_name: patientId, // Will be replaced with actual patient name
    appointment_time: appointmentTime,
    doctor_name: doctorName,
    department_name: departmentName,
    hospital_name: 'Hospital' // Get from settings
  };
  
  const messageContent = `Reminder: Your appointment is scheduled for ${appointmentTime} with Dr. ${doctorName} at ${departmentName}. Please arrive 15 minutes early.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'appointment_reminder',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    appointmentId,
    variablesUsed: variables,
    scheduledFor: new Date(appointmentTime).getTime() - (24 * 60 * 60 * 1000), // 24 hours before
    isAutomated: true,
    createdBy: null
  });
  
  return communicationId;
}

export async function sendTokenCallNotification({ tenantId, tokenId, patientId, patientPhone, patientEmail, tokenNumber, departmentName, doctorName }) {
  const variables = {
    patient_name: patientId,
    token_number: tokenNumber,
    department_name: departmentName,
    doctor_name: doctorName,
    hospital_name: 'Hospital'
  };
  
  const messageContent = `Your token ${tokenNumber} has been called. Please proceed to ${departmentName}. Dr. ${doctorName} is ready to see you.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'token_call',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    tokenId,
    variablesUsed: variables,
    isAutomated: true,
    priority: 2,
    createdBy: null
  });
  
  return communicationId;
}

export async function sendBillingReminder({ tenantId, billId, patientId, patientPhone, patientEmail, billNumber, totalAmount, dueDate }) {
  const variables = {
    patient_name: patientId,
    bill_number: billNumber,
    total_amount: totalAmount,
    due_date: dueDate,
    hospital_name: 'Hospital'
  };
  
  const messageContent = `Reminder: Bill ${billNumber} of amount ${totalAmount} is due on ${dueDate}. Please complete the payment to avoid any inconvenience.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'billing_reminder',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    billId,
    variablesUsed: variables,
    isAutomated: true,
    priority: 1,
    createdBy: null
  });
  
  return communicationId;
}

export async function updateTokenStatus(tokenId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  // Add timestamp fields based on status
  if (status === 'called') {
    fields.push('last_called_at');
    values.push(new Date());
  }
  
  if (status === 'in_progress') {
    fields.push('consultation_started_at');
    values.push(new Date());
  }
  
  if (status === 'completed') {
    fields.push('consultation_completed_at');
    values.push(new Date());
  }
  
  // Add called_count increment
  if (status === 'called') {
    fields.push('called_count');
    values.push(`(SELECT COALESCE(called_count, 0) + 1 FROM emr.opd_tokens WHERE id = $1)`);
  }
  
  // Add additional data
  if (additionalData.doctorId) {
    fields.push('doctor_id');
    values.push(additionalData.doctorId);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.opd_tokens 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(tokenId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function callNextToken(tenantId, departmentId, doctorId = null) {
  const sql = `
    UPDATE emr.opd_tokens 
    SET status = 'called',
        last_called_at = NOW(),
        called_count = COALESCE(called_count, 0) + 1,
        updated_at = NOW()
    WHERE id = (
      SELECT id FROM emr.opd_tokens 
      WHERE tenant_id = $1 
        AND ($2::uuid IS NULL OR department_id = $2)
        AND ($3::uuid IS NULL OR doctor_id = $3)
        AND status = 'waiting'
      ORDER BY 
        CASE 
          WHEN priority = 'urgent' THEN 1
          WHEN priority = 'senior_citizen' THEN 2
          WHEN priority = 'follow_up' THEN 3
          ELSE 4
        END,
        token_number ASC
      LIMIT 1
    )
    RETURNING *
  `;
  
  const result = await query(sql, [tenantId, departmentId, doctorId]);
  return result.rows[0];
}

export async function getTokenQueueStats(tenantId, filters = {}) {
  const { departmentId, doctorId, date = new Date().toISOString().split('T')[0] } = filters;
  
  const sql = `
    SELECT 
      COUNT(*) as total_tokens,
      COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting,
      COUNT(CASE WHEN status = 'called' THEN 1 END) as called,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
      COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show,
      AVG(EXTRACT(EPOCH FROM (consultation_completed_at - consultation_started_at))/60) as avg_consultation_time_minutes
    FROM emr.opd_tokens
    WHERE tenant_id = $1 
      AND DATE(created_at) = $2
      AND ($3::uuid IS NULL OR department_id = $3)
      AND ($4::uuid IS NULL OR doctor_id = $4)
  `;
  
  const result = await query(sql, [tenantId, date, departmentId, doctorId]);
  return result.rows[0];
}

export async function getActiveTokensByDepartment(tenantId) {
  const sql = `
    SELECT 
      d.id as department_id,
      d.name as department_name,
      COUNT(CASE WHEN t.status = 'waiting' THEN 1 END) as waiting_count,
      COUNT(CASE WHEN t.status = 'called' THEN 1 END) as called_count,
      COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_count,
      MAX(t.token_number) as last_token,
      t.full_token as current_token,
      t.status as current_token_status
    FROM emr.departments d
    LEFT JOIN emr.opd_tokens t ON d.id = t.department_id 
      AND t.tenant_id = $1 
      AND DATE(t.created_at) = CURRENT_DATE
      AND t.status IN ('waiting', 'called', 'in_progress')
    WHERE d.tenant_id = $1
    GROUP BY d.id, d.name, t.full_token, t.status
    ORDER BY d.name
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function updateTokenVitals(tokenId, tenantId, vitalsData) {
  const sql = `
    UPDATE emr.opd_tokens 
    SET vitals_recorded = true,
        updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  
  const result = await query(sql, [tokenId, tenantId]);
  
  // Create vitals record if needed
  if (result.rows[0]) {
    const vitalsSql = `
      INSERT INTO emr.vitals (
        tenant_id, patient_id, encounter_id, blood_pressure_systolic,
        blood_pressure_diastolic, heart_rate, temperature, 
        oxygen_saturation, weight, height, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    await query(vitalsSql, [
      tenantId, 
      result.rows[0].patient_id, 
      null, // No encounter yet
      vitalsData.bloodPressureSystolic,
      vitalsData.bloodPressureDiastolic,
      vitalsData.heartRate,
      vitalsData.temperature,
      vitalsData.oxygenSaturation,
      vitalsData.weight,
      vitalsData.height,
      vitalsData.createdBy
    ]);
  }
  
  return result.rows[0];
}

export async function getTokenHistory(tenantId, patientId, limit = 10) {
  const sql = `
    SELECT 
      t.*,
      d.name as department_name,
      u.name as doctor_name,
      EXTRACT(EPOCH FROM (consultation_completed_at - consultation_started_at))/60 as consultation_duration_minutes
    FROM emr.opd_tokens t
    LEFT JOIN emr.departments d ON t.department_id = d.id
    LEFT JOIN emr.users u ON t.doctor_id = u.id
    WHERE t.tenant_id = $1 AND t.patient_id = $2
    ORDER BY t.created_at DESC
    LIMIT $3
  `;
  
  const result = await query(sql, [tenantId, patientId, limit]);
  return result.rows;
}

export async function deleteOPDToken(tokenId, tenantId) {
  const sql = `
    DELETE FROM emr.opd_tokens 
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  
  const result = await query(sql, [tokenId, tenantId]);
  return result.rows[0];
}

// =====================================================
// OPD BILLING SYSTEM
// =====================================================

export async function createOPDBill({ tenantId, patientId, tokenId, appointmentId, patientName, patientAge, patientGender, visitType, departmentId, doctorId, departmentName, doctorName, consultationFee, registrationFee, procedureCharges, labCharges, medicineCharges, otherCharges, discountAmount, discountPercentage, taxAmount, totalAmount, paymentMethod, insuranceProvider, policyNumber, notes, createdBy }) {
  // Generate bill number
  const billNumberSql = `SELECT get_next_bill_number($1) as bill_number`;
  const billNumberResult = await query(billNumberSql, [tenantId]);
  const billNumber = billNumberResult.rows[0].bill_number;
  
  const sql = `
    INSERT INTO emr.opd_bills (
      tenant_id, patient_id, token_id, appointment_id, bill_number, bill_date, bill_time,
      patient_name, patient_age, patient_gender, visit_type, department_id, doctor_id,
      department_name, doctor_name, consultation_fee, registration_fee, procedure_charges,
      lab_charges, medicine_charges, other_charges, discount_amount, discount_percentage,
      tax_amount, total_amount, payment_method, insurance_provider, policy_number,
      notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIME,
            $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22,
            $23, $24, $25, $26, $27)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, tokenId, appointmentId, billNumber,
    patientName, patientAge, patientGender, visitType, departmentId, doctorId,
    departmentName, doctorName, consultationFee || 0, registrationFee || 0, procedureCharges || 0,
    labCharges || 0, medicineCharges || 0, otherCharges || 0, discountAmount || 0, discountPercentage || 0,
    taxAmount || 0, totalAmount || 0, paymentMethod, insuranceProvider, policyNumber,
    notes, createdBy
  ]);
  
  return result.rows[0];
}

export async function getOPDBills(tenantId, filters = {}) {
  const { status, departmentId, doctorId, date, patientId } = filters;
  
  let sql = `
    SELECT 
      b.*,
      p.name as patient_name,
      p.phone as patient_phone,
      d.name as department_name,
      u.name as doctor_name,
      t.full_token as token_number
    FROM emr.opd_bills b
    LEFT JOIN emr.patients p ON b.patient_id = p.id
    LEFT JOIN emr.departments d ON b.department_id = d.id
    LEFT JOIN emr.users u ON b.doctor_id = u.id
    LEFT JOIN emr.opd_tokens t ON b.token_id = t.id
    WHERE b.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND b.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (departmentId) {
    sql += ` AND b.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND b.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (date) {
    sql += ` AND b.bill_date = $${paramIndex++}`;
    params.push(date);
  }
  
  if (patientId) {
    sql += ` AND b.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  sql += ` ORDER BY b.bill_date DESC, b.bill_time DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getOPDBillById(billId, tenantId) {
  const sql = `
    SELECT 
      b.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email,
      d.name as department_name,
      u.name as doctor_name,
      t.full_token as token_number,
      a.start as appointment_time
    FROM emr.opd_bills b
    LEFT JOIN emr.patients p ON b.patient_id = p.id
    LEFT JOIN emr.departments d ON b.department_id = d.id
    LEFT JOIN emr.users u ON b.doctor_id = u.id
    LEFT JOIN emr.opd_tokens t ON b.token_id = t.id
    LEFT JOIN emr.appointments a ON b.appointment_id = a.id
    WHERE b.id = $1 AND b.tenant_id = $2
  `;
  
  const result = await query(sql, [billId, tenantId]);
  return result.rows[0];
}

// =====================================================
// EXOTEL SMS PROVIDER INTEGRATION
// =====================================================

export async function createExotelConfiguration({ tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber, webhookUrl, deliveryReportWebhook, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_configurations (
      tenant_id, account_sid, api_key, api_token, subdomain, from_number,
      webhook_url, delivery_report_webhook, is_active, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, accountSid, apiKey, apiToken, subdomain, fromNumber,
    webhookUrl, deliveryReportWebhook, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelConfigurations(tenantId, isActive = true) {
  const sql = `
    SELECT * FROM emr.exotel_configurations
    WHERE tenant_id = $1 AND is_active = $2
    ORDER BY is_default DESC, created_at DESC
  `;
  
  const result = await query(sql, [tenantId, isActive]);
  return result.rows;
}

export async function updateExotelConfiguration(configId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_configurations
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(configId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function createSMSCampaign({ tenantId, campaignName, campaignType, description, templateId, targetAudience, filters, scheduleType, scheduledAt, recurringPattern, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_sms_campaigns (
      tenant_id, campaign_name, campaign_type, description, template_id,
      target_audience, filters, schedule_type, scheduled_at, recurring_pattern,
      status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, campaignName, campaignType, description, templateId,
    targetAudience, JSON.stringify(filters), scheduleType, scheduledAt, 
    recurringPattern ? JSON.stringify(recurringPattern) : null, createdBy
  ]);
  
  return result.rows[0];
}

export async function getSMSCampaigns(tenantId, filters = {}) {
  const { status, campaignType, startDate, endDate } = filters;
  
  let sql = `
    SELECT 
      c.*,
      ct.template_name,
      ct.message_content,
      COUNT(l.id) as sent_count,
      COUNT(CASE WHEN l.status = 'delivered' THEN 1 END) as delivered_count,
      COUNT(CASE WHEN l.status = 'failed' THEN 1 END) as failed_count
    FROM emr.exotel_sms_campaigns c
    LEFT JOIN emr.communication_templates ct ON c.template_id = ct.id
    LEFT JOIN emr.exotel_sms_logs l ON c.id = l.campaign_id
    WHERE c.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND c.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (campaignType) {
    sql += ` AND c.campaign_type = $${paramIndex++}`;
    params.push(campaignType);
  }
  
  if (startDate) {
    sql += ` AND c.scheduled_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND c.scheduled_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  sql += ` GROUP BY c.id, ct.template_name, ct.message_content ORDER BY c.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function sendExotelSMS({ tenantId, toNumber, messageContent, messageType = 'transactional', priority = 1, campaignId = null, communicationId = null, externalId = null }) {
  // Get available Exotel number
  const availableNumberSql = `SELECT get_available_exotel_number($1, $2) as from_number`;
  const numberResult = await query(availableNumberSql, [tenantId, messageType]);
  const fromNumber = numberResult.rows[0].from_number;
  
  if (!fromNumber) {
    throw new Error('No available Exotel number found for this message type');
  }
  
  // Get Exotel configuration
  const configSql = `
    SELECT account_sid, api_key, api_token, subdomain 
    FROM emr.exotel_configurations 
    WHERE tenant_id = $1 AND is_active = true 
    ORDER BY is_default DESC 
    LIMIT 1
  `;
  const configResult = await query(configSql, [tenantId]);
  const config = configResult.rows[0];
  
  if (!config) {
    throw new Error('No active Exotel configuration found');
  }
  
  // Create SMS log entry
  const logSql = `
    INSERT INTO emr.exotel_sms_logs (
      tenant_id, campaign_id, communication_id, account_sid, from_number, to_number,
      message_content, message_type, priority, status, external_id, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued', $10, NOW())
    RETURNING *
  `;
  
  const logResult = await query(logSql, [
    tenantId, campaignId, communicationId, config.account_sid, fromNumber, toNumber,
    messageContent, messageType, priority, externalId
  ]);
  
  const smsLog = logResult.rows[0];
  
  // Update number pool usage
  await query(`SELECT update_exotel_number_usage($1, $2, 1)`, [tenantId, fromNumber]);
  
  // Send SMS via Exotel API
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: config.account_sid,
      apiKey: config.api_key,
      apiToken: config.api_token,
      subdomain: config.subdomain,
      fromNumber,
      toNumber,
      messageContent,
      priority,
      externalId: smsLog.id
    });
    
    // Update log with Exotel response
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      webhookData: exotelResponse.webhookData
    });
    
    // Update communication status if linked
    if (communicationId) {
      const communicationStatus = exotelResponse.status === 'sent' ? 'sent' : 'failed';
      await updateCommunicationStatus(communicationId, tenantId, communicationStatus, {
        externalId: exotelResponse.messageSid,
        provider: 'exotel',
        failedReason: exotelResponse.errorMessage
      });
    }
    
    return { success: true, smsLog, exotelResponse };
  } catch (error) {
    // Update log with error
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'API_ERROR',
      errorMessage: error.message
    });
    
    // Update communication status if linked
    if (communicationId) {
      await updateCommunicationStatus(communicationId, tenantId, 'failed', {
        provider: 'exotel',
        failedReason: error.message
      });
    }
    
    return { success: false, error: error.message, smsLog };
  }
}

export async function sendExotelAPIRequest({ accountSid, apiKey, apiToken, subdomain, fromNumber, toNumber, messageContent, priority, externalId }) {
  // Exotel SMS API endpoint
  const apiUrl = `https://${subdomain}.exotel.in/v1/Accounts/${accountSid}/Sms/send`;
  
  const authString = Buffer.from(`${accountSid}:${apiToken}`).toString('base64');
  
  const payload = {
    SmsSid: externalId,
    SenderId: fromNumber,
    To: toNumber,
    MessageBody: messageContent,
    Priority: priority,
    Type: 'txn', // Transactional SMS
    DltTemplateId: '1207160012345678901' // Template ID for DLT compliance
  };
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(`Exotel API Error: ${responseData.message || 'Unknown error'}`);
  }
  
  return {
    messageSid: responseData.SmsSid,
    status: responseData.Status === 'sent' ? 'sent' : 'queued',
    sentTimestamp: responseData.Date,
    cost: responseData.Cost || 0,
    webhookData: responseData
  };
}

export async function updateExotelSMSLog(smsLogId, tenantId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(updates[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE emr.exotel_sms_logs
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(smsLogId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getExotelSMSLogs(tenantId, filters = {}) {
  const { status, toNumber, fromNumber, startDate, endDate, campaignId, limit = 100 } = filters;
  
  let sql = `
    SELECT 
      l.*,
      c.campaign_name,
      ct.template_name,
      p.name as patient_name,
      p.phone as patient_phone
    FROM emr.exotel_sms_logs l
    LEFT JOIN emr.exotel_sms_campaigns c ON l.campaign_id = c.id
    LEFT JOIN emr.communication_templates ct ON l.template_id = ct.id
    LEFT JOIN emr.patient_communications pc ON l.communication_id = pc.id
    LEFT JOIN emr.patients p ON pc.patient_id = p.id
    WHERE l.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND l.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (toNumber) {
    sql += ` AND l.to_number = $${paramIndex++}`;
    params.push(toNumber);
  }
  
  if (fromNumber) {
    sql += ` AND l.from_number = $${paramIndex++}`;
    params.push(fromNumber);
  }
  
  if (startDate) {
    sql += ` AND l.created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND l.created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  if (campaignId) {
    sql += ` AND l.campaign_id = $${paramIndex++}`;
    params.push(campaignId);
  }
  
  sql += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);
  
  const result = await query(sql, params);
  return result.rows;
}

export async function createExotelNumberPool({ tenantId, poolName, phoneNumber, numberType, departmentId, doctorId, dailyLimit, monthlyLimit, priority = 1, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_number_pools (
      tenant_id, pool_name, phone_number, number_type, department_id, doctor_id,
      daily_limit, monthly_limit, priority, is_active, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, poolName, phoneNumber, numberType, departmentId, doctorId,
    dailyLimit, monthlyLimit, priority, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelNumberPools(tenantId, filters = {}) {
  const { isActive = true, numberType, departmentId, doctorId } = filters;
  
  let sql = `
    SELECT 
      np.*,
      d.name as department_name,
      u.name as doctor_name,
      ROUND((np.current_daily_usage::float / NULLIF(np.daily_limit, 0) * 100), 2) as daily_usage_percentage,
      ROUND((np.current_monthly_usage::float / NULLIF(np.monthly_limit, 0) * 100), 2) as monthly_usage_percentage
    FROM emr.exotel_number_pools np
    LEFT JOIN emr.departments d ON np.department_id = d.id
    LEFT JOIN emr.users u ON np.doctor_id = u.id
    WHERE np.tenant_id = $1 AND np.is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (numberType) {
    sql += ` AND np.number_type = $${paramIndex++}`;
    params.push(numberType);
  }
  
  if (departmentId) {
    sql += ` AND np.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND np.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  sql += ` ORDER BY np.priority ASC, np.pool_name`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function processExotelWebhook(tenantId, eventData) {
  const sql = `
    INSERT INTO emr.exotel_webhook_events (
      tenant_id, event_type, event_data, message_sid, account_sid, created_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, eventData.eventType || 'unknown', 
    JSON.stringify(eventData), 
    eventData.SmsSid, 
    eventData.AccountSid
  ]);
  
  const webhookEvent = result.rows[0];
  
  // Process delivery reports
  if (eventData.Status) {
    await processExotelDeliveryReport(tenantId, eventData);
  }
  
  return webhookEvent;
}

export async function processExotelDeliveryReport(tenantId, deliveryData) {
  const { SmsSid, Status, ErrorCode, ErrorMessage, Date, Cost } = deliveryData;
  
  // Update SMS log with delivery status
  const updateData = {
    status: Status.toLowerCase(),
    deliveryStatus: Status.toLowerCase(),
    deliveryTimestamp: Date ? new Date(Date) : null,
    errorCode: ErrorCode,
    errorMessage: ErrorMessage,
    cost: Cost || 0,
    webhookData: JSON.stringify(deliveryData)
  };
  
  // Find the SMS log entry
  const findSql = `
    SELECT id, communication_id, to_number 
    FROM emr.exotel_sms_logs 
    WHERE message_sid = $1 AND tenant_id = $2
  `;
  
  const findResult = await query(findSql, [SmsSid, tenantId]);
  const smsLog = findResult.rows[0];
  
  if (smsLog) {
    await updateExotelSMSLog(smsLog.id, tenantId, updateData);
    
    // Update communication status if linked
    if (smsLog.communication_id) {
      const communicationStatus = Status.toLowerCase() === 'delivered' ? 'delivered' : 
                              Status.toLowerCase() === 'failed' ? 'failed' : 'sent';
      
      await updateCommunicationStatus(smsLog.communication_id, tenantId, communicationStatus, {
        externalId: SmsSid,
        provider: 'exotel',
        failedReason: ErrorMessage
      });
    }
    
    // Schedule retry for failed messages
    if (Status.toLowerCase() === 'failed' && ErrorCode !== '404') {
      await scheduleSMSRetry(smsLog.id);
    }
  }
}

export async function scheduleSMSRetry(smsLogId) {
  const sql = `SELECT schedule_sms_retry($1)`;
  await query(sql, [smsLogId]);
}

export async function getExotelSMSStats(tenantId, filters = {}) {
  const { startDate, endDate, messageType, fromNumber } = filters;
  
  let sql = `SELECT get_exotel_sms_stats($1, $2, $3)`;
  const params = [tenantId, startDate, endDate];
  
  const result = await query(sql, params);
  return result.rows;
}

export async function retryFailedSMS(tenantId, smsLogId) {
  const sql = `
    SELECT l.*, c.account_sid, c.api_key, c.api_token, c.subdomain
    FROM emr.exotel_sms_logs l
    JOIN emr.exotel_configurations c ON l.account_sid = c.account_sid
    WHERE l.id = $1 AND l.tenant_id = $2 AND l.status = 'failed'
  `;
  
  const result = await query(sql, [smsLogId, tenantId]);
  const smsLog = result.rows[0];
  
  if (!smsLog) {
    throw new Error('SMS log not found or not in failed status');
  }
  
  try {
    const exotelResponse = await sendExotelAPIRequest({
      accountSid: smsLog.account_sid,
      apiKey: smsLog.api_key,
      apiToken: smsLog.api_token,
      subdomain: smsLog.subdomain,
      fromNumber: smsLog.from_number,
      toNumber: smsLog.to_number,
      messageContent: smsLog.message_content,
      priority: smsLog.priority,
      externalId: smsLog.id
    });
    
    // Update log with retry result
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: exotelResponse.status || 'sent',
      messageSid: exotelResponse.messageSid,
      errorCode: exotelResponse.errorCode,
      errorMessage: exotelResponse.errorMessage,
      sentTimestamp: exotelResponse.sentTimestamp,
      cost: exotelResponse.cost,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: true, exotelResponse };
  } catch (error) {
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'RETRY_FAILED',
      errorMessage: error.message,
      retry_count: smsLog.retry_count + 1
    });
    
    return { success: false, error: error.message };
  }
}

export async function getPendingRetries(tenantId) {
  const sql = `
    SELECT 
      l.*,
      EXTRACT(EPOCH FROM (next_retry_at - NOW()))/60 as minutes_until_retry
    FROM emr.exotel_sms_logs l
    WHERE l.tenant_id = $1 
      AND l.status = 'queued' 
      AND l.next_retry_at IS NOT NULL 
      AND l.next_retry_at <= NOW() + INTERVAL '1 hour'
      AND l.retry_count < l.max_retries
    ORDER BY l.next_retry_at ASC
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function processScheduledCampaigns(tenantId) {
  const sql = `
    SELECT c.* 
    FROM emr.exotel_sms_campaigns c
    WHERE c.tenant_id = $1 
      AND c.status = 'scheduled' 
      AND c.scheduled_at <= NOW()
    ORDER BY c.scheduled_at ASC
  `;
  
  const campaigns = await query(sql, [tenantId]);
  
  for (const campaign of campaigns) {
    // Update campaign status to active
    await query(`
      UPDATE emr.exotel_sms_campaigns 
      SET status = 'active', updated_at = NOW()
      WHERE id = $1
    `, [campaign.id]);
    
    // Process campaign based on target audience
    await processSMSCampaign(campaign, tenantId);
  }
}

export async function processSMSCampaign(campaign, tenantId) {
  const { targetAudience, filters } = campaign;
  
  let targetNumbers = [];
  
  switch (targetAudience) {
    case 'all_patients':
      const patientsSql = `
        SELECT DISTINCT phone FROM emr.patients 
        WHERE tenant_id = $1 AND phone IS NOT NULL
      `;
      const patientsResult = await query(patientsSql, [tenantId]);
      targetNumbers = patientsResult.rows.map(p => p.phone);
      break;
      
    case 'specific_patients':
      if (filters && filters.patientIds) {
        const specificPatientsSql = `
          SELECT phone FROM emr.patients 
          WHERE tenant_id = $1 AND id = ANY($2)
        `;
        const specificResult = await query(specificPatientsSql, [tenantId, filters.patientIds]);
        targetNumbers = specificResult.rows.map(p => p.phone);
      }
      break;
      
    case 'department':
      if (filters && filters.departmentId) {
        const deptPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.department_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const deptResult = await query(deptPatientsSql, [tenantId, filters.departmentId]);
        targetNumbers = deptResult.rows.map(p => p.phone);
      }
      break;
      
    case 'doctor':
      if (filters && filters.doctorId) {
        const doctorPatientsSql = `
          SELECT DISTINCT p.phone FROM emr.patients p
          JOIN emr.opd_tokens t ON p.id = t.patient_id
          WHERE p.tenant_id = $1 AND p.phone IS NOT NULL 
            AND t.doctor_id = $2 AND DATE(t.created_at) = CURRENT_DATE
        `;
        const doctorResult = await query(doctorPatientsSql, [tenantId, filters.doctorId]);
        targetNumbers = doctorResult.rows.map(p => p.phone);
      }
      break;
      
    default:
      if (filters && filters.phoneNumbers) {
        targetNumbers = filters.phoneNumbers;
      }
      break;
  }
  
  // Send SMS to all target numbers
  for (const phoneNumber of targetNumbers) {
    await sendExotelSMS({
      tenantId,
      toNumber: phoneNumber,
      messageContent: campaign.message_content || 'Campaign message',
      messageType: 'promotional',
      campaignId: campaign.id
    });
  }
  
  // Update campaign statistics
  await query(`
    UPDATE emr.exotel_sms_campaigns 
    SET total_recipients = $1, updated_at = NOW()
    WHERE id = $2
  `, [targetNumbers.length, campaign.id]);
}

export async function addBillItem({ tenantId, billId, serviceType, serviceName, serviceCode, description, quantity, unitPrice, discountAmount, taxAmount, totalAmount, doctorId, departmentId, createdBy }) {
  const sql = `
    INSERT INTO emr.opd_bill_items (
      tenant_id, bill_id, service_type, service_name, service_code, description,
      quantity, unit_price, discount_amount, tax_amount, total_amount,
      doctor_id, department_id, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, billId, serviceType, serviceName, serviceCode, description,
    quantity, unitPrice, discountAmount, taxAmount, totalAmount,
    doctorId, departmentId, createdBy
  ]);
  
  // Update bill totals
  await query(`SELECT calculate_bill_totals($1)`, [billId]);
  
  return result.rows[0];
}

export async function updateBillStatus(billId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  if (additionalData.paymentMethod) {
    fields.push('payment_method');
    values.push(additionalData.paymentMethod);
  }
  
  if (additionalData.paidAmount) {
    fields.push('paid_amount');
    values.push(additionalData.paidAmount);
  }
  
  if (additionalData.paymentDate) {
    fields.push('payment_date');
    values.push(additionalData.paymentDate);
  }
  
  if (additionalData.transactionId) {
    fields.push('transaction_id');
    values.push(additionalData.transactionId);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.opd_bills 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(billId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getBillingStats(tenantId, filters = {}) {
  const { departmentId, doctorId, date = new Date().toISOString().split('T')[0] } = filters;
  
  const sql = `
    SELECT 
      COUNT(*) as total_bills,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_bills,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bills,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bills,
      SUM(total_amount) as total_revenue,
      SUM(paid_amount) as total_paid,
      SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as collected_revenue,
      AVG(total_amount) as avg_bill_amount
    FROM emr.opd_bills
    WHERE tenant_id = $1 
      AND bill_date = $2
      AND ($3::uuid IS NULL OR department_id = $3)
      AND ($4::uuid IS NULL OR doctor_id = $4)
  `;
  
  const result = await query(sql, [tenantId, date, departmentId, doctorId]);
  return result.rows[0];
}

export async function getServicePackages(tenantId, filters = {}) {
  const { isActive = true, departmentId } = filters;
  
  let sql = `
    SELECT 
      sp.*,
      d.name as department_name,
      COUNT(pi.id) as item_count
    FROM emr.opd_service_packages sp
    LEFT JOIN emr.departments d ON sp.department_id = d.id
    LEFT JOIN emr.opd_package_items pi ON sp.id = pi.package_id
    WHERE sp.tenant_id = $1
      AND sp.is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (departmentId) {
    sql += ` AND sp.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  sql += ` GROUP BY sp.id, d.name ORDER BY sp.name`;
  
  const result = await query(sql, params);
  return result.rows;
}

// =====================================================
// COMMUNICATION SYSTEM
// =====================================================

export async function createCommunicationTemplate({ tenantId, templateName, templateType, purpose, subject, messageContent, variables, isActive = true, isDefault = false, createdBy }) {
  const sql = `
    INSERT INTO emr.communication_templates (
      tenant_id, template_name, template_type, purpose, subject, message_content,
      variables, is_active, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, templateName, templateType, purpose, subject, messageContent,
    JSON.stringify(variables || []), isActive, isDefault, createdBy
  ]);
  
  return result.rows[0];
}

export async function getCommunicationTemplates(tenantId, filters = {}) {
  const { templateType, purpose, isActive = true } = filters;
  
  let sql = `
    SELECT * FROM emr.communication_templates
    WHERE tenant_id = $1 AND is_active = $2
  `;
  
  const params = [tenantId, isActive];
  let paramIndex = 3;
  
  if (templateType) {
    sql += ` AND template_type = $${paramIndex++}`;
    params.push(templateType);
  }
  
  if (purpose) {
    sql += ` AND purpose = $${paramIndex++}`;
    params.push(purpose);
  }
  
  sql += ` ORDER BY template_name`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function sendCommunication({ tenantId, patientId, communicationType, purpose, messageContent, recipientPhone, recipientEmail, subject, appointmentId, tokenId, billId, templateId, variablesUsed, scheduledFor, isAutomated = false, priority = 1, createdBy }) {
  const sql = `
    SELECT create_communication(
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) as communication_id
  `;
  
  const result = await query(sql, [
    tenantId, patientId, communicationType, purpose, messageContent,
    recipientPhone, recipientEmail, subject, appointmentId, tokenId, billId,
    templateId, variablesUsed ? JSON.stringify(variablesUsed) : null, scheduledFor, isAutomated, priority, createdBy
  ]);
  
  return result.rows[0].communication_id;
}

export async function getPatientCommunications(tenantId, filters = {}) {
  const { patientId, communicationType, purpose, status, date } = filters;
  
  let sql = `
    SELECT 
      pc.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email,
      ct.template_name,
      a.start as appointment_time,
      t.full_token as token_number,
      b.bill_number
    FROM emr.patient_communications pc
    LEFT JOIN emr.patients p ON pc.patient_id = p.id
    LEFT JOIN emr.communication_templates ct ON pc.template_id = ct.id
    LEFT JOIN emr.appointments a ON pc.appointment_id = a.id
    LEFT JOIN emr.opd_tokens t ON pc.token_id = t.id
    LEFT JOIN emr.opd_bills b ON pc.bill_id = b.id
    WHERE pc.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (patientId) {
    sql += ` AND pc.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  if (communicationType) {
    sql += ` AND pc.communication_type = $${paramIndex++}`;
    params.push(communicationType);
  }
  
  if (purpose) {
    sql += ` AND pc.purpose = $${paramIndex++}`;
    params.push(purpose);
  }
  
  if (status) {
    sql += ` AND pc.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (date) {
    sql += ` AND DATE(pc.created_at) = $${paramIndex++}`;
    params.push(date);
  }
  
  sql += ` ORDER BY pc.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function updateCommunicationStatus(communicationId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
  if (status === 'sent') {
    fields.push('sent_at');
    values.push(new Date());
  }
  
  if (status === 'delivered') {
    fields.push('delivered_at');
    values.push(new Date());
  }
  
  if (status === 'read') {
    fields.push('read_at');
    values.push(new Date());
  }
  
  if (additionalData.externalId) {
    fields.push('external_id');
    values.push(additionalData.externalId);
  }
  
  if (additionalData.provider) {
    fields.push('provider');
    values.push(additionalData.provider);
  }
  
  if (additionalData.failedReason) {
    fields.push('failed_reason');
    values.push(additionalData.failedReason);
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const sql = `
    UPDATE emr.patient_communications 
    SET ${setClause}
    WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
    RETURNING *
  `;
  
  values.push(communicationId, tenantId);
  
  const result = await query(sql, values);
  return result.rows[0];
}

export async function scheduleAppointmentReminder({ tenantId, appointmentId, patientId, patientPhone, patientEmail, appointmentTime, doctorName, departmentName }) {
  const variables = {
    patient_name: patientId, // Will be replaced with actual patient name
    appointment_time: appointmentTime,
    doctor_name: doctorName,
    department_name: departmentName,
    hospital_name: 'Hospital' // Get from settings
  };
  
  const messageContent = `Reminder: Your appointment is scheduled for ${appointmentTime} with Dr. ${doctorName} at ${departmentName}. Please arrive 15 minutes early.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'appointment_reminder',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    appointmentId,
    variablesUsed: variables,
    scheduledFor: new Date(appointmentTime).getTime() - (24 * 60 * 60 * 1000), // 24 hours before
    isAutomated: true,
    createdBy: null
  });
  
  return communicationId;
}

export async function sendTokenCallNotification({ tenantId, tokenId, patientId, patientPhone, patientEmail, tokenNumber, departmentName, doctorName }) {
  const variables = {
    patient_name: patientId,
    token_number: tokenNumber,
    department_name: departmentName,
    doctor_name: doctorName,
    hospital_name: 'Hospital'
  };
  
  const messageContent = `Your token ${tokenNumber} has been called. Please proceed to ${departmentName}. Dr. ${doctorName} is ready to see you.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'token_call',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    tokenId,
    variablesUsed: variables,
    isAutomated: true,
    priority: 2,
    createdBy: null
  });
  
  return communicationId;
}

export async function sendBillingReminder({ tenantId, billId, patientId, patientPhone, patientEmail, billNumber, totalAmount, dueDate }) {
  const variables = {
    patient_name: patientId,
    bill_number: billNumber,
    total_amount: totalAmount,
    due_date: dueDate,
    hospital_name: 'Hospital'
  };
  
  const messageContent = `Reminder: Bill ${billNumber} of amount ${totalAmount} is due on ${dueDate}. Please complete the payment to avoid any inconvenience.`;
  
  const communicationId = await sendCommunication({
    tenantId,
    patientId,
    communicationType: 'sms',
    purpose: 'billing_reminder',
    messageContent,
    recipientPhone: patientPhone,
    recipientEmail: patientEmail,
    billId,
    variablesUsed: variables,
    isAutomated: true,
    priority: 1,
    createdBy: null
  });
  
  return communicationId;
}

