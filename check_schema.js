const { query } = require('./server/db/connection.js');

(async () => {
  try {
    const schemas = await query('SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ($1, $2, $3)', ['information_schema', 'pg_catalog', 'pg_toast']);
    console.log('Available schemas:', schemas.rows.map(r => r.schema_name));
    
    const tables = await query('SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ($1, $2, $3) ORDER BY table_schema, table_name', ['information_schema', 'pg_catalog', 'pg_toast']);
    console.log('\nAvailable tables:');
    tables.rows.forEach(t => console.log('  ' + t.table_schema + '.' + t.table_name));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
