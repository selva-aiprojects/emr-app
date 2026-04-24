import { query } from './server/db/connection.js';
import fs from 'fs';

async function magnumFullSetup() {
  console.log('🚀 MAGNUM Full Setup: NEXUS + SHARD Baseline');

  try {
    // 1. NEXUS (Control Plane) - Idempotent
    console.log('📡 Applying NEXUS_MASTER_BASELINE...');
    const nexusSql = fs.readFileSync('./database/NEXUS_MASTER_BASELINE.sql', 'utf8');
    await query('SET search_path TO emr, public;');
    await query(nexusSql);
    console.log('✅ NEXUS applied');

    // 2. CREATE magnum SCHEMA if missing
    await query('CREATE SCHEMA IF NOT EXISTS magnum;');
    console.log('✅ magnum schema ready');

    // 3. SHARD (Data Plane) in magnum
    console.log('🔬 Applying SHARD_MASTER_BASELINE to magnum...');
    const shardSql = fs.readFileSync('./database/SHARD_MASTER_BASELINE.sql', 'utf8');
    await query('SET search_path TO magnum, emr, public;');
    await query(shardSql);
    console.log('✅ SHARD applied to magnum');

    // 4. Verify seeds
    const countQuery = `SELECT 
      (SELECT COUNT(*) FROM magnum.departments) as depts,
      (SELECT COUNT(*) FROM magnum.wards) as wards,
      (SELECT COUNT(*) FROM magnum.beds) as beds,
      (SELECT COUNT(*) FROM magnum.services) as services,
      (SELECT COUNT(*) FROM magnum.insurance_providers) as insurers
    `;
    const verification = await query(countQuery);
    console.log('📊 Verification:', verification.rows[0]);

    // 5. Refresh metrics (get magnum tenant_id)
    const tenantRes = await query("SELECT id FROM emr.management_tenants WHERE code = 'magnum'");
    if (tenantRes.rows.length > 0) {
      const tenantId = tenantRes.rows[0].id;
      await query('SELECT emr.refresh_management_tenant_metrics($1::text, \'magnum\')', [tenantId]);
      console.log('✅ Metrics refreshed');
    }

    // 6. Superadmin check
    const adminRes = await query("SELECT name FROM emr.users WHERE email = 'superadmin@magnum.com'");
    if (adminRes.rows.length > 0) {
      console.log('👑 Superadmin ready:', adminRes.rows[0].name);
    }

    console.log('🎉 MAGNUM Full Setup COMPLETE!');
    console.log('💡 Next: npm run dev → Superadmin login → Create fresh tenant');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

magnumFullSetup();
