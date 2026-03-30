// Comprehensive Pharmacy Module Seed Script
// Creates realistic pharmacy inventory, dispensing, and management data for dashboard validation

import { query } from '../server/db/connection.js';

const tenantId = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'; // New Age Hospital

// Enhanced drug inventory data
const pharmacyInventory = [
  // Pain and Fever Medications
  { drugId: 'drug-001', brandName: 'Crocin', genericName: 'Paracetamol', manufacturer: 'GSK', batchNumber: 'CRN2024001', expiryDate: '2025-12-31', mrp: 15.50, purchaseRate: 12.00, saleRate: 15.50, currentStock: 250, minStock: 50, maxStock: 500, reorderLevel: 75, schedule: 'OTC' },
  { drugId: 'drug-002', brandName: 'Brufen', genericName: 'Ibuprofen', manufacturer: 'Abbott', batchNumber: 'BRF2024002', expiryDate: '2025-08-15', mrp: 25.00, purchaseRate: 20.00, saleRate: 25.00, currentStock: 120, minStock: 30, maxStock: 300, reorderLevel: 45, schedule: 'H' },
  { drugId: 'drug-003', brandName: 'Voveran', genericName: 'Diclofenac', manufacturer: 'Novartis', batchNumber: 'VVR2024003', expiryDate: '2025-06-30', mrp: 35.00, purchaseRate: 28.00, saleRate: 35.00, currentStock: 80, minStock: 20, maxStock: 200, reorderLevel: 30, schedule: 'H' },
  
  // Antibiotics
  { drugId: 'drug-004', brandName: 'Azithral', genericName: 'Azithromycin', manufacturer: 'Cipla', batchNumber: 'AZT2024004', expiryDate: '2025-09-30', mrp: 120.00, purchaseRate: 95.00, saleRate: 120.00, currentStock: 45, minStock: 15, maxStock: 100, reorderLevel: 25, schedule: 'H' },
  { drugId: 'drug-005', brandName: 'Augmentin', genericName: 'Amoxicillin+Clavulanate', manufacturer: 'GSK', batchNumber: 'AUG2024005', expiryDate: '2025-07-20', mrp: 180.00, purchaseRate: 145.00, saleRate: 180.00, currentStock: 60, minStock: 20, maxStock: 150, reorderLevel: 30, schedule: 'H' },
  { drugId: 'drug-006', brandName: 'Ceftum', genericName: 'Cefuroxime', manufacturer: 'Ranbaxy', batchNumber: 'CFT2024006', expiryDate: '2025-10-15', mrp: 150.00, purchaseRate: 120.00, saleRate: 150.00, currentStock: 35, minStock: 10, maxStock: 80, reorderLevel: 15, schedule: 'H' },
  
  // Cardiovascular Medications
  { drugId: 'drug-007', brandName: 'Metolar', genericName: 'Metoprolol', manufacturer: 'Sun Pharma', batchNumber: 'MTL2024007', expiryDate: '2025-11-30', mrp: 85.00, purchaseRate: 68.00, saleRate: 85.00, currentStock: 90, minStock: 25, maxStock: 200, reorderLevel: 35, schedule: 'H' },
  { drugId: 'drug-008', brandName: 'Amlong', genericName: 'Amlodipine', manufacturer: 'Cipla', batchNumber: 'AML2024008', expiryDate: '2025-08-20', mrp: 45.00, purchaseRate: 36.00, saleRate: 45.00, currentStock: 110, minStock: 30, maxStock: 250, reorderLevel: 40, schedule: 'H' },
  { drugId: 'drug-009', brandName: 'Storvas', genericName: 'Atorvastatin', manufacturer: 'Ranbaxy', batchNumber: 'STV2024009', expiryDate: '2025-09-10', mrp: 95.00, purchaseRate: 76.00, saleRate: 95.00, currentStock: 75, minStock: 20, maxStock: 180, reorderLevel: 30, schedule: 'H' },
  
  // Diabetes Medications
  { drugId: 'drug-010', brandName: 'Glycomet', genericName: 'Metformin', manufacturer: 'USV', batchNumber: 'GLC2024010', expiryDate: '2025-12-15', mrp: 25.00, purchaseRate: 20.00, saleRate: 25.00, currentStock: 200, minStock: 50, maxStock: 400, reorderLevel: 75, schedule: 'H' },
  { drugId: 'drug-011', brandName: 'Januvia', genericName: 'Sitagliptin', manufacturer: 'MSD', batchNumber: 'JNV2024011', expiryDate: '2025-07-25', mrp: 450.00, purchaseRate: 360.00, saleRate: 450.00, currentStock: 25, minStock: 10, maxStock: 60, reorderLevel: 15, schedule: 'H' },
  { drugId: 'drug-012', brandName: 'Lantus', genericName: 'Insulin Glargine', manufacturer: 'Sanofi', batchNumber: 'LTS2024012', expiryDate: '2025-05-30', mrp: 850.00, purchaseRate: 680.00, saleRate: 850.00, currentStock: 15, minStock: 5, maxStock: 30, reorderLevel: 8, schedule: 'H' },
  
  // Respiratory Medications
  { drugId: 'drug-013', brandName: 'Asthalin', genericName: 'Salbutamol', manufacturer: 'Cipla', batchNumber: 'AST2024013', expiryDate: '2025-06-15', mrp: 180.00, purchaseRate: 144.00, saleRate: 180.00, currentStock: 40, minStock: 10, maxStock: 100, reorderLevel: 15, schedule: 'H' },
  { drugId: 'drug-014', brandName: 'Budecort', genericName: 'Budesonide', manufacturer: 'Cipla', batchNumber: 'BDC2024014', expiryDate: '2025-09-25', mrp: 220.00, purchaseRate: 176.00, saleRate: 220.00, currentStock: 30, minStock: 8, maxStock: 80, reorderLevel: 12, schedule: 'H' },
  { drugId: 'drug-015', brandName: 'Montair', genericName: 'Montelukast', manufacturer: 'Cipla', batchNumber: 'MTR2024015', expiryDate: '2025-11-10', mrp: 150.00, purchaseRate: 120.00, saleRate: 150.00, currentStock: 55, minStock: 15, maxStock: 120, reorderLevel: 20, schedule: 'H' },
  
  // GI Medications
  { drugId: 'drug-016', brandName: 'Pantocid', genericName: 'Pantoprazole', manufacturer: 'Sun Pharma', batchNumber: 'PTC2024016', expiryDate: '2025-10-20', mrp: 65.00, purchaseRate: 52.00, saleRate: 65.00, currentStock: 85, minStock: 20, maxStock: 180, reorderLevel: 30, schedule: 'H' },
  { drugId: 'drug-017', brandName: 'Rantac', genericName: 'Ranitidine', manufacturer: 'J&J', batchNumber: 'RNT2024017', expiryDate: '2025-08-10', mrp: 35.00, purchaseRate: 28.00, saleRate: 35.00, currentStock: 120, minStock: 30, maxStock: 250, reorderLevel: 40, schedule: 'OTC' },
  
  // Vitamins and Supplements
  { drugId: 'drug-018', brandName: 'Supradyn', genericName: 'Multivitamin', manufacturer: 'Abbott', batchNumber: 'SPD2024018', expiryDate: '2025-12-25', mrp: 45.00, purchaseRate: 36.00, saleRate: 45.00, currentStock: 180, minStock: 40, maxStock: 300, reorderLevel: 60, schedule: 'OTC' },
  { drugId: 'drug-019', brandName: 'Shelcal', genericName: 'Calcium+Vit D3', manufacturer: 'Torrent', batchNumber: 'SHC2024019', expiryDate: '2025-11-15', mrp: 85.00, purchaseRate: 68.00, saleRate: 85.00, currentStock: 95, minStock: 25, maxStock: 200, reorderLevel: 35, schedule: 'OTC' },
  { drugId: 'drug-020', brandName: 'Becosules', genericName: 'Vitamin B Complex', manufacturer: 'Pfizer', batchNumber: 'BCL2024020', expiryDate: '2025-10-30', mrp: 25.00, purchaseRate: 20.00, saleRate: 25.00, currentStock: 150, minStock: 35, maxStock: 250, reorderLevel: 50, schedule: 'OTC' },
  
  // Psychiatric Medications (Controlled)
  { drugId: 'drug-021', brandName: 'Serenace', genericName: 'Haloperidol', manufacturer: 'Janssen', batchNumber: 'SRC2024021', expiryDate: '2025-07-15', mrp: 125.00, purchaseRate: 100.00, saleRate: 125.00, currentStock: 20, minStock: 5, maxStock: 40, reorderLevel: 8, schedule: 'H1' },
  { drugId: 'drug-022', brandName: 'Rivotril', genericName: 'Clonazepam', manufacturer: 'Roche', batchNumber: 'RVL2024022', expiryDate: '2025-06-30', mrp: 85.00, purchaseRate: 68.00, saleRate: 85.00, currentStock: 15, minStock: 3, maxStock: 25, reorderLevel: 5, schedule: 'H1' },
  
  // Emergency Medications
  { drugId: 'drug-023', brandName: 'Adrenaline', genericName: 'Epinephrine', manufacturer: 'German Remedies', batchNumber: 'ADR2024023', expiryDate: '2025-04-30', mrp: 450.00, purchaseRate: 360.00, saleRate: 450.00, currentStock: 8, minStock: 2, maxStock: 15, reorderLevel: 3, schedule: 'H' },
  { drugId: 'drug-024', brandName: 'Dextrose', genericName: 'Dextrose 25%', manufacturer: 'Baxter', batchNumber: 'DXT2024024', expiryDate: '2025-09-15', mrp: 120.00, purchaseRate: 96.00, saleRate: 120.00, currentStock: 25, minStock: 8, maxStock: 50, reorderLevel: 12, schedule: 'OTC' }
];

// Sample dispensing data
const dispensingData = [
  { patientId: 'patient-001', patientName: 'Rajesh Kumar', totalItems: 3, totalAmount: 285.50, paymentMode: 'CASH' },
  { patientId: 'patient-002', patientName: 'Priya Sharma', totalItems: 2, totalAmount: 420.00, paymentMode: 'CARD' },
  { patientId: 'patient-003', patientName: 'Amit Patel', totalItems: 4, totalAmount: 156.75, paymentMode: 'UPI' },
  { patientId: 'patient-004', patientName: 'Sunita Reddy', totalItems: 1, totalAmount: 850.00, paymentMode: 'INSURANCE' },
  { patientId: 'patient-005', patientName: 'Vikram Singh', totalItems: 5, totalAmount: 325.80, paymentMode: 'CASH' },
  { patientId: 'patient-006', patientName: 'Anjali Gupta', totalItems: 2, totalAmount: 195.00, paymentMode: 'CARD' },
  { patientId: 'patient-007', patientName: 'Rahul Verma', totalItems: 3, totalAmount: 278.90, paymentMode: 'UPI' },
  { patientId: 'patient-008', patientName: 'Meera Joshi', totalItems: 1, totalAmount: 65.00, paymentMode: 'CASH' },
  { patientId: 'patient-009', patientName: 'Sanjay Kumar', totalItems: 4, totalAmount: 485.60, paymentMode: 'INSURANCE' },
  { patientId: 'patient-010', patientName: 'Deepa Nair', totalItems: 2, totalAmount: 145.50, paymentMode: 'CARD' }
];

// Generate enhanced pharmacy inventory
async function seedEnhancedPharmacyInventory() {
  console.log('💊 Seeding Enhanced Pharmacy Inventory...');
  
  for (const item of pharmacyInventory) {
    // Calculate GST percentage based on schedule
    let gstPercentage = 5; // Default GST
    if (item.schedule === 'H1' || item.schedule === 'H2') {
      gstPercentage = 12; // Higher GST for controlled substances
    } else if (item.schedule === 'OTC') {
      gstPercentage = 0; // No GST for OTC in some cases
    }
    
    // Determine if drug is controlled
    const isNarcotic = item.schedule === 'H1';
    const isPsychotropic = item.schedule === 'H1' || item.schedule === 'H2';
    const isAntibiotic = item.genericName.toLowerCase().includes('cin') || 
                         item.genericName.toLowerCase().includes('ox') ||
                         item.genericName.toLowerCase().includes('mycin');
    
    const inventoryQuery = `
      INSERT INTO emr.pharmacy_inventory_enhanced (
        tenant_id, drug_id, batch_number, manufacturer, supplier_name, supplier_license,
        expiry_date, manufacturing_date, mrp, purchase_rate, sale_rate, gst_percentage,
        hsn_code, pack_size, units_per_pack, current_stock, minimum_stock_level,
        maximum_stock_level, reorder_level, storage_location, storage_conditions,
        schedule_category, is_narcotic, is_psychotropic, is_antibiotic,
        requires_prescription, barcode, qr_code, last_verified_date, verified_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, 'ACTIVE')
      ON CONFLICT (tenant_id, drug_id, batch_number) DO UPDATE SET
        current_stock = EXCLUDED.current_stock,
        updated_at = NOW()
    `;
    
    // Generate manufacturing date (typically 6-12 months before expiry)
    const expiryDate = new Date(item.expiryDate);
    const manufacturingDate = new Date(expiryDate);
    manufacturingDate.setMonth(expiryDate.getMonth() - Math.floor(6 + Math.random() * 6));
    
    await query(inventoryQuery, [
      tenantId,
      item.drugId,
      item.batchNumber,
      item.manufacturer,
      `${item.manufacturer} Ltd.`,
      'SUP001',
      item.expiryDate,
      manufacturingDate.toISOString().split('T')[0],
      item.mrp,
      item.purchaseRate,
      item.saleRate,
      gstPercentage,
      '3004', // HSN code for medicines
      '10 tablets', // Pack size
      10, // Units per pack
      item.currentStock,
      item.minStock,
      item.maxStock,
      item.reorderLevel,
      `Rack-${Math.floor(1 + Math.random() * 20)}`, // Storage location
      'Store at room temperature, protect from light', // Storage conditions
      item.schedule,
      isNarcotic,
      isPsychotropic,
      isAntibiotic,
      item.schedule !== 'OTC', // Requires prescription if not OTC
      `1234567890${Math.floor(Math.random() * 1000)}`, // Barcode
      `QR${item.drugId}${Math.floor(Math.random() * 1000)}`, // QR code
      new Date().toISOString().split('T')[0], // Last verified date
      'pharmacist-001' // Verified by
    ]);
  }
  
  console.log('✅ Enhanced Pharmacy Inventory Seeded Successfully');
}

// Generate pharmacy dispensing logs
async function seedPharmacyDispensingLogs() {
  console.log('📋 Seeding Pharmacy Dispensing Logs...');
  
  let dispensingCounter = 1;
  
  for (const dispensing of dispensingData) {
    // Generate dispensing date (last 7 days)
    const daysAgo = Math.floor(Math.random() * 7);
    const dispensingDate = new Date();
    dispensingDate.setDate(dispensingDate.getDate() - daysAgo);
    
    // Generate dispensing number
    const dispensingNumber = `DSP${new Date().getFullYear()}${String(dispensingCounter).padStart(4, '0')}`;
    
    // Calculate additional charges
    const doctorConsultationFee = Math.random() < 0.3 ? 150 : 0; // 30% have consultation fee
    const serviceCharge = 10; // Fixed service charge
    const gstAmount = (dispensing.totalAmount * 0.05); // 5% GST
    const discountAmount = Math.random() < 0.2 ? dispensing.totalAmount * 0.1 : 0; // 20% get 10% discount
    const netAmount = dispensing.totalAmount + doctorConsultationFee + serviceCharge + gstAmount - discountAmount;
    const roundedAmount = Math.round(netAmount);
    
    const dispensingQuery = `
      INSERT INTO emr.pharmacy_dispensing_log (
        tenant_id, dispensing_number, patient_id, total_items, total_amount,
        payment_mode, doctor_consultation_fee, service_charge, gst_amount,
        discount_amount, net_amount, rounded_amount, emergency_dispensing,
        status, dispensing_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'COMPLETED', $14, NOW(), NOW())
      RETURNING id
    `;
    
    const dispensingResult = await query(dispensingQuery, [
      tenantId,
      dispensingNumber,
      dispensing.patientId,
      dispensing.totalItems,
      dispensing.totalAmount,
      dispensing.paymentMode,
      doctorConsultationFee,
      serviceCharge,
      gstAmount,
      discountAmount,
      netAmount,
      roundedAmount,
      false, // Emergency dispensing
      dispensingDate
    ]);
    
    const dispensingLogId = dispensingResult.rows[0].id;
    
    // Add dispensing items
    await seedDispensingItems(dispensingLogId, dispensing.totalItems);
    
    dispensingCounter++;
  }
  
  console.log('✅ Pharmacy Dispensing Logs Seeded Successfully');
}

// Generate dispensing items
async function seedDispensingItems(dispensingLogId, totalItems) {
  for (let i = 0; i < totalItems; i++) {
    const inventoryItem = pharmacyInventory[Math.floor(Math.random() * pharmacyInventory.length)];
    
    // Generate quantity dispensed
    const quantityDispensed = Math.floor(1 + Math.random() * 5); // 1-5 units
    
    // Calculate total amount
    const totalAmount = quantityDispensed * inventoryItem.saleRate;
    
    // Apply discount
    const discountPercentage = Math.random() < 0.2 ? 10 : 0; // 20% get 10% discount
    
    const itemQuery = `
      INSERT INTO emr.pharmacy_dispensing_items (
        dispensing_log_id, drug_id, batch_number, expiry_date, quantity_dispensed,
        quantity_unit, mrp, sale_rate, discount_percentage, gst_percentage,
        total_amount, storage_location, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;
    
    await query(itemQuery, [
      dispensingLogId,
      inventoryItem.drugId,
      inventoryItem.batchNumber,
      inventoryItem.expiryDate,
      quantityDispensed,
      'TABLETS', // Default unit
      inventoryItem.mrp,
      inventoryItem.saleRate,
      discountPercentage,
      5, // GST percentage
      totalAmount,
      `Rack-${Math.floor(1 + Math.random() * 20)}`,
      'Standard dispensing'
    ]);
    
    // Update inventory stock
    await updateInventoryStock(inventoryItem.drugId, inventoryItem.batchNumber, quantityDispensed);
  }
}

// Update inventory stock after dispensing
async function updateInventoryStock(drugId, batchNumber, quantityDispensed) {
  const updateQuery = `
    UPDATE emr.pharmacy_inventory_enhanced
    SET current_stock = current_stock - $1, updated_at = NOW()
    WHERE tenant_id = $2 AND drug_id = $3 AND batch_number = $4
  `;
  
  await query(updateQuery, [quantityDispensed, tenantId, drugId, batchNumber]);
}

// Generate stock movements
async function seedStockMovements() {
  console.log('📦 Seeding Stock Movements...');
  
  const movementTypes = ['PURCHASE', 'SALE', 'RETURN', 'EXPIRY', 'ADJUSTMENT'];
  
  for (let i = 0; i < 100; i++) {
    const inventoryItem = pharmacyInventory[Math.floor(Math.random() * pharmacyInventory.length)];
    const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
    
    // Generate movement date (last 30 days)
    const daysAgo = Math.floor(Math.random() * 30);
    const movementDate = new Date();
    movementDate.setDate(movementDate.getDate() - daysAgo);
    
    // Get current stock
    const stockQuery = `SELECT current_stock FROM emr.pharmacy_inventory_enhanced WHERE tenant_id = $1 AND drug_id = $2 AND batch_number = $3`;
    const stockResult = await query(stockQuery, [tenantId, inventoryItem.drugId, inventoryItem.batchNumber]);
    
    if (stockResult.rows.length > 0) {
      const currentStock = stockResult.rows[0].current_stock;
      let quantityChange;
      
      switch (movementType) {
        case 'PURCHASE':
          quantityChange = Math.floor(10 + Math.random() * 50); // Add 10-60 units
          break;
        case 'SALE':
          quantityChange = -Math.floor(1 + Math.random() * 10); // Remove 1-10 units
          break;
        case 'RETURN':
          quantityChange = Math.floor(1 + Math.random() * 5); // Add 1-5 units
          break;
        case 'EXPIRY':
          quantityChange = -Math.floor(1 + Math.random() * 3); // Remove 1-3 units
          break;
        case 'ADJUSTMENT':
          quantityChange = Math.random() < 0.5 ? -2 : 2; // Small adjustment
          break;
      }
      
      const quantityBefore = currentStock;
      const quantityAfter = currentStock + quantityChange;
      
      if (quantityAfter >= 0) {
        const movementQuery = `
          INSERT INTO emr.pharmacy_stock_movements (
            inventory_id, movement_type, movement_date, quantity_before,
            quantity_change, quantity_after, reference_number, reference_type,
            reason, performed_by, created_at
          ) VALUES (
            (SELECT id FROM emr.pharmacy_inventory_enhanced WHERE tenant_id = $1 AND drug_id = $2 AND batch_number = $3),
            $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
          )
        `;
        
        await query(movementQuery, [
          tenantId,
          inventoryItem.drugId,
          inventoryItem.batchNumber,
          movementType,
          movementDate,
          quantityBefore,
          quantityChange,
          quantityAfter,
          `REF${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
          movementType.toLowerCase(),
          `${movementType} transaction`,
          'pharmacist-001'
        ]);
      }
    }
  }
  
  console.log('✅ Stock Movements Seeded Successfully');
}

// Generate pharmacy dashboard statistics
async function seedPharmacyStatistics() {
  console.log('📊 Seeding Pharmacy Statistics...');
  
  const stats = {
    totalInventoryItems: pharmacyInventory.length,
    criticalStockItems: pharmacyInventory.filter(item => item.currentStock <= item.minStock).length,
    lowStockItems: pharmacyInventory.filter(item => item.currentStock <= item.reorderLevel && item.currentStock > item.minStock).length,
    expiringItems: pharmacyInventory.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const today = new Date();
      const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return daysToExpiry <= 30;
    }).length,
    expiredItems: pharmacyInventory.filter(item => new Date(item.expiryDate) < new Date()).length,
    activePrescriptions: 125,
    completedPrescriptions: 280,
    todayDispensing: dispensingData.length,
    todayRevenue: dispensingData.reduce((sum, d) => sum + d.totalAmount, 0),
    monthlyRevenue: 125000,
    therapeuticCategories: 8,
    narcoticDrugs: pharmacyInventory.filter(item => item.schedule === 'H1').length,
    psychotropicDrugs: pharmacyInventory.filter(item => item.schedule === 'H1' || item.schedule === 'H2').length
  };
  
  // Store statistics for dashboard
  const statsQuery = `
    INSERT INTO emr.pharmacy_dashboard_stats (
      tenant_id, total_inventory_items, critical_stock_items, low_stock_items,
      expiring_items, expired_items, active_prescriptions, completed_prescriptions,
      today_dispensing, today_revenue, monthly_revenue, therapeutic_categories,
      narcotic_drugs, psychotropic_drugs, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
    ON CONFLICT (tenant_id) DO UPDATE SET
      total_inventory_items = EXCLUDED.total_inventory_items,
      critical_stock_items = EXCLUDED.critical_stock_items,
      low_stock_items = EXCLUDED.low_stock_items,
      expiring_items = EXCLUDED.expiring_items,
      expired_items = EXCLUDED.expired_items,
      active_prescriptions = EXCLUDED.active_prescriptions,
      completed_prescriptions = EXCLUDED.completed_prescriptions,
      today_dispensing = EXCLUDED.today_dispensing,
      today_revenue = EXCLUDED.today_revenue,
      monthly_revenue = EXCLUDED.monthly_revenue,
      therapeutic_categories = EXCLUDED.therapeutic_categories,
      narcotic_drugs = EXCLUDED.narcotic_drugs,
      psychotropic_drugs = EXCLUDED.psychotropic_drugs,
      updated_at = NOW()
  `;
  
  await query(statsQuery, [
    tenantId,
    stats.totalInventoryItems,
    stats.criticalStockItems,
    stats.lowStockItems,
    stats.expiringItems,
    stats.expiredItems,
    stats.activePrescriptions,
    stats.completedPrescriptions,
    stats.todayDispensing,
    stats.todayRevenue,
    stats.monthlyRevenue,
    stats.therapeuticCategories,
    stats.narcoticDrugs,
    stats.psychotropicDrugs
  ]);
  
  console.log('✅ Pharmacy Statistics Seeded Successfully');
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Pharmacy Module Data Seeding...');
    
    await seedEnhancedPharmacyInventory();
    await seedPharmacyDispensingLogs();
    await seedStockMovements();
    await seedPharmacyStatistics();
    
    console.log('🎉 Pharmacy Module Data Seeding Complete!');
    console.log('📈 Generated:');
    console.log('   - 24+ enhanced pharmacy inventory items');
    console.log('   - 10+ dispensing logs with detailed items');
    console.log('   - 100+ stock movements tracking');
    console.log('   - Complete inventory management data');
    console.log('   - Controlled substance tracking');
    console.log('   - Expiry and stock level monitoring');
    console.log('   - Pharmacy dashboard statistics');
    console.log('   - Multiple payment modes and billing');
    
  } catch (error) {
    console.error('❌ Error seeding pharmacy data:', error);
    process.exit(1);
  }
}

main();
