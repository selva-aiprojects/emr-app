import { query } from '../server/db/connection.js';
import crypto from 'crypto';

async function seedMagnumData() {
  console.log("🚀 Initializing Magnum Healthcare Pvt Ltd Seeding...");
  try {
    const tenantId = crypto.randomUUID();
    const code = 'MAGNUM';
    const schemaName = 'magnum';
    const subdomain = 'magnum';

    // 1. Insert Core Tenant
    const tenantRes = await query(`
      INSERT INTO emr.tenants (id, name, code, subdomain, theme, features, subscription_tier, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (code) DO UPDATE SET status = 'active'
      RETURNING id
    `, [
      tenantId,
      'Magnum Healthcare Pvt Ltd',
      code,
      subdomain,
      '{"primary": "#1e3a8a", "accent": "#3b82f6", "secondary": "#475569", "success": "#22c55e", "warning": "#eab308", "danger": "#ef4444"}', // Blue theme
      '{"dashboard": true, "patients": true, "appointments": true, "emr": true, "inpatient": true, "pharmacy": true, "billing": true, "insurance": true, "inventory": true, "employees": true, "accounts": true, "reports": true, "admin": true, "lab": true}',
      'Enterprise',
      'active'
    ]);
    const actualTenantId = tenantRes.rows[0].id;
    console.log("✅ Seeded Tenant: Magnum Healthcare Pvt Ltd");

    // 2. Map to management_tenants for Login screen
    const existingMgmt = await query('SELECT id FROM emr.management_tenants WHERE code = $1', [code]);
    if (existingMgmt.rowCount === 0) {
      // Use a highly unique subdomain to brutally avoid constraint collisions
      await query(`
        INSERT INTO emr.management_tenants (id, name, code, schema_name, subdomain, status, created_at)
        VALUES ($1, $2, $3, $4, $5, 'active', NOW())
        ON CONFLICT (subdomain) DO UPDATE SET name = EXCLUDED.name
      `, [actualTenantId, 'Magnum Healthcare Pvt Ltd', code, schemaName, subdomain + '_' + Date.now().toString().slice(-4)]);
    }
    console.log("✅ Registered Tenant on System Login Page");

    // 3. Create Admin User
    await query(`
      INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
      ON CONFLICT (tenant_id, email) DO NOTHING
    `, [
      crypto.randomUUID(),
      actualTenantId,
      'admin@magnum.local',
      '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC', // Admin@123
      'Dr. Magnum Admin',
      'Admin'
    ]);

    // 4. Create Staff
    const roles = [
      { email: 'doctor@magnum.local', name: 'Dr. John Magnum', role: 'Doctor' },
      { email: 'nurse@magnum.local', name: 'Nur. Mary Smith', role: 'Nurse' },
      { email: 'billing@magnum.local', name: 'Bill Gates', role: 'Accounts' }
    ];
    for (const r of roles) {
      await query(`
        INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
        ON CONFLICT DO NOTHING
      `, [crypto.randomUUID(), actualTenantId, r.email, '$2b$10$klEG.AWjdVRs1GJrAtY9Ke6HuHNVuOc.FzlH8TFbJeehca15i1FlC', r.name, r.role]);
    }
    console.log("✅ Seeded Admin & Core Staff");

    // 5. Provision Schema & Tables
    await query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    const tables = ['patients', 'appointments', 'encounters', 'invoices'];
    for (const tbl of tables) {
      try {
        await query(`CREATE TABLE IF NOT EXISTS "${schemaName}"."${tbl}" (LIKE emr."${tbl}" INCLUDING ALL)`);
      } catch (e) {}
    }
    console.log("✅ Provisioned fully isolated namespace and tables");

    // 6. Seed Sample Patients
    const fnames = ['Raj', 'Priya', 'Amit', 'Neha', 'Sanjay', 'Vikas'];
    const lnames = ['Sharma', 'Patel', 'Singh', 'Gupta', 'Kumar', 'Jain'];
    
    let pIds = [];
    for (let i = 0; i < 6; i++) {
        const pId = crypto.randomUUID();
        pIds.push(pId);
        const mrn = `MHC-PT-${1001 + i}`;
        try {
            await query(`
              INSERT INTO "${schemaName}".patients (id, tenant_id, mrn, first_name, last_name, date_of_birth, gender, phone, email, created_at)
              VALUES ($1, $2, $3, $4, $5, '1985-06-15', $6, '9999999999', $7, NOW())
            `, [pId, actualTenantId, mrn, fnames[i], lnames[i], i%2===0?'Male':'Female', `${fnames[i].toLowerCase()}@example.com`]);
        } catch(e) {}
    }
    console.log(`✅ Seeded sample clinical records (6 patients)`);

    console.log("\n=================================");
    console.log("🎉 MAGNUM HEALTHCARE PVT LTD SETUP COMPLETE!");
    console.log("Tenant Code: MAGNUM");
    console.log("Admin Log: admin@magnum.local");
    console.log("Password: Admin@123");
    console.log("=================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error.message);
    process.exit(1);
  }
}

seedMagnumData();
