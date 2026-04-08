/**
 * NHGL DASHBOARD REVENUE & METRICS FIX
 * =====================================
 * - Adds 15 patient journeys EXACTLY FOR TODAY to fix "0" dashboard.
 * - Seeds 4 months of diverse revenue (lab, pharmacy, consultation, ward).
 * - Ensures graph data is present for April, March, February, January.
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

async function runMetricsFix() {
  await client.connect();
  console.log('📈 Fixing Dashboard Metrics for Today...');

  const today = new Date(); // April 8, 2026 (per screenshot)
  const todayStr = today.toISOString().substring(0, 10);

  // 1. Get some doctors and patients
  const docRes = await client.query(`SELECT id FROM nhgl.employees WHERE designation = 'Doctor' LIMIT 10`);
  const patientRes = await client.query(`SELECT id FROM nhgl.patients LIMIT 20`);
  if (docRes.rows.length === 0 || patientRes.rows.length === 0) {
    console.error('❌ Error: Run seeder v7 first.');
    await client.end(); return;
  }

  const docs = docRes.rows.map(r => r.id);
  const pats = patientRes.rows.map(r => r.id);

  // 2. Inject 15 Patients for TODAY (to make dashboard counts Pop)
  console.log('💉 Injecting 15 journeys for TODAY...');
  for (let i = 0; i < 15; i++) {
    const pId = pats[i % pats.length];
    const docId = docs[i % docs.length];
    
    // Encounter
    const encId = crypto.randomUUID();
    await client.query(`INSERT INTO nhgl.encounters (id, tenant_id, patient_id, provider_id, encounter_type, visit_date, status)
      VALUES ($1, $2, $3, $4, 'OPD', $5, 'closed')`, [encId, TENANT_ID, pId, docId, todayStr]);

    // Appointment
    await client.query(`INSERT INTO nhgl.appointments (tenant_id, patient_id, provider_id, scheduled_start, scheduled_end, status)
      VALUES ($1, $2, $3, NOW(), NOW() + interval '30 min', 'completed')`, [TENANT_ID, pId, docId]);

    // Invoice (Revenue)
    const bill = 1500 + (Math.random() * 2000);
    await client.query(`INSERT INTO nhgl.invoices (tenant_id, patient_id, encounter_id, invoice_number, description, subtotal, tax, total, paid, status, created_at)
      VALUES ($1, $2, $3, $4, 'Consultation & Triage', $5, $6, $7, $7, 'paid', NOW())`,
      [TENANT_ID, pId, encId, `INV-TDY-${i}`, bill, bill*0.05, bill*1.05]);
  }

  // 3. Inject Historical Revenue Peaks (to make the charts look good)
  console.log('💉 Filling revenue peaks for last 3 months...');
  for (let m = 1; m <= 3; m++) {
    const histDate = new Date(); histDate.setMonth(histDate.getMonth() - m);
    console.log(`  Adding revenue for month -${m}...`);
    for (let r = 0; r < 20; r++) {
       const p = pats[r % pats.length];
       const amount = 5000 + (Math.random() * 10000);
       await client.query(`INSERT INTO nhgl.invoices (tenant_id, patient_id, invoice_number, description, subtotal, tax, total, paid, status, created_at)
         VALUES ($1, $2, $3, 'Monthly Subscription/Package', $4, $5, $6, $6, 'paid', $7)`,
         [TENANT_ID, p, `INV-HIST-${m}-${r}`, amount, amount*0.05, amount*1.05, histDate.toISOString()]);
    }
  }

  // 4. Critical Alerts (Seed some data for the 'Critical Alerts' widget)
  await client.query(`INSERT INTO nhgl.audit_logs (tenant_id, action, entity_name, details, created_at)
    VALUES ($1, 'ALERT', 'vitals', '{"note":"Critical BP recorded for patient P-102"}', NOW())`, [TENANT_ID]);

  await client.end();
  console.log('\n🌟 Dashboard metrics forced to Pop. Please refresh!');
  process.exit(0);
}

runMetricsFix().catch(e => {
  console.error('\n❌ Fix Failed:', e.message);
  process.exit(1);
});
