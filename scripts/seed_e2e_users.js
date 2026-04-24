import { query } from '../server/db/connection.js';
import bcrypt from 'bcryptjs';

const PASSWORD = 'Test@123';
const PASSWORD_HASH = await bcrypt.hash(PASSWORD, 10);

const TENANTS = [
  { name: 'City General Hospital', code: 'city_general', subdomain: 'city-general', tier: 'Enterprise' },
  { name: 'Enterprise Hospital Systems', code: 'EHS', subdomain: 'ehs', tier: 'Enterprise' }
];

const USERS = {
  city_general: [
    { email: 'lisa.white@citygen.local', role: 'Admin', name: 'Admin Lisa White' },
    { email: 'emily.chen@citygen.local', role: 'Doctor', name: 'Dr. Emily Chen' },
    { email: 'sarah.jones@citygen.local', role: 'Nurse', name: 'Nurse Sarah Jones' },
    { email: 'michael.brown@citygen.local', role: 'Lab', name: 'Lab Tech Michael Brown' },
    { email: 'robert.billing@citygen.local', role: 'Billing', name: 'Billing Officer Robert' },
    { email: 'jessica.taylor@citygen.local', role: 'Support Staff', name: 'Staff Jessica Taylor' }
  ],
  EHS: [
    { email: 'accounts@ehs.local', role: 'Accounts', name: 'Accounts Manager' },
    { email: 'insurance@ehs.local', role: 'Insurance', name: 'Insurance Coordinator' },
    { email: 'hr@ehs.local', role: 'HR', name: 'HR Manager' },
    { email: 'pharmacy@ehs.local', role: 'Pharmacy', name: 'Pharmacist John' },
    { email: 'ops@ehs.local', role: 'Operations', name: 'Ops Manager' },
    { email: 'doctor@ehs.local', role: 'Doctor', name: 'Dr. EHS Doctor' },
    { email: 'support@ehs.local', role: 'Support Staff', name: 'Support Staff' }
  ]
};

async function ensureTenant(tenant) {
  const existing = await query('SELECT id, code FROM emr.tenants WHERE code = $1', [tenant.code]);
  if (existing.rows.length) {
    const id = existing.rows[0].id;
    await query(
      `UPDATE emr.tenants
       SET name = $1, subdomain = $2, subscription_tier = $3, status = 'active', updated_at = NOW()
       WHERE id = $4`,
      [tenant.name, tenant.subdomain, tenant.tier, id]
    );
    return id;
  }

  const inserted = await query(
    `INSERT INTO emr.tenants (name, code, subdomain, subscription_tier, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING id`,
    [tenant.name, tenant.code, tenant.subdomain, tenant.tier]
  );
  return inserted.rows[0].id;
}

async function ensureUser(tenantId, user) {
  const found = await query(
    'SELECT id FROM emr.users WHERE tenant_id = $1 AND LOWER(email) = LOWER($2)',
    [tenantId, user.email]
  );

  if (found.rows.length) {
    await query(
      `UPDATE emr.users
       SET name = $1, role = $2, password_hash = $3, is_active = true, updated_at = NOW()
       WHERE id = $4`,
      [user.name, user.role, PASSWORD_HASH, found.rows[0].id]
    );
    return found.rows[0].id;
  }

  const created = await query(
    `INSERT INTO emr.users (tenant_id, email, password_hash, role, name, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING id`,
    [tenantId, user.email, PASSWORD_HASH, user.role, user.name]
  );
  return created.rows[0].id;
}

async function main() {
  console.log('🚀 Seeding E2E tenants & users...');
  for (const tenant of TENANTS) {
    const tenantId = await ensureTenant(tenant);
    const userList = USERS[tenant.code] || USERS[tenant.code.toUpperCase()] || [];
    for (const user of userList) {
      await ensureUser(tenantId, user);
    }
    console.log(`✅ Seeded ${tenant.name} (${userList.length} users)`);
  }
  console.log('✅ E2E seed complete. Password for all seeded users: Test@123');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ E2E seed failed:', err.message);
  process.exit(1);
});
