/**
 * SEED SCRIPT: CLINICAL DASHBOARDS (PHARMACY & LAB)
 * Population script for NHGL Tenant to demonstrate Dashboard features.
 */

import { query } from './connection.js';

const NHGL_ID = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';

async function seed() {
  console.log('🚀 Starting Clinical Dashboard Seeding for NHGL...');

  try {
    // 1. PHARMACY DRUG MASTER (if empty)
    const checkDrugSql = "SELECT id FROM drug_master LIMIT 1";
    const checkDrug = await query(checkDrugSql);
    
    if (checkDrug.rows.length === 0) {
      console.log('   📦 Seeding Drug Master...');
      const drugMasterSql = `
        INSERT INTO drug_master (name, brand_name, generic_name, dosage_form, strength, category, schedule_category)
        VALUES 
        ('Amoxicillin 500mg', 'Amoxil', 'Amoxicillin', 'Capsule', '500mg', 'Antibiotic', 'H'),
        ('Paracetamol 650mg', 'Dolo-650', 'Paracetamol', 'Tablet', '650mg', 'Antipyretic', 'OTC'),
        ('Insulin Glargine', 'Lantus', 'Insulin Glargine', 'Injection', '100 IU/ml', 'Antidiabetic', 'H'),
        ('Atorvastatin 10mg', 'Lipitor', 'Atorvastatin', 'Tablet', '10mg', 'Statins', 'H')
      `;
      await query(drugMasterSql);
    }

    const drugs = await query("SELECT id, generic_name FROM drug_master");
    const drugMap = {};
    drugs.rows.forEach(d => drugMap[d.generic_name] = d.id);

    // 2. PHARMACY INVENTORY (Enhanced)
    console.log('   📦 Seeding Pharmacy Inventory...');
    const inventorySql = `
      INSERT INTO pharmacy_inventory_enhanced (
        tenant_id, drug_id, batch_number, expiry_date, current_stock, minimum_stock_level, reorder_level, mrp, status
      ) VALUES 
      ($1, $2, 'BCH-001', CURRENT_DATE + INTERVAL '120 days', 500, 100, 200, 15.50, 'ACTIVE'),
      ($1, $3, 'BCH-002', CURRENT_DATE + INTERVAL '10 days', 50, 60, 100, 2.00, 'ACTIVE'),
      ($1, $4, 'BCH-003', CURRENT_DATE + INTERVAL '365 days', 20, 10, 25, 450.00, 'ACTIVE')
      ON CONFLICT DO NOTHING
    `;
    await query(inventorySql, [NHGL_ID, drugMap['Amoxicillin'], drugMap['Paracetamol'], drugMap['Insulin Glargine']]);

    // 3. LAB ORDERS (Service Requests)
    console.log('   📦 Seeding Lab Orders...');
    const labSql = `
      INSERT INTO service_requests (
        tenant_id, patient_id, category, display, status, priority, requested_at
      ) VALUES 
      ($1, (SELECT id FROM patients LIMIT 1), 'lab', 'Complete Blood Count', 'pending', 'routine', NOW() - INTERVAL '2 hours'),
      ($1, (SELECT id FROM patients OFFSET 1 LIMIT 1), 'lab', 'Lipid Profile', 'pending', 'urgent', NOW() - INTERVAL '1 hour'),
      ($1, (SELECT id FROM patients LIMIT 1), 'lab', 'Blood Sugar (Fasting)', 'completed', 'routine', NOW() - INTERVAL '1 day')
      ON CONFLICT DO NOTHING
    `;
    await query(labSql, [NHGL_ID]);

    console.log('✅ Seeding complete! Check Pharmacy/Lab dashboards.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit();
  }
}

seed();
