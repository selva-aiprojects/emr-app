/**
 * Pharmacy Service Controller
 * Handles prescription creation, validation, and dispensing
 */

import {
  PharmacySafetyService,
  PharmacyInventoryService,
  DrugMasterService
} from '../services/pharmacy.service.js';
import { pool } from '../db/index.js';

const safetyService = new PharmacySafetyService();
const inventoryService = new PharmacyInventoryService();
const drugService = new DrugMasterService();

// =====================================================
// PRESCRIPTION CREATION & VALIDATION
// =====================================================

/**
 * Create new prescription with safety validation
 */
export const createPrescription = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { patientId, encounterId, items, wardId, bedId } = req.body;
    const providerId = req.user?.id; // From auth middleware
    const role = (req.user?.role || '').toLowerCase();
    const tenantId = req.headers['x-tenant-id'];

    if (role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Only doctors can create prescriptions'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        errors: [{ message: 'At least one medication is required' }]
      });
    }

    // 1. Perform comprehensive safety check
    const safetyCheck = await safetyService.performSafetyCheck({
      patientId,
      prescriptionItems: items,
      tenantId
    });

    // If not safe, return alerts (allow override for non-critical)
    if (!safetyCheck.isSafe && !req.body.overrideSafetyCheck) {
      return res.status(400).json({
        success: false,
        requiresOverride: safetyCheck.requiresOverride,
        safetyCheck,
        message: 'Prescription failed safety validation'
      });
    }

    // 2. Create prescription header
    const prescriptionSql = `
      INSERT INTO emr.prescriptions(
        tenant_id, patient_id, encounter_id, provider_id,
       status, intent, priority, category,
       ward_id, bed_id,
      created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const prescriptionResult = await client.query(prescriptionSql, [
      tenantId,
      patientId,
      encounterId,
      providerId,
      'active',
      'order',
      req.body.priority || 'routine',
      req.body.category || 'outpatient',
      wardId,
      bedId
    ]);

    const prescription = prescriptionResult.rows[0];

    // 3. Create prescription items
    const createdItems = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      const itemSql = `
        INSERT INTO emr.prescription_items(
        prescription_id, drug_id, sequence,
         dose, dose_unit, frequency, route, administration_timing,
         duration_days, quantity_prescribed, instructions,
         sig_code, refills_allowed, days_supply, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const itemResult = await client.query(itemSql, [
        prescription.id,
        item.drugId,
        i + 1, // sequence
        item.dose,
        item.doseUnit,
        item.frequency,
        item.route || 'Oral',
        item.administrationTiming,
        item.durationDays,
        item.quantity,
        item.instructions,
        item.sigCode,
        item.refillsAllowed || 0,
        item.daysSupply || 30,
        'pending'
      ]);

      createdItems.push(itemResult.rows[0]);
    }

    // 4. Create audit log
    const auditSql = `
      INSERT INTO emr.audit_logs(
        tenant_id, user_id, action, entity_name, entity_id, details
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await client.query(auditSql, [
      tenantId,
      providerId,
      'create',
      'prescription',
      prescription.id,
      JSON.stringify({ patientId, itemCount: items.length })
    ]);

    await client.query('COMMIT');

    // Return prescription with safety check results
    res.status(201).json({
      success: true,
      data: {
        prescription,
        items: createdItems,
        safetyCheck
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Validate prescription without creating it
 */
export const validatePrescription = async (req, res) => {
  try {
    const { patientId, items } = req.body;
    const tenantId = req.headers['x-tenant-id'];

    const safetyCheck = await safetyService.performSafetyCheck({
      patientId,
      prescriptionItems: items,
      tenantId
    });

    res.json({
      success: true,
      safetyCheck
    });
  } catch (error) {
    console.error('Validate prescription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// =====================================================
// PHARMACY DISPENSING
// =====================================================

/**
 * Get pharmacy dispensing queue
 */
export const getPharmacyQueue = async (req, res) => {
  const client = await pool.connect();

  try {
    const tenantId = req.tenantId || req.headers['x-tenant-id'];
    if (!tenantId) {
      console.error('[PHARMACY_QUEUE_ERROR] No tenant context identified');
    }

    const sql = `
      SELECT 
        p.id as prescription_id,
        p.prescription_number,
        p.tenant_id as db_tenant_id,
        p.patient_id,
        pt.first_name as patient_first_name,
        pt.last_name as patient_last_name,
        p.provider_id,
        u.name as provider_name,
        p.encounter_id,
        p.status as prescription_status,
        p.priority,
        p.ward_id,
        p.bed_id,
        p.created_at,
        pi.item_id,
        pi.drug_id,
        dm.generic_name,
        dm.brand_names[1] as brand_name,
        dm.strength,
        dm.dosage_form,
        pi.dose,
        pi.dose_unit,
        pi.frequency,
        pi.route,
        pi.quantity_prescribed,
        pi.quantity_dispensed,
        pi.instructions,
        pi.status as item_status,
        pi.sequence,
        pi.substitution_allowed
      FROM emr.prescriptions p
      LEFT JOIN emr.patients pt ON p.patient_id::text = pt.id::text
      LEFT JOIN emr.users u ON p.provider_id::text = u.id::text
      LEFT JOIN emr.prescription_items pi ON p.id::text = pi.prescription_id::text AND pi.status = 'pending'
      LEFT JOIN emr.drug_master dm ON pi.drug_id::text = dm.drug_id::text
      WHERE p.tenant_id::text = $1::text
      ORDER BY 
        CASE p.priority
          WHEN 'stat' THEN 1
          WHEN 'urgent' THEN 2
          WHEN 'asap' THEN 3
          ELSE 4
        END,
        p.created_at DESC
    `;

    const result = await client.query(sql, [tenantId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get pharmacy queue error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Dispense medication from prescription
 */
export const dispenseMedication = async (req, res) => {
  const client = await pool.connect();

  try {
    const { prescriptionItemId, drugId, quantity } = req.body;
    const pharmacistId = req.user?.id;
    const tenantId = req.tenantId;

    if (!prescriptionItemId || !drugId || !quantity) {
      return res.status(400).json({
        success: false,
        errors: [{ message: 'Missing required fields' }]
      });
    }

    // Dispense medication using FEFO
    const result = await inventoryService.dispenseMedication({
      prescriptionItemId,
      drugId,
      quantity,
      dispensedBy: pharmacistId,
      tenantId
    });

    // Create audit log
    const auditSql = `
      INSERT INTO emr.audit_logs(
        tenant_id, user_id, action, entity_name, entity_id, details
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await client.query(auditSql, [
      tenantId,
      pharmacistId,
      'dispense',
      'medication',
      prescriptionItemId,
      JSON.stringify({ drugId, quantity })
    ]);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Dispense medication error:', error);

    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        requiresStockTransfer: true
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
};

// =====================================================
// DRUG CATALOG SEARCH
// =====================================================

/**
 * Search drug master catalog
 */
export const searchDrugs = async (req, res) => {
  try {
    const query = req.query.q || '';
    const filters = {
      dosageForm: req.query.dosageForm,
      route: req.query.route
    };

    const drugs = await drugService.searchDrugs(query, filters);

    res.json({
      success: true,
      data: drugs
    });
  } catch (error) {
    console.error('Search drugs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get drug details by ID
 */
export const getDrugDetails = async (req, res) => {
  try {
    const drugId = req.params.id;

    const drug = await drugService.getDrugDetails(drugId);

    if (!drug) {
      return res.status(404).json({
        success: false,
        error: 'Drug not found'
      });
    }

    res.json({
      success: true,
      data: drug
    });
  } catch (error) {
    console.error('Get drug details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get generic substitutes for a drug
 */
export const getGenericSubstitutes = async (req, res) => {
  try {
    const drugId = req.params.id;
    const tenantId = req.tenantId || req.query.tenantId;

    const substitutes = await drugService.getGenericSubstitutes(drugId, tenantId);

    res.json({
      success: true,
      data: substitutes
    });
  } catch (error) {
    console.error('Get generic substitutes error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// =====================================================
// INVENTORY ALERTS
// =====================================================

/**
 * Get low stock alerts
 */
export const getLowStockAlerts = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const alerts = await inventoryService.getLowStockAlerts(tenantId);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get expiring stock alerts
 */
export const getExpiringStockAlerts = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const daysThreshold = parseInt(req.query.days) || 90;

    const alerts = await inventoryService.getExpiringStockAlerts(tenantId, daysThreshold);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Get expiring alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Add a new vendor
 */
export const addVendor = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const vendor = await inventoryService.addVendor({ ...req.body, tenantId });
    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get all vendors
 */
export const getVendors = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const vendors = await inventoryService.getVendors(tenantId);
    res.json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get all purchase orders
 */
export const getPurchaseOrders = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const pos = await inventoryService.getPurchaseOrders(tenantId);
    res.json({ success: true, data: pos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Create a purchase order
 */
export const createPurchaseOrder = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const po = await inventoryService.createPurchaseOrder({ ...req.body, tenantId, createdBy: req.user?.id });
    res.status(201).json({ success: true, data: po });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Import stock from CSV (as JSON)
 */
export const importStock = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { items } = req.body;
    const result = await inventoryService.importStockFromCSV(tenantId, req.user?.id, items);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
