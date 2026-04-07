import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function auditNodes() {
  try {
    const { rows: schemasRes } = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'emr')");
    const schemas = schemasRes.map(r => r.schema_name);
    
    for (const schema of schemas) {
      console.log(`\n--- Auditing Institutional Node: ${schema.toUpperCase()} ---`);
      try {
        const pCount = await pool.query(`SELECT count(*) FROM ${schema}.patients`);
        console.log(`Patients in ${schema}:`, pCount.rows[0].count);
        
        const dCount = await pool.query(`SELECT count(*) FROM ${schema}.users WHERE lower(role) LIKE '%doctor%'`);
        console.log(`Doctors in ${schema}:`, dCount.rows[0].count);
        
        const bCount = await pool.query(`SELECT count(*)::int FROM ${schema}.beds WHERE lower(status) = 'available'`);
        console.log(`Beds available in ${schema}:`, bCount.rows[0].count);
      } catch (e) {
        console.warn(`⚠️ Schema ${schema} access check failed:`, e.message);
      }
    }

    console.log('\n--- Management Plane Telemetry (emr.management_tenant_metrics) ---');
    const metrics = await pool.query('SELECT tenant_code, doctors_count, patients_count FROM emr.management_tenant_metrics');
    console.table(metrics.rows);

    console.log('\n--- Management Plane Global Summary (emr.management_dashboard_summary) ---');
    const summary = await pool.query('SELECT total_tenants, total_doctors, total_patients FROM emr.management_dashboard_summary');
    console.table(summary.rows);

  } catch (err) {
    console.error('❌ Audit failed:', err.message);
  } finally {
    await pool.end();
  }
}

auditNodes();
