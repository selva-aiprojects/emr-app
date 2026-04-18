const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('Checking MGHPL patient data in emr schema...');
    
    const tenantId = '6dda48e1-51ea-4661-91c5-94a9c72f489c';
    
    // Check patient data in emr schema for MGHPL
    const patientCount = await query('SELECT COUNT(*) as count FROM emr.patients WHERE tenant_id::text = $1::text', [tenantId]);
    console.log('MGHPL patients in emr schema:', patientCount.rows[0]?.count || 0);
    
    // Check other tables in emr schema
    const tables = ['encounters', 'beds', 'invoices'];
    for (const table of tables) {
      try {
        const count = await query('SELECT COUNT(*) as count FROM emr.' + table + ' WHERE tenant_id::text = $1::text', [tenantId]);
        console.log('MGHPL ' + table + ' in emr schema:', count.rows[0]?.count || 0);
      } catch (e) {
        console.log('MGHPL ' + table + ' in emr schema: N/A');
      }
    }
    
    console.log('\nFixing schema mapping...');
    // Update MGHPL to point to emr schema instead of mgohl
    await query('UPDATE emr.management_tenants SET schema_name = $1 WHERE id::text = $2::text', ['emr', tenantId]);
    console.log('Updated MGHPL to use emr schema');
    
    // Verify the fix
    const { getTenantSchema } = require('./server/utils/tenant-schema-helper.js');
    const newSchema = await getTenantSchema(tenantId);
    console.log('MGHPL now resolves to:', newSchema);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
