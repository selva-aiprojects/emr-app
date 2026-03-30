import { query } from './connection.js';

// =====================================================
// TENANT MANAGEMENT
// =====================================================

export async function getTenantTier(tenantId) {
  const sql = 'SELECT subscription_tier FROM emr.tenants WHERE id = $1';
  const result = await query(sql, [tenantId]);
  return result.rows[0]?.subscription_tier || 'Basic';
}

export async function getTenantCustomFeatures(tenantId) {
  const sql = 'SELECT feature_flag, enabled FROM emr.tenant_features WHERE tenant_id = $1';
  const result = await query(sql, [tenantId]);
  return result.rows.map(row => ({
    featureFlag: row.feature_flag,
    enabled: row.enabled
  }));
}

export async function getGlobalKillSwitches() {
  const sql = 'SELECT feature_flag, enabled FROM emr.global_kill_switches WHERE enabled = true';
  const result = await query(sql);
  const killSwitches = {};
  result.rows.forEach(row => {
    killSwitches[row.feature_flag] = row.enabled;
  });
  return killSwitches;
}

export async function setGlobalKillSwitch(featureFlag, enabled, userId, reason) {
  const sql = `
    INSERT INTO emr.global_kill_switches (feature_flag, enabled, created_by, reason)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (feature_flag) 
    DO UPDATE SET enabled = $2, updated_at = NOW(), updated_by = $3, reason = $4
  `;
  await query(sql, [featureFlag, enabled, userId, reason]);
}

export async function getTenantFeatureStatus(tenantId) {
  const sql = 'SELECT * FROM emr.tenant_feature_status WHERE tenant_id = $1';
  const result = await query(sql, [tenantId]);
  return result.rows;
}

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

export async function setTenantFeatureOverride(tenantId, featureFlag, enabled) {
  const sql = `
    INSERT INTO emr.tenant_features (tenant_id, feature_flag, enabled, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (tenant_id, feature_flag) 
    DO UPDATE SET enabled = $3, updated_at = NOW()
  `;
  await query(sql, [tenantId, featureFlag, enabled]);
}

export async function createAuditLog({ tenantId, userId, userName, action, entityName, entityId, details, ipAddress, userAgent }) {
  const sql = `
    INSERT INTO emr.audit_logs (tenant_id, user_id, user_name, action, entity_name, entity_id, details, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, userId, userName, action, entityName, entityId, details, ipAddress, userAgent]);
  return result.rows[0];
}

export async function updateTenantSettings({ tenantId, displayName, theme, features, subscriptionTier, billingConfig, logo_url: req_logo_url }) {
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (displayName !== undefined) {
    updates.push(`display_name = $${paramIndex++}`);
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

  updates.push('updated_at = NOW()');
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

  const sql = `
    INSERT INTO emr.mrn_sequences (tenant_id, sequence_value)
    VALUES ($1, 1)
    ON CONFLICT (tenant_id)
    DO UPDATE SET sequence_value = mrn_sequences.sequence_value + 1
    RETURNING sequence_value
  `;

  const result = await query(sql, [tenantId]);
  const sequence = result.rows[0].sequence_value;
  return `${tenantCode}${sequence.toString().padStart(6, '0')}`;
}

export async function generateInvoiceNumber(tenantId) {
  const tenantResult = await query('SELECT code FROM emr.tenants WHERE id = $1', [tenantId]);
  const tenantCode = tenantResult.rows[0]?.code || 'UNK';

  const sql = `
    INSERT INTO emr.invoice_sequences (tenant_id, sequence_value)
    VALUES ($1, 1)
    ON CONFLICT (tenant_id)
    DO UPDATE SET sequence_value = invoice_sequences.sequence_value + 1
    RETURNING sequence_value
  `;

  const result = await query(sql, [tenantId]);
  const sequence = result.rows[0].sequence_value;
  return `INV-${tenantCode}-${sequence.toString().padStart(6, '0')}`;
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
  const result = await query(sql, [name, code, subdomain, contactEmail, theme, JSON.stringify(features)]);
  return result.rows[0];
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
    sql = 'SELECT * FROM emr.users WHERE email = $1';
    params = [email];
  } else {
    sql = 'SELECT * FROM emr.users WHERE email = $1 AND tenant_id = $2';
    params = [email, tenantId];
  }

  const result = await query(sql, params);
  return result.rows[0];
}

export async function createUser({ tenantId, email, passwordHash, name, role, patientId }) {
  const sql = `
    INSERT INTO emr.users (tenant_id, email, password_hash, name, role, patient_id, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, true)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, email, passwordHash, name, role, patientId]);
  return result.rows[0];
}

export async function updateUserLastLogin(userId) {
  await query('UPDATE emr.users SET last_login = NOW() WHERE id = $1', [userId]);
}

// =====================================================
// PATIENTS
// =====================================================

export async function getPatients(tenantId, userRole = null, limit = 50, offset = 0, includeArchived = false) {
  let sql = `
    SELECT 
      p.id, p.tenant_id, p.first_name, p.last_name, p.dob, p.gender, p.phone, p.email, 
      p.address, p.blood_group, p.emergency_contact, p.insurance, p.medical_history,
      p.mrn, p.is_archived, p.created_at, p.updated_at,
      (SELECT COUNT(*) FROM emr.appointments WHERE patient_id = p.id) as appointment_count,
      (SELECT COUNT(*) FROM emr.clinical_records WHERE patient_id = p.id) as clinical_record_count
    FROM emr.patients p
    WHERE p.tenant_id = $1
  `;

  const params = [tenantId];
  let paramIndex = 2;

  if (!includeArchived) {
    sql += ` AND p.is_archived = false`;
  }

  sql += ` ORDER BY p.last_name, p.first_name LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
}

export async function searchPatients(tenantId, { text, date, type, status, limit = 50, includeArchived = false }) {
  let sql = `
    SELECT DISTINCT p.*,
           e.encounter_type as latest_encounter_type,
           a.start as latest_appointment_date
    FROM emr.patients p
    LEFT JOIN emr.encounters e ON p.id = e.patient_id
    LEFT JOIN emr.appointments a ON p.id = a.patient_id
    WHERE p.tenant_id = $1
  `;

  const params = [tenantId];
  let paramIndex = 2;

  if (text) {
    sql += ` AND (
      p.first_name ILIKE $${paramIndex++} OR 
      p.last_name ILIKE $${paramIndex++} OR 
      p.mrn ILIKE $${paramIndex++} OR 
      p.phone ILIKE $${paramIndex++}
    )`;
    const searchTerm = `%${text}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (!includeArchived) {
    sql += ` AND p.is_archived = false`;
  }

  sql += ` ORDER BY p.last_name, p.first_name LIMIT $${paramIndex++}`;
  params.push(limit);

  const result = await query(sql, params);
  return result.rows;
}

export async function getPatientById(id, tenantId, userRole = null) {
  const sql = `
    SELECT p.*,
           json_agg(DISTINCT cr.*) FILTER (WHERE cr.id IS NOT NULL) as clinical_records,
           json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL) as appointments,
           json_agg(DISTINCT d.*) FILTER (WHERE d.id IS NOT NULL) as documents
    FROM emr.patients p
    LEFT JOIN emr.clinical_records cr ON p.id = cr.patient_id
    LEFT JOIN emr.appointments a ON p.id = a.patient_id
    LEFT JOIN emr.documents d ON p.id = d.patient_id AND d.is_deleted = false
    WHERE p.id = $1 AND p.tenant_id = $2
    GROUP BY p.id
  `;
  const result = await query(sql, [id, tenantId]);
  const patientObj = result.rows[0];

  if (!patientObj) return null;

  // Apply role-based data masking
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
      tenant_id, first_name, last_name, mrn, dob, gender, phone, email, 
      address, blood_group, emergency_contact, insurance, medical_history
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, firstName, lastName, mrn, dob, gender, phone, email,
    address, bloodGroup, emergencyContact, JSON.stringify(insurance), JSON.stringify(medicalHistory)
  ]);
  
  // Create audit log
  await createAuditLog({
    tenantId,
    userId,
    userName: 'system',
    action: 'CREATE',
    entityName: 'patient',
    entityId: result.rows[0].id,
    details: `Created patient: ${firstName} ${lastName} (MRN: ${mrn})`
  });

  return result.rows[0];
}

export async function addClinicalRecord({ tenantId, userId, patientId, section, content }) {
  const sql = `
    INSERT INTO emr.clinical_records (tenant_id, patient_id, section, content, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, patientId, section, content, userId]);
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
  const result = await query(sql, [tenantId, name, phone, reason]);
  return result.rows[0];
}

// =====================================================
// DEPARTMENTS
// =====================================================

export async function getDepartments(tenantId) {
  const result = await query(
    'SELECT * FROM emr.departments WHERE tenant_id = $1 ORDER BY name',
    [tenantId]
  );
  return result.rows;
}

export async function createDepartment({ tenantId, name, description, headOfDepartment }) {
  const sql = `
    INSERT INTO emr.departments (tenant_id, name, description, head_of_department)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, name, description, headOfDepartment]);
  return result.rows[0];
}

// =====================================================
// APPOINTMENTS
// =====================================================

export async function getAppointments(tenantId, filters = {}) {
  const { status, doctorId, departmentId, date, patientId } = filters;
  
  let sql = `
    SELECT a.*, p.first_name, p.last_name, p.phone, d.name as department_name,
           u.name as doctor_name
    FROM emr.appointments a
    JOIN emr.patients p ON a.patient_id = p.id
    LEFT JOIN emr.departments d ON a.department_id = d.id
    LEFT JOIN emr.users u ON a.doctor_id = u.id
    WHERE a.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND a.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (doctorId) {
    sql += ` AND a.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (departmentId) {
    sql += ` AND a.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (date) {
    sql += ` AND DATE(a.start) = $${paramIndex++}`;
    params.push(date);
  }
  
  if (patientId) {
    sql += ` AND a.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  sql += ` ORDER BY a.start DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function createAppointment({ tenantId, patientId, doctorId, departmentId, start, end, type, status, notes }) {
  const sql = `
    INSERT INTO emr.appointments (tenant_id, patient_id, doctor_id, department_id, start, end, type, status, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, patientId, doctorId, departmentId, start, end, type, status, notes]);
  return result.rows[0];
}

export async function updateAppointmentStatus(appointmentId, tenantId, status) {
  const sql = `
    UPDATE emr.appointments 
    SET status = $1, updated_at = NOW() 
    WHERE id = $2 AND tenant_id = $3
    RETURNING *
  `;
  const result = await query(sql, [status, appointmentId, tenantId]);
  return result.rows[0];
}

// =====================================================
// OPD TOKENS
// =====================================================

export async function createOPDToken({ tenantId, patientId, departmentId, doctorId, priority = 'normal' }) {
  // Get token number for the department
  const tokenSql = `
    SELECT COALESCE(MAX(CAST(SUBSTRING(full_token FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_number
    FROM emr.opd_tokens 
    WHERE tenant_id = $1 AND department_id = $2 AND DATE(created_at) = CURRENT_DATE
  `;
  const tokenResult = await query(tokenSql, [tenantId, departmentId]);
  const nextNumber = tokenResult.rows[0].next_number;
  
  // Get department code
  const deptSql = 'SELECT code FROM emr.departments WHERE id = $1';
  const deptResult = await query(deptSql, [departmentId]);
  const deptCode = deptResult.rows[0]?.code || 'GEN';
  
  const fullToken = `${deptCode}-${nextNumber.toString().padStart(3, '0')}`;
  
  const sql = `
    INSERT INTO emr.opd_tokens (tenant_id, patient_id, department_id, doctor_id, full_token, token_number, priority, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'waiting')
    RETURNING *
  `;
  
  const result = await query(sql, [tenantId, patientId, departmentId, doctorId, fullToken, nextNumber, priority]);
  return result.rows[0];
}

export async function getOPDTokens(tenantId, filters = {}) {
  const { departmentId, doctorId, status, date = new Date().toISOString().split('T')[0] } = filters;
  
  let sql = `
    SELECT t.*, p.first_name, p.last_name, d.name as department_name, u.name as doctor_name
    FROM emr.opd_tokens t
    JOIN emr.patients p ON t.patient_id = p.id
    LEFT JOIN emr.departments d ON t.department_id = d.id
    LEFT JOIN emr.users u ON t.doctor_id = u.id
    WHERE t.tenant_id = $1 AND DATE(t.created_at) = $2
  `;
  
  const params = [tenantId, date];
  let paramIndex = 3;
  
  if (departmentId) {
    sql += ` AND t.department_id = $${paramIndex++}`;
    params.push(departmentId);
  }
  
  if (doctorId) {
    sql += ` AND t.doctor_id = $${paramIndex++}`;
    params.push(doctorId);
  }
  
  if (status) {
    sql += ` AND t.status = $${paramIndex++}`;
    params.push(status);
  }
  
  sql += ` ORDER BY t.created_at`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function updateTokenStatus(tokenId, tenantId, status, additionalData = {}) {
  const fields = ['status', 'updated_at'];
  const values = [status, new Date()];
  let paramIndex = 3;
  
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

// =====================================================
// OPD BILLING
// =====================================================

export async function createOPDBill({ tenantId, patientId, tokenId, doctorId, departmentId, items, paymentMethod, createdBy }) {
  const billNumber = await generateInvoiceNumber(tenantId);
  
  const sql = `
    INSERT INTO emr.opd_bills (
      tenant_id, patient_id, token_id, doctor_id, department_id, 
      bill_number, bill_date, status, payment_method, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, 'pending', $7, $8)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, tokenId, doctorId, departmentId,
    billNumber, paymentMethod, createdBy
  ]);
  
  const bill = result.rows[0];
  
  // Add bill items
  for (const item of items) {
    await addBillItem({
      tenantId,
      billId: bill.id,
      serviceType: item.serviceType,
      serviceName: item.serviceName,
      serviceCode: item.serviceCode,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      taxAmount: item.taxAmount,
      totalAmount: item.totalAmount,
      doctorId,
      departmentId,
      createdBy
    });
  }
  
  return bill;
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

// =====================================================
// EXOTEL SMS INTEGRATION
// =====================================================

export async function createExotelConfiguration({ tenantId, accountSid, apiKey, apiToken, subdomain, isDefault = false, isActive = true, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_configurations (
      tenant_id, account_sid, api_key, api_token, subdomain, is_default, is_active, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, accountSid, apiKey, apiToken, subdomain, isDefault, isActive, createdBy
  ]);
  
  return result.rows[0];
}

export async function getExotelConfigurations(tenantId, filters = {}) {
  const { isActive = true } = filters;
  
  let sql = `
    SELECT * FROM emr.exotel_configurations
    WHERE tenant_id = $1 AND is_active = $2
  `;
  
  const params = [tenantId, isActive];
  
  sql += ` ORDER BY is_default DESC, created_at DESC`;
  
  const result = await query(sql, params);
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

export async function createSMSCampaign({ tenantId, campaignName, campaignType, messageContent, targetAudience, filters, scheduledAt, createdBy }) {
  const sql = `
    INSERT INTO emr.exotel_sms_campaigns (
      tenant_id, campaign_name, campaign_type, message_content, target_audience,
      filters, scheduled_at, status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, campaignName, campaignType, messageContent, targetAudience,
    JSON.stringify(filters), scheduledAt, createdBy
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
    LEFT JOIN emr.communication_templates ct ON c.id = ct.id
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
    
    return { success: true, smsLog, exotelResponse };
  } catch (error) {
    // Update log with error
    await updateExotelSMSLog(smsLog.id, tenantId, {
      status: 'failed',
      errorCode: 'API_ERROR',
      errorMessage: error.message
    });
    
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

// =====================================================
// PRESCRIPTIONS & PHARMACY
// =====================================================

export async function getPrescriptions(tenantId, filters = {}) {
  const { status, patientId } = filters;
  
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
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND pr.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (patientId) {
    sql += ` AND p.id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  sql += ` ORDER BY pr.created_at DESC`;
  
  const result = await query(sql, params);
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
    INSERT INTO emr.prescriptions (
      tenant_id, encounter_id, drug_name, dosage, frequency, duration, instructions, status, is_followup, followup_date, followup_notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending', $8, $9, $10)
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
      action: `prescription.${status.toLowerCase()}`,
      entityName: 'prescription',
      entityId: id,
      details: { status }
    });
  }
  
  return result.rows[0];
}

export async function dispensePrescription({ id, tenantId, userId, itemId, quantity }) {
  // Update prescription status
  const prescription = await updatePrescriptionStatus({ id, tenantId, userId, status: 'Dispensed' });
  
  if (!prescription) {
    throw new Error('Prescription not found');
  }
  
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

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function maskPatientData(patient, userRole) {
  if (!patient) return null;
  
  // Apply role-based data masking
  const maskedPatient = { ...patient };
  
  if (userRole === 'receptionist') {
    // Receptionists see limited information
    delete maskedPatient.medical_history;
    delete maskedPatient.insurance;
  }
  
  return maskedPatient;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export function calculatePerformanceScore(weeklyStats) {
  const { 
    appointments, patients, admissions, occupiedBeds, totalBeds, totalRevenue 
  } = weeklyStats;
  
  // Performance indicators (0-100 scale)
  const occupancyScore = Math.min(100, (occupiedBeds / totalBeds) * 100);
  const revenueScore = Math.min(100, (totalRevenue / (totalBeds || 1)) * 100);
  const patientScore = Math.min(100, (patients / (totalPatients || 1)) * 100);
  
  // Weighted average score
  const performanceScore = Math.round((occupancyScore + revenueScore + patientScore) / 3);
  
  return performanceScore;
}

export function calculateUtilizationRate(occupiedBeds, totalBeds) {
  if (totalBeds === 0) return 0;
  return Math.round((occupiedBeds / totalBeds) * 100);
}

export function calculateRevenuePerBed(totalRevenue, totalBeds) {
  if (totalBeds === 0) return 0;
  return Math.round(totalRevenue / totalBeds);
}

export function calculateTrend(current, previous) {
  if (!current || !previous) return 'stable';
  const change = current - previous;
  if (Math.abs(change) < 0.1) return 'decreasing';
  if (change > 0.1) return 'increasing';
  return 'stable';
}

export function getPerformanceColor(score) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

export function getTrendColor(current, previous) {
  const change = current - previous;
  if (change > 0.1) return 'text-green-600';
  if (change < -0.1) return 'text-red-600';
  return 'text-amber-600';
}
