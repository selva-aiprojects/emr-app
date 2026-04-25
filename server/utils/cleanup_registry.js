import pool from '../db/connection.js';

/**
 * CLEANUP UTILITY: Registry Alignment
 * Identifies and removes tenant metadata that lacks a corresponding physical schema.
 */
async function cleanupOrphanTenants() {
  console.log('🚀 [CLEANUP] Starting Registry Alignment Protocol...');
  
  try {
    // 1. Get all schemas actually in the DB
    const { rows: schemas } = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'emr')
    `);
    const existingSchemas = new Set(schemas.map(s => s.schema_name));
    console.log(`📊 [CLEANUP] Physical schemas detected: ${existingSchemas.size}`);

    // 2. Scan Management Plane
    const { rows: managementTenants } = await pool.query('SELECT id, code, schema_name FROM management_tenants');
    const managementOrphans = managementTenants.filter(t => !existingSchemas.has(t.schema_name));
    
    console.log(`📊 [CLEANUP] Management Plane Orphans: ${managementOrphans.length}`);

    if (managementOrphans.length > 0) {
      const orphanIds = managementOrphans.map(t => t.id);
      await pool.query('DELETE FROM management_tenants WHERE id = ANY($1)', [orphanIds]);
      console.log(`✅ [CLEANUP] Purged ${managementOrphans.length} records from management_tenants.`);
    }

    // 3. Scan Legacy Plane
    const { rows: legacyTenants } = await pool.query('SELECT id, code FROM tenants');
    // Legacy mapping: code.toLowerCase()
    const legacyOrphans = legacyTenants.filter(t => !existingSchemas.has(t.code.toLowerCase()));
    
    console.log(`📊 [CLEANUP] Legacy Plane Orphans: ${legacyOrphans.length}`);

    if (legacyOrphans.length > 0) {
      const legacyOrphanIds = legacyOrphans.map(t => t.id);
      await pool.query('DELETE FROM tenants WHERE id = ANY($1)', [legacyOrphanIds]);
      console.log(`✅ [CLEANUP] Purged ${legacyOrphans.length} records from legacy tenants.`);
    }

    console.log('✨ [CLEANUP] Registry Alignment Complete.');
  } catch (err) {
    console.error('❌ [CLEANUP_FATAL]', err.message);
  }
}

// Run cleanup
cleanupOrphanTenants().then(() => process.exit(0));
