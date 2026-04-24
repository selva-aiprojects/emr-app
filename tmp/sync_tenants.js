import { query } from '../server/db/connection.js';

async function syncRegistryWithSchemas() {
  try {
    console.log('🔍 Auditing Management Registry vs Database Schemas...');
    
    // 1. Get all actual schemas in the DB
    const { rows: actualSchemas } = await query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'emr')
    `);
    const schemaList = actualSchemas.map(s => s.schema_name.toLowerCase());
    console.log('✅ Actual DB Schemas found:', schemaList);

    // 2. Get all registered tenants
    const { rows: registeredTenants } = await query('SELECT id, code, schema_name FROM emr.management_tenants');
    console.log('📋 Registered in management_tenants:', registeredTenants.map(t => t.schema_name));

    // 3. Identify orphans (registered but schema missing)
    const orphans = registeredTenants.filter(t => !schemaList.includes(t.schema_name.toLowerCase()));
    
    if (orphans.length > 0) {
      console.log('⚠️ Found orphaned registrations (no physical schema exists):', orphans.map(o => o.code));
      
      for (const orphan of orphans) {
        console.log(`🧹 Removing orphaned tenant: ${orphan.code} (${orphan.id})`);
        await query('DELETE FROM emr.management_tenants WHERE id = $1', [orphan.id]);
        // Also remove from legacy tenants table if it exists there
        await query('DELETE FROM emr.tenants WHERE id = $1', [orphan.id]).catch(() => {});
      }
      console.log('✨ Registry pruned successfully.');
    } else {
      console.log('✅ Registry is already in sync with physical schemas.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
    process.exit(1);
  }
}

syncRegistryWithSchemas();
