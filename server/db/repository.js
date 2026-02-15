/**
 * Database Repository Layer
 * Provides all CRUD operations for the EMR system
 * Replaces the JSON file storage with PostgreSQL
 */

import { query } from './connection.js';

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate audit log entry
 */
async function createAuditLog({ tenantId, userId, userName, action, entityName, entityId, details, ipAddress, userAgent }) {
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
 * Generate unique MRN for patient
 */
async function generateMRN(tenantId) {
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
async function generateInvoiceNumber(tenantId) {
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
  const result = await query('SELECT id, name, code, subdomain, theme, features, status, created_at, updated_at FROM emr.tenants ORDER BY name');
  return result.rows;
}

export async function getTenantById(id) {
  const result = await query('SELECT * FROM emr.tenants WHERE id = $1', [id]);
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

  return result.rows[0];
}

export async function updateTenantSettings({ tenantId, displayName, theme, features }) {
  const sql = `
    UPDATE emr.tenants
    SET name = COALESCE($2, name),
        theme = COALESCE($3, theme),
        features = COALESCE($4, features),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId,
    displayName,
    theme ? JSON.stringify(theme) : null,
    features ? JSON.stringify(features) : null,
  ]);

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

export async function getPatients(tenantId) {
  const sql = `
    SELECT p.*, 
           json_agg(DISTINCT cr.*) FILTER (WHERE cr.id IS NOT NULL) as clinical_records
    FROM emr.patients p
    LEFT JOIN emr.clinical_records cr ON p.id = cr.patient_id
    WHERE p.tenant_id = $1
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  const result = await query(sql, [tenantId]);

  // Transform clinical records into separate arrays by section
  return result.rows.map(patient => {
    const records = patient.clinical_records || [];
    return {
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
      clinical_records: undefined, // Remove the aggregated field
    };
  });
}

export async function getPatientById(id, tenantId) {
  const sql = `
    SELECT p.*,
           json_agg(DISTINCT cr.*) FILTER (WHERE cr.id IS NOT NULL) as clinical_records
    FROM emr.patients p
    LEFT JOIN emr.clinical_records cr ON p.id = cr.patient_id
    WHERE p.id = $1 AND p.tenant_id = $2
    GROUP BY p.id
  `;

  const result = await query(sql, [id, tenantId]);

  if (result.rows.length === 0) return null;

  const patient = result.rows[0];
  const records = patient.clinical_records || [];

  return {
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

export async function getAppointments(tenantId) {
  const result = await query(
    'SELECT * FROM emr.appointments WHERE tenant_id = $1 ORDER BY scheduled_start DESC',
    [tenantId]
  );
  return result.rows.map(row => ({
    ...row,
    patientId: row.patient_id,
    providerId: row.provider_id,
    start: row.scheduled_start,
    end: row.scheduled_end,
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
// ENCOUNTERS (EMR)
// =====================================================

export async function getEncounters(tenantId) {
  const result = await query(
    'SELECT * FROM emr.encounters WHERE tenant_id = $1 ORDER BY visit_date DESC',
    [tenantId]
  );
  return result.rows.map(row => ({
    ...row,
    patientId: row.patient_id,
    providerId: row.provider_id,
    type: row.encounter_type,
    complaint: row.chief_complaint,
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
  }));
}

export async function createInvoice({ tenantId, userId, patientId, description, amount, taxPercent = 0 }) {
  const invoiceNumber = await generateInvoiceNumber(tenantId);
  const subtotal = parseFloat(amount);
  const tax = subtotal * (parseFloat(taxPercent) / 100);
  const total = subtotal + tax;

  const sql = `
    INSERT INTO emr.invoices (tenant_id, patient_id, invoice_number, description, subtotal, tax, total, paid, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'issued')
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
  ]);

  const invoice = result.rows[0];

  await createAuditLog({
    tenantId,
    userId,
    action: 'invoice.issue',
    entityName: 'invoice',
    entityId: invoice.id,
    details: { invoiceNumber },
  });

  return {
    ...invoice,
    number: invoice.invoice_number,
  };
}

export async function payInvoice({ invoiceId, tenantId, userId }) {
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
  });

  const invoice = result.rows[0];
  return {
    ...invoice,
    number: invoice.invoice_number,
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

  return {
    periodical: {
      dailyAppointments: parseInt(periodicalResult.rows[0].daily_appointments),
      openAppointments: parseInt(periodicalResult.rows[0].open_appointments),
      pendingInvoices: parseInt(periodicalResult.rows[0].pending_invoices),
    },
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

  return {
    tenants: tenantStats,
    totals: {
      tenants: parseInt(totals.rows[0].tenants),
      users: parseInt(totals.rows[0].users),
      patients: parseInt(totals.rows[0].patients),
      appointments: parseInt(totals.rows[0].appointments),
    },
  };
}

// =====================================================
// BOOTSTRAP (Initial data load)
// =====================================================

export async function getBootstrapData(tenantId, userId) {
  const tenant = await getTenantById(tenantId);

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  let patients = await getPatients(tenantId);
  let appointments = await getAppointments(tenantId);
  let encounters = await getEncounters(tenantId);
  let invoices = await getInvoices(tenantId);
  const users = await getUsers(tenantId);
  const walkins = await getWalkins(tenantId);
  const employees = await getEmployees(tenantId);
  const employeeLeaves = await getEmployeeLeaves(tenantId);
  const inventory = await getInventoryItems(tenantId);

  // Get user role
  const user = await getUserById(userId);

  // If user is a patient, filter data to only their records
  if (user && user.role === 'Patient' && user.patient_id) {
    const patientId = user.patient_id;
    patients = patients.filter(p => p.id === patientId);
    appointments = appointments.filter(a => a.patient_id === patientId);
    encounters = encounters.filter(e => e.patient_id === patientId);
    invoices = invoices.filter(i => i.patient_id === patientId);
  }

  return {
    tenant,
    users,
    patients,
    appointments,
    encounters,
    invoices,
    walkins,
    employees,
    employeeLeaves,
    inventory,
    permissions: {
      Superadmin: ['superadmin', 'dashboard', 'reports'],
      Admin: ['dashboard', 'patients', 'appointments', 'emr', 'billing', 'inventory', 'employees', 'reports', 'admin'],
      Doctor: ['dashboard', 'patients', 'appointments', 'emr', 'reports'],
      Nurse: ['dashboard', 'patients', 'appointments', 'emr'],
      'Front Office': ['dashboard', 'patients', 'appointments'],
      Billing: ['dashboard', 'billing', 'reports'],
      Inventory: ['dashboard', 'inventory', 'reports'],
      Patient: ['dashboard', 'appointments', 'patients'],
    },
  };
}

export default {
  // Tenants
  getTenants,
  getTenantById,
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
  createEmployee,
  getEmployeeLeaves,
  createEmployeeLeave,

  // Reports
  getReportSummary,

  // Superadmin
  getSuperadminOverview,

  // Bootstrap
  getBootstrapData,

  // Audit
  createAuditLog,
};

// Export createAuditLog separately as well
export { createAuditLog };
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
  let paramIndex = 2;

  if (filters.status) {
    sql += ` AND pr.status = $${paramIndex++}`;
    params.push(filters.status);
  }

  if (filters.patientId) {
    sql += ` AND p.id = $${paramIndex++}`;
    params.push(filters.patientId);
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
