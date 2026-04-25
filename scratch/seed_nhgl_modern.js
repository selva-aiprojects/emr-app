import pg from 'pg';
import { faker } from '@faker-js/faker';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedNHGL() {
  try {
    await client.connect();
    console.log('🚀 Starting Modern NHGL Seeder (Indestructible Mode)...');

    // 0. SET SEARCH PATH
    await client.query('SET search_path TO nhgl, nexus, public');

    // 1. Get NHGL Tenant ID
    const tenantRes = await client.query("SELECT id FROM nexus.tenants WHERE code = 'nhgl'");
    if (tenantRes.rows.length === 0) {
      console.error('❌ NHGL Tenant not found in nexus.tenants.');
      process.exit(1);
    }
    const tenantId = tenantRes.rows[0].id;

    // 2. Clear existing clinical data (Safe Mode)
    console.log('🧹 Clearing old NHGL data...');
    const tables = ['invoice_items', 'invoices', 'attendance', 'encounters', 'appointments', 'patients', 'employees', 'users', 'roles', 'departments', 'wards', 'beds'];
    for (const t of tables) {
      try {
        await client.query(`TRUNCATE TABLE nhgl.${t} CASCADE`);
      } catch (e) {
        if (e.code !== '42P01') {
          console.warn(`⚠️ Warning clearing ${t}:`, e.message);
        }
      }
    }

    // 3. Seed Local Roles
    console.log('🔑 Seeding Local Roles...');
    const roles = ['doctor', 'nurse', 'pharmacist', 'lab', 'admin', 'receptionist'];
    for (const r of roles) {
      await client.query(`INSERT INTO nhgl.roles (id, name) VALUES ($1::text, $2::text) ON CONFLICT (id) DO NOTHING`, [r, r.charAt(0).toUpperCase() + r.slice(1)]);
    }

    // 4. Seed Departments
    console.log('🏢 Seeding Departments...');
    const depts = [
      { name: 'Emergency', code: 'ER' },
      { name: 'Cardiology', code: 'CARD' },
      { name: 'General OPD', code: 'OPD' },
      { name: 'Inpatient Department', code: 'IPD' },
      { name: 'Pharmacy', code: 'PHARM' }
    ];
    const deptIds = [];
    for (const d of depts) {
      const res = await client.query(`
        INSERT INTO nhgl.departments (tenant_id, name, code, is_active)
        VALUES ($1::text, $2::text, $3::text, true) 
        ON CONFLICT (tenant_id, name) DO UPDATE SET code = EXCLUDED.code
        RETURNING id
      `, [tenantId, d.name, d.code]);
      deptIds.push(res.rows[0].id);
    }

    // 5. Seed Staff (Identity Bridge)
    console.log('👨‍⚕️ Seeding Staff (Local Identity)...');
    
    const adminEmail = 'admin@nhgl.com';
    const adminHash = '$2a$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC'; // Admin@123
    
    await client.query(`
      INSERT INTO nexus.users (id, tenant_id, email, password_hash, name, role_id)
      VALUES ($1::text, $2::text, $3::text, $4::text, 'NHGL Administrator', 'admin')
      ON CONFLICT (email) DO UPDATE SET tenant_id = EXCLUDED.tenant_id
    `, [adminEmail, tenantId, adminEmail, adminHash]);

    for (let i = 0; i < 10; i++) {
      const role = roles[i % roles.length];
      const email = i === 0 ? adminEmail : `staff${i}@nhgl.com`;
      const name = i === 0 ? 'NHGL Administrator' : faker.person.fullName();
      
      await client.query(`
        INSERT INTO nhgl.users (id, tenant_id, email, name, role)
        VALUES ($1::text, $2::text, $3::text, $4::text, $5::text)
        ON CONFLICT (id) DO NOTHING
      `, [email, tenantId, email, name, role]);

      await client.query(`
        INSERT INTO nhgl.employees (tenant_id, user_id, employee_code, first_name, last_name, designation, department_id, salary_basic, join_date)
        VALUES ($1::text, $2::text, $3::text, $4::text, $5::text, $6::text, $7::text, $8, $9)
        ON CONFLICT (employee_code) DO NOTHING
      `, [tenantId, email, `NHGL-EMP-${1000 + i}`, name.split(' ')[0], name.split(' ')[1] || 'Staff', role, deptIds[i % deptIds.length], 45000 + (i * 5000), faker.date.past()]);
    }

    // 6. Seed Patients
    console.log('👥 Seeding Patients...');
    for (let i = 0; i < 15; i++) {
      await client.query(`
        INSERT INTO nhgl.patients (tenant_id, mrn, first_name, last_name, gender, date_of_birth, phone, email)
        VALUES ($1::text, $2::text, $3::text, $4::text, $5::text, $6, $7::text, $8::text)
        ON CONFLICT (mrn) DO NOTHING
      `, [tenantId, `MRN-NH-${2000 + i}`, faker.person.firstName(), faker.person.lastName(), i % 2 === 0 ? 'Male' : 'Female', faker.date.birthdate({ min: 18, max: 75, mode: 'age' }), faker.phone.number(), faker.internet.email()]);
    }

    console.log('\n✅ [SUCCESS] NHGL Demo Data is now live.');
    console.log('👉 Final Step: npm run dev');

  } catch (err) {
    console.error('\n❌ [FATAL] Seeding Failed:', err.message);
  } finally {
    await client.end();
  }
}

seedNHGL();
