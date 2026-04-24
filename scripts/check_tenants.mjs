import { query } from '../server/db/connection.js';

const r = await query("SELECT name, code, subscription_tier, status FROM emr.tenants ORDER BY name");
console.log('=== TENANTS ===');
r.rows.forEach(t => console.log(`${t.name} | code=${t.code} | tier=${t.subscription_tier} | status=${t.status}`));

// Check users for Free and Basic tier tenants
const r2 = await query(`
  SELECT u.email, u.role, t.name as tenant_name, t.subscription_tier 
  FROM emr.users u 
  JOIN emr.tenants t ON u.tenant_id = t.id 
  WHERE t.name LIKE '%Demo%' OR t.name LIKE '%Free%' OR t.name LIKE '%Basic%' OR t.name LIKE '%seedling%' OR t.name LIKE '%greenvalley%'
  ORDER BY t.name, u.role
`);
console.log('\n=== DEMO USERS ===');
r2.rows.forEach(u => console.log(`${u.tenant_name} | ${u.email} | role=${u.role}`));

process.exit(0);
