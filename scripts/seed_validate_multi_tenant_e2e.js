import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pkg from 'pg';

dotenv.config();

const { Client } = pkg;
const API_URL = process.env.API_URL || 'http://127.0.0.1:4000/api';
const DEFAULT_PASSWORD = 'Test@123';
const RUN_TAG = `RUN${Date.now().toString().slice(-8)}`;
const TARGET_TENANTS = [
  { code: 'EHS', name: 'Enterprise Hospital Systems', subdomain: 'enterprise' },
  { code: 'city_general', name: 'City General Hospital', subdomain: 'city-general' },
];

const ROLE_CATALOG = [
  { key: 'admin', role: 'Admin', name: 'Platform Admin' },
  { key: 'doctor', role: 'Doctor', name: 'Lead Doctor' },
  { key: 'nurse', role: 'Nurse', name: 'Senior Nurse' },
  { key: 'lab', role: 'Lab', name: 'Lab Specialist' },
  { key: 'pharmacy', role: 'Pharmacy', name: 'Pharmacy Officer' },
  { key: 'support', role: 'Support Staff', name: 'Support Staff' },
  { key: 'frontoffice', role: 'Front Office', name: 'Front Office Executive' },
  { key: 'billing', role: 'Billing', name: 'Billing Executive' },
  { key: 'accounts', role: 'Accounts', name: 'Accounts Team' },
  { key: 'hr', role: 'HR', name: 'HR Manager' },
  { key: 'operations', role: 'Operations', name: 'Operations Manager' },
  { key: 'insurance', role: 'Insurance', name: 'Insurance Desk' },
  { key: 'management', role: 'Management', name: 'Management User' },
  { key: 'auditor', role: 'Auditor', name: 'Internal Auditor' },
  { key: 'inventory', role: 'Inventory', name: 'Inventory Controller' },
];

const EMPLOYEE_BLUEPRINT = [
  { department: 'Doctor', designation: 'Consultant Physician', shift: 'Morning', salary: 250000 },
  { department: 'Nursing', designation: 'Staff Nurse', shift: 'Morning', salary: 85000 },
  { department: 'Lab', designation: 'Lab Technician', shift: 'Morning', salary: 72000 },
  { department: 'Pharmacy', designation: 'Pharmacist', shift: 'Evening', salary: 70000 },
  { department: 'Support', designation: 'Ward Assistant', shift: 'Rotating', salary: 45000 },
  { department: 'HR', designation: 'HR Executive', shift: 'Morning', salary: 65000 },
  { department: 'Operations', designation: 'Operations Analyst', shift: 'Morning', salary: 90000 },
  { department: 'Billing', designation: 'Accounts Executive', shift: 'Morning', salary: 78000 },
  { department: 'Emergency', designation: 'Emergency Nurse', shift: 'Night', salary: 92000 },
  { department: 'Inpatient', designation: 'IP Coordinator', shift: 'Rotating', salary: 88000 },
];

const BED_POOL = [
  'WARD-A-BED-01',
  'WARD-A-BED-02',
  'WARD-A-BED-03',
  'WARD-B-BED-01',
  'WARD-B-BED-02',
  'WARD-B-BED-03',
  'ICU-BED-01',
  'ICU-BED-02',
];

function isoDateDaysFromNow(days = 0) {
  const dt = new Date(Date.now() + (days * 86400000));
  return dt.toISOString().slice(0, 10);
}

function isoDateTimeFromNow(minutes = 0) {
  const dt = new Date(Date.now() + (minutes * 60000));
  const tzOff = dt.getTimezoneOffset() * 60000;
  return new Date(dt - tzOff).toISOString().slice(0, 16);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function apiRequest(path, { method = 'GET', token, tenantId, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (tenantId) headers['x-tenant-id'] = tenantId;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const detail = typeof payload === 'string' ? payload : JSON.stringify(payload);
    throw new Error(`${method} ${path} failed (${res.status}): ${detail}`);
  }

  return payload;
}

async function login(tenantId, email, password) {
  return apiRequest('/login', {
    method: 'POST',
    body: { tenantId, email, password },
  });
}

async function ensureHealth() {
  const health = await apiRequest('/health');
  assert(health.ok === true, 'API health check failed');
}

async function ensureTenant(client, spec) {
  const existing = await client.query('SELECT id, code FROM emr.tenants WHERE code = $1', [spec.code]);
  if (existing.rows.length > 0) {
    const tenantId = existing.rows[0].id;
    await client.query(
      `UPDATE emr.tenants
       SET subscription_tier = 'Enterprise',
           status = 'active',
           features = COALESCE(features, '{}'::jsonb) || '{"inventory":true,"telehealth":true}'::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [tenantId]
    );
    return { id: tenantId, code: spec.code };
  }

  const inserted = await client.query(
    `INSERT INTO emr.tenants (name, code, subdomain, subscription_tier, status, theme, features)
     VALUES ($1, $2, $3, 'Enterprise', 'active',
             '{"primary":"#0f172a","accent":"#2563eb"}'::jsonb,
             '{"inventory":true,"telehealth":true}'::jsonb)
     RETURNING id, code`,
    [spec.name, spec.code, spec.subdomain]
  );
  return inserted.rows[0];
}

async function ensureRoleUsers(client, tenant) {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const usersByKey = {};

  for (const r of ROLE_CATALOG) {
    const email = `${r.key}.${tenant.code.toLowerCase()}@emr.local`;
    const name = `${r.name} ${tenant.code.toUpperCase()}`;

    const found = await client.query(
      'SELECT id FROM emr.users WHERE tenant_id = $1 AND LOWER(email) = LOWER($2)',
      [tenant.id, email]
    );

    if (found.rows.length > 0) {
      await client.query(
        `UPDATE emr.users
         SET name = $1, role = $2, password_hash = $3, is_active = true, updated_at = NOW()
         WHERE id = $4`,
        [name, r.role, hash, found.rows[0].id]
      );
      usersByKey[r.key] = { id: found.rows[0].id, email, role: r.role, name };
    } else {
      const created = await client.query(
        `INSERT INTO emr.users (tenant_id, email, password_hash, name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING id`,
        [tenant.id, email, hash, name, r.role]
      );
      usersByKey[r.key] = { id: created.rows[0].id, email, role: r.role, name };
    }
  }

  return usersByKey;
}

async function buildTenantSessions(tenantId, usersByKey) {
  const sessions = {};
  for (const key of Object.keys(usersByKey)) {
    const u = usersByKey[key];
    const result = await login(tenantId, u.email, DEFAULT_PASSWORD);
    sessions[key] = {
      token: result.token,
      user: result.user,
      tenantId: result.tenantId,
      email: u.email,
      role: u.role,
    };
  }
  return sessions;
}

async function seedPatients(sessions, tenantId, tenantCode) {
  const adminToken = sessions.admin.token;
  const genders = ['Male', 'Female', 'Other'];
  const patients = [];

  for (let i = 0; i < 20; i++) {
    const payload = {
      firstName: `P${tenantCode}${String(i + 1).padStart(2, '0')}`,
      lastName: `Workflow`,
      dob: isoDateDaysFromNow(-1 * (3650 + i * 13)),
      gender: genders[i % genders.length],
      phone: `90000${String(tenantCode.length).padStart(2, '0')}${String(i).padStart(4, '0')}`,
      email: `patient${i + 1}.${tenantCode.toLowerCase()}@example.com`,
      bloodGroup: ['A+', 'B+', 'O+', 'AB+'][i % 4],
      insurance: i % 2 === 0 ? 'Corporate Plan' : 'Self',
      chronicConditions: i % 3 === 0 ? 'Hypertension' : '',
      allergies: i % 4 === 0 ? 'Penicillin' : '',
    };
    const patient = await apiRequest('/patients', {
      method: 'POST',
      token: adminToken,
      tenantId,
      body: payload,
    });
    patients.push(patient);
  }

  return patients;
}

async function seedWalkinsAndConvert(sessions, tenantId, tenantCode) {
  const walkins = [];
  const frontToken = sessions.frontoffice.token;
  const adminToken = sessions.admin.token;

  for (let i = 0; i < 8; i++) {
    const w = await apiRequest('/walkins', {
      method: 'POST',
      token: frontToken,
      tenantId,
      body: {
        name: `Walkin ${tenantCode} ${i + 1}`,
        phone: `81111${String(i).padStart(5, '0')}`,
        reason: i % 2 === 0 ? 'Fever and observation' : 'Injury assessment',
      },
    });
    walkins.push(w);
  }

  const converted = [];
  for (const w of walkins.slice(0, 4)) {
    const p = await apiRequest(`/walkins/${w.id}/convert`, {
      method: 'POST',
      token: adminToken,
      tenantId,
      body: {
        dob: isoDateDaysFromNow(-4000),
        gender: 'Male',
      },
    });
    converted.push(p);
  }

  return { walkins, converted };
}

async function seedEmployees(sessions, tenantId, tenantCode) {
  const hrToken = sessions.admin.token;
  const created = [];
  for (let i = 0; i < EMPLOYEE_BLUEPRINT.length; i++) {
    const b = EMPLOYEE_BLUEPRINT[i];
    const code = `${tenantCode.toUpperCase()}-EMP-${Date.now().toString().slice(-6)}-${String(i + 1).padStart(2, '0')}`;
    const e = await apiRequest('/employees', {
      method: 'POST',
      token: hrToken,
      tenantId,
      body: {
        name: `${b.designation} ${tenantCode.toUpperCase()} ${i + 1}`,
        code,
        department: b.department,
        designation: b.designation,
        joinDate: isoDateDaysFromNow(-60 - i),
        shift: b.shift,
        salary: b.salary,
      },
    });
    created.push(e);
  }

  for (const e of created.slice(0, 3)) {
    await apiRequest(`/employees/${e.id}/leaves`, {
      method: 'POST',
      token: hrToken,
      tenantId,
      body: { from: isoDateDaysFromNow(3), to: isoDateDaysFromNow(5), type: 'Casual' },
    });
  }

  for (const e of created.slice(0, 5)) {
    const today = isoDateDaysFromNow(0);
    await apiRequest('/attendance', {
      method: 'POST',
      token: hrToken,
      tenantId,
      body: {
        employeeId: e.id,
        date: today,
        status: 'Present',
        checkIn: `${today}T09:00:00Z`,
        checkOut: `${today}T18:00:00Z`,
      },
    });
  }

  return created;
}

async function seedInventory(sessions, tenantId, tenantCode) {
  const invToken = sessions.inventory.token;
  const items = [];
  const seedItems = [
    { code: `${tenantCode}-MED-001`, name: 'Paracetamol 500mg', category: 'Medicines' },
    { code: `${tenantCode}-MED-002`, name: 'Amoxicillin 250mg', category: 'Medicines' },
    { code: `${tenantCode}-MED-003`, name: 'ORS Sachet', category: 'Consumables' },
    { code: `${tenantCode}-SUP-004`, name: 'Syringe 5ml', category: 'Supplies' },
    { code: `${tenantCode}-SUP-005`, name: 'IV Set', category: 'Supplies' },
  ];

  for (let i = 0; i < seedItems.length; i++) {
    const it = seedItems[i];
    try {
      const row = await apiRequest('/inventory-items', {
        method: 'POST',
        token: invToken,
        tenantId,
        body: {
          code: it.code,
          name: it.name,
          category: it.category,
          stock: 300 - i * 20,
          reorder: 30,
        },
      });
      items.push(row);
    } catch (error) {
      if (!String(error.message).includes('409')) throw error;
    }
  }

  const all = await apiRequest('/inventory-items', { token: invToken, tenantId });
  return all.length > 0 ? all : items;
}

async function seedAppointments(sessions, tenantId, patients) {
  const frontToken = sessions.frontoffice.token;
  const doctorId = sessions.doctor.user.id;
  const created = [];
  for (let i = 0; i < 12; i++) {
    const start = isoDateTimeFromNow((i + 1) * 45);
    const end = isoDateTimeFromNow((i + 1) * 45 + 30);
    const a = await apiRequest('/appointments', {
      method: 'POST',
      token: frontToken,
      tenantId,
      body: {
        patientId: patients[i].id,
        providerId: doctorId,
        start,
        end,
        reason: i % 3 === 0 ? 'Emergency follow-up' : 'General consultation',
      },
    });
    created.push(a);
  }

  for (const a of created.slice(0, 4)) {
    await apiRequest(`/appointments/${a.id}/status`, {
      method: 'PATCH',
      token: frontToken,
      tenantId,
      body: { status: 'checked_in' },
    });
  }

  for (const a of created.slice(4, 8)) {
    await apiRequest(`/appointments/${a.id}/status`, {
      method: 'PATCH',
      token: frontToken,
      tenantId,
      body: { status: 'completed' },
    });
  }

  return created;
}

async function seedEncountersPrescriptionsBilling(sessions, tenantId, patients, inventoryItems) {
  const doctorToken = sessions.doctor.token;
  const billingToken = sessions.billing.token;
  const pharmacyToken = sessions.pharmacy.token;
  const labToken = sessions.lab.token;
  const doctorId = sessions.doctor.user.id;
  const encounters = [];
  const prescriptions = [];
  const invoices = [];
  const bedAssignments = [];

  const types = [
    ...Array(8).fill('Out-patient'),
    ...Array(6).fill('In-patient'),
    ...Array(6).fill('Emergency'),
  ];

  for (let i = 0; i < 20; i++) {
    const encounterType = types[i];
    const bedTag = encounterType === 'In-patient'
      ? `${RUN_TAG}-${BED_POOL[bedAssignments.length % BED_POOL.length]}`
      : null;

    const enc = await apiRequest('/encounters', {
      method: 'POST',
      token: doctorToken,
      tenantId,
      body: {
        patientId: patients[i].id,
        providerId: doctorId,
        type: encounterType,
        complaint: `${encounterType} complaint #${i + 1}`,
        diagnosis: `${encounterType} diagnosis #${i + 1}`,
        notes: bedTag
          ? `Clinical observation with treatment plan | Bed Allocation: ${bedTag}`
          : 'Clinical observation with treatment plan',
      },
    });
    encounters.push(enc);
    if (bedTag) {
      bedAssignments.push({
        encounterId: enc.id,
        patientId: enc.patientId || enc.patient_id,
        bedId: bedTag,
      });
    }

    const rx = await apiRequest('/prescriptions', {
      method: 'POST',
      token: doctorToken,
      tenantId,
      body: {
        encounter_id: enc.id,
        drug_name: i % 2 === 0 ? 'Paracetamol 500mg' : 'Amoxicillin 250mg',
        dosage: '1-0-1',
        frequency: 'Twice daily',
        duration: '5 days',
        instructions: 'After food',
      },
    });
    prescriptions.push(rx);

    if (i < 15) {
      const inv = await apiRequest('/invoices', {
        method: 'POST',
        token: billingToken,
        tenantId,
        body: {
          patientId: patients[i].id,
          description: `Consultation and treatment #${i + 1}`,
          amount: 1200 + i * 100,
          taxPercent: 5,
          paymentMethod: 'Pending',
        },
      });
      invoices.push(inv);
      if (i < 10) {
        await apiRequest(`/invoices/${inv.id}/pay`, {
          method: 'PATCH',
          token: billingToken,
          tenantId,
          body: { paymentMethod: 'Card' },
        });
      }
    }
  }

  const inventoryItemId = inventoryItems[0]?.id;
  assert(inventoryItemId, 'No inventory item available for dispense');

  for (const rx of prescriptions.slice(0, 10)) {
    await apiRequest(`/prescriptions/${rx.id}/dispense`, {
      method: 'POST',
      token: pharmacyToken,
      tenantId,
      body: { itemId: inventoryItemId, quantity: 5 },
    });
  }

  for (const p of patients.slice(0, 10)) {
    await apiRequest(`/patients/${p.id}/clinical`, {
      method: 'PATCH',
      token: labToken,
      tenantId,
      body: {
        section: 'testReports',
        payload: {
          date: isoDateDaysFromNow(0),
          testName: 'CBC',
          result: 'Normal',
          notes: 'Auto-seeded validation report',
        },
      },
    });
  }

  // Discharge first 3 in-patient encounters after settlement.
  const ipd = encounters.filter((e) => e.type === 'In-patient').slice(0, 3);
  const dischargedEncounterIds = [];
  const dischargeErrors = [];
  for (const enc of ipd) {
    const settlement = await apiRequest('/invoices', {
      method: 'POST',
      token: billingToken,
      tenantId,
      body: {
        patientId: enc.patientId || enc.patient_id,
        description: `Discharge settlement for ${enc.id}`,
        amount: 4200,
        taxPercent: 12,
        paymentMethod: 'Pending',
      },
    });
    await apiRequest(`/invoices/${settlement.id}/pay`, {
      method: 'PATCH',
      token: billingToken,
      tenantId,
      body: { paymentMethod: 'UPI' },
    });

    try {
      await apiRequest(`/encounters/${enc.id}/discharge`, {
        method: 'POST',
        token: doctorToken,
        tenantId,
        body: { diagnosis: 'Stable and fit for discharge', notes: 'Discharge completed after settlement' },
      });
      dischargedEncounterIds.push(enc.id);
    } catch (error) {
      dischargeErrors.push({ encounterId: enc.id, error: error.message });
    }
  }

  return {
    encounters,
    prescriptions,
    invoices,
    bedAssignments,
    dischargedEncounterIds,
    dischargeErrors,
  };
}

async function seedExpensesInsuranceAndReports(sessions, tenantId, tenantCode, patients, encounters, invoices) {
  const billingToken = sessions.billing.token;
  const hrToken = sessions.admin.token;
  const managementToken = sessions.management.token;
  const doctorToken = sessions.doctor.token;

  const expenseCategories = ['Purchase', 'Salary', 'Maintenance', 'Utilities', 'Subscriptions', 'Equipment'];
  for (let i = 0; i < expenseCategories.length; i++) {
    await apiRequest('/expenses', {
      method: 'POST',
      token: billingToken,
      tenantId,
      body: {
        category: expenseCategories[i],
        description: `${expenseCategories[i]} expense ${i + 1}`,
        amount: 1500 + i * 250,
        date: isoDateDaysFromNow(-i),
        paymentMethod: 'Bank Transfer',
        reference: `${tenantCode}-EXP-${Date.now().toString().slice(-5)}-${i + 1}`,
      },
    });
  }

  const provider = await apiRequest('/insurance/providers', {
    method: 'POST',
    token: billingToken,
    tenantId,
    body: {
      name: `${tenantCode.toUpperCase()} Secure Insurance ${RUN_TAG}`,
      type: 'Corporate',
      coverageLimit: 1000000,
      contactPerson: 'Coverage Officer',
      phone: '9999999999',
      email: `insurance.${tenantCode.toLowerCase()}.${RUN_TAG.toLowerCase()}@corp.example`,
    },
  });

  await apiRequest('/insurance/claims', {
    method: 'POST',
    token: billingToken,
    tenantId,
    body: {
      patientId: patients[0].id,
      providerId: provider.id,
      amount: 3500,
      claimNumber: `${tenantCode.toUpperCase()}-CLM-${Date.now().toString().slice(-6)}`,
      encounterId: encounters[0]?.id || null,
      invoiceId: invoices[0]?.id || null,
    },
  });

  // Validations across workflows/roles
  const summary = await apiRequest('/reports/summary', { token: managementToken, tenantId });
  const financials = await apiRequest(`/reports/financials?month=${isoDateDaysFromNow(0).slice(0, 7)}-01`, {
    token: managementToken,
    tenantId,
  });
  const payouts = await apiRequest('/reports/payouts', { token: managementToken, tenantId });
  const realtime = await apiRequest('/realtime-tick', { token: doctorToken, tenantId });
  const attendance = await apiRequest(`/attendance?date=${isoDateDaysFromNow(0)}`, { token: hrToken, tenantId });

  assert(summary.periodical.openAppointments >= 0, 'Invalid reports summary response');
  assert(typeof financials.income === 'number', 'Invalid financial summary response');
  assert(Array.isArray(payouts), 'Invalid doctor payouts response');
  assert(Array.isArray(realtime.appointments), 'Invalid realtime tick response');
  assert(Array.isArray(attendance), 'Invalid attendance response');

  // Additional bootstrap/role validation for major workflows.
  const bootstrapChecks = ['doctor', 'nurse', 'lab', 'pharmacy', 'billing', 'hr', 'operations', 'management', 'support'];
  for (const k of bootstrapChecks) {
    await apiRequest(`/bootstrap?tenantId=${tenantId}&userId=${sessions[k].user.id}`, {
      token: sessions[k].token,
      tenantId,
    });
  }
}

async function validateBedManagement(sessions, tenantId, bedAssignments) {
  const doctorToken = sessions.doctor.token;
  const encounters = await apiRequest('/encounters', { token: doctorToken, tenantId });
  const openIpd = encounters.filter(
    (e) =>
      (e.type === 'In-patient' || e.encounter_type === 'In-patient' || e.encounter_type === 'IPD') &&
      e.status === 'open'
  );

  const extractedBeds = openIpd
    .map((e) => {
      const raw = e.notes || '';
      const marker = 'Bed Allocation: ';
      const idx = raw.indexOf(marker);
      if (idx === -1) return null;
      return raw.slice(idx + marker.length).trim();
    })
    .filter((bedId) => bedId && bedId.includes(RUN_TAG));

  const uniqueBeds = new Set(extractedBeds);
  assert(uniqueBeds.size === extractedBeds.length, 'Bed management validation failed: duplicate active bed allocation found');

  return {
    assignedBedsTotal: bedAssignments.length,
    activeBedOccupancy: extractedBeds.length,
    uniqueActiveBeds: uniqueBeds.size,
  };
}

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Starting multi-tenant workflow seeding + validation...');
  await ensureHealth();
  await client.connect();

  const tenantSummaries = [];
  try {
    for (const spec of TARGET_TENANTS) {
      console.log(`\n--- Tenant: ${spec.code} ---`);

      const tenant = await ensureTenant(client, spec);
      const usersByKey = await ensureRoleUsers(client, tenant);
      const sessions = await buildTenantSessions(tenant.id, usersByKey);

      const patients = await seedPatients(sessions, tenant.id, tenant.code);
      const walkinInfo = await seedWalkinsAndConvert(sessions, tenant.id, tenant.code);
      const employees = await seedEmployees(sessions, tenant.id, tenant.code);
      const inventory = await seedInventory(sessions, tenant.id, tenant.code);
      const appointments = await seedAppointments(sessions, tenant.id, patients);
      const clinical = await seedEncountersPrescriptionsBilling(sessions, tenant.id, patients, inventory);
      await seedExpensesInsuranceAndReports(
        sessions,
        tenant.id,
        tenant.code,
        patients,
        clinical.encounters,
        clinical.invoices
      );
      const bedStatus = await validateBedManagement(sessions, tenant.id, clinical.bedAssignments);

      tenantSummaries.push({
        tenantCode: tenant.code,
        tenantId: tenant.id,
        usersSeeded: Object.keys(usersByKey).length,
        patientsCreated: patients.length,
        walkinsCreated: walkinInfo.walkins.length,
        walkinsConverted: walkinInfo.converted.length,
        employeesCreated: employees.length,
        inventoryItems: inventory.length,
        appointmentsCreated: appointments.length,
        encountersCreated: clinical.encounters.length,
        prescriptionsCreated: clinical.prescriptions.length,
        invoicesCreated: clinical.invoices.length,
        dischargeSuccess: clinical.dischargedEncounterIds.length,
        dischargeAttemptFailures: clinical.dischargeErrors.length,
        bedsAssigned: bedStatus.assignedBedsTotal,
        activeBedOccupancy: bedStatus.activeBedOccupancy,
      });
    }
  } finally {
    await client.end();
  }

  console.log('\nValidation completed for all tenants.');
  console.table(tenantSummaries);
  console.log('\nRole login password used for seeded users:', DEFAULT_PASSWORD);
}

run().catch((error) => {
  console.error('\nFAILED:', error.message);
  process.exit(1);
});
