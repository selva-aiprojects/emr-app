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
  const sql = 'SELECT feature_flag FROM emr.tenant_features WHERE tenant_id = $1 AND enabled = true';
  const result = await query(sql, [tenantId]);
  return result.rows.map(row => row.feature_flag);
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

  const countResult = await query(
    'SELECT COUNT(*) as count FROM emr.patients WHERE tenant_id = $1',
    [tenantId]
  );

  const count = parseInt(countResult.rows[0].count) + 1001;
  return `${tenantCode}-${count}`;
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
  const result = await query('SELECT id, name, code, subdomain, theme, features, billing_config, status, created_at, updated_at, subscription_tier, logo_url FROM emr.tenants ORDER BY name');
  return result.rows;
}

export async function getTenantById(id) {
  const result = await query('SELECT * FROM emr.tenants WHERE id = $1', [id]);
  return result.rows[0];
}

export async function getTenantByCode(code) {
  const result = await query('SELECT * FROM emr.tenants WHERE code = $1', [code]);
  return result.rows[0];
}

export async function createTenant({ name, code, subdomain, theme, features }) {
  const sql = `
    INSERT INTO emr.tenants (name, code, subdomain, theme, features, status)
    VALUES ($1, $2, $3, $4, $5, 'active')
    RETURNING *
  `;

  const result = await query(sql, [
    name,
    code,
    subdomain,
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
export async function getPatients(tenantId, userRole = null, limit = 50, offset = 0) {
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
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    ) p
  `;

  const result = await query(sql, [tenantId, limit, offset]);

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

export async function searchPatients(tenantId, { text, date, type, status, limit = 50 }) {
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
    WHERE p.tenant_id = $1
  `;

  const params = [tenantId];
  let paramIdx = 2;

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
    JSON.stringify(medicalHistory || {}),
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
    if (userRole === 'Support staff') userRole = 'Support Staff';
    if (userRole === 'Hr') userRole = 'HR';
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
    action: `support.ticket.status.${status}`,
    entityName: 'support_ticket',
    entityId: id,
  });

  return result.rows[0];
}
