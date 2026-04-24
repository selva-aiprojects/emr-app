/**
 * Pharmacy & Prescription Management Service
 * Handles medication ordering, dispensing, inventory, and clinical safety
 */

import { query } from './connection.js';

// =====================================================
// ENHANCED PHARMACY (INVENTORY & SAFETY)
// =====================================================

export async function searchDrugs(queryText) {
  const sql = `
    SELECT * FROM drug_master 
    WHERE brand_name ILIKE $1 OR generic_name ILIKE $1 
    LIMIT 20
  `;
  const result = await query(sql, [`%${queryText}%`]);
  return result.rows;
}

export async function getPharmacyAlerts(tenantId) {
  const sql = `
    SELECT id, alert_type, message, severity, is_read, created_at, updated_at
    FROM demo_emr.pharmacy_alerts 
    WHERE tenant_id = $1 
    ORDER BY created_at DESC 
    LIMIT 50
  `;
  const result = await query(sql, [tenantId]);
  return result.rows;
}

export async function createEnhancedPrescription(tenantId, data) {
  await query('BEGIN');
  try {
    // 1. Create the prescription header
    const headerSql = `
      INSERT INTO emr.prescriptions_enhanced (
        tenant_id, encounter_id, patient_id, provider_id, 
        priority, status, notes, ward_id, bed_id
      ) VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7, $8)
      RETURNING *
    `;
    const headerRes = await query(headerSql, [
      tenantId, data.encounterId, data.patientId, data.providerId || null,
      data.priority || 'routine', data.notes || '', data.wardId || null, data.bedId || null
    ]);
    const prescription = headerRes.rows[0];

    // 2. Add items
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const itemSql = `
          INSERT INTO emr.prescription_items_enhanced (
            prescription_id, drug_id, drug_name, dosage, 
            frequency, duration_days, total_quantity, instructions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await query(itemSql, [
          prescription.id, item.drugId || 'drug-test-001', item.drugName, item.dose || '500mg',
          item.frequency || '1-0-1', parseInt(item.durationDays) || 5, 
          parseInt(item.totalQuantity) || 10, item.instructions || ''
        ]);
      }
    }

    await query('COMMIT');
    return prescription;
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}


export async function getPharmacyInventory(tenantId, filters = {}) {
  let sql = `
    SELECT 
      pie.*,
      dm.generic_name,
      dm.brand_names,
      dm.dosage_form,
      dm.strength,
      dm.reorder_threshold,
      CASE 
        WHEN pie.expiry_date <= CURRENT_DATE THEN 'EXPIRED'
        WHEN pie.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'ACTIVE'
      END as expiry_status
    FROM pharmacy_inventory_enhanced pie
    JOIN drug_master dm ON pie.drug_id::text = dm.id::text
    WHERE pie.tenant_id::text = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (filters.status) {
    sql += ` AND pie.status = $${paramIndex++}`;
    params.push(filters.status);
  }
  
  if (filters.drugId) {
    sql += ` AND pie.drug_id = $${paramIndex++}`;
    params.push(filters.drugId);
  }
  
  if (filters.expiringWithin) {
    sql += ` AND pie.expiry_date <= CURRENT_DATE + ($${paramIndex} * INTERVAL '1 day')`;
    params.push(filters.expiringWithin);
    paramIndex++;
  }
  
  sql += ` ORDER BY dm.generic_name, pie.batch_number`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function getEnhancedPrescriptions(tenantId, filters = {}) {
  let sql = `
    SELECT 
      pe.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.mrn as patient_mrn,
      u.name as doctor_name,
      (SELECT COUNT(*) FROM prescription_items_enhanced WHERE prescription_id::text = pe.id::text) as item_count,
      CASE 
        WHEN (pe.prescription_date + (COALESCE(pe.validity_days, 30) * INTERVAL '1 day')) < CURRENT_DATE THEN 'EXPIRED'
        ELSE pe.status
      END as calculated_status
    FROM prescriptions_enhanced pe
    JOIN patients p ON pe.patient_id::text = p.id::text
    LEFT JOIN users u ON pe.provider_id::text = u.id::text
    WHERE pe.tenant_id::text = $1
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (filters.status) {
    sql += ` AND pe.status = $${paramIndex++}`;
    params.push(filters.status);
  }
  
  if (filters.patientId) {
    sql += ` AND pe.patient_id = $${paramIndex++}`;
    params.push(filters.patientId);
  }
  
  sql += ` ORDER BY pe.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function dispenseEnhancedMedication(tenantId, { prescriptionId, items, dispensedBy }) {
  await query('BEGIN');
  try {
    for (const item of items) {
      // 1. Update inventory
      const updateInventorySql = `
        UPDATE emr.pharmacy_inventory_enhanced 
        SET quantity_remaining = quantity_remaining - $1,
            updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3 AND quantity_remaining >= $1
      `;
      const invRes = await query(updateInventorySql, [item.quantity, item.inventoryId, tenantId]);
      
      if (invRes.rowCount === 0) {
        throw new Error(`Insufficient stock for item ID ${item.inventoryId}`);
      }
      
      // 2. Record dispensing
      const dispenseSql = `
        INSERT INTO emr.medication_dispensing (
          tenant_id, prescription_id, drug_id, batch_id, 
          quantity_dispensed, dispensed_by, dispensed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;
      await query(dispenseSql, [
        tenantId, prescriptionId, item.drugId, item.inventoryId, 
        item.quantity, dispensedBy
      ]);
      
      // 3. Update prescription item status
      const updateItemSql = `
        UPDATE emr.prescription_items_enhanced 
        SET status = 'DISPENSED', dispensed_quantity = $1
        WHERE prescription_id = $2 AND drug_id = $3
      `;
      await query(updateItemSql, [item.quantity, prescriptionId, item.drugId]);
    }
    
    // 4. Update prescription status if all items handled
    await query(`
      UPDATE emr.prescriptions_enhanced 
      SET status = 'COMPLETED', updated_at = NOW()
      WHERE id = $1 AND NOT EXISTS (
        SELECT 1 FROM emr.prescription_items_enhanced 
        WHERE prescription_id = $1 AND status != 'DISPENSED'
      )
    `, [prescriptionId]);
    
    await query('COMMIT');
    return { success: true };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

export async function addDrugBatch(tenantId, data) {
  const sql = `
    INSERT INTO emr.pharmacy_inventory_enhanced (
      tenant_id, drug_id, batch_number, expiry_date, 
      quantity_received, quantity_remaining, unit_cost, 
      unit_price, location, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE', NOW())
    RETURNING *
  `;
  const result = await query(sql, [
    tenantId, data.drugId, data.batchNumber, data.expiryDate,
    data.quantity, data.quantity, data.unitCost, data.unitPrice, data.location
  ]);
  return result.rows[0];
}

export async function getPharmacyDashboard(tenantId) {
  try {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM inventory_items WHERE tenant_id::text = $1) as total_inventory_items,
        (SELECT COUNT(*) FROM inventory_items WHERE tenant_id::text = $1 AND current_stock <= reorder_level) as critical_stock_items,
        (SELECT COUNT(*) FROM pharmacy_inventory_enhanced WHERE tenant_id::text = $1 AND status = 'ACTIVE') as total_active_batches,
        (SELECT COUNT(*) FROM pharmacy_inventory_enhanced WHERE tenant_id::text = $1 AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND status = 'ACTIVE') as expiring_items,
        (SELECT COUNT(*) FROM pharmacy_inventory_enhanced WHERE tenant_id::text = $1 AND expiry_date < CURRENT_DATE AND status = 'ACTIVE') as expired_items,
        (SELECT COUNT(*) FROM prescriptions_enhanced WHERE tenant_id::text = $1 AND status = 'PENDING') as active_prescriptions,
        (SELECT COALESCE(SUM(quantity_remaining * unit_price), 0) FROM pharmacy_inventory_enhanced WHERE tenant_id::text = $1 AND status = 'ACTIVE') as today_revenue
    `;
    const result = await query(sql, [tenantId]);
    
    // SERVER-SIDE TRACE for Pharmacy Discrepancy
    console.log(`[DASHBOARD_SYNC] Tenant: ${tenantId} | Items: ${result.rows[0].total_inventory_items} | Batches: ${result.rows[0].total_active_batches}`);
    
    return {
      total_inventory_items: parseInt(result.rows[0].total_inventory_items) || 0,
      critical_stock_items: parseInt(result.rows[0].critical_stock_items) || 0,
      total_active_batches: parseInt(result.rows[0].total_active_batches) || 0,
      expiring_items: parseInt(result.rows[0].expiring_items) || 0,
      expired_items: parseInt(result.rows[0].expired_items) || 0,
      active_prescriptions: parseInt(result.rows[0].active_prescriptions) || 0,
      today_revenue: parseFloat(result.rows[0].today_revenue) || 0
    };
  } catch (error) {
    console.error('[PHARMACY_DASHBOARD_ERROR]', error.message);
    return {
      total_inventory_items: 0,
      critical_stock_items: 0,
      total_active_batches: 0,
      expiring_items: 0,
      expired_items: 0,
      active_prescriptions: 0,
      today_revenue: 0
    };
  }
}

export async function getExpiringInventory(tenantId, days = 90) {
  const sql = `
    SELECT 
      pie.*,
      dm.generic_name,
      dm.brand_names,
      CASE 
        WHEN pie.expiry_date <= CURRENT_DATE THEN 'EXPIRED'
        WHEN pie.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'CRITICAL'
        WHEN pie.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'WARNING'
        ELSE 'NORMAL'
      END as expiry_status,
      (pie.expiry_date::date - CURRENT_DATE)::integer as days_to_expiry
    FROM emr.pharmacy_inventory_enhanced pie
    JOIN emr.drug_master dm ON pie.drug_id = dm.id
    WHERE pie.tenant_id = $1 AND pie.status = 'ACTIVE' 
      AND pie.expiry_date <= CURRENT_DATE + ($2 || ' days')::interval
    ORDER BY pie.expiry_date ASC
  `;
  
  const result = await query(sql, [tenantId, days]);
  return result.rows;
}
