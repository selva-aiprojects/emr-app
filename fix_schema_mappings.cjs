const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('Updating management_tenants with correct schema mappings...');
    
    // Check current state first
    const currentMappings = await query('SELECT id, name, schema_name FROM emr.management_tenants ORDER BY name');
    console.log('Current schema mappings:');
    currentMappings.rows.forEach(t => console.log('  ' + t.id + ' - ' + t.name + ' -> ' + t.schema_name));
    
    // Update Magnum Group Hospital to use mgohl schema
    await query('UPDATE emr.management_tenants SET schema_name = $1 WHERE id::text = $2::text', ['mgohl', '6dda48e1-51ea-4661-91c5-94a9c72f489c']);
    console.log('Updated Magnum Group Hospital -> mgohl');
    
    // Update Starlight Mega Center to use smcmega schema  
    await query('UPDATE emr.management_tenants SET schema_name = $1 WHERE id::text = $2::text', ['smcmega', 'bb80c757-2dc5-447d-9bfd-0acc53bcc762']);
    console.log('Updated Starlight Mega Center -> smcmega');
    
    console.log('\nSchema mappings updated successfully');
    
    // Verify the updates
    const result = await query('SELECT id, name, schema_name FROM emr.management_tenants ORDER BY name');
    console.log('\nUpdated schema mappings:');
    result.rows.forEach(t => console.log('  ' + t.id + ' - ' + t.name + ' -> ' + t.schema_name));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
