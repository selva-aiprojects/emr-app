// Enhanced Pharmacy Repository Functions - Healthcare Standards Compliant
// Pharmacy Act Compliance, Drug Control, Stock Management, Clinical Safety

export async function getEnhancedPharmacyInventory(tenantId, filters = {}) {
  let sql = `
    SELECT 
      pie.*,
      dm.brand_name,
      dm.generic_name,
      dm.therapeutic_category,
      dm.schedule_category as drug_schedule,
      dm.is_narcotic as drug_is_narcotic,
      dm.is_psychotropic as drug_is_psychotropic,
      dm.is_antibiotic as drug_is_antibiotic,
      dm.requires_prescription as drug_requires_prescription,
      dm.contraindications,
      dm.side_effects,
      dm.drug_interactions,
      dm.dosage_form,
      dm.strength,
      CASE 
        WHEN pie.current_stock <= pie.minimum_stock_level THEN 'CRITICAL'
        WHEN pie.current_stock <= pie.reorder_level THEN 'LOW'
        WHEN pie.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'NORMAL'
      END as stock_status
    FROM emr.pharmacy_inventory_enhanced pie
    JOIN emr.drug_master dm ON pie.drug_id = dm.id
    WHERE pie.tenant_id = $1 AND pie.status = 'ACTIVE'
  `;
  
  const params = [tenantId];
  let paramIndex = 2;
  
  if (filters.drugId) {
    sql += ` AND pie.drug_id = $${paramIndex++}`;
    params.push(filters.drugId);
  }
  
  if (filters.genericName) {
    sql += ` AND dm.generic_name ILIKE $${paramIndex++}`;
    params.push(`%${filters.genericName}%`);
  }
  
  if (filters.brandName) {
    sql += ` AND dm.brand_name ILIKE $${paramIndex++}`;
    params.push(`%${filters.brandName}%`);
  }
  
  if (filters.stockStatus) {
    if (filters.stockStatus === 'CRITICAL') {
      sql += ` AND pie.current_stock <= pie.minimum_stock_level`;
    } else if (filters.stockStatus === 'LOW') {
      sql += ` AND pie.current_stock <= pie.reorder_level AND pie.current_stock > pie.minimum_stock_level`;
    } else if (filters.stockStatus === 'EXPIRING_SOON') {
      sql += ` AND pie.expiry_date <= CURRENT_DATE + INTERVAL '30 days'`;
    }
  }
  
    sql += ` AND pie.expiry_date <= CURRENT_DATE + ($${paramIndex} || ' days')::interval`;
    params.push(filters.expiringWithin);
  
  sql += ` ORDER BY dm.generic_name, pie.batch_number`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function createEnhancedPharmacyInventory({
  tenantId, drugId, batchNumber, manufacturer, supplierName, supplierLicense,
  expiryDate, manufacturingDate, mrp, purchaseRate, saleRate, gstPercentage,
  hsnCode, packSize, unitsPerPack, currentStock, minimumStockLevel,
  maximumStockLevel, reorderLevel, storageLocation, storageConditions,
  scheduleCategory, isNarcotic, isPsychotropic, isAntibiotic,
  requiresPrescription, barcode, qrCode, verifiedBy
}) {
  const sql = `
    INSERT INTO emr.pharmacy_inventory_enhanced (
      tenant_id, drug_id, batch_number, manufacturer, supplier_name, supplier_license,
      expiry_date, manufacturing_date, mrp, purchase_rate, sale_rate, gst_percentage,
      hsn_code, pack_size, units_per_pack, current_stock, minimum_stock_level,
      maximum_stock_level, reorder_level, storage_location, storage_conditions,
      schedule_category, is_narcotic, is_psychotropic, is_antibiotic,
      requires_prescription, barcode, qr_code, last_verified_date, verified_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, CURRENT_DATE, $30)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, drugId, batchNumber, manufacturer, supplierName, supplierLicense,
    expiryDate, manufacturingDate, mrp, purchaseRate, saleRate, gstPercentage,
    hsnCode, packSize, unitsPerPack, currentStock, minimumStockLevel,
    maximumStockLevel, reorderLevel, storageLocation, storageConditions,
    scheduleCategory, isNarcotic, isPsychotropic, isAntibiotic,
    requiresPrescription, barcode, qrCode, verifiedBy
  ]);
  
  return result.rows[0];
}

export async function createEnhancedPrescription({
  tenantId, patientId, encounterId, doctorId, doctorRegistration,
  prescriptionDate, validityDays, patientWeightKg, patientAgeYears,
  patientGender, knownAllergies, chronicConditions, currentMedications,
  diagnosisIcd10Codes, specialInstructions, doctorDigitalSignature, createdBy
}) {
  // Generate prescription number
  const prescriptionNumber = `RX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
  
  const sql = `
    INSERT INTO emr.prescriptions_enhanced (
      tenant_id, prescription_number, patient_id, encounter_id, doctor_id,
      doctor_registration, prescription_date, validity_days, patient_weight_kg,
      patient_age_years, patient_gender, known_allergies, chronic_conditions,
      current_medications, diagnosis_icd10_codes, special_instructions,
      doctor_digital_signature, status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'ACTIVE', $18)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, prescriptionNumber, patientId, encounterId, doctorId,
    doctorRegistration, prescriptionDate, validityDays, patientWeightKg,
    patientAgeYears, patientGender, knownAllergies, chronicConditions,
    currentMedications, diagnosisIcd10Codes, specialInstructions,
    doctorDigitalSignature, createdBy
  ]);
  
  return result.rows[0];
}

export async function addPrescriptionMedicine({
  prescriptionId, drugId, brandName, genericName, dosageForm, strength,
  routeOfAdministration, dosageInstructions, frequency, durationDays,
  totalQuantity, quantityUnit, indication, specialInstructions,
  isPrn, maxDailyDose, warnings, contraindications
}) {
  const sql = `
    INSERT INTO emr.prescription_medicines (
      prescription_id, drug_id, brand_name, generic_name, dosage_form, strength,
      route_of_administration, dosage_instructions, frequency, duration_days,
      total_quantity, quantity_unit, indication, special_instructions,
      is_prn, max_daily_dose, warnings, contraindications, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'PENDING')
    RETURNING *
  `;
  
  const result = await query(sql, [
    prescriptionId, drugId, brandName, genericName, dosageForm, strength,
    routeOfAdministration, dosageInstructions, frequency, durationDays,
    totalQuantity, quantityUnit, indication, specialInstructions,
    isPrn, maxDailyDose, warnings, contraindications
  ]);
  
  return result.rows[0];
}

export async function getEnhancedPrescriptions(tenantId, filters = {}) {
  let sql = `
    SELECT 
      pe.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.mrn as patient_mrn,
      u.name as doctor_name,
      u.registration_number as doctor_registration,
      ARRAY(
        SELECT json_build_object(
          'id', pm.id,
          'drug_id', pm.drug_id,
          'brand_name', pm.brand_name,
          'generic_name', pm.generic_name,
          'dosage_form', pm.dosage_form,
          'strength', pm.strength,
          'dosage_instructions', pm.dosage_instructions,
          'frequency', pm.frequency,
          'duration_days', pm.duration_days,
          'total_quantity', pm.total_quantity,
          'quantity_unit', pm.quantity_unit,
          'indication', pm.indication,
          'status', pm.status,
          'dispensed_quantity', pm.dispensed_quantity
        )
        FROM emr.prescription_medicines pm
        WHERE pm.prescription_id = pe.id
      ) as medicines,
      CASE 
        WHEN pe.prescription_date + INTERVAL '1 day' * pe.validity_days < CURRENT_DATE THEN 'EXPIRED'
        WHEN pe.status = 'COMPLETED' THEN 'COMPLETED'
        WHEN pe.status = 'CANCELLED' THEN 'CANCELLED'
        ELSE 'ACTIVE'
      END as current_status
    FROM emr.prescriptions_enhanced pe
    JOIN emr.patients p ON pe.patient_id = p.id
    JOIN emr.users u ON pe.doctor_id = u.id
    WHERE pe.tenant_id = $1
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
  
  if (filters.doctorId) {
    sql += ` AND pe.doctor_id = $${paramIndex++}`;
    params.push(filters.doctorId);
  }
  
  if (filters.prescriptionNumber) {
    sql += ` AND pe.prescription_number ILIKE $${paramIndex++}`;
    params.push(`%${filters.prescriptionNumber}%`);
  }
  
  sql += ` ORDER BY pe.created_at DESC`;
  
  const result = await query(sql, params);
  return result.rows;
}

export async function checkDrugInteractions(tenantId, drugIds) {
  const sql = `
    SELECT DISTINCT
      di.*,
      dm1.generic_name as drug_1_name,
      dm2.generic_name as drug_2_name,
      dm1.brand_name as drug_1_brand,
      dm2.brand_name as drug_2_brand
    FROM emr.drug_interactions di
    JOIN emr.drug_master dm1 ON di.drug_1_id = dm1.id
    JOIN emr.drug_master dm2 ON di.drug_2_id = dm2.id
    WHERE (di.drug_1_id = ANY($1) AND di.drug_2_id = ANY($1))
       OR (di.drug_1_id = ANY($1) AND di.drug_2_id = ANY($1))
    ORDER BY di.interaction_severity DESC
  `;
  
  const result = await query(sql, [drugIds]);
  return result.rows;
}

export async function createPharmacyDispensing({
  tenantId, prescriptionId, patientId, dispenserId, pharmacistId,
  totalItems, totalAmount, paymentMode, insuranceClaimId,
  doctorConsultationFee, serviceCharge, gstAmount, discountAmount,
  netAmount, roundedAmount, emergencyDispensing, emergencyReason
}) {
  // Generate dispensing number
  const dispensingNumber = `DSP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
  
  const sql = `
    INSERT INTO emr.pharmacy_dispensing_log (
      tenant_id, dispensing_number, prescription_id, patient_id, dispenser_id,
      pharmacist_id, total_items, total_amount, payment_mode, insurance_claim_id,
      doctor_consultation_fee, service_charge, gst_amount, discount_amount,
      net_amount, rounded_amount, emergency_dispensing, emergency_reason, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'COMPLETED')
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, dispensingNumber, prescriptionId, patientId, dispenserId,
    pharmacistId, totalItems, totalAmount, paymentMode, insuranceClaimId,
    doctorConsultationFee, serviceCharge, gstAmount, discountAmount,
    netAmount, roundedAmount, emergencyDispensing, emergencyReason
  ]);
  
  return result.rows[0];
}

export async function addDispensingItem({
  dispensingLogId, prescriptionMedicineId, drugId, batchNumber, expiryDate,
  quantityDispensed, quantityUnit, mrp, saleRate, discountPercentage,
  gstPercentage, totalAmount, storageLocation, remarks
}) {
  const sql = `
    INSERT INTO emr.pharmacy_dispensing_items (
      dispensing_log_id, prescription_medicine_id, drug_id, batch_number, expiry_date,
      quantity_dispensed, quantity_unit, mrp, sale_rate, discount_percentage,
      gst_percentage, total_amount, storage_location, remarks
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `;
  
  const result = await query(sql, [
    dispensingLogId, prescriptionMedicineId, drugId, batchNumber, expiryDate,
    quantityDispensed, quantityUnit, mrp, saleRate, discountPercentage,
    gstPercentage, totalAmount, storageLocation, remarks
  ]);
  
  // Update inventory stock
  await updateInventoryStock(dispensingLogId, drugId, batchNumber, quantityDispensed, 'SALE');
  
  // Update prescription medicine status
  await updatePrescriptionMedicineStatus(prescriptionMedicineId, quantityDispensed);
  
  return result.rows[0];
}

export async function updateInventoryStock(dispensingLogId, drugId, batchNumber, quantity, movementType) {
  // Get current inventory
  const inventoryResult = await query(`
    SELECT id, current_stock FROM emr.pharmacy_inventory_enhanced
    WHERE drug_id = $1 AND batch_number = $2 AND status = 'ACTIVE'
    FOR UPDATE
  `, [drugId, batchNumber]);
  
  if (inventoryResult.rows.length === 0) {
    throw new Error('Inventory not found for the specified drug and batch');
  }
  
  const inventory = inventoryResult.rows[0];
  const quantityBefore = inventory.current_stock;
  const quantityChange = movementType === 'SALE' ? -quantity : quantity;
  const quantityAfter = quantityBefore + quantityChange;
  
  if (quantityAfter < 0) {
    throw new Error('Insufficient stock');
  }
  
  // Update inventory
  await query(`
    UPDATE emr.pharmacy_inventory_enhanced
    SET current_stock = $1, updated_at = NOW()
    WHERE id = $2
  `, [quantityAfter, inventory.id]);
  
  // Log stock movement
  await query(`
    INSERT INTO emr.pharmacy_stock_movements (
      inventory_id, movement_type, movement_date, quantity_before,
      quantity_change, quantity_after, reference_number, reference_type,
      reason, performed_by
    )
    VALUES ($1, $2, NOW(), $3, $4, $5, $6, 'DISPENSING', 'Pharmacy Sale', $7)
  `, [inventory.id, movementType, quantityBefore, quantityChange, quantityAfter, dispensingLogId, null]);
  
  return { quantityBefore, quantityChange, quantityAfter };
}

export async function updatePrescriptionMedicineStatus(prescriptionMedicineId, dispensedQuantity) {
  const sql = `
    UPDATE emr.prescription_medicines
    SET 
      dispensed_quantity = COALESCE(dispensed_quantity, 0) + $1,
      status = CASE 
        WHEN COALESCE(dispensed_quantity, 0) + $1 >= total_quantity THEN 'DISPENSED'
        WHEN COALESCE(dispensed_quantity, 0) + $1 > 0 THEN 'PARTIALLY_DISPENSED'
        ELSE 'PENDING'
      END,
      dispensed_date = CASE 
        WHEN COALESCE(dispensed_quantity, 0) = 0 THEN NOW()
        ELSE dispensed_date
      END,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  
  const result = await query(sql, [prescriptionMedicineId, dispensedQuantity]);
  return result.rows[0];
}

export async function getPharmacyDashboard(tenantId) {
  const sql = `
    SELECT 
      -- Inventory Statistics
      (SELECT COUNT(*) FROM emr.pharmacy_inventory_enhanced WHERE tenant_id = $1 AND status = 'ACTIVE') as total_inventory_items,
      (SELECT COUNT(*) FROM emr.pharmacy_inventory_enhanced WHERE tenant_id = $1 AND current_stock <= minimum_stock_level AND status = 'ACTIVE') as critical_stock_items,
      (SELECT COUNT(*) FROM emr.pharmacy_inventory_enhanced WHERE tenant_id = $1 AND current_stock <= reorder_level AND current_stock > minimum_stock_level AND status = 'ACTIVE') as low_stock_items,
      (SELECT COUNT(*) FROM emr.pharmacy_inventory_enhanced WHERE tenant_id = $1 AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND status = 'ACTIVE') as expiring_items,
      (SELECT COUNT(*) FROM emr.pharmacy_inventory_enhanced WHERE tenant_id = $1 AND expiry_date <= CURRENT_DATE AND status = 'ACTIVE') as expired_items,
      
      -- Prescription Statistics
      (SELECT COUNT(*) FROM emr.prescriptions_enhanced WHERE tenant_id = $1 AND status = 'ACTIVE') as active_prescriptions,
      (SELECT COUNT(*) FROM emr.prescriptions_enhanced WHERE tenant_id = $1 AND status = 'COMPLETED') as completed_prescriptions,
      (SELECT COUNT(*) FROM emr.prescriptions_enhanced WHERE tenant_id = $1 AND prescription_date + INTERVAL '1 day' * validity_days < CURRENT_DATE) as expired_prescriptions,
      
      -- Dispensing Statistics
      (SELECT COUNT(*) FROM emr.pharmacy_dispensing_log WHERE tenant_id = $1 AND DATE(dispensing_date) = CURRENT_DATE) as today_dispensing,
      (SELECT COALESCE(SUM(net_amount), 0) FROM emr.pharmacy_dispensing_log WHERE tenant_id = $1 AND DATE(dispensing_date) = CURRENT_DATE) as today_revenue,
      (SELECT COUNT(*) FROM emr.pharmacy_dispensing_log WHERE tenant_id = $1 AND emergency_dispensing = true) as emergency_dispensing,
      
      -- Financial Summary
      (SELECT COALESCE(SUM(net_amount), 0) FROM emr.pharmacy_dispensing_log WHERE tenant_id = $1 AND DATE_TRUNC('month', dispensing_date) = DATE_TRUNC('month', CURRENT_DATE)) as monthly_revenue,
      (SELECT COALESCE(SUM(total_amount), 0) FROM emr.pharmacy_dispensing_log WHERE tenant_id = $1 AND DATE_TRUNC('month', dispensing_date) = DATE_TRUNC('month', CURRENT_DATE)) as monthly_gross_revenue,
      
      -- Drug Categories
      (SELECT COUNT(DISTINCT dm.therapeutic_category) FROM emr.pharmacy_inventory_enhanced pie JOIN emr.drug_master dm ON pie.drug_id = dm.id WHERE pie.tenant_id = $1 AND pie.status = 'ACTIVE') as therapeutic_categories,
      (SELECT COUNT(*) FROM emr.pharmacy_inventory_enhanced pie JOIN emr.drug_master dm ON pie.drug_id = dm.id WHERE pie.tenant_id = $1 AND dm.is_narcotic = true AND pie.status = 'ACTIVE') as narcotic_drugs,
      (SELECT COUNT(*) FROM emr.pharmacy_inventory_enhanced pie JOIN emr.drug_master dm ON pie.drug_id = dm.id WHERE pie.tenant_id = $1 AND dm.is_psychotropic = true AND pie.status = 'ACTIVE') as psychotropic_drugs
  `;
  
  const result = await query(sql, [tenantId]);
  return result.rows[0];
}

export async function getExpiringDrugs(tenantId, days = 30) {
  const sql = `
    SELECT 
      pie.*,
      dm.brand_name,
      dm.generic_name,
      dm.therapeutic_category,
      dm.schedule_category,
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

export async function createPharmacyAuditLog({
  tenantId, entityType, entityId, actionType, oldValues, newValues,
  userId, userName, ipAddress, userAgent, regulatoryFlag, remarks
}) {
  const sql = `
    INSERT INTO emr.pharmacy_audit_log (
      tenant_id, entity_type, entity_id, action_type, old_values,
      new_values, user_id, user_name, ip_address, user_agent, regulatory_flag, remarks
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;
  
  const result = await query(sql, [
    tenantId, entityType, entityId, actionType, oldValues,
    newValues, userId, userName, ipAddress, userAgent, regulatoryFlag, remarks
  ]);
  
  return result.rows[0];
}
