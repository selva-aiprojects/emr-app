import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function auditNodes() {
  try {
    const schemas = ['ehs', 'nah'];
    
    for (const schema of schemas) {
      console.log(`\n--- Auditing Node: ${schema} ---`);
      try {
        const pCount = await pool.query(`SELECT count(*) FROM ${schema}.patients`);
        console.log(`Patients in ${schema}:`, pCount.rows[0].count);
        
        const dCount = await pool.query(`SELECT count(*) FROM ${schema}.users WHERE role = 'Doctor'`);
        console.log(`Doctors in ${schema}:`, dCount.rows[0].count);
        
        const bCount = await pool.query(`SELECT count(*) FROM ${schema}.beds WHERE status = 'available'`);
        console.log(`Beds available in ${schema}:`, bCount.rows[0].count);
      } catch (e) {
        console.warn(`⚠️ Schema ${schema} access fail:`, e.message);
      }
    }

    console.log('\n--- Management Plane Metrics ---');
    const metrics = await pool.query('SELECT tenant_code, doctors_count, patients_count FROM public.management_tenant_metrics');
    console.table(metrics.rows);

    console.log('\n--- Global Summary ---');
    const summary = await pool.query('SELECT total_tenants, total_doctors, total_patients FROM public.management_dashboard_summary');
    console.table(summary.rows);

  } catch (err) {
    console.error('❌ Audit failed:', err.message);
  } finally {
    await pool.end();
  }
}

auditNodes();
