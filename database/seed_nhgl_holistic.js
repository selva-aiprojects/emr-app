/**
 * NHGL HOLISTIC SEEDER v8.2 — FINAL CLINICAL DATASET
 * ===================================================
 * - SEEDS: 50 Appointments, 50 Diagnostics (Lab/Imaging), Pharmacy, Billing, HR.
 * - FIXES: Multi-run unique constraints & column alignment.
 */

import pg from 'pg';
import { faker } from '@faker-js/faker';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const S = 'nhgl';
const TENANT_ID = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runHolisticSeed() {
  await client.connect();
  console.log('🏥 Starting Holistic Integration v8.2...');

  // 1. Schema Alignment
  console.log('📐 Aligning schema columns...');
  await client.query(`CREATE TABLE IF NOT EXISTS nhgl.suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    contact_person text,
    phone varchar(32),
    email text,
    category varchar(32) DEFAULT 'Medical',
    status varchar(16) DEFAULT 'Active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (tenant_id, name)
  )`);
  await client.query(`CREATE TABLE IF NOT EXISTS nhgl.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    action text NOT NULL,
    entity_name text,
    details jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
  )`);
  await client.query(`ALTER TABLE nhgl.inventory_items ADD COLUMN IF NOT EXISTS unit varchar(32)`);

  // 1.2 Seed Suppliers
  console.log('🚚 Seeding Suppliers...');
  const suppliers = ['Global Pharma Corp', 'City Medical Supplies', 'Sunrise Diagnostics'];
  const supplierIds = [];
  for (const sName of suppliers) {
    const sId = crypto.randomUUID();
    await client.query(`INSERT INTO nhgl.suppliers (id, tenant_id, name, contact_person, category)
      VALUES ($1, $2, $3, $4, 'Pharmacy') ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [sId, TENANT_ID, sName, faker.person.fullName()]);
    supplierIds.push(sId);
  }

  // 1.5 Get Data
  const docs = (await client.query(`SELECT id, name FROM nhgl.employees WHERE designation = 'Doctor'`)).rows;
  const pats = (await client.query(`SELECT id FROM nhgl.patients`)).rows;

  if (docs.length === 0 || pats.length === 0) {
     console.error('❌ Missing core employees/patients. Run seed_nhgl_comprehensive.js first.');
     process.exit(1);
  }

  // 2. PHARMACY INVENTORY
  console.log('💊 Seeding Inventory...');
  const drugs = ['Paracetamol', 'Amoxicillin', 'Insulin', 'Metformin', 'Atorvastatin', 'Amlodipine', 'Ibuprofen', 'Cetirizine', 'Azithromycin', 'Omeprazole', 'Albumin', 'Heparin', 'Dopamine'];
  for (let i = 0; i < drugs.length; i++) {
    const isCritical = i < 3;
    const stock = isCritical ? 5 : 500;
    const reorder = 20;
    
    await client.query(`INSERT INTO nhgl.inventory_items (id, tenant_id, item_code, name, category, current_stock, reorder_level, unit, unit_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (tenant_id, item_code) DO UPDATE SET current_stock = $6`,
      [crypto.randomUUID(), TENANT_ID, `DRG-${100+i}`, drugs[i], 'Pharmacy', stock, reorder, 'Strip', 150 + (i*10)]);

    if (isCritical) {
      await client.query(`INSERT INTO nhgl.audit_logs (tenant_id, action, entity_name, details, created_at)
        VALUES ($1, 'ALERT', 'inventory', $2, NOW())`, 
        [TENANT_ID, JSON.stringify({ note: `Critical Shortage: ${drugs[i]} (Stock: ${stock})`, severity: 'high' })]);
    }
  }

  // 3. APPOINTMENTS (Next 7 days)
  console.log('📅 Seeding 50 Meaningful Appointments...');
  const apptSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  const reasons = ['Routine Checkup', 'Follow-up', 'Consultation', 'Emergency', 'Lab Review'];
  const statuses = ['scheduled', 'completed', 'cancelled', 'no_show'];
  
  for (let i = 0; i < 50; i++) {
    const p = pats[i % pats.length];
    const d = docs[i % docs.length];
    const dayOffset = Math.floor(i / 10);
    const slotTime = apptSlots[i % apptSlots.length];
    const start = new Date();
    start.setDate(start.getDate() + dayOffset);
    start.setHours(parseInt(slotTime.split(':')[0]), 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60000);
    
    await client.query(`INSERT INTO nhgl.appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [TENANT_ID, p.id, d.id, start.toISOString(), end.toISOString(), statuses[i % 4], reasons[i % 5]]);
  }

  // 4. DIAGNOSTICS (Lab/Imaging)
  console.log('🧪 Seeding 50 Diagnostic Records...');
  const labTests = ['CBC', 'Lipid Profile', 'Thyroid Profile', 'HbA1c', 'Vitamin D'];
  const imagingTests = ['X-Ray Chest', 'MRI Brain', 'CT Abdomen', 'USG Pelvis'];

  for (let i = 0; i < 50; i++) {
    const p = pats[i % pats.length];
    const isLab = i % 2 === 0;
    const testName = isLab ? labTests[i % labTests.length] : imagingTests[i % imagingTests.length];
    const isCritical = i % 15 === 0;
    
    await client.query(`INSERT INTO nhgl.service_requests (tenant_id, patient_id, category, status, notes, result, created_at)
      VALUES ($1, $2, $3, 'completed', $4, $5, NOW() - interval '${i} hours')`,
      [TENANT_ID, p.id, isLab ? 'lab' : 'imaging',
       JSON.stringify({ testName: testName, criticalFlag: isCritical }),
       JSON.stringify({ findings: isCritical ? `Critical Abnormal value in ${testName}` : `Normal findings for ${testName}`, summary: `Generated by NHGL Lab` })
      ]);
  }

  // 5. BILLING & DISCHARGES
  console.log('💰 Seeding Professional Billing & Retrofitting Diagnoses...');
  const commonDiagnoses = ['Essential Hypertension', 'Type 2 Diabetes', 'Acute Pharyngitis', 'Gastroenteritis', 'Upper Respiratory Infection', 'Low Back Pain', 'Urinary Tract Infection', 'Anxiety Disorder', 'Osteoarthritis', 'Dermatitis'];
  
  for (let i = 0; i < 15; i++) {
    const p = pats[i % pats.length];
    const invId = crypto.randomUUID();
    const encId = crypto.randomUUID();
    const diagnosis = commonDiagnoses[i % commonDiagnoses.length];
    
    await client.query(`INSERT INTO nhgl.encounters (id, tenant_id, patient_id, encounter_type, visit_date, status, diagnosis)
      VALUES ($1, $2, $3, 'IPD', CURRENT_DATE - interval '3 days', 'closed', $4)`, 
      [encId, TENANT_ID, p.id, diagnosis]);

    await client.query(`INSERT INTO nhgl.invoices (id, tenant_id, patient_id, encounter_id, invoice_number, description, subtotal, tax, total, paid, status)
      VALUES ($1, $2, $3, $4, $5, 'Holistic IPD Case', 25000, 1250, 26250, 26250, 'paid')`,
      [invId, TENANT_ID, p.id, encId, `BN-${Date.now()}-${i}`]);
    
    await client.query(`INSERT INTO nhgl.invoice_items (tenant_id, invoice_id, description, quantity, unit_price, amount) VALUES
      ($1, $2, 'Room Charges', 3, 5000, 15000),
      ($1, $2, 'Pharmacy & Services', 1, 11250, 11250)`, [TENANT_ID, invId]);
  }

  // 5.5 Retrofit any empty diagnoses for historical encounters
  console.log('🩹 Retrofitting historical diagnoses...');
  await client.query(`UPDATE nhgl.encounters 
    SET diagnosis = $1 
    WHERE tenant_id = $2 AND (diagnosis IS NULL OR diagnosis = '')`, 
    ['General Consultation', TENANT_ID]);

  await client.end();
  console.log('\n🌟 Holistic Seed v8.2 Completed Successfully.');
  process.exit(0);
}

runHolisticSeed().catch(e => {
  console.error('\n❌ Holistic Seed Failed:', e.message);
  process.exit(1);
});
