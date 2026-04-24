import { query } from '../server/db/connection.js';

async function checkNahSchemas() {
  try {
    const res = await query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE '%nah%'
    `);
    
    console.log("Found schemas containing 'nah':");
    res.rows.forEach(r => console.log(`- ${r.schema_name}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkNahSchemas();
