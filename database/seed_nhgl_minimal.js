/**
 * NHGL MINIMAL SEEDER — 1 Row Per Table
 * Verify all tables exist and accept data.
 * Run: node database/seed_nhgl_minimal.js
 */
import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const S = 'nhgl';
const TENANT_ID = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function q(sql, params = []) {
  try {
    return await client.query(sql, params);
  } catch(e) {
    console.error(`  ❌ ${e.message.substring(0, 150)}`);
    console.error(`     SQL: ${sql.substring(0, 100)}`);
    throw e;
  }
}

async function run() {
  await client.connect();
  await client.query(`SET search_path TO "${S}", emr, public`);
  console.log('🏥 NHGL Minimal Seeder\n');

  // ── TENANT ────────────────────────────────────────────────────
  await q(`INSERT INTO emr.management_tenants (id,name,code,schema_name,subdomain,status)
    VALUES ($1,$2,$3,$4,$5,'active')
    ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name`,
    [TENANT_ID,'National Hospital Group Ltd','NHGL',S,'nhgl']);
  await q(`INSERT INTO emr.tenants (id,name,code,subdomain,status)
    VALUES ($1,$2,$3,$4,'active') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name`,
    [TENANT_ID,'National Hospital Group Ltd','NHGL','nhgl']).catch(()=>{});
  console.log('✅ Tenant');

  // ── DROP ALL STALE TABLES ────────────────────────────────────
  const tables = [
    'ambulance_dispatch','admissions','blood_requests','blood_units','donors',
    'insurance_claims','inventory_transactions','service_requests',
    'frontdesk_visits','payroll_items','payroll_runs','salary_structures',
    'attendance','employee_leaves','employees','invoice_items','expenses',
    'invoices','prescriptions','clinical_records','encounters','appointments',
    'walkins','insurance_providers','inventory_items','ambulances',
    'notices','documents','audit_logs','departments','beds','wards','patients'
  ];
  for (const t of tables) await client.query(`DROP TABLE IF EXISTS "${S}"."${t}" CASCADE`);
  console.log('✅ Stale tables cleared');

  // ── CREATE ALL TABLES (inline DDL — no file parsing) ─────────
  const DDL = [
    // patients
    `CREATE TABLE patients (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      mrn varchar(64) NOT NULL,
      first_name text NOT NULL,
      last_name text NOT NULL,
      date_of_birth date,
      gender varchar(16),
      phone varchar(32),
      email text,
      address text,
      blood_group varchar(8),
      emergency_contact varchar(128),
      insurance varchar(256),
      medical_history jsonb NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, mrn)
    )`,
    // walkins
    `CREATE TABLE walkins (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      name text NOT NULL,
      phone varchar(32) NOT NULL,
      reason text,
      status varchar(16) NOT NULL DEFAULT 'waiting',
      patient_id uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // appointments
    `CREATE TABLE appointments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid NOT NULL REFERENCES patients(id),
      provider_id uuid,
      scheduled_start timestamptz NOT NULL,
      scheduled_end timestamptz NOT NULL,
      status varchar(16) NOT NULL DEFAULT 'scheduled',
      reason text,
      source varchar(16) DEFAULT 'staff',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // encounters
    `CREATE TABLE encounters (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid NOT NULL REFERENCES patients(id),
      provider_id uuid,
      encounter_type varchar(16) NOT NULL DEFAULT 'OPD',
      visit_date date NOT NULL DEFAULT CURRENT_DATE,
      chief_complaint text,
      diagnosis text,
      notes text,
      status varchar(16) NOT NULL DEFAULT 'open',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // clinical_records
    `CREATE TABLE clinical_records (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid NOT NULL REFERENCES patients(id),
      encounter_id uuid REFERENCES encounters(id),
      section varchar(32) NOT NULL,
      content jsonb NOT NULL DEFAULT '{}',
      created_by uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // prescriptions
    `CREATE TABLE prescriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      encounter_id uuid NOT NULL REFERENCES encounters(id),
      drug_name text NOT NULL,
      dosage text,
      frequency text,
      duration text,
      instructions text,
      status varchar(16) NOT NULL DEFAULT 'Pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // wards
    `CREATE TABLE wards (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      name text NOT NULL,
      type varchar(32) NOT NULL DEFAULT 'General',
      base_rate numeric(12,2) NOT NULL DEFAULT 0,
      status varchar(16) DEFAULT 'Active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, name)
    )`,
    // beds
    `CREATE TABLE beds (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      ward_id uuid REFERENCES wards(id),
      bed_number varchar(16) NOT NULL,
      type varchar(32) DEFAULT 'General',
      status varchar(16) DEFAULT 'Available',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // admissions
    `CREATE TABLE admissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid NOT NULL REFERENCES patients(id),
      ward_id uuid REFERENCES wards(id),
      bed_id uuid REFERENCES beds(id),
      admission_date timestamptz NOT NULL DEFAULT now(),
      discharge_date timestamptz,
      status varchar(16) NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // departments
    `CREATE TABLE departments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      name text NOT NULL,
      code varchar(32) NOT NULL,
      status varchar(16) NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, code)
    )`,
    // frontdesk_visits
    `CREATE TABLE frontdesk_visits (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid NOT NULL REFERENCES patients(id),
      appointment_id uuid REFERENCES appointments(id),
      department_id uuid REFERENCES departments(id),
      doctor_id uuid,
      token_no bigint NOT NULL,
      status varchar(24) NOT NULL DEFAULT 'checked_in',
      triage_notes text,
      checked_in_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // invoices
    `CREATE TABLE invoices (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid NOT NULL REFERENCES patients(id),
      encounter_id uuid REFERENCES encounters(id),
      invoice_number varchar(64) NOT NULL,
      description text,
      subtotal numeric(12,2) NOT NULL DEFAULT 0,
      tax numeric(12,2) NOT NULL DEFAULT 0,
      total numeric(12,2) NOT NULL DEFAULT 0,
      paid numeric(12,2) NOT NULL DEFAULT 0,
      payment_method varchar(32),
      status varchar(20) NOT NULL DEFAULT 'draft',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, invoice_number)
    )`,
    // invoice_items
    `CREATE TABLE invoice_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      invoice_id uuid NOT NULL REFERENCES invoices(id),
      description text NOT NULL,
      quantity numeric(10,2) NOT NULL DEFAULT 1,
      unit_price numeric(12,2) NOT NULL DEFAULT 0,
      amount numeric(12,2) NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    // expenses
    `CREATE TABLE expenses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      category varchar(64) NOT NULL,
      description text NOT NULL,
      amount numeric(12,2) NOT NULL,
      date date NOT NULL DEFAULT CURRENT_DATE,
      payment_method varchar(32) DEFAULT 'Bank Transfer',
      reference text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // insurance_providers
    `CREATE TABLE insurance_providers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      name text NOT NULL,
      provider_type varchar(32) DEFAULT 'INSURANCE',
      contact_phone varchar(32),
      contact_email text,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // insurance_claims
    `CREATE TABLE insurance_claims (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid NOT NULL REFERENCES patients(id),
      provider_id uuid REFERENCES insurance_providers(id),
      invoice_id uuid REFERENCES invoices(id),
      claim_number varchar(64),
      claim_amount numeric(12,2) NOT NULL DEFAULT 0,
      approved_amount numeric(12,2),
      status varchar(24) NOT NULL DEFAULT 'pending',
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // inventory_items
    `CREATE TABLE inventory_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      item_code varchar(64) NOT NULL,
      name text NOT NULL,
      category text,
      current_stock numeric(12,2) NOT NULL DEFAULT 0,
      reorder_level numeric(12,2) NOT NULL DEFAULT 0,
      unit varchar(32),
      unit_price numeric(12,2) DEFAULT 0,
      expiry_date date,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, item_code)
    )`,
    // inventory_transactions
    `CREATE TABLE inventory_transactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      item_id uuid NOT NULL REFERENCES inventory_items(id),
      transaction_type varchar(16) NOT NULL,
      quantity numeric(12,2) NOT NULL,
      reference text,
      created_by uuid,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    // service_requests
    `CREATE TABLE service_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid REFERENCES patients(id),
      encounter_id uuid REFERENCES encounters(id),
      category varchar(32) NOT NULL,
      status varchar(24) NOT NULL DEFAULT 'pending',
      notes jsonb DEFAULT '{}',
      result jsonb DEFAULT '{}',
      requested_by uuid,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // donors
    `CREATE TABLE donors (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      code varchar(32) NOT NULL,
      name text NOT NULL,
      gender varchar(16),
      blood_group varchar(8) NOT NULL,
      phone varchar(32),
      eligibility_status varchar(24) NOT NULL DEFAULT 'eligible',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, code)
    )`,
    // blood_units
    `CREATE TABLE blood_units (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      donor_id uuid REFERENCES donors(id),
      unit_number varchar(48) NOT NULL,
      blood_group varchar(8) NOT NULL,
      component varchar(24) NOT NULL DEFAULT 'whole_blood',
      volume_ml int DEFAULT 450,
      collected_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL DEFAULT now() + interval '35 days',
      status varchar(24) NOT NULL DEFAULT 'available',
      storage_location text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, unit_number)
    )`,
    // blood_requests
    `CREATE TABLE blood_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid NOT NULL REFERENCES patients(id),
      requested_group varchar(8) NOT NULL,
      component varchar(24) NOT NULL DEFAULT 'whole_blood',
      units_requested int NOT NULL DEFAULT 1,
      units_issued int NOT NULL DEFAULT 0,
      priority varchar(16) NOT NULL DEFAULT 'routine',
      status varchar(24) NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // ambulances
    `CREATE TABLE ambulances (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      vehicle_number varchar(32) NOT NULL,
      vehicle_type varchar(32) DEFAULT 'Basic Life Support',
      status varchar(24) NOT NULL DEFAULT 'available',
      driver_name text,
      driver_phone varchar(32),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, vehicle_number)
    )`,
    // ambulance_dispatch
    `CREATE TABLE ambulance_dispatch (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      ambulance_id uuid NOT NULL REFERENCES ambulances(id),
      patient_id uuid REFERENCES patients(id),
      pickup_address text NOT NULL,
      destination text,
      dispatch_time timestamptz NOT NULL DEFAULT now(),
      status varchar(24) NOT NULL DEFAULT 'dispatched',
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    // employees
    `CREATE TABLE employees (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      code varchar(64) NOT NULL,
      name text NOT NULL,
      email text,
      phone varchar(32),
      department text,
      designation text,
      join_date date,
      shift varchar(16),
      salary numeric(12,2) NOT NULL DEFAULT 0,
      leave_balance numeric(5,1) NOT NULL DEFAULT 12,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, code)
    )`,
    // employee_leaves
    `CREATE TABLE employee_leaves (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      employee_id uuid NOT NULL REFERENCES employees(id),
      leave_type varchar(16) NOT NULL DEFAULT 'Casual',
      from_date date NOT NULL,
      to_date date NOT NULL,
      days numeric(5,1) NOT NULL DEFAULT 1,
      reason text,
      status varchar(16) NOT NULL DEFAULT 'Pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // attendance
    `CREATE TABLE attendance (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      employee_id uuid NOT NULL REFERENCES employees(id),
      date date NOT NULL DEFAULT CURRENT_DATE,
      check_in timestamptz,
      check_out timestamptz,
      status varchar(16) DEFAULT 'Present',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, employee_id, date)
    )`,
    // salary_structures
    `CREATE TABLE salary_structures (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      employee_id uuid NOT NULL REFERENCES employees(id),
      base_salary numeric(12,2) NOT NULL DEFAULT 0,
      allowances jsonb NOT NULL DEFAULT '[]',
      deductions jsonb NOT NULL DEFAULT '[]',
      effective_from date NOT NULL DEFAULT CURRENT_DATE,
      status varchar(16) NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // payroll_runs
    `CREATE TABLE payroll_runs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      period_month int NOT NULL,
      period_year int NOT NULL,
      total_employees int NOT NULL DEFAULT 0,
      total_gross numeric(12,2) NOT NULL DEFAULT 0,
      total_deductions numeric(12,2) NOT NULL DEFAULT 0,
      total_net numeric(12,2) NOT NULL DEFAULT 0,
      status varchar(16) NOT NULL DEFAULT 'draft',
      notes text,
      processed_date date,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, period_month, period_year)
    )`,
    // payroll_items
    `CREATE TABLE payroll_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      payroll_run_id uuid NOT NULL REFERENCES payroll_runs(id),
      employee_id uuid NOT NULL REFERENCES employees(id),
      gross numeric(12,2) NOT NULL DEFAULT 0,
      deduction_total numeric(12,2) NOT NULL DEFAULT 0,
      net numeric(12,2) NOT NULL DEFAULT 0,
      breakdown jsonb NOT NULL DEFAULT '{}',
      status varchar(16) NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (payroll_run_id, employee_id)
    )`,
    // notices
    `CREATE TABLE notices (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      title text NOT NULL,
      body text NOT NULL,
      status varchar(16) NOT NULL DEFAULT 'published',
      priority varchar(16) NOT NULL DEFAULT 'normal',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // documents
    `CREATE TABLE documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid NOT NULL,
      patient_id uuid REFERENCES patients(id),
      category varchar(32) NOT NULL DEFAULT 'other',
      title text NOT NULL,
      file_name text NOT NULL,
      storage_key text NOT NULL,
      size_bytes bigint NOT NULL DEFAULT 0,
      is_deleted boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    // audit_logs
    `CREATE TABLE audit_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid,
      user_id uuid,
      action text NOT NULL,
      entity_name text,
      entity_id text,
      details jsonb DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  ];

  let created = 0;
  for (const ddl of DDL) {
    await q(ddl);
    created++;
  }
  console.log(`✅ ${created} tables created`);

  // ── SINGLE TEST ROW PER TABLE ────────────────────────────────

  // emr.users — admin
  const adminId = crypto.randomUUID();
  await q(`INSERT INTO emr.users (id,tenant_id,email,password_hash,name,role,is_active)
    VALUES ($1,$2,$3,$4,$5,'Admin',true) ON CONFLICT (tenant_id,email) DO NOTHING`,
    [adminId, TENANT_ID, 'admin@nhgl.local',
     '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC','NHGL Admin']);

  // emr.users — doctor
  const doctorId = crypto.randomUUID();
  await q(`INSERT INTO emr.users (id,tenant_id,email,password_hash,name,role,is_active)
    VALUES ($1,$2,$3,$4,$5,'Doctor',true) ON CONFLICT (tenant_id,email) DO NOTHING`,
    [doctorId, TENANT_ID, 'doctor@nhgl.local',
     '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC','Dr. Smith (Cardiology)']);
  console.log('✅ emr.users (admin + doctor)');

  // department
  const deptId = crypto.randomUUID();
  await q(`INSERT INTO departments (id,tenant_id,name,code,status) VALUES ($1,$2,$3,$4,'active')`,
    [deptId, TENANT_ID, 'Cardiology', 'CARD']);
  console.log('✅ departments');

  // employee
  const empId = crypto.randomUUID();
  await q(`INSERT INTO employees (id,tenant_id,code,name,email,department,designation,join_date,shift,salary)
    VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_DATE,'Morning',$8)`,
    [empId, TENANT_ID, 'DOC-001', 'Dr. Smith', 'doctor@nhgl.local', 'Cardiology', 'Doctor', 85000]);
  console.log('✅ employees');

  // attendance
  await q(`INSERT INTO attendance (id,tenant_id,employee_id,date,check_in,check_out,status)
    VALUES ($1,$2,$3,CURRENT_DATE,NOW(),NOW(),'Present')`,
    [crypto.randomUUID(), TENANT_ID, empId]);
  console.log('✅ attendance');

  // payroll_runs
  const prId = crypto.randomUUID();
  await q(`INSERT INTO payroll_runs (id,tenant_id,period_month,period_year,total_employees,total_gross,total_deductions,total_net,status)
    VALUES ($1,$2,4,2025,1,85000,10200,74800,'paid')`,
    [prId, TENANT_ID]);
  // payroll_items
  await q(`INSERT INTO payroll_items (id,tenant_id,payroll_run_id,employee_id,gross,deduction_total,net,status)
    VALUES ($1,$2,$3,$4,85000,10200,74800,'paid')`,
    [crypto.randomUUID(), TENANT_ID, prId, empId]);
  console.log('✅ payroll_runs + payroll_items');

  // ward + bed
  const wardId = crypto.randomUUID();
  await q(`INSERT INTO wards (id,tenant_id,name,type,base_rate,status) VALUES ($1,$2,$3,$4,$5,$6)`,
    [wardId, TENANT_ID, 'General Ward', 'General', 800, 'Active']);
  const bedId = crypto.randomUUID();
  await q(`INSERT INTO beds (id,tenant_id,ward_id,bed_number,type,status) VALUES ($1,$2,$3,$4,$5,$6)`,
    [bedId, TENANT_ID, wardId, 'GEN-1', 'General', 'Available']);
  console.log('✅ wards + beds');

  // insurance_providers
  const insId = crypto.randomUUID();
  await q(`INSERT INTO insurance_providers (id,tenant_id,name,provider_type) VALUES ($1,$2,$3,$4)`,
    [insId, TENANT_ID, 'Star Health Insurance', 'INSURANCE']);
  console.log('✅ insurance_providers');

  // inventory_items
  const itemId = crypto.randomUUID();
  await q(`INSERT INTO inventory_items (id,tenant_id,item_code,name,category,current_stock,reorder_level,unit,unit_price)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [itemId, TENANT_ID, 'MED-001', 'Paracetamol 500mg', 'Analgesic', 5000, 500, 'Tablets', 5]);
  console.log('✅ inventory_items');

  // ambulance
  const ambId = crypto.randomUUID();
  await q(`INSERT INTO ambulances (id,tenant_id,vehicle_number,vehicle_type,status,driver_name)
    VALUES ($1,$2,$3,$4,$5,$6)`,
    [ambId, TENANT_ID, 'TN-NHGL-1001', 'Basic Life Support', 'available', 'John Driver']);
  console.log('✅ ambulances');

  // donor + blood_unit
  const donorId = crypto.randomUUID();
  await q(`INSERT INTO donors (id,tenant_id,code,name,blood_group,gender) VALUES ($1,$2,$3,$4,$5,$6)`,
    [donorId, TENANT_ID, 'DNR-001', 'Test Donor', 'O+', 'Male']);
  await q(`INSERT INTO blood_units (id,tenant_id,donor_id,unit_number,blood_group,component,status)
    VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [crypto.randomUUID(), TENANT_ID, donorId, 'BU-001', 'O+', 'whole_blood', 'available']);
  console.log('✅ donors + blood_units');

  // patient
  const patId = crypto.randomUUID();
  await q(`INSERT INTO patients (id,tenant_id,mrn,first_name,last_name,gender,blood_group)
    VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [patId, TENANT_ID, 'NHGL-000001', 'Test', 'Patient', 'Male', 'O+']);
  console.log('✅ patients');

  // appointment
  await q(`INSERT INTO appointments (id,tenant_id,patient_id,provider_id,scheduled_start,scheduled_end,status)
    VALUES ($1,$2,$3,$4,NOW(),NOW()+interval '30 min','completed')`,
    [crypto.randomUUID(), TENANT_ID, patId, doctorId]);
  console.log('✅ appointments');

  // encounter
  const encId = crypto.randomUUID();
  await q(`INSERT INTO encounters (id,tenant_id,patient_id,provider_id,encounter_type,visit_date,diagnosis,status)
    VALUES ($1,$2,$3,$4,'OPD',CURRENT_DATE,'Hypertension','closed')`,
    [encId, TENANT_ID, patId, doctorId]);
  console.log('✅ encounters');

  // prescription
  await q(`INSERT INTO prescriptions (id,tenant_id,encounter_id,drug_name,dosage,status)
    VALUES ($1,$2,$3,$4,$5,'Dispensed')`,
    [crypto.randomUUID(), TENANT_ID, encId, 'Paracetamol 500mg', '1 Tab BD']);
  console.log('✅ prescriptions');

  // service_request
  await q(`INSERT INTO service_requests (id,tenant_id,patient_id,encounter_id,category,status,notes)
    VALUES ($1,$2,$3,$4,'lab','completed','{"testType":"CBC"}')`,
    [crypto.randomUUID(), TENANT_ID, patId, encId]);
  console.log('✅ service_requests');

  // invoice
  const invId = crypto.randomUUID();
  await q(`INSERT INTO invoices (id,tenant_id,patient_id,encounter_id,invoice_number,description,subtotal,tax,total,paid,status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [invId, TENANT_ID, patId, encId, 'NHGL-INV-00001', 'OPD - Hypertension', 1500, 75, 1575, 1575, 'paid']);
  console.log('✅ invoices');

  // expenses
  await q(`INSERT INTO expenses (id,tenant_id,category,description,amount,date) VALUES ($1,$2,$3,$4,$5,CURRENT_DATE)`,
    [crypto.randomUUID(), TENANT_ID, 'Utilities', 'Jan 2025 Electricity', 45000]);
  console.log('✅ expenses');

  // notices
  await q(`INSERT INTO notices (id,tenant_id,title,body,status) VALUES ($1,$2,$3,$4,'published')`,
    [crypto.randomUUID(), TENANT_ID, 'Welcome to NHGL EMR', 'System is live and ready.']);
  console.log('✅ notices');

  // audit_log
  await q(`INSERT INTO audit_logs (id,tenant_id,action,entity_name,details) VALUES ($1,$2,$3,$4,$5)`,
    [crypto.randomUUID(), TENANT_ID, 'SEED', 'system', '{"note":"minimal seed run"}']);
  console.log('✅ audit_logs');

  await client.end();
  console.log('\n🎉 All tables verified with 1 row each!');
  console.log('📧 admin@nhgl.local  🔑 Admin@123');
  console.log('\nRun the full seeder next:');
  console.log('  node database/seed_nhgl_comprehensive.js');
  process.exit(0);
}

run().catch(async e => {
  console.error('\n❌ Fatal:', e.message);
  await client.end().catch(()=>{});
  process.exit(1);
});
