import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function findSpecificPatient() {
  const searchTerm = process.argv[2];
  if (!searchTerm) {
    console.error('Please provide a name/MRN to search for.');
    process.exit(1);
  }

  try {
    console.log(`--- SCANNING FOR PATIENT: ${searchTerm} ---`);
    
    const schemasRes = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')");
    const schemas = schemasRes.rows.map(r => r.schema_name);

    let foundOnce = false;
    for (const schema of schemas) {
      const tableCheck = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'patients'`, [schema]);
      if (tableCheck.rows.length > 0) {
        const res = await pool.query(`SELECT id, first_name, last_name, mrn, tenant_id, created_at FROM "${schema}".patients WHERE last_name ILIKE $1 OR first_name ILIKE $1 OR mrn ILIKE $1`, [`%${searchTerm}%`]);
        if (res.rows.length > 0) {
          console.log(`\n✅ FOUND in Schema [${schema}]:`);
          console.table(res.rows);
          foundOnce = true;
        }
      }
    }

    if (!foundOnce) {
      console.log('\n❌ Patient NOT FOUND in any schema patients table.');
      
      // Secondary check: Audit log or similar if enabled
      console.log('\nScanning for any recent registration activity in management logs...');
      try {
         const logRes = await pool.query("SELECT * FROM audit_logs WHERE action ILIKE '%register%' OR details ILIKE $1 ORDER BY timestamp DESC LIMIT 5", [`%${searchTerm}%`]);
         if (logRes.rows.length > 0) console.table(logRes.rows);
         else console.log('No recent registration audit logs found.');
      } catch (e) {
         console.log('Audit logs table not accessible.');
      }
    }

  } catch (err) {
    console.error('Search failed:', err.message);
  } finally {
    await pool.end();
  }
}

findSpecificPatient();
