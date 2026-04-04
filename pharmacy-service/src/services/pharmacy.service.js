/**
 * Pharmacy Service- MedFlow EMR
 * 
 * Comprehensive medication management with clinical safety checking
 * Supports: e-Prescribing, Dispensing, Inventory, Safety Validation
 */

import { pool } from '../db/index.js';

// =====================================================
// PRESCRIPTION SAFETY CHECKING
// =====================================================

export class PharmacySafetyService {

  /**
   * Comprehensive medication safety check
   * @param {Object} params - Patient and prescription data
   * @returns {Object} Safety assessment with alerts
   */
  async performSafetyCheck({ patientId, prescriptionItems, tenantId }) {
    const alerts = [];
    let isSafe = true;

    // 1. Check drug-drug interactions
    const interactionAlerts = await this.checkDrugInteractions(prescriptionItems);
    alerts.push(...interactionAlerts);

    // 2. Check patient allergies
    const allergyAlerts = await this.checkPatientAllergies(patientId, prescriptionItems);
    alerts.push(...allergyAlerts);

    // 3. Check duplicate therapy
    const duplicateAlerts = await this.checkDuplicateTherapy(patientId, prescriptionItems);
    alerts.push(...duplicateAlerts);

    // 4. Check high-alert medications
    const highAlertWarnings = await this.checkHighAlertMeds(prescriptionItems);
    alerts.push(...highAlertWarnings);

    // Determine if safe to proceed
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'MAJOR');
    isSafe = criticalAlerts.length === 0;

    return {
      isSafe,
      requiresOverride: alerts.some(a => a.requiresOverride),
      totalAlerts: alerts.length,
      alerts: alerts.map(alert => ({
        ...alert,
        timestamp: new Date().toISOString()
      }))
    };
  }

  /**
   * Check for drug-drug interactions
   */
  async checkDrugInteractions(prescriptionItems) {
    const client = await pool.connect();

    try {
      const alerts = [];
      const drugIds = prescriptionItems.map(item => item.drugId).filter(id => id);

      if (drugIds.length < 2) return alerts;

      // Query for interactions between any pair of drugs
      const sql = `
        SELECT 
         di.interaction_id,
         di.drug_a,
         di.drug_b,
         di.severity,
         di.description,
         di.mechanism,
         di.management,
          dm1.generic_name as drug_a_name,
          dm2.generic_name as drug_b_name
        FROM emr.drug_interactions di
        JOIN emr.drug_master dm1 ON di.drug_a = dm1.drug_id
        JOIN emr.drug_master dm2 ON di.drug_b = dm2.drug_id
        WHERE (di.drug_a = ANY($1) AND di.drug_b = ANY($1))
           OR (di.drug_b = ANY($1) AND di.drug_a = ANY($1))
      `;

      const result = await client.query(sql, [drugIds]);

      for (const interaction of result.rows) {
        alerts.push({
          type: 'DRUG_INTERACTION',
          severity: this.mapInteractionSeverity(interaction.severity),
          requiresOverride: ['contraindicated', 'major'].includes(interaction.severity),
          drugs: [interaction.drug_a_name, interaction.drug_b_name],
          description: interaction.description,
          mechanism: interaction.mechanism,
          management: interaction.management,
          interactionId: interaction.interaction_id
        });
      }

      return alerts;
    } finally {
      client.release();
    }
  }

  /**
   * Check patient drug allergies
   */
  async checkPatientAllergies(patientId, prescriptionItems) {
    const client = await pool.connect();

    try {
      const alerts = [];
      const drugIds = prescriptionItems.map(item => item.drugId).filter(id => id);

      if (drugIds.length === 0) return alerts;

      const sql = `
        SELECT 
          da.allergy_id,
          da.drug_id,
          da.reaction_severity,
          da.reaction_description,
          da.criticality,
          dm.generic_name as drug_name,
          dm.brand_names
        FROM emr.drug_allergies da
        JOIN emr.drug_master dm ON da.drug_id= dm.drug_id
        WHERE da.patient_id = $1
          AND da.drug_id = ANY($2)
          AND da.verification_status != 'refuted'
      `;

      const result = await client.query(sql, [patientId, drugIds]);

      for (const allergy of result.rows) {
        alerts.push({
          type: 'ALLERGY_ALERT',
          severity: this.mapAllergySeverity(allergy.reaction_severity),
          requiresOverride: true, // Always require override for allergies
          drug: allergy.drug_name,
          brandNames: allergy.brand_names,
          reaction: allergy.reaction_description,
          criticality: allergy.criticality,
          allergyId: allergy.allergy_id
        });
      }

      return alerts;
    } finally {
      client.release();
    }
  }

  /**
   * Check for duplicate therapy (same drug or therapeutic class)
   */
  async checkDuplicateTherapy(patientId, prescriptionItems) {
    const client = await pool.connect();

    try {
      const alerts = [];
      const drugIds = prescriptionItems.map(item => item.drugId).filter(id => id);

      if (drugIds.length === 0) return alerts;

      // Check for same active ingredient in current prescriptions
      const sql = `
        SELECT 
          p.id as prescription_id,
          pi.item_id,
          dm.drug_id,
          dm.generic_name,
          dm.therapeutic_class,
          p.status as prescription_status,
          pi.status as item_status
        FROM emr.prescriptions p
        JOIN emr.prescription_items pi ON p.id = pi.prescription_id
        JOIN emr.drug_master dm ON pi.drug_id = dm.drug_id
        WHERE p.patient_id= $1
          AND p.status IN ('active', 'pending')
          AND pi.status IN ('active', 'pending')
          AND dm.drug_id= ANY($2)
      `;

      const result = await client.query(sql, [patientId, drugIds]);

      for (const dup of result.rows) {
        alerts.push({
          type: 'DUPLICATE_THERAPY',
          severity: 'MODERATE',
          requiresOverride: false,
          drug: dup.generic_name,
          existingPrescription: dup.prescription_id,
          message: `Patient already has active prescription for ${dup.generic_name}`,
          therapeuticClass: dup.therapeutic_class
        });
      }

      // Also check within the new prescription items
      const newItemMap = new Map();
      for (const item of prescriptionItems) {
        if (newItemMap.has(item.drugId)) {
          alerts.push({
            type: 'DUPLICATE_IN_PRESCRIPTION',
            severity: 'WARNING',
            requiresOverride: false,
            drug: item.drugName || item.drugId,
            message: 'Drug appears multiple times in this prescription'
          });
        }
        newItemMap.set(item.drugId, item);
      }

      return alerts;
    } finally {
      client.release();
    }
  }

  /**
   * Flag high-alert medications requiring extra caution
   */
  async checkHighAlertMeds(prescriptionItems) {
    const client = await pool.connect();

    try {
      const warnings = [];
      const drugIds = prescriptionItems.map(item => item.drugId).filter(id => id);

      if (drugIds.length === 0) return warnings;

      const sql = `
        SELECT 
         drug_id,
          generic_name,
          brand_names,
          high_alert_flag,
          look_alike_sound_alike_flag,
          black_box_warning,
         pregnancy_category
        FROM emr.drug_master
        WHERE drug_id = ANY($1)
          AND (high_alert_flag = true 
               OR look_alike_sound_alike_flag = true 
               OR black_box_warning = true)
      `;

      const result = await client.query(sql, [drugIds]);

      for (const drug of result.rows) {
        const reasons = [];
        if (drug.high_alert_flag) reasons.push('High-alert medication');
        if (drug.look_alike_sound_alike_flag) reasons.push('LASA drug');
        if (drug.black_box_warning) reasons.push('Black box warning');

        warnings.push({
          type: 'HIGH_ALERT_MEDICATION',
          severity: 'WARNING',
          requiresOverride: false,
          drug: drug.generic_name,
          brandNames: drug.brand_names,
          reasons,
          pregnancyCategory: drug.pregnancy_category,
          message: reasons.join('. ') + '. Verify dose and indication.'
        });
      }

      return warnings;
    } finally {
      client.release();
    }
  }

  /**
   * Map interaction severity to alert levels
   */
  mapInteractionSeverity(severity) {
    const map = {
      'contraindicated': 'CRITICAL',
      'major': 'MAJOR',
      'moderate': 'MODERATE',
      'minor': 'MINOR'
    };
    return map[severity] || 'UNKNOWN';
  }

  /**
   * Map allergy severity to alert levels
   */
  mapAllergySeverity(severity) {
    const map = {
      'life-threatening': 'CRITICAL',
      'severe': 'MAJOR',
      'moderate': 'MODERATE',
      'mild': 'MINOR'
    };
    return map[severity] || 'MODERATE';
  }
}

// =====================================================
// INVENTORY MANAGEMENT SERVICE
// =====================================================

export class PharmacyInventoryService {

  /**
   * Select batches for dispensing using FEFO (First Expiry, First Out)
   * @param {string} drugId - Drug to dispense
   * @param {number} quantityNeeded- Amount to dispense
   * @returns {Array} Selected batches with quantities
   */
  async selectBatchesFEFO(drugId, quantityNeeded) {
    const client = await pool.connect();

    try {
      // Get available batches sorted by expiry date (earliest first)
      const sql = `
        SELECT 
          batch_id,
          batch_number,
         quantity_remaining,
         expiry_date,
          location,
          status
        FROM emr.drug_batches
        WHERE drug_id= $1
          AND status = 'active'
          AND quantity_remaining > 0
          AND expiry_date > CURRENT_DATE
        ORDER BY expiry_date ASC, created_at ASC
      `;

      const result = await client.query(sql, [drugId]);

      if (result.rows.length === 0) {
        throw new Error(`No available stock for drug ${drugId}`);
      }

      const selectedBatches = [];
      let remainingQty = quantityNeeded;

      for (const batch of result.rows) {
        if (remainingQty <= 0) break;

        const qtyToTake = Math.min(batch.quantity_remaining, remainingQty);
        selectedBatches.push({
          batchId: batch.batch_id,
          batchNumber: batch.batch_number,
          quantity: qtyToTake,
          expiryDate: batch.expiry_date,
          location: batch.location
        });

        remainingQty -= qtyToTake;
      }

      if (remainingQty > 0) {
        throw new Error(
          `Insufficient stock. Need ${quantityNeeded}, available ${quantityNeeded - remainingQty}. Short by ${remainingQty}`
        );
      }

      return selectedBatches;
    } finally {
      client.release();
    }
  }

  /**
   * Dispense medication from selected batches
   */
  async dispenseMedication({ prescriptionItemId, drugId, quantity, dispensedBy, tenantId }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Select batches using FEFO
      const batches = await this.selectBatchesFEFO(drugId, quantity);

      // Create inventory transactions for each batch
      for (const batch of batches) {
        // Decrement batch quantity
        const updateBatchSql = `
          UPDATE emr.drug_batches
          SET quantity_remaining = quantity_remaining- $1,
              updated_at = NOW()
          WHERE batch_id = $2
          RETURNING quantity_remaining
        `;

        await client.query(updateBatchSql, [batch.quantity, batch.batchId]);

        // Create inventory ledger entry
        const inventorySql = `
          INSERT INTO emr.pharmacy_inventory(
            tenant_id, batch_id, transaction_type,
           quantity_change, quantity_balance,
           reference_type, reference_id, performed_by, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        await client.query(inventorySql, [
          tenantId,
          batch.batchId,
          'dispense',
          -batch.quantity,
          0, // Will be updated with actual balance
          'prescription',
          prescriptionItemId,
          dispensedBy,
          `Dispensed for prescription ${prescriptionItemId}`
        ]);
      }

      // Update prescription item status
      const updatePrescriptionSql = `
        UPDATE emr.prescription_items
        SET 
          status = 'completed',
         quantity_dispensed = $1,
         dispensed_date = NOW(),
         dispensed_by = $2,
          updated_at = NOW()
        WHERE item_id = $3
        RETURNING *
      `;

      const result = await client.query(updatePrescriptionSql, [quantity, dispensedBy, prescriptionItemId]);

      await client.query('COMMIT');

      return {
        success: true,
        prescriptionItem: result.rows[0],
        batchesUsed: batches,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add a new vendor to the pharmacy system
   */
  async addVendor(data) {
    const client = await pool.connect();
    try {
      const sql = `
        INSERT INTO emr.vendors (
          tenant_id, vendor_name, contact_person, email, phone, address, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await client.query(sql, [
        data.tenantId,
        data.vendor_name || data.name,       // support both field names
        data.contact_person || data.contactPerson,
        data.email,
        data.phone,
        data.address,
        data.status || 'active'
      ]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Create a purchase order for stock replenishment
   */
  async createPurchaseOrder(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const poSql = `
        INSERT INTO emr.purchase_orders (
          tenant_id, vendor_id, order_number, status, total_amount, ordered_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const po = await client.query(poSql, [
        data.tenantId,
        data.vendorId,
        data.poNumber || data.order_number || `PO-${Date.now()}`,
        'pending',  // must be one of: pending, approved, shipped, received, cancelled, closed
        data.totalAmount || 0,
        data.createdBy || null
      ]);

      const poId = po.rows[0].order_id;

      for (const item of (data.items || [])) {
        const itemSql = `
          INSERT INTO emr.purchase_order_items (
            order_id, drug_id, quantity_ordered, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(itemSql, [
          poId, item.drugId, item.quantity, item.unitPrice || 0, (item.quantity * (item.unitPrice || 0))
        ]);
      }

      await client.query('COMMIT');
      return po.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Import stock from CSV data (JSON format from frontend)
   */
  async importStockFromCSV(tenantId, userId, stockItems) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = { imported: 0, skipped: 0, errors: [] };

      for (const item of stockItems) {
        try {
          // 1. Find or create drug in master (simplified for now)
          let drugId = item.drugId;
          if (!drugId) {
            const findSql = `SELECT drug_id FROM emr.drug_master WHERE generic_name = $1 AND (tenant_id = $2 OR tenant_id IS NULL)`;
            const findRes = await client.query(findSql, [item.genericName, tenantId]);
            if (findRes.rows.length > 0) {
              drugId = findRes.rows[0].drug_id;
            } else {
              // Create new drug if not found
              const createSql = `INSERT INTO emr.drug_master (tenant_id, generic_name, dosage_form, status) VALUES ($1, $2, $3, 'active') RETURNING drug_id`;
              const createRes = await client.query(createSql, [tenantId, item.genericName, item.dosageForm || 'tablet']);
              drugId = createRes.rows[0].drug_id;
            }
          }

          // 2. Add batch
          const batchSql = `
            INSERT INTO emr.drug_batches (
              tenant_id, drug_id, batch_number, expiry_date, 
              quantity_received, quantity_remaining, unit_cost, location
            ) VALUES ($1, $2, $3, $4, $5, $5, $6, $7)
          `;
          await client.query(batchSql, [
            tenantId, drugId, item.batchNumber, item.expiryDate,
            item.quantity, item.unitCost || 0, item.location || 'Central Pharmacy'
          ]);

          results.imported++;
        } catch (e) {
          results.skipped++;
          results.errors.push({ item: item.genericName, error: e.message });
        }
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(tenantId) {
    const client = await pool.connect();

    try {
      const sql = `
        SELECT 
          dm.drug_id,
          dm.generic_name,
          dm.brand_names,
          db.batch_id,
          db.quantity_remaining,
          dm.reorder_threshold,
          db.expiry_date,
          db.location,
          CASE 
            WHEN db.quantity_remaining <= dm.reorder_threshold * 0.5 THEN 'CRITICAL'
            WHEN db.quantity_remaining <= dm.reorder_threshold THEN 'WARNING'
            ELSE 'INFO'
          END as alert_level
        FROM emr.drug_master dm
        JOIN emr.drug_batches db ON dm.drug_id = db.drug_id
        WHERE (dm.tenant_id = $1 OR dm.tenant_id IS NULL)
          AND db.status = 'active'
          AND db.quantity_remaining <= dm.reorder_threshold
        ORDER BY 
          CASE 
            WHEN db.quantity_remaining <= dm.reorder_threshold * 0.5 THEN 1
            WHEN db.quantity_remaining <= dm.reorder_threshold THEN 2
            ELSE 3
          END,
          db.quantity_remaining ASC
      `;

      const result = await client.query(sql, [tenantId]);

      return result.rows.map(row => ({
        drugId: row.drug_id,
        drugName: row.generic_name,
        brandNames: row.brand_names,
        batchId: row.batch_id,
        quantityRemaining: row.quantity_remaining,
        reorderThreshold: row.reorder_threshold,
        alertLevel: row.alert_level,
        expiryDate: row.expiry_date,
        location: row.location,
        suggestedOrderQuantity: row.reorder_threshold * 2 - row.quantity_remaining
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get expiring stock alerts
   */
  async getExpiringStockAlerts(tenantId, daysThreshold = 90) {
    const client = await pool.connect();

    try {
      const sql = `
        SELECT 
          dm.drug_id,
          dm.generic_name,
          dm.brand_names,
          db.batch_id,
          db.batch_number,
          db.quantity_remaining,
          db.expiry_date,
          db.location,
          db.expiry_date - CURRENT_DATE as days_until_expiry
        FROM emr.drug_master dm
        JOIN emr.drug_batches db ON dm.drug_id = db.drug_id
        WHERE (dm.tenant_id = $1 OR dm.tenant_id IS NULL)
          AND db.status = 'active'
          AND db.quantity_remaining > 0
          AND db.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + ($2 || ' days')::interval)
        ORDER BY db.expiry_date ASC
      `;

      const result = await client.query(sql, [tenantId, daysThreshold]);

      return result.rows.map(row => ({
        drugId: row.drug_id,
        drugName: row.generic_name,
        brandNames: row.brand_names,
        batchId: row.batch_id,
        batchNumber: row.batch_number,
        quantityRemaining: row.quantity_remaining,
        expiryDate: row.expiry_date,
        daysUntilExpiry: row.days_until_expiry,
        location: row.location,
        urgency: row.days_until_expiry <= 30 ? 'HIGH' : 'MEDIUM'
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get all vendors for a tenant
   */
  async getVendors(tenantId) {
    const client = await pool.connect();
    try {
      const sql = `
        SELECT * FROM emr.vendors 
        WHERE tenant_id = $1 OR tenant_id IS NULL
        ORDER BY vendor_name ASC
      `;
      const result = await client.query(sql, [tenantId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get all purchase orders for a tenant
   */
  async getPurchaseOrders(tenantId) {
    const client = await pool.connect();
    try {
      const sql = `
        SELECT 
          po.*,
          v.vendor_name,
          u.name as creator_name
        FROM emr.purchase_orders po
        JOIN emr.vendors v ON po.vendor_id = v.vendor_id
        LEFT JOIN emr.users u ON po.created_by = u.id
        WHERE po.tenant_id = $1
        ORDER BY po.created_at DESC
      `;
      const result = await client.query(sql, [tenantId]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

// =====================================================
// DRUG MASTER SERVICE
// =====================================================

export class DrugMasterService {

  /**
   * Search drug catalog with RxNorm/SNOMED support
   */
  async searchDrugs(query, filters = {}) {
    const client = await pool.connect();

    try {
      const conditions = ['1=1'];
      const values = [];
      let paramIndex = 1;

      // Search by generic name, brand name, or codes
      if (query) {
        conditions.push(`
          (dm.generic_name ILIKE $${paramIndex}
           OR dm.brand_names::text ILIKE $${paramIndex}
           OR dm.rxnorm_code ILIKE $${paramIndex}
           OR dm.ndc_code ILIKE $${paramIndex})
        `);
        values.push(`%${query}%`);
        paramIndex++;
      }

      // Filter by dosage form
      if (filters.dosageForm) {
        conditions.push(`dm.dosage_form = $${paramIndex++}`);
        values.push(filters.dosageForm);
      }

      // Filter by route
      if (filters.route) {
        conditions.push(`dm.route = $${paramIndex++}`);
        values.push(filters.route);
      }

      // Only active drugs
      conditions.push(`dm.status = 'active'`);

      const sql = `
        SELECT 
          dm.drug_id as id,
          dm.generic_name,
          dm.brand_names,
          dm.strength,
          dm.dosage_form,
          dm.route,
          dm.manufacturer,
          dm.rxnorm_code,
          dm.ndc_code,
          dm.snomed_code,
          dm.schedule_type,
          dm.high_alert_flag,
          dm.pregnancy_category,
          dm.reorder_threshold,
          dm.status,
          json_agg(db.batch_id) FILTER (WHERE db.batch_id IS NOT NULL) as available_batches
        FROM emr.drug_master dm
        LEFT JOIN emr.drug_batches db ON dm.drug_id= db.drug_id 
          AND db.status = 'active' AND db.quantity_remaining > 0
        WHERE ${conditions.join(' AND ')}
        GROUP BY dm.drug_id
        ORDER BY dm.generic_name ASC
        LIMIT 100
      `;

      const result = await client.query(sql, values);

      return result.rows.map(drug => ({
        ...drug,
        brandNames: drug.brand_names,
        availableBatches: drug.available_batches.filter(id => id !== null)
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Find generic substitutes for a given drug
   */
  async getGenericSubstitutes(drugId, tenantId) {
    const client = await pool.connect();
    try {
      // 1. Get the generic name and strength of the target drug
      const drugSql = `SELECT generic_name, strength FROM emr.drug_master WHERE drug_id = $1`;
      const drugRes = await client.query(drugSql, [drugId]);

      if (drugRes.rows.length === 0) return [];

      const { generic_name, strength } = drugRes.rows[0];

      // 2. Find all other drugs with the same generic name and strength
      const substSql = `
        SELECT 
          dm.drug_id as id,
          dm.generic_name,
          dm.brand_names,
          dm.strength,
          dm.dosage_form,
          dm.manufacturer,
          COALESCE(SUM(db.quantity_remaining), 0) as total_stock
        FROM emr.drug_master dm
        LEFT JOIN emr.drug_batches db ON dm.drug_id = db.drug_id 
          AND db.status = 'active' AND db.quantity_remaining > 0
        WHERE dm.generic_name = $1 
          AND dm.strength = $2
          AND dm.drug_id != $3
          AND (dm.tenant_id = $4 OR dm.tenant_id IS NULL)
        GROUP BY dm.drug_id
        ORDER BY total_stock DESC
      `;

      const result = await client.query(substSql, [generic_name, strength, drugId, tenantId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get drug details by ID
   */
  async getDrugDetails(drugId) {
    const client = await pool.connect();

    try {
      const sql = `
        SELECT 
          dm.*,
          json_agg(
            json_build_object(
              'batch_id', db.batch_id,
              'batch_number', db.batch_number,
              'quantity_remaining', db.quantity_remaining,
              'expiry_date', db.expiry_date,
              'location', db.location
            )
          ) FILTER (WHERE db.batch_id IS NOT NULL) as batches
        FROM emr.drug_master dm
        LEFT JOIN emr.drug_batches db ON dm.drug_id = db.drug_id 
          AND db.status = 'active'
        WHERE dm.drug_id = $1
        GROUP BY dm.drug_id
      `;

      const result = await client.query(sql, [drugId]);

      if (result.rows.length === 0) {
        return null;
      }

      return {
        ...result.rows[0],
        brandNames: result.rows[0].brand_names,
        batches: result.rows[0].batches.filter(b => b.batch_id !== null)
      };
    } finally {
      client.release();
    }
  }
}

export default {
  PharmacySafetyService,
  PharmacyInventoryService,
  DrugMasterService
};
