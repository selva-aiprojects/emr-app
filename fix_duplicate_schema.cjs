const { query } = require('./server/db/connection.js');

(async () => {
  try {
    // Delete the duplicate entry that points to wrong schema
    await query('DELETE FROM emr.management_tenants WHERE id::text = $1::text', ['3ed7f4d8-2670-4c5b-bd5c-2ee7c9cf4e91']);
    console.log('Deleted duplicate Magnum entry');
    
    // The correct entry (6dda48e1-51ea-4661-91c5-94a9c72f489c) should already point to mgohl
    // Let's verify
    const result = await query('SELECT id, name, schema_name FROM emr.management_tenants WHERE name LIKE $1 ORDER BY name', ['%Magnum%']);
    console.log('\nMagnum schema mappings:');
    result.rows.forEach(t => console.log('  ' + t.id + ' - ' + t.name + ' -> ' + t.schema_name));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
