const { query } = require('./server/db/connection.js');

async function listTables() {
  try {
    const result = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'emr' AND table_type = 'BASE TABLE'");
    console.log('Available tables in emr schema:');
    result.rows.forEach(r => console.log(`- ${r.table_name}`));
    process.exit(0);
  } catch (error) {
    console.error('Error listing tables:', error);
    process.exit(1);
  }
}

listTables();
