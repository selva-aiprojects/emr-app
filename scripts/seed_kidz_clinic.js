
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

async function seedKidzClinic() {
  console.log('🚀 Seeding "Kidz Clinic" (Pediatric Specialty)...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create Tenant (Kidz Clinic)
    console.log('--- Creating Tenant: Kidz Clinic ---');
    const tenantResult = await client.query(`
      INSERT INTO emr.tenants (name, code, subdomain, theme, features, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['Kidz Clinic', 'KC', 'kidz', JSON.stringify({ primary: '#f472b6', accent: '#38bdf8' }), JSON.stringify({
      inventory: true, billing: true, emr: true, insurance: true, pharmacy: true, employees: true,
      pediatricSpecialty: true,
      startDate: '2026-02-01'
    }), 'active']);
    const tenantId = tenantResult.rows[0].id;

    // 2. Pediatric Specialized Staff
    console.log('--- Adding Specialty Staff ---');
    const staffRoles = [
      { name: 'KC Admin', email: 'admin@kidz.com', role: 'Admin', designation: 'Clinic Manager' },
      { name: 'Dr. Emily Pediatric', email: 'emily@kidz.com', role: 'Doctor', designation: 'Senior Pediatrician' },
      { name: 'Nurse Daisy', email: 'daisy@kidz.com', role: 'Nurse', designation: 'Pediatric Care Nurse' },
      { name: 'Leo Lab-KC', email: 'leo-kc@kidz.com', role: 'Lab', designation: 'Pediatric Lab Specialist' },
      { name: 'Pam Pharm-KC', email: 'pam@kidz.com', role: 'Pharmacy', designation: 'Pharmacy Lead' }
    ];

    const userMap = {};
    for (const s of staffRoles) {
      const userRes = await client.query(`
        INSERT INTO emr.users (tenant_id, name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING id
      `, [tenantId, s.name, s.email, TEST_PASSWORD_HASH, s.role]);
      const userId = userRes.rows[0].id;
      userMap[s.role] = userId;

      await client.query(`
        INSERT INTO emr.employees (tenant_id, name, code, designation, join_date, salary)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [tenantId, s.name, `EMP-KC-${s.role.toUpperCase()}`, s.designation, '2026-02-01', 45000]);
    }

    // 3. Infrastructure: NICU & Nursery
    console.log('--- Adding Pediatric Wards ---');
    const wardConfigs = [
      { name: 'NICU (Neonatal)', type: 'ICU', rate: 12000, beds: 6 },
      { name: 'Pediatric Ward', type: 'General', rate: 2000, beds: 12 }
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
        `, [tenantId, wardId, `K-${w.name.charAt(0)}${i}`]);
      }
    }

    // 4. Pediatric Medication Stock
    console.log('--- Adding Pediatric Meds ---');
    const drugItems = [
      { name: 'Calpol 120 (Paracetamol Syrup)', form: 'syrup', price: 120, stock: 500 },
      { name: 'Crocin Drops (Infant)', form: 'drops', price: 65, stock: 300 },
      { name: 'Augmentin Duo 457mg', form: 'syrup', price: 280, stock: 150 }
    ];

    for (const d of drugItems) {
      const drugRes = await client.query(`
        INSERT INTO emr.drug_master (tenant_id, generic_name, dosage_form, status, reorder_threshold)
        VALUES ($1, $2, $3, 'active', 50)
        RETURNING drug_id
      `, [tenantId, d.name, d.form]);
      const drugId = drugRes.rows[0].drug_id;

      await client.query(`
        INSERT INTO emr.drug_batches (tenant_id, drug_id, batch_number, expiry_date, quantity_received, quantity_remaining, purchase_price)
        VALUES ($1, $2, $3, $4, $5, $5, $6)
      `, [tenantId, drugId, `K-BCH-${Math.floor(Math.random()*9000)+1000}`, '2027-06-30', d.stock, d.price]);
    }

    // 5. Initial Cash (100,000 INR)
    console.log('--- Setting Initial Cash ---');
    const cashPatientRes = await client.query(`
      INSERT INTO emr.patients (tenant_id, first_name, last_name, mrn, date_of_birth, gender)
      VALUES ($1, 'Kidz', 'Clinic-Internal', 'KC-CASH-001', '1900-01-01', 'Other')
      RETURNING id
    `, [tenantId]);
    const cashPatientId = cashPatientRes.rows[0].id;
    await client.query(`
      INSERT INTO emr.invoices (tenant_id, patient_id, description, subtotal, tax, total, paid, status, created_at, invoice_number)
      VALUES ($1, $2, 'Clinic Setup Cash', 100000, 0, 100000, 100000, 'paid', '2026-02-01', 'KC-INV-001')
    `, [tenantId, cashPatientId]);

    // 6. Test Patients (Pediatric)
    console.log('--- Adding Young Patients ---');
    const childPatientRes = await client.query(`
      INSERT INTO emr.patients (tenant_id, first_name, last_name, mrn, date_of_birth, gender, phone)
      VALUES ($1, 'Baby', 'Joy', 'KC-P-2001', '2025-11-20', 'Female', '7766554433')
      RETURNING id
    `, [tenantId]);
    const childId = childPatientRes.rows[0].id;

    await client.query(`
      INSERT INTO emr.encounters (tenant_id, patient_id, provider_id, encounter_type, status, chief_complaint, diagnosis)
      VALUES ($1, $2, $3, 'In-patient', 'open', 'Common Cold & Fever', 'Upper Respiratory Infection')
    `, [tenantId, childId, userMap['Doctor']]);

    await client.query('COMMIT');
    console.log(`✅ SUCCESS: "Kidz Clinic" seeded! Tenant ID: ${tenantId}`);
    
    console.log('\n--- Kidz Clinic Login ---');
    console.log('Admin: admin@kidz.com / Test@123');
    console.log('Doctor: emily@kidz.com / Test@123');
    console.log('Tenant Code: KC');

  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('❌ SEEDING FAILED:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedKidzClinic();
