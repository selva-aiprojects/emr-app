/**
 * NHGL PHARMACY & INVENTORY BOOSTER
 * Syncs inventory_items, pharmacy_inventory_enhanced, and prescriptions_enhanced
 * Target: Tenant b01f0cdc-4e8b-4db5-ba71-e657a414695e
 */
import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const TENANT_ID = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
const S = 'nhgl';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  await client.query(`SET search_path TO "${S}", emr, public`);
  console.log('🚀 Boosting Pharmacy & Inventory for NHGL...');

  // 1. CLEAR STALE DATA
  await client.query(`DELETE FROM inventory_items WHERE tenant_id::text = $1`, [TENANT_ID]);
  await client.query(`DELETE FROM pharmacy_inventory_enhanced WHERE tenant_id::text = $1`, [TENANT_ID]);
  await client.query(`DELETE FROM prescriptions_enhanced WHERE tenant_id::text = $1`, [TENANT_ID]);

  // 2. INVENTORY ITEMS (Stock Ledger)
  const medicines = [
    { code: 'PHAR-001', name: 'Dopamine 200mg/5ml Injection', cat: 'PHARMACY', stock: 45, reorder: 50 },
    { code: 'PHAR-002', name: 'Heparin 5000 IU Injection', cat: 'PHARMACY', stock: 120, reorder: 30 },
    { code: 'PHAR-003', name: 'Atropine 0.6mg Injection', cat: 'PHARMACY', stock: 85, reorder: 20 },
    { code: 'PHAR-004', name: 'Adrenaline 1mg/ml', cat: 'PHARMACY', stock: 12, reorder: 25 },
    { code: 'PHAR-005', name: 'Furosemide 20mg/2ml', cat: 'PHARMACY', stock: 200, reorder: 50 },
    { code: 'PHAR-006', name: 'Hydrocortisone 100mg', cat: 'PHARMACY', stock: 65, reorder: 20 },
    { code: 'PHAR-007', name: 'Lignocaine 2%', cat: 'PHARMACY', stock: 42, reorder: 15 },
    { code: 'PHAR-008', name: 'Magnesium Sulfate 50%', cat: 'PHARMACY', stock: 35, reorder: 10 },
    { code: 'PHAR-009', name: 'Potassium Chloride 15%', cat: 'PHARMACY', stock: 78, reorder: 20 },
    { code: 'PHAR-010', name: 'Sodium Bicarbonate 7.5%', cat: 'PHARMACY', stock: 15, reorder: 20 },
    { code: 'PHAR-011', name: 'Calcium Gluconate 10%', cat: 'PHARMACY', stock: 55, reorder: 15 },
    { code: 'PHAR-012', name: 'Amiodarone 150mg/3ml', cat: 'PHARMACY', stock: 28, reorder: 10 },
    { code: 'PHAR-013', name: 'Digoxin 0.5mg/2ml', cat: 'PHARMACY', stock: 40, reorder: 10 },
    { code: 'PHAR-014', name: 'Dextrose 25% 100ml', cat: 'PHARMACY', stock: 95, reorder: 30 }
  ];

  for (const m of medicines) {
    const id = crypto.randomUUID();
    await client.query(`
      INSERT INTO inventory_items (id, tenant_id, item_code, name, category, current_stock, reorder_level, unit, unit_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Ampoule', 120)
    `, [id, TENANT_ID, m.code, m.name, m.cat, m.stock, m.reorder]);

    // 3. ENHANCED BATCHES (PHARMACY DASHBOARD METRICS)
    await client.query(`
      INSERT INTO pharmacy_inventory_enhanced (tenant_id, drug_id, batch_number, expiry_date, current_stock, quantity_remaining, unit_price, status)
      VALUES ($1, $2, $3, $4, $5, $5, 120, 'ACTIVE')
    `, [TENANT_ID, id, 'BATCH-' + m.code.split('-')[1], 
        new Date(Date.now() + (Math.random() > 0.8 ? -10 : 90) * 24 * 60 * 60 * 1000), // Some expired
        m.stock]);
  }

  // 4. PRESCRIPTIONS (Active Prescriptions count)
  console.log('📝 Injecting active prescriptions...');
  // Find a patient first
  const patRes = await client.query(`SELECT id FROM patients WHERE tenant_id::text = $1 LIMIT 1`, [TENANT_ID]);
  if (patRes.rows.length > 0) {
    const patId = patRes.rows[0].id;
    for (let i = 1; i <= 5; i++) {
      await client.query(`
        INSERT INTO prescriptions_enhanced (tenant_id, patient_id, prescription_number, status, prescription_date)
        VALUES ($1, $2, $3, 'PENDING', CURRENT_DATE)
      `, [TENANT_ID, patId, 'RX-NHGL-' + (1000 + i)]);
    }
  }

  await client.end();
  console.log('✅ NHGL Pharmacy Dataset Synced Successfully.');
}

run().catch(e => {
  console.error('❌ Failed:', e.message);
  process.exit(1);
});
