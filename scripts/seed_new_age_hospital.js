
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const TEST_PASSWORD_HASH = bcrypt.hashSync('Test@123', 10);

async function seedNewAgeHospital() {
  if (process.env.DEMO_SEED !== '1') {
    console.error('❌ Refusing to run seed_new_age_hospital without DEMO_SEED=1');
    process.exit(1);
  }

  console.log('🚀 Seeding demo tenant "New Age Hospital" (tenant-scoped only)...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 0. Clean up ONLY existing New Age Hospital tenant (if present)
    console.log('--- Cleaning existing New Age Hospital demo data (if any) ---');
    const existingTenant = await client.query(
      'SELECT id FROM emr.tenants WHERE code = $1',
      ['NAH']
    );
    if (existingTenant.rowCount) {
      const existingTenantId = existingTenant.rows[0].id;
      console.log('   Found existing NAH tenant, cleaning tenant-scoped data...');

      // 0a. Clean up tables WITHOUT tenant_id column first (using subqueries)
      const subqueryTables = [
        { table: 'emr.prescription_items', parent: 'emr.prescriptions', parentId: 'id', fk: 'prescription_id' },
        { table: 'emr.prescription_items', parent: 'emr.drug_master', parentId: 'drug_id', fk: 'drug_id' },
        { table: 'emr.drug_batches', parent: 'emr.drug_master', parentId: 'drug_id', fk: 'drug_id' },
        { table: 'emr.purchase_order_items', parent: 'emr.purchase_orders', parentId: 'order_id', fk: 'order_id' },
        { table: 'emr.purchase_order_items', parent: 'emr.drug_master', parentId: 'drug_id', fk: 'drug_id' },
        { table: 'emr.drug_interactions', parent: 'emr.drug_master', parentId: 'drug_id', fk: 'drug_a' },
        { table: 'emr.drug_interactions', parent: 'emr.drug_master', parentId: 'drug_id', fk: 'drug_b' },
        { table: 'emr.sessions', parent: 'emr.users', parentId: 'id', fk: 'user_id' }
      ];

      for (const t of subqueryTables) {
        await client.query(
          `DELETE FROM ${t.table} WHERE ${t.fk} IN (SELECT ${t.parentId} FROM ${t.parent} WHERE tenant_id = $1)`,
          [existingTenantId]
        );
      }

      // 0b. Clean up tables WITH tenant_id column - Order matters!
      const tenantTablesInOrder = [
        'emr.audit_logs',
        'emr.drug_allergies',
        'emr.medication_administrations',
        'emr.medication_schedules',
        'emr.patient_medication_allocations',
        'emr.pharmacy_alerts',
        'emr.pharmacy_inventory',
        'emr.ward_stock',
        'emr.drug_master',
        'emr.prescriptions',
        'emr.claims',
        'emr.invoice_items',
        'emr.invoices',
        'emr.purchase_orders',
        'emr.vendors',
        'emr.attendance',
        'emr.employee_leaves',
        'emr.encounters',
        'emr.appointments',
        'emr.clinical_records',
        'emr.walkins',
        'emr.patients',
        'emr.beds',
        'emr.wards',
        'emr.insurance_providers',
        'emr.users'
      ];

      for (const tableName of tenantTablesInOrder) {
        await client.query(
          `DELETE FROM ${tableName} WHERE tenant_id = $1`,
          [existingTenantId]
        );
      }

      await client.query('DELETE FROM emr.tenants WHERE id = $1', [existingTenantId]);
      console.log('   Previous NAH tenant and associated data removed.');
    }

    // 1. Create Tenant (demo-only)
    console.log('--- Creating Tenant ---');
    const tenantResult = await client.query(`
      INSERT INTO emr.tenants (name, code, subdomain, theme, features, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['New Age Hospital', 'NAH', 'newage', JSON.stringify({ primary: '#0ea5e9', accent: '#f59e0b' }), JSON.stringify({
      inventory: true, billing: true, emr: true, insurance: true, pharmacy: true, employees: true,
      startDate: '2026-02-01'
    }), 'active']);
    const tenantId = tenantResult.rows[0].id;

    // 2. Add Staff (Users & Employees)
    console.log('--- Adding Staff with Supervisor Hierarchy ---');
    const staffRoles = [
      { name: 'NAH Admin', email: 'admin@nah.com', role: 'Admin', designation: 'Administrator' },
      { name: 'Dr. Sarah Smith', email: 'sarah@nah.com', role: 'Doctor', designation: 'Chief Medical Officer' },
      { name: 'Nurse Joy', email: 'joy@nah.com', role: 'Nurse', designation: 'Head Nurse' },
      { name: 'Leo Lab Assistant', email: 'leo@nah.com', role: 'Lab Assistant', designation: 'Senior Lab Assistant' },
      { name: 'Peter Pharmacist', email: 'peter@nah.com', role: 'Pharmacist', designation: 'Lead Pharmacist' },
      { name: 'Iris Insurance Clerk', email: 'iris@nah.com', role: 'Insurance Clerk', designation: 'Claims Specialist' },
      { name: 'Sam Supervisor', email: 'sam@nah.com', role: 'Supervisor', designation: 'Operations Supervisor' },
      { name: 'Alex Accountant', email: 'alex@nah.com', role: 'Accountant', designation: 'Senior Accountant' },
      { name: 'Tina Auditor', email: 'tina@nah.com', role: 'Auditor', designation: 'Internal Auditor' }
    ];

    const userMap = {};
    const employeeMap = {};
    
    // First pass: Create Users and base Employee records
    for (const s of staffRoles) {
      const userRes = await client.query(`
        INSERT INTO emr.users (tenant_id, name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING id
      `, [tenantId, s.name, s.email, TEST_PASSWORD_HASH, s.role]);
      const userId = userRes.rows[0].id;
      userMap[s.role] = userId;

      const empRes = await client.query(`
        INSERT INTO emr.employees (tenant_id, name, code, designation, join_date, salary)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [tenantId, s.name, `EMP-${s.role.toUpperCase().replace(' ', '')}`, s.designation, '2026-02-01', 50000]);
      employeeMap[s.role] = empRes.rows[0].id;
    }

    // Second pass: Set Supervisor hierarchy
    // Admin supervises Doctors, Accountants, and Supervisors
    // Supervisor supervises Nurses, Lab Assistants, Pharmacists, and Insurance Clerks
    console.log('--- Setting Supervisor Hierarchy ---');
    const supervisorMapping = [
      { empRole: 'Doctor', bossRole: 'Admin' },
      { empRole: 'Accountant', bossRole: 'Admin' },
      { empRole: 'Supervisor', bossRole: 'Admin' },
      { empRole: 'Nurse', bossRole: 'Supervisor' },
      { empRole: 'Lab Assistant', bossRole: 'Supervisor' },
      { empRole: 'Pharmacist', bossRole: 'Supervisor' },
      { empRole: 'Insurance Clerk', bossRole: 'Supervisor' }
    ];

    for (const mapping of supervisorMapping) {
      await client.query(`
        UPDATE emr.employees 
        SET supervisor_id = $1 
        WHERE id = $2
      `, [employeeMap[mapping.bossRole], employeeMap[mapping.empRole]]);
    }

    // 3. Infrastructure (Wards & Beds)
    console.log('--- Adding Infrastructure ---');
    const wardConfigs = [
      { name: 'General Ward A', type: 'General', rate: 1500, beds: 10 },
      { name: 'ICU Unit 1', type: 'ICU', rate: 8500, beds: 4 },
      { name: 'Private Suite 101', type: 'Private', rate: 5000, beds: 1 }
    ];

    for (const w of wardConfigs) {
      const wardRes = await client.query(`
        INSERT INTO emr.wards (tenant_id, name, type, base_rate)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [tenantId, w.name, w.type, w.rate]);
      const wardId = wardRes.rows[0].id;

      for (let i = 1; i <= w.beds; i++) {
        await client.query(`
          INSERT INTO emr.beds (tenant_id, ward_id, bed_number)
          VALUES ($1, $2, $3)
        `, [tenantId, wardId, `${w.name.charAt(0)}${i}`]);
      }
    }

    // 4. Master Data: Insurance & Vendors
    console.log('--- Adding Master Data ---');
    const insuranceRes = await client.query(`
      INSERT INTO emr.insurance_providers (tenant_id, name, type, contact_person, email, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [tenantId, 'Global Health Insurance', 'Private', 'Mark Insure', 'claims@globalhealth.com', 'Active']);
    const insuranceId = insuranceRes.rows[0].id;

    const vendorRes = await client.query(`
      INSERT INTO emr.vendors (tenant_id, vendor_name, contact_person, email, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING vendor_id
    `, [tenantId, 'PharmaCorp Solutions', 'Victor Vendor', 'sales@pharmacorp.com', 'active']);
    const vendorId = vendorRes.rows[0].vendor_id;

    // 5. Drugs & Opening Stock
    console.log('--- Adding Medication Stock ---');
    const drugItems = [
      { name: 'Paracetamol 500mg', form: 'tablet', price: 2.5, stock: 2000 },
      { name: 'Amoxicillin 250mg', form: 'capsule', price: 15.0, stock: 1000 },
      { name: 'Insulin Glargine', form: 'injection', price: 450.0, stock: 100 },
      { name: 'Aspirin 81mg', form: 'tablet', price: 1.2, stock: 5000 }
    ];

    for (const d of drugItems) {
      const drugRes = await client.query(`
        INSERT INTO emr.drug_master (tenant_id, generic_name, dosage_form, status, reorder_threshold)
        VALUES ($1, $2, $3, 'active', 100)
        RETURNING drug_id
      `, [tenantId, d.name, d.form]);
      const drugId = drugRes.rows[0].drug_id;

      await client.query(`
        INSERT INTO emr.drug_batches (tenant_id, drug_id, batch_number, expiry_date, quantity_received, quantity_remaining, purchase_price)
        VALUES ($1, $2, $3, $4, $5, $5, $6)
      `, [tenantId, drugId, `BCH-${Math.floor(Math.random()*9000)+1000}`, '2028-01-01', d.stock, d.price]);
    }

    // 6. Assets & Expenses
    console.log('--- Recording Assets (Hospital Machinery) ---');
    await client.query(`
      INSERT INTO emr.expenses (tenant_id, category, description, amount, date, payment_method, recorded_by)
      VALUES ($1, 'Equipment', 'MRI System', 1200000, '2026-02-05', 'Bank Transfer', $2)
    `, [tenantId, userMap['Admin']]);

    // 7. Initial Cash in Hand (100,000 INR)
    console.log('--- Setting Initial Cash in Hand ---');
    const cashPatientRes = await client.query(`
      INSERT INTO emr.patients (tenant_id, first_name, last_name, mrn, date_of_birth, gender)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [tenantId, 'Hospital', 'Internal', 'NAH-CASH-001', '1900-01-01', 'Other']);
    const cashPatientId = cashPatientRes.rows[0].id;
    await client.query(`
      INSERT INTO emr.invoices (tenant_id, patient_id, description, subtotal, tax, total, paid, status, created_at, invoice_number)
      VALUES ($1, $2, 'Opening Cash Balance Settlement', 100000, 0, 100000, 100000, 'paid', '2026-02-01', 'INV-CASH-001')
    `, [tenantId, cashPatientId]);

    // 8. Test Patients: OP & IP
    console.log('--- Adding Test Patients ---');
    
    // IP Patient (John Doe)
    const ipPatientRes = await client.query(`
      INSERT INTO emr.patients (tenant_id, first_name, last_name, mrn, date_of_birth, gender, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [tenantId, 'John', 'Doe', 'NAH-P-1001', '1980-01-01', 'Male', '9988776655']);
    const ipPatientId = ipPatientRes.rows[0].id;

    await client.query(`
      INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, encounter_type, status, chief_complaint, diagnosis)
      VALUES ($1, $2, $3, 'In-patient', 'open', 'Post-Op Recovery', 'Appendix Removal Recovery')
    `, [tenantId, ipPatientId, userMap['Doctor']]);

    // OP Patient (Jane Smith)
    const opPatientRes = await client.query(`
      INSERT INTO emr.patients (tenant_id, first_name, last_name, mrn, date_of_birth, gender, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [tenantId, 'Jane', 'Smith', 'NAH-P-1002', '1992-06-15', 'Female', '8877665544']);
    const opPatientId = opPatientRes.rows[0].id;

    await client.query(`
      INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, encounter_type, status, chief_complaint, diagnosis)
      VALUES ($1, $2, $3, 'Out-patient', 'closed', 'Routine Checkup', 'General Malaise')
    `, [tenantId, opPatientId, userMap['Doctor']]);

    // 9. HR Resource Simulation (Attendance)
    console.log('--- Seeding HR Attendance for Feb 2026 ---');
    const employees = await client.query('SELECT id FROM emr.employees WHERE tenant_id = $1', [tenantId]);
    for (const emp of employees.rows) {
      for (let day = 1; day <= 10; day++) {
        const dateStr = `2026-02-${day.toString().padStart(2, '0')}`;
        await client.query(`
          INSERT INTO emr.attendance (tenant_id, employee_id, date, status, check_in, check_out)
          VALUES ($1, $2, $3, 'Present', '2026-02-01 08:30:00+00', '2026-02-01 17:30:00+00')
        `, [tenantId, emp.id, dateStr]);
      }
    }

    await client.query('COMMIT');
    console.log(`✅ SUCCESS: "New Age Hospital" seeded with clean data! ID: ${tenantId}`);
    
    console.log('\n--- Login Credentials ---');
    console.log('Admin: admin@nah.com / Test@123');
    console.log('Doctor: sarah@nah.com / Test@123');
    console.log('Supervisor: sam@nah.com / Test@123');
    console.log('Accountant: alex@nah.com / Test@123');
    console.log('Tenant Code: NAH');

  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('❌ SEEDING FAILED:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedNewAgeHospital();
