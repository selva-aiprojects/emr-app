const { getTenantSchema } = require('./server/utils/tenant-schema-helper.js');

(async () => {
  try {
    console.log('Testing schema resolution for available tenants...');
    
    const tenantIds = [
      '6dda48e1-51ea-4661-91c5-94a9c72f489c', // Magnum Group Hospital
      'bb80c757-2dc5-447d-9bfd-0acc53bcc762'  // Starlight Mega Center
    ];
    
    for (const tenantId of tenantIds) {
      try {
        const schema = await getTenantSchema(tenantId);
        console.log(`Tenant ${tenantId} -> Schema: ${schema}`);
      } catch (error) {
        console.log(`Tenant ${tenantId} -> Error: ${error.message}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
