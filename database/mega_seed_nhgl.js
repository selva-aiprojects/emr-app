/**
 * NHGL MEGA SEEDER v9.2 — 1 YEAR DEEP ANALYTICS + DIVERSE STAFF
 * ============================================================
 * - SEEDS: 12 months history, 500 Patients, 1200 Encounters.
 * - STAFFING: Diversifies employees with Lab, Pharmacy, Admin roles.
 */

import pg from 'pg';
import { faker } from '@faker-js/faker';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function megaSeed() {
  await client.connect();
  
  // Resolve Dynamic Tenant ID
  const tenantRes = await client.query(`SELECT id FROM emr.management_tenants WHERE code = 'NHGL'`);
  if (tenantRes.rows.length === 0) {
    console.error('❌ Error: NHGL tenant not found in registry. Run bootstrap first.');
    process.exit(1);
  }
  const TENANT_ID = tenantRes.rows[0].id;
  console.log(`🚀 Launching Mega-Seeder v9.3 for Tenant: ${TENANT_ID}`);

  // 1. Diversify Staffing
  console.log('🧑‍💼  Diversifying Hospital Workforce...');
  const diverseRoles = ['Doctor', 'Nurse', 'Lab Technician', 'Radiologist', 'Pharmacist', 'Receptionist', 'Accountant', 'HR Manager', 'IT Support', 'Maintenance'];
  const staff = (await client.query(`SELECT id FROM nhgl.employees WHERE tenant_id = $1`, [TENANT_ID])).rows;
  
  for (let i = 0; i < staff.length; i++) {
    const role = diverseRoles[i % diverseRoles.length];
    await client.query(`UPDATE nhgl.employees SET designation = $1 WHERE id = $2`, [role, staff[i].id]);
  }

  // 2. Clean existing operational data (Child-first order)
  console.log('🗑️  Clearing existing NHGL operational data (Cascading Deletes)...');
  const tables = [
    'invoice_items', 'invoices', 'service_requests', 'prescriptions', 
    'admissions', 'vital_signs', 'clinical_notes', 'attendance', 
    'encounters', 'appointments', 'walkins', 'patients', 'audit_logs'
  ];
  
  for (const t of tables) {
    try {
      await client.query(`DELETE FROM nhgl.${t} WHERE tenant_id = $1`, [TENANT_ID]);
    } catch (e) {}
  }

  // 3. Seed 500 Patients
  console.log('👥 Seeding 500 Patients (12-Month Span)...');
  const patients = [];
  for (let i = 0; i < 500; i++) {
    const id = crypto.randomUUID();
    const created = faker.date.past({ years: 1.2 });
    await client.query(`INSERT INTO nhgl.patients (id, tenant_id, mrn, first_name, last_name, gender, date_of_birth, phone, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, TENANT_ID, `MRN-${10000+i}`, faker.person.firstName(), faker.person.lastName(), i%2===0?'Male':'Female', faker.date.birthdate({ min: 0, max: 90, mode: 'age' }), faker.phone.number(), created]);
    patients.push({ id, created });
  }

  // 4. Seed 1200 Encounters & Invoices (Historical Mix)
  console.log('🏥 Seeding 1200 Encounters & Financials...');
  const docs = (await client.query(`SELECT id FROM nhgl.employees WHERE designation = 'Doctor'`)).rows;
  const commonDiagnoses = ['Essential Hypertension', 'Type 2 Diabetes', 'Acute Pharyngitis', 'Gastroenteritis', 'Upper Respiratory Infection', 'Low Back Pain', 'Urinary Tract Infection', 'Anxiety Disorder', 'Osteoarthritis', 'Dermatitis'];

  for (let i = 0; i < 1200; i++) {
    const p = patients[i % patients.length];
    const doc = docs[i % docs.length];
    const date = faker.date.between({ from: p.created, to: new Date() });
    const eId = crypto.randomUUID();
    const diag = commonDiagnoses[i % commonDiagnoses.length];
    const type = i % 5 === 0 ? 'IPD' : 'OPD';
    
    // Encounter
    await client.query(`INSERT INTO nhgl.encounters (id, tenant_id, patient_id, provider_id, encounter_type, visit_date, diagnosis, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'closed')`,
      [eId, TENANT_ID, p.id, doc.id, type, date.toISOString(), diag]);

    // Financial Record (Fixed subtotal/tax)
    const baseAmount = type === 'IPD' ? 15000 : 800;
    const total = baseAmount + (Math.random() * 2000);
    const subtotal = total / 1.1; 
    const tax = total - subtotal;
    
    await client.query(`INSERT INTO nhgl.invoices (tenant_id, patient_id, encounter_id, invoice_number, subtotal, tax, total, paid, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7, 'paid', $8)`,
      [TENANT_ID, p.id, eId, `INV-${Date.now()}-${i}`, subtotal, tax, total, date.toISOString()]);
  }

  // 5. Inject Today Vitality
  console.log('⚡ Injecting Today Appointments...');
  for (let i = 0; i < 30; i++) {
    const p = patients[i % patients.length];
    const doc = docs[i % docs.length];
    const start = new Date();
    start.setHours(9 + (i % 8), (i % 4) * 15, 0, 0);
    await client.query(`INSERT INTO nhgl.appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status, reason)
      VALUES ($1, $2, $3, $4, $5, 'scheduled', 'Routine Checkup')`,
      [TENANT_ID, p.id, doc.id, start.toISOString(), new Date(start.getTime() + 15 * 60000).toISOString()]);
  }

  await client.end();
  console.log('\n🌟 Mega-Seed v9.2 SUCCESS. High-density diverse dataset applied.');
  process.exit(0);
}

megaSeed().catch(err => {
  console.error('\n❌ Mega-Seed Failed:', err.message);
  process.exit(1);
});
