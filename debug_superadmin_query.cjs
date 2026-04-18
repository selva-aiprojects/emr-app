const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Debugging Superadmin Query ===');
    
    // Get the exact same query that superadmin service uses
    const { rows: tenantRows } = await query(`
      SELECT 
        t.id as tenant_id,
        t.code as tenant_code,
        t.name as tenant_name,
        t.status,
        t.subscription_tier,
        t.contact_email,
        t.schema_name,
        COALESCE(mtm.doctors_count, 0) as doctors_count,
        COALESCE(mtm.patients_count, 0) as patients_count,
        COALESCE(mtm.available_beds, 0) as available_beds,
        COALESCE(mtm.available_ambulances, 0) as available_ambulances,
        COALESCE(mtm.active_users_count, 0) as active_users_count
      FROM emr.management_tenants t
      LEFT JOIN emr.management_tenant_metrics mtm ON t.id::text = mtm.tenant_id::text
      ORDER BY t.created_at DESC
    `);
    
    console.log('Found tenants:', tenantRows.length);
    
    // Focus on NHSL and Starlight
    const targetTenants = tenantRows.filter(t => 
      t.tenant_name.toLowerCase().includes('nitra') || 
      t.tenant_name.toLowerCase().includes('starlight')
    );
    
    console.log('\n=== Target Tenants ===');
    targetTenants.forEach(t => {
      console.log(`- ${t.tenant_name}:`);
      console.log(`  Tenant ID: ${t.tenant_id}`);
      console.log(`  Schema: ${t.schema_name}`);
      console.log(`  Cached Patients: ${t.patients_count}`);
      console.log(`  Cached Doctors: ${t.doctors_count}`);
      console.log(`  Cached Beds: ${t.available_beds}`);
      console.log(`  All Zero: ${Number(t.patients_count) === 0 && Number(t.doctors_count) === 0}`);
    });
    
    // Test live query for NHSL
    const nhslTenant = targetTenants.find(t => t.tenant_name.toLowerCase().includes('nitra'));
    if (nhslTenant) {
      console.log('\n=== Testing Live Query for NHSL ===');
      try {
        const schemaName = nhslTenant.schema_name;
        console.log(`Schema: ${schemaName}`);
        console.log(`Tenant ID: ${nhslTenant.tenant_id}`);
        
        const [pRes, dRes, bRes, aRes] = await Promise.all([
          query(`SELECT COUNT(*)::int as c FROM "${schemaName}".patients`).catch(() => ({ rows: [{ c: 0 }] })),
          query(`SELECT COUNT(*)::int as c FROM "${schemaName}".employees WHERE tenant_id = $1 AND (lower(designation) LIKE '%doctor%' OR lower(designation) LIKE '%consultant%' OR lower(designation) LIKE '%physician%' OR lower(designation) LIKE '%surgeon%')`, [nhslTenant.tenant_id]).catch(() => ({ rows: [{ c: 0 }] })),
          query(`SELECT COUNT(CASE WHEN status = 'available' THEN 1 END)::int as c FROM "${schemaName}".beds`).catch(() => ({ rows: [{ c: 0 }] })),
          query(`SELECT COUNT(CASE WHEN status = 'available' THEN 1 END)::int as c FROM "${schemaName}".ambulances`).catch(() => ({ rows: [{ c: 0 }] })),
        ]);
        
        console.log('Live Results:');
        console.log(`  Patients: ${pRes.rows[0]?.c || 0}`);
        console.log(`  Doctors: ${dRes.rows[0]?.c || 0}`);
        console.log(`  Beds: ${bRes.rows[0]?.c || 0}`);
        console.log(`  Ambulances: ${aRes.rows[0]?.c || 0}`);
        
      } catch (e) {
        console.log('Live query failed:', e.message);
      }
    }
    
    // Test live query for Starlight
    const starlightTenant = targetTenants.find(t => t.tenant_name.toLowerCase().includes('starlight'));
    if (starlightTenant) {
      console.log('\n=== Testing Live Query for Starlight ===');
      try {
        const schemaName = starlightTenant.schema_name;
        console.log(`Schema: ${schemaName}`);
        console.log(`Tenant ID: ${starlightTenant.tenant_id}`);
        
        const [pRes, dRes, bRes, aRes] = await Promise.all([
          query(`SELECT COUNT(*)::int as c FROM "${schemaName}".patients`).catch(() => ({ rows: [{ c: 0 }] })),
          query(`SELECT COUNT(*)::int as c FROM "${schemaName}".employees WHERE tenant_id = $1 AND (lower(designation) LIKE '%doctor%' OR lower(designation) LIKE '%consultant%' OR lower(designation) LIKE '%physician%' OR lower(designation) LIKE '%surgeon%')`, [starlightTenant.tenant_id]).catch(() => ({ rows: [{ c: 0 }] })),
          query(`SELECT COUNT(CASE WHEN status = 'available' THEN 1 END)::int as c FROM "${schemaName}".beds`).catch(() => ({ rows: [{ c: 0 }] })),
          query(`SELECT COUNT(CASE WHEN status = 'available' THEN 1 END)::int as c FROM "${schemaName}".ambulances`).catch(() => ({ rows: [{ c: 0 }] })),
        ]);
        
        console.log('Live Results:');
        console.log(`  Patients: ${pRes.rows[0]?.c || 0}`);
        console.log(`  Doctors: ${dRes.rows[0]?.c || 0}`);
        console.log(`  Beds: ${bRes.rows[0]?.c || 0}`);
        console.log(`  Ambulances: ${aRes.rows[0]?.c || 0}`);
        
      } catch (e) {
        console.log('Live query failed:', e.message);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
