const { query } = require('./server/db/connection.js');

(async () => {
  try {
    // Update the first Magnum entry to point to the correct schema
    await query('UPDATE emr.management_tenants SET schema_name = $1 WHERE id::text = $2::text', ['mghpl', '3ed7f4d8-2670-4c5b-bd5c-2ee7c9cf4e91']);
    
    // Update the second Magnum entry to point to mgohl (the actual schema with data)
    await query('UPDATE emr.management_tenants SET schema_name = $1 WHERE id::text = $2::text', ['mgohl', '6dda48e1-51ea-4661-91c5-94a9c72f489c']);
    
    console.log('Fixed Magnum schema mappings');
    
    // Verify
    const result = await query('SELECT id, name, schema_name FROM emr.management_tenants WHERE name LIKE $1 ORDER BY name', ['%Magnum%']);
    console.log('\nMagnum schema mappings:');
    result.rows.forEach(t => console.log('  ' + t.id + ' - ' + t.name + ' -> ' + t.schema_name));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
