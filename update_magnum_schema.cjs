const { query } = require('./server/db/connection.js');

(async () => {
  try {
    // Update to point to the actual schema with data
    await query('UPDATE emr.management_tenants SET schema_name = $1 WHERE id::text = $2::text', ['mgohl', '6dda48e1-51ea-4661-91c5-94a9c72f489c']);
    
    console.log('Updated Magnum to point to mgohl schema');
    
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
