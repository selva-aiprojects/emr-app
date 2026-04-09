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
    FROM invoices i
    LEFT JOIN patients p ON i.patient_id = p.id
    LEFT JOIN encounters e ON i.encounter_id = e.id
    LEFT JOIN emr.users u ON e.provider_id = u.id
    WHERE i.tenant_id = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND i.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (patientId) {
    sql += ` AND i.patient_id = $${paramIndex++}`;
    params.push(patientId);
  }
  
  if (doctorId) {
    sql += ` AND i.doctor_id = $${paramIndex++}`;
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
  // Generate invoice number correctly from emr schema
  const invoiceNumberSql = `SELECT emr.get_next_invoice_number($1) as invoice_number`;
  const invoiceNumberResult = await query(invoiceNumberSql, [tenantId]);
  const invoiceNumber = invoiceNumberResult.rows[0].invoice_number;
  
  const sql = `
    INSERT INTO invoices (
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
       await query(`INSERT INTO invoice_items (tenant_id, invoice_id, description, quantity, unit_price, total) VALUES ($1, $2, $3, $4, $5, $6)`,
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
    UPDATE invoices
    SET ${setClause}
    WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}
    RETURNING *
  `;
  
  const result = await query(sql, [...values, invoiceId, tenantId]);
  return result.rows[0];
}

export async function payInvoice({ tenantId, invoiceId, paymentMethod, paymentAmount, transactionId, notes, paidBy }) {
  const sql = `
    UPDATE invoices 
    SET status = 'paid', payment_method = $1, paid = $2, transaction_id = $3, payment_date = NOW(), payment_notes = $4, paid_by = $5, updated_at = NOW()
    WHERE id = $6 AND tenant_id = $7
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
    FROM invoices i
    LEFT JOIN patients p ON i.patient_id = p.id
    LEFT JOIN emr.users u ON i.doctor_id = u.id
    WHERE i.id = $1 AND i.tenant_id = $2
  `;
  
  const result = await query(sql, [invoiceId, tenantId]);
  return result.rows[0];
}
