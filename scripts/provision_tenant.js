
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const DEFAULT_PWD = bcrypt.hashSync('Test@123', 10);

/**
 * Standardized Tenant Provisioning Flow
 */
async function provisionHospital(name, code, subdomain, primaryColor) {
  console.log(`🏥 Provisioning New Tenant: ${name} [${code}]...`);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create Tenant Record
    const tenantRes = await client.query(`
      INSERT INTO emr.tenants (name, code, subdomain, theme, features, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING id
    `, [name, code, subdomain, JSON.stringify({ primary: primaryColor }), JSON.stringify({
      emr: true, pharmacy: true, billing: true, inventory: true, insurance: true, hcm: true
    })]);
    const tenantId = tenantRes.rows[0].id;

    // 2. Setup Standard Roles & Staff
    const defaultStaff = [
      { role: 'Admin', email: `admin@${subdomain}.com`, name: `${name} Admin` },
      { role: 'Doctor', email: `doctor@${subdomain}.com`, name: `Dr. Lead ${name}` },
      { role: 'Nurse', email: `nurse@${subdomain}.com`, name: `Head Nurse` },
      { role: 'Accountant', email: `finance@${subdomain}.com`, name: `Finance Lead` },
      { role: 'Supervisor', email: `supervisor@${subdomain}.com`, name: `Ops Supervisor` },
      { role: 'Auditor', email: `audit@${subdomain}.com`, name: `Systems Auditor` }
    ];

    for (const s of defaultStaff) {
      const uRes = await client.query(`
        INSERT INTO emr.users (tenant_id, name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [tenantId, s.name, s.email, DEFAULT_PWD, s.role]);
      
      await client.query(`
        INSERT INTO emr.employees (tenant_id, name, code, designation, join_date)
        VALUES ($1, $2, $3, $4, NOW())
      `, [tenantId, s.name, `EMP-${code}-${s.role.toUpperCase()}`, s.role]);
    }

    // 3. Infrastructure (Wards)
    await client.query(`
      INSERT INTO emr.wards (tenant_id, name, type, base_rate)
      VALUES 
        ($1, 'General Ward', 'General', 1000),
        ($1, 'Emergency Unit', 'Emergency', 5000),
        ($1, 'Intensive Care Unit', 'ICU', 10000)
    `, [tenantId]);

    await client.query('COMMIT');
    console.log(`✅ Provisioning Success: ${name} is now live!`);
    return tenantId;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`❌ Provisioning Failed for ${name}:`, err);
    throw err;
  } finally {
    client.release();
  }
}

// Example usage if run directly
const args = process.argv.slice(2);
if (args.length >= 3) {
  provisionHospital(args[0], args[1], args[2], args[3] || '#0f5a6e')
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  console.log('Usage: node provision_tenant.js "Hospital Name" HLTH subdomain #hexcolor');
  // I will not call it here, this is a library-ready script now.
  pool.end();
}
