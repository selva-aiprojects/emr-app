/**
 * OPD Management Service
 * Handles all OPD token and billing-related database operations
 */

import { query } from './connection.js';

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
  const nextNumber = tokenResult.rows[0]?.next_number || 1;
  
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
    SELECT 
      t.full_token as token_number,
      p.name as patient_name,
      p.phone as patient_phone,
      d.name as department_name,
      u.name as doctor_name
    FROM emr.opd_tokens t
    LEFT JOIN emr.patients p ON t.patient_id = p.id
    LEFT JOIN emr.departments d ON t.department_id = d.id
    LEFT JOIN emr.users u ON t.doctor_id = u.id
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
  
  sql += ` ORDER BY t.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

// =====================================================
// OPD BILLING
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
      tax_amount, total_amount, payment_method, insurance_provider, policy_number, notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, CURRENT_TIME,
            $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, tokenId, appointmentId, billNumber,
    patientName, patientAge, patientGender, visitType, departmentId, doctorId, departmentName, doctorName, consultationFee, registrationFee, procedureCharges, labCharges, medicineCharges, otherCharges, discountAmount, discountPercentage, taxAmount, totalAmount, paymentMethod, insuranceProvider, policyNumber, notes, createdBy
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
    sql += ` AND DATE(b.bill_date) = $${paramIndex++}`;
    params.push(date);
  }
  
  if (patientId) {
    sql += ` AND b.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  sql += ` ORDER BY b.bill_date DESC, b.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getOPDBillById(billId, tenantId) {
  const sql = `
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
    WHERE b.id = $1 AND b.tenant_id = $2
  `;
  
  const result = await query(sql, [billId, tenantId]);
  return result.rows[0];
}

export async function updateBillStatus(billId, tenantId, status, additionalData = {}) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(additionalData).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(additionalData[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  const setValues = values.join(', ');
  
  const sql = `
    UPDATE emr.opd_bills
    SET ${setClause}
    WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
    RETURNING *
  `;
  
  const result = await query(sql, [...setValues, billId, tenantId]);
  return result.rows[0];
}

export async function addBillItem({ tenantId, billId, serviceType, serviceName, serviceCode, description, quantity, unitPrice, discountAmount, taxAmount, totalAmount, doctorId, departmentId, createdBy }) {
  const sql = `
    INSERT INTO emr.opd_bill_items (
      tenant_id, bill_id, service_type, service_name, service_code, description,
      quantity, unit_price, discount_amount, tax_amount, total_amount,
      doctor_id, department_id, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, billId, serviceType, serviceName, serviceCode, description,
    quantity, unitPrice, discountAmount, taxAmount, totalAmount, doctorId, departmentId, createdBy
  ]);
  
  // Update bill totals
  await query(`SELECT calculate_bill_totals($1)`, [billId]);
  
  return result.rows[0];
}

export async function createOPDToken({ tenantId, patientId, departmentId, doctorId, priority = 'normal' }) {
  // Get token number for the department
  const tokenSql = `
    SELECT COALESCE(MAX(CAST(SUBSTRING(full_token FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_number
    FROM emr.opd_tokens 
    WHERE tenant_id = $1 AND department_id = $2 AND DATE(created_at) = CURRENT_DATE
  `;
  const tokenResult = await query(tokenSql, [tenantId, departmentId]);
  const nextNumber = tokenResult.rows[0]?.next_number || 1;
  
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
    SELECT 
      t.full_token as token_number,
      p.name as patient_name,
      p.phone as patient_phone,
      d.name as department_name,
      u.name as doctor_name
    FROM emr.opd_tokens t
    LEFT JOIN emr.patients p ON t.patient_id = p.id
    LEFT JOIN emr.departments d ON t.department_id = d.id
    LEFT JOIN emr.users u ON t.doctor_id = u.id
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
  
  sql += ` ORDER BY t.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

// =====================================================
// OPD BILLING
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
      tax_amount, total_amount, payment_method, insurance_provider, policy_number, notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, CURRENT_TIME,
            $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, tokenId, appointmentId, billNumber,
    patientName, patientAge, patientGender, visitType, departmentId, doctorId, departmentName, doctorName, consultationFee, registrationFee, procedureCharges, labCharges, medicineCharges, otherCharges, discountAmount, discountPercentage, taxAmount, totalAmount, paymentMethod, insuranceProvider, policyNumber, notes, createdBy
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
    sql += ` AND DATE(bill_date) = $${paramIndex++}`;
    params.push(date);
  }
  
  if (patientId) {
    sql += ` AND b.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  sql += ` ORDER BY b.bill_date DESC, b.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getOPDBillById(billId, tenantId) {
  const sql = `
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
    WHERE b.id = $1 AND b.tenant_id = $2
  `;
  
  const result = await query(sql, [billId, tenantId]);
  return result.rows[0];
}

export async function updateBillStatus(billId, tenantId, status, additionalData = {}) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(additionalData).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(additionalData[key]);
  });
  
  fields.push('updated_at = NOW()');
  values.push(new Date());
  
  const setClause = fields.join(', ');
  const setValues = values.join(', ');
  
  const sql = `
    UPDATE emr.opd_bills
    SET ${setClause}
    WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
    RETURNING *
  `;
  
  const result = await query(sql, [...setValues, billId, tenantId]);
  return result.rows[0];
}

export async function addBillItem({ tenantId, billId, serviceType, serviceName, serviceCode, description, quantity, unitPrice, discountAmount, taxAmount, totalAmount, doctorId, departmentId, createdBy }) {
  const sql = `
    INSERT INTO emr.opd_bill_items (
      tenant_id, bill_id, service_type, service_name, service_code, description,
      quantity, unit_price, discount_amount, tax_amount, total_amount,
      doctor_id, department_id, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, billId, serviceType, serviceName, serviceCode, description,
    quantity, unitPrice, discountAmount, taxAmount, totalAmount, doctorId, departmentId, createdBy
  ]);
  
  // Update bill totals
  await query(`SELECT calculate_bill_totals($1)`, [billId]);
  
  return result.rows[0];
}
