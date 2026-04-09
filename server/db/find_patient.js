import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function findPatient() {
  const lastName = process.argv[2];
  if (!lastName) {
    console.error('Please provide a last name to search for.');
    process.exit(1);
  }

  try {
    console.log(`Searching for patient with last name: ${lastName}`);
    
    // 1. Check schemas
    const schemasRes = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')");
    const schemas = schemasRes.rows.map(r => r.schema_name);
    console.log('Available schemas:', schemas.join(', '));

    for (const schema of schemas) {
      try {
        const tableCheck = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'patients'`, [schema]);
        if (tableCheck.rows.length > 0) {
          const res = await pool.query(`SELECT id, first_name, last_name, tenant_id FROM "${schema}".patients WHERE last_name ILIKE $1`, [`%${lastName}%`]);
          if (res.rows.length > 0) {
            console.log(`[FOUND in ${schema}]`);
            console.table(res.rows);
          }
        }
      } catch (e) {
        // Skip schemas where we can't search
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

findPatient();
