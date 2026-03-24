/**
 * Pharmacy Service Routes
 * Base path: /api/pharmacy/v1
 */

import express from 'express';
import { requireRole } from '../../../server/middleware/auth.middleware.js';
import {
  createPrescription,
  validatePrescription,
  getPharmacyQueue,
  dispenseMedication,
  searchDrugs,
  getDrugDetails,
  getLowStockAlerts,
  getExpiringStockAlerts,
  getVendors,
  getPurchaseOrders,
  addVendor,
  createPurchaseOrder,
  importStock
} from '../controllers/pharmacy.controller.js';

const router = express.Router();

// =====================================================
// PRESCRIPTION MANAGEMENT
// =====================================================

// POST /api/pharmacy/v1/prescriptions- Create new prescription
router.post('/prescriptions', requireRole('Doctor'), createPrescription);

// POST /api/pharmacy/v1/prescriptions/validate- Validate without creating
router.post('/prescriptions/validate', requireRole('Doctor'), validatePrescription);

// GET/api/pharmacy/v1/pharmacy/queue- Get dispensing queue
router.get('/pharmacy/queue', requireRole('Nurse', 'Lab', 'Pharmacy'), getPharmacyQueue);

// POST /api/pharmacy/v1/pharmacy/dispense- Dispense medication
router.post('/pharmacy/dispense', requireRole('Nurse', 'Lab', 'Pharmacy'), dispenseMedication);

// =====================================================
// DRUG CATALOG
// =====================================================

// GET /api/pharmacy/v1/drugs/search?q=query- Search drugs
router.get('/drugs/search', requireRole('Doctor', 'Nurse', 'Lab', 'Pharmacy'), searchDrugs);

// GET/api/pharmacy/v1/drugs/:id- Get drug details
router.get('/drugs/:id', requireRole('Doctor', 'Nurse', 'Lab', 'Pharmacy'), getDrugDetails);

// =====================================================
// INVENTORY ALERTS
// =====================================================

// GET/api/pharmacy/v1/alerts/low-stock- Low stock alerts
router.get('/alerts/low-stock', requireRole('Nurse', 'Lab', 'Pharmacy'), getLowStockAlerts);

// GET /api/pharmacy/v1/alerts/expiring?days=90- Expiring stock alerts
router.get('/alerts/expiring', requireRole('Nurse', 'Lab', 'Pharmacy'), getExpiringStockAlerts);

// =====================================================
// PROCUREMENT & VENDORS
// =====================================================

// GET /api/pharmacy/v1/vendors - List all vendors
router.get('/vendors', requireRole('Nurse', 'Lab', 'Pharmacy'), getVendors);

// POST /api/pharmacy/v1/vendors - Add new vendor
router.post('/vendors', requireRole('Nurse', 'Lab', 'Pharmacy'), addVendor);

// GET /api/pharmacy/v1/purchase-orders - List all POs
router.get('/purchase-orders', requireRole('Nurse', 'Lab', 'Pharmacy'), getPurchaseOrders);

// POST /api/pharmacy/v1/purchase-orders - Create PO
router.post('/purchase-orders', requireRole('Nurse', 'Lab', 'Pharmacy'), createPurchaseOrder);

// POST /api/pharmacy/v1/stock/import- Import from CSV (JSON)
router.post('/stock/import', requireRole('Nurse', 'Lab', 'Pharmacy'), importStock);

export default router;
