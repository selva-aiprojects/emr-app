const { query } = require('./server/db/connection.js');

async function getTenants() {
  try {
    const result = await query("SELECT id, name, code FROM emr.tenants");
    console.log('Registered Tenants:');
    result.rows.forEach(r => console.log(`- ${r.name} (${r.code}): ID=${r.id}`));
    process.exit(0);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    process.exit(1);
  }
}

getTenants();
