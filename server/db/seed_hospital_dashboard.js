
import { query } from './connection.js';

const NHGL_ID = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';

async function seed() {
  console.log('🚀 Starting Comprehensive Hospital Dashboard Seeding for NHGL...');

  try {
    // 1. Ensure NHGL Tenant exists in management_tenants if not there
    await query(`
      INSERT INTO nexus.tenants (id, name, code, status, subscription_tier, subdomain)
      VALUES ($1, 'NHGL Healthcare Institute', 'NHGL', 'active', 'enterprise', 'nhgl')
      ON CONFLICT (id) DO UPDATE SET status = 'active';
    `, [NHGL_ID]);

    // 2. SEED PATIENTS
    console.log('   👤 Seeding Patients...');
    const patientData = [
      ['P-101', 'James', 'Wilson', 'Male', '1985-05-12', '9876543210', 'james@example.com'],
      ['P-102', 'Maria', 'Garcia', 'Female', '1992-08-24', '9876543211', 'maria@example.com'],
      ['P-103', 'Robert', 'Chen', 'Male', '1978-11-03', '9876543212', 'robert@example.com'],
      ['P-104', 'Sarah', 'Miller', 'Female', '2001-02-15', '9876543213', 'sarah@example.com'],
      ['P-105', 'David', 'Smith', 'Male', '1965-12-30', '9876543214', 'david@example.com']
    ];

    for (const p of patientData) {
      await query(`
        INSERT INTO nexus.patients (mrn, first_name, last_name, gender, date_of_birth, phone, email, tenant_id)
        SELECT $1::text, $2::text, $3::text, $4::text, $5::date, $6::text, $7::text, $8::uuid
        WHERE NOT EXISTS (SELECT 1 FROM nexus.patients WHERE mrn = $1::text AND tenant_id = $8::uuid)
      `, [...p, NHGL_ID]);
    }

    const patients = await query("SELECT id FROM nexus.patients WHERE tenant_id = $1 LIMIT 5", [NHGL_ID]);
    const patientIds = patients.rows.map(r => r.id);

    if (patientIds.length < 1) {
       throw new Error('No patients found to link appointments/encounters');
    }

    // 3. SEED APPOINTMENTS (Today and Tomorrow)
    console.log('   📅 Seeding Appointments...');
    const appointmentData = [
      [patientIds[0], 'scheduled', 'Consultation', '2026-04-24 10:00:00'],
      [patientIds[1], 'checked_in', 'Follow-up', '2026-04-24 11:30:00'],
      [patientIds[2], 'triaged', 'Emergency', '2026-04-24 09:15:00'],
      [patientIds[3], 'completed', 'General Checkup', '2026-04-24 08:00:00'],
      [patientIds[4], 'scheduled', 'Consultation', '2026-04-25 14:00:00']
    ];

    for (const a of appointmentData) {
      await query(`
        INSERT INTO nexus.appointments (patient_id, status, reason, scheduled_start, scheduled_end, tenant_id)
        VALUES ($1, $2, $3, $4::timestamptz, ($4::timestamptz + interval '30 minutes'), $5)
      `, [...a, NHGL_ID]);
    }

    // 4. SEED ENCOUNTERS
    console.log('   🩺 Seeding Encounters...');
    for (let i = 0; i < 3; i++) {
      await query(`
        INSERT INTO nexus.encounters (patient_id, encounter_type, status, diagnosis, chief_complaint, visit_date, tenant_id)
        VALUES ($1, 'OPD', 'completed', 'General Fatigue', 'Patient reports low energy', CURRENT_DATE, $2)
      `, [patientIds[i], NHGL_ID]);
    }

    // 5. SEED INVOICES (Revenue)
    console.log('   💰 Seeding Invoices...');
    const invoiceData = [
      [patientIds[0], 1500, 150, 1650, 'paid', 'INV-NHGL-001'],
      [patientIds[1], 800, 80, 880, 'paid', 'INV-NHGL-002'],
      [patientIds[2], 2500, 250, 2750, 'pending', 'INV-NHGL-003'],
      [patientIds[3], 1200, 120, 1320, 'paid', 'INV-NHGL-004']
    ];

    for (const inv of invoiceData) {
      await query(`
        INSERT INTO nexus.invoices (patient_id, subtotal, tax, total, status, invoice_number, tenant_id)
        SELECT $1::uuid, $2::numeric, $3::numeric, $4::numeric, $5::text, $6::text, $7::uuid
        WHERE NOT EXISTS (SELECT 1 FROM nexus.invoices WHERE invoice_number = $6::text AND tenant_id = $7::uuid)
      `, [...inv, NHGL_ID]);
    }

    console.log('✅ Dashboard Data Seeding Complete for NHGL!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit();
  }
}

seed();
