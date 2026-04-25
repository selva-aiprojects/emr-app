/**
 * Billing Management Service
 * Handles all billing and invoice-related database operations
 */

import { query } from './connection.js';

// =====================================================
// BILLING & INVOICES
// =====================================================

export async function getInvoices(tenantId, filters = {}) {
  const { status, patientId, doctorId, date, startDate, endDate } = filters;
  
  let sql = `
    SELECT 
      i.*, p.first_name || ' ' || p.last_name as patient_name,
      p.phone as patient_phone,
      u.name as doctor_name
    FROM nexus.invoices i
    LEFT JOIN nexus.patients p ON i.patient_id::text = p.id::text
    LEFT JOIN nexus.encounters e ON i.encounter_id::text = e.id::text
    LEFT JOIN nexus.users u ON e.provider_id::text = u.id::text
    WHERE i.tenant_id::text = $1::text
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND i.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (patientId) {
    sql += ` AND i.patient_id::text = $${paramIndex++}::text`;
    params.push(patientId);
  }
  
  if (doctorId) {
    sql += ` AND i.doctor_id::text = $${paramIndex++}::text`;
    params.push(doctorId);
  }
  
  if (date) {
    sql += ` AND DATE(i.created_at) = $${paramIndex++}`;
    params.push(date);
  }
  
  if (startDate) {
    sql += ` AND i.created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ` AND i.created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  sql += ` ORDER BY i.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function createInvoice({ tenantId, patientId, encounterId, items, subtotal, taxAmount, totalAmount }) {
  // Generate invoice number correctly from nexus schema
  const invoiceNumberSql = `SELECT nexus.get_next_invoice_number($1) as invoice_number`;
  const invoiceNumberResult = await query(invoiceNumberSql, [tenantId]);
  const invoiceNumber = invoiceNumberResult.rows[0].invoice_number;
  
  const sql = `
    INSERT INTO nexus.invoices (
      tenant_id, patient_id, encounter_id, invoice_number, subtotal, tax, total, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'unpaid')
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, patientId, encounterId, invoiceNumber, subtotal, taxAmount, totalAmount
  ]);

  // Insert items into invoice_items if provided
  if (items && Array.isArray(items)) {
    for (const item of items) {
       await query(`INSERT INTO nexus.invoice_items (tenant_id, invoice_id, description, quantity, unit_price, total) VALUES ($1, $2, $3, $4, $5, $6)`,
         [tenantId, result.rows[0].id, item.description, item.quantity || 1, item.unitPrice || item.price, item.total]);
    }
  }
  
  return { ...result.rows[0], invoice_number: invoiceNumber };
}

export async function updateInvoiceStatus(invoiceId, tenantId, status, additionalData = {}) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  Object.keys(additionalData).forEach(key => {
    fields.push(`${key} = $${paramIndex++}`);
    values.push(additionalData[key]);
  });
  
  fields.push(`updated_at = $${paramIndex++}`);
  values.push(new Date());
  
  const setClause = fields.join(', ');
  
  const sql = `
    UPDATE nexus.invoices
    SET ${setClause}
    WHERE id::text = $${paramIndex++}::text AND tenant_id::text = $${paramIndex++}::text
    RETURNING *
  `;
  
  const result = await query(sql, [...values, invoiceId, tenantId]);
  return result.rows[0];
}

export async function payInvoice({ tenantId, invoiceId, paymentMethod, paymentAmount, transactionId, notes, paidBy }) {
  const sql = `
    UPDATE nexus.invoices 
    SET status = 'paid', payment_method = $1, paid = $2, transaction_id = $3, payment_date = NOW(), payment_notes = $4, paid_by = $5, updated_at = NOW()
    WHERE id::text = $6::text AND tenant_id::text = $7::text
    RETURNING *
  `;
  
  const result = await query(sql, [paymentMethod, paymentAmount, transactionId, notes, paidBy, invoiceId, tenantId]);
  return result.rows[0];
}

export async function getInvoiceById(invoiceId, tenantId) {
  const sql = `
    SELECT 
      i.*, p.first_name || ' ' || p.last_name as patient_name,
      p.phone as patient_phone,
      u.name as doctor_name
    FROM nexus.invoices i
    LEFT JOIN nexus.patients p ON i.patient_id::text = p.id::text
    LEFT JOIN nexus.users u ON i.doctor_id::text = u.id::text
    WHERE i.id::text = $1::text AND i.tenant_id::text = $2::text
  `;
  
  const result = await query(sql, [invoiceId, tenantId]);
  return result.rows[0];
}

// =====================================================
// ADVANCED BILLING EXTENSIONS
// =====================================================

export async function getBillingItems(tenantId, filters = {}) {
  const { patientId, visitId, invoiceId, status } = filters;
  let sql = `
    SELECT bi.*, p.first_name || ' ' || p.last_name AS patient_name,
           fv.token_number AS visit_token, inv.invoice_number
    FROM nexus.billing_items bi
    LEFT JOIN nexus.patients p ON bi.patient_id::text = p.id::text
    LEFT JOIN nexus.frontdesk_visits fv ON bi.visit_id::text = fv.id::text
    LEFT JOIN nexus.invoices inv ON bi.invoice_id::text = inv.id::text
    WHERE bi.tenant_id::text = $1::text
  `;

  const params = [tenantId];
  let paramIndex = 2;

  if (patientId) {
    sql += ` AND bi.patient_id::text = $${paramIndex++}::text`;
    params.push(patientId);
  }

  if (visitId) {
    sql += ` AND bi.visit_id::text = $${paramIndex++}::text`;
    params.push(visitId);
  }

  if (invoiceId) {
    sql += ` AND bi.invoice_id::text = $${paramIndex++}::text`;
    params.push(invoiceId);
  }

  if (status) {
    sql += ` AND bi.status = $${paramIndex++}`;
    params.push(status);
  }

  sql += ` ORDER BY bi.created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
}

export async function getBillingItemById(itemId, tenantId) {
  const sql = `SELECT * FROM nexus.billing_items WHERE id::text = $1::text AND tenant_id::text = $2::text`;
  const result = await query(sql, [itemId, tenantId]);
  return result.rows[0];
}

export async function createBillingItem({ tenantId, patientId, visitId, invoiceId, itemCode, itemName, quantity = 1, unitPrice = 0, discountAmount = 0, taxAmount = 0, status = 'pending' }) {
  const sql = `
    INSERT INTO nexus.billing_items (
      tenant_id, patient_id, visit_id, invoice_id,
      item_code, item_name, quantity, unit_price,
      discount_amount, tax_amount, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId, patientId, visitId, invoiceId,
    itemCode, itemName, quantity, unitPrice,
    discountAmount, taxAmount, status
  ]);

  return result.rows[0];
}

export async function updateBillingItem({ itemId, tenantId, updates = {} }) {
  const allowedFields = ['item_code', 'item_name', 'quantity', 'unit_price', 'discount_amount', 'tax_amount', 'status', 'visit_id', 'invoice_id'];
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedFields.includes(key)) continue;
    fields.push(`${key} = $${index++}`);
    values.push(value);
  }

  if (fields.length === 0) {
    return getBillingItemById(itemId, tenantId);
  }

  fields.push(`updated_at = $${index++}`);
  values.push(new Date());

  const sql = `
    UPDATE nexus.billing_items
    SET ${fields.join(', ')}
    WHERE id::text = $${index++}::text AND tenant_id::text = $${index++}::text
    RETURNING *
  `;

  values.push(itemId, tenantId);
  const result = await query(sql, values);
  return result.rows[0];
}

export async function deleteBillingItem(itemId, tenantId) {
  const sql = `DELETE FROM nexus.billing_items WHERE id::text = $1::text AND tenant_id::text = $2::text RETURNING *`;
  const result = await query(sql, [itemId, tenantId]);
  return result.rows[0];
}

export async function getBillingConcessions(tenantId, filters = {}) {
  const { patientId, invoiceId, status } = filters;
  let sql = `
    SELECT bc.*, p.first_name || ' ' || p.last_name AS patient_name, inv.invoice_number
    FROM nexus.billing_concessions bc
    LEFT JOIN nexus.patients p ON bc.patient_id = p.id
    LEFT JOIN nexus.invoices inv ON bc.invoice_id = inv.id
    WHERE bc.tenant_id::text = $1::text
  `;

  const params = [tenantId];
  let paramIndex = 2;

  if (patientId) {
    sql += ` AND bc.patient_id::text = $${paramIndex++}::text`;
    params.push(patientId);
  }

  if (invoiceId) {
    sql += ` AND bc.invoice_id::text = $${paramIndex++}::text`;
    params.push(invoiceId);
  }

  if (status) {
    sql += ` AND bc.status = $${paramIndex++}`;
    params.push(status);
  }

  sql += ` ORDER BY bc.created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
}

export async function createBillingConcession({ tenantId, patientId, invoiceId, concessionType, amount, reason, approvedBy = null, approvedAt = null, status = 'pending' }) {
  const sql = `
    INSERT INTO nexus.billing_concessions (
      tenant_id, patient_id, invoice_id,
      concession_type, amount, reason,
      approved_by, approved_at, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId, patientId, invoiceId, concessionType, amount, reason,
    approvedBy, approvedAt, status
  ]);
  return result.rows[0];
}

export async function updateBillingConcession({ concessionId, tenantId, updates = {} }) {
  const allowedFields = ['concession_type', 'amount', 'reason', 'approved_by', 'approved_at', 'status'];
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedFields.includes(key)) continue;
    fields.push(`${key} = $${index++}`);
    values.push(value);
  }

  if (fields.length === 0) {
    const result = await query(`SELECT * FROM nexus.billing_concessions WHERE id::text = $1::text AND tenant_id::text = $2::text`, [concessionId, tenantId]);
    return result.rows[0];
  }

  fields.push(`updated_at = $${index++}`);
  values.push(new Date());

  const sql = `
    UPDATE nexus.billing_concessions
    SET ${fields.join(', ')}
    WHERE id::text = $${index++}::text AND tenant_id::text = $${index++}::text
    RETURNING *
  `;

  values.push(concessionId, tenantId);
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getCreditNotes(tenantId, filters = {}) {
  const { patientId, invoiceId } = filters;
  let sql = `SELECT cn.* FROM nexus.billing_credit_notes cn WHERE cn.tenant_id::text = $1::text`;
  const params = [tenantId];
  let paramIndex = 2;

  if (patientId) {
    sql += ` AND cn.patient_id::text = $${paramIndex++}::text`;
    params.push(patientId);
  }

  if (invoiceId) {
    sql += ` AND cn.original_invoice_id::text = $${paramIndex++}::text`;
    params.push(invoiceId);
  }

  sql += ` ORDER BY cn.issued_at DESC`;
  const result = await query(sql, params);
  return result.rows;
}

export async function createCreditNote({ tenantId, patientId, originalInvoiceId, amount, reason, creditNoteNumber = null }) {
  if (!creditNoteNumber) {
    creditNoteNumber = `CR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
  }

  const sql = `
    INSERT INTO nexus.billing_credit_notes (
      tenant_id, patient_id, original_invoice_id,
      credit_note_number, amount, reason
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const result = await query(sql, [tenantId, patientId, originalInvoiceId, creditNoteNumber, amount, reason]);
  return result.rows[0];
}

export async function getBillingApprovals(tenantId, filters = {}) {
  const { patientId, invoiceId, status } = filters;
  let sql = `
    SELECT ba.*, p.first_name || ' ' || p.last_name AS patient_name, inv.invoice_number
    FROM nexus.billing_approvals ba
    LEFT JOIN nexus.patients p ON ba.patient_id = p.id
    LEFT JOIN nexus.invoices inv ON ba.invoice_id = inv.id
    WHERE ba.tenant_id::text = $1::text
  `;

  const params = [tenantId];
  let paramIndex = 2;

  if (patientId) {
    sql += ` AND ba.patient_id::text = $${paramIndex++}::text`;
    params.push(patientId);
  }

  if (invoiceId) {
    sql += ` AND ba.invoice_id::text = $${paramIndex++}::text`;
    params.push(invoiceId);
  }

  if (status) {
    sql += ` AND ba.status = $${paramIndex++}`;
    params.push(status);
  }

  sql += ` ORDER BY ba.created_at DESC`;
  const result = await query(sql, params);
  return result.rows;
}

export async function createBillingApproval({ tenantId, patientId, invoiceId, approvalType, amount, requestedBy, status = 'pending', notes = null }) {
  const sql = `
    INSERT INTO nexus.billing_approvals (
      tenant_id, patient_id, invoice_id,
      approval_type, amount, requested_by,
      status, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const result = await query(sql, [
    tenantId, patientId, invoiceId, approvalType, amount,
    requestedBy, status, notes
  ]);
  return result.rows[0];
}

export async function updateBillingApproval({ approvalId, tenantId, updates = {} }) {
  const allowedFields = ['approval_type', 'amount', 'approved_by', 'approved_at', 'status', 'notes'];
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedFields.includes(key)) continue;
    fields.push(`${key} = $${index++}`);
    values.push(value);
  }

  if (fields.length === 0) {
    const result = await query(`SELECT * FROM nexus.billing_approvals WHERE id::text = $1::text AND tenant_id::text = $2::text`, [approvalId, tenantId]);
    return result.rows[0];
  }

  fields.push(`updated_at = $${index++}`);
  values.push(new Date());

  const sql = `
    UPDATE nexus.billing_approvals
    SET ${fields.join(', ')}
    WHERE id::text = $${index++}::text AND tenant_id::text = $${index++}::text
    RETURNING *
  `;

  values.push(approvalId, tenantId);
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getCorporateClients(tenantId) {
  const sql = `SELECT * FROM nexus.corporate_clients WHERE tenant_id::text = $1::text ORDER BY client_name`;
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createCorporateClient({ tenantId, clientName, clientCode, contactPerson, phone, email, address, billingAddress, creditLimit, paymentTerms, isActive = true }) {
  const sql = `
    INSERT INTO nexus.corporate_clients (
      tenant_id, client_name, client_code,
      contact_person, phone, email, address,
      billing_address, credit_limit, payment_terms, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  const result = await query(sql, [
    tenantId, clientName, clientCode, contactPerson, phone, email,
    address, billingAddress, creditLimit, paymentTerms, isActive
  ]);
  return result.rows[0];
}

export async function getCorporateBills(tenantId, filters = {}) {
  const { clientId, status } = filters;
  let sql = `
    SELECT cb.*, cc.client_name
    FROM nexus.corporate_bills cb
    LEFT JOIN nexus.corporate_clients cc ON cb.client_id = cc.id
    WHERE cb.tenant_id::text = $1::text
  `;

  const params = [tenantId];
  let paramIndex = 2;

  if (clientId) {
    sql += ` AND cb.client_id::text = $${paramIndex++}::text`;
    params.push(clientId);
  }

  if (status) {
    sql += ` AND cb.status = $${paramIndex++}`;
    params.push(status);
  }

  sql += ` ORDER BY cb.issued_at DESC`;
  const result = await query(sql, params);
  return result.rows;
}

export async function getCorporateBillById(billId, tenantId) {
  const sql = `
    SELECT cb.*, cc.client_name
    FROM nexus.corporate_bills cb
    LEFT JOIN nexus.corporate_clients cc ON cb.client_id = cc.id
    WHERE cb.id::text = $1::text AND cb.tenant_id::text = $2::text
  `;
  const result = await query(sql, [billId, tenantId]);
  return result.rows[0];
}

export async function createCorporateBill({ tenantId, clientId, billNumber = null, totalAmount, dueDate, status = 'unpaid' }) {
  if (!billNumber) {
    billNumber = `CB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
  }

  const sql = `
    INSERT INTO nexus.corporate_bills (
      tenant_id, client_id, bill_number,
      total_amount, paid_amount, status, due_date
    ) VALUES ($1, $2, $3, $4, 0, $5, $6)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, clientId, billNumber, totalAmount, status, dueDate]);
  return result.rows[0];
}

export async function updateCorporateBill({ billId, tenantId, updates = {} }) {
  const allowedFields = ['bill_number', 'total_amount', 'paid_amount', 'status', 'due_date'];
  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedFields.includes(key)) continue;
    fields.push(`${key} = $${index++}`);
    values.push(value);
  }

  if (fields.length === 0) {
    return getCorporateBillById(billId, tenantId);
  }

  fields.push(`updated_at = $${index++}`);
  values.push(new Date());

  const sql = `
    UPDATE nexus.corporate_bills
    SET ${fields.join(', ')}
    WHERE id::text = $${index++}::text AND tenant_id::text = $${index++}::text
    RETURNING *
  `;

  values.push(billId, tenantId);
  const result = await query(sql, values);
  return result.rows[0];
}

export async function getCorporateBillItems(billId, tenantId) {
  const sql = `
    SELECT cbi.*, p.first_name || ' ' || p.last_name AS patient_name
    FROM nexus.corporate_bill_items cbi
    LEFT JOIN nexus.patients p ON cbi.patient_id = p.id
    WHERE cbi.bill_id::text = $1::text AND cbi.tenant_id::text = $2::text
    ORDER BY cbi.created_at DESC
  `;
  const result = await query(sql, [billId, tenantId]);
  return result.rows;
}

export async function createCorporateBillItem({ tenantId, billId, patientId, serviceDescription, amount }) {
  const sql = `
    INSERT INTO nexus.corporate_bill_items (
      tenant_id, bill_id, patient_id, service_description, amount
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const result = await query(sql, [tenantId, billId, patientId, serviceDescription, amount]);
  return result.rows[0];
}
