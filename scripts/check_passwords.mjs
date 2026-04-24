import { query } from '../server/db/connection.js';
import { comparePassword } from '../server/services/auth.service.js';

// Find the users for our test tenants
const r = await query(`
  SELECT u.email, u.name, u.role, u.is_active, u.password_hash, t.name as tenant_name, t.code as tenant_code
  FROM emr.users u 
  JOIN emr.tenants t ON u.tenant_id = t.id 
  WHERE t.name IN ('MedFlow Demo: Free Tier', 'MedFlow Demo: Basic Tier', 'MedFlow Demo: Pro Tier', 'MedFlow Demo: Enterprise Tier')
  ORDER BY t.name
`);

console.log('=== USER CREDENTIALS CHECK ===');
for (const row of r.rows) {
  const match = await comparePassword('Test@123', row.password_hash);
  console.log(`${row.tenant_name} | ${row.email} | role=${row.role} | active=${row.is_active} | password_match=${match}`);
}

process.exit(0);
