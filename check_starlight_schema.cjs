const { query } = require('./server/db/connection.js');

(async () => {
  try {
    const result = await query('SELECT id, name, schema_name FROM emr.management_tenants WHERE name LIKE $1 ORDER BY name', ['%Starlight%']);
    console.log('Starlight schema mappings:');
    result.rows.forEach(t => console.log('  ' + t.id + ' - ' + t.name + ' -> ' + t.schema_name));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
