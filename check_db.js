import { query } from './server/db/connection.js';

async function check() {
  try {
    const tenants = await query('SELECT count(*) FROM emr.tenants');
    const m_tenants = await query('SELECT count(*) FROM emr.management_tenants');
    const summary = await query('SELECT * FROM emr.management_dashboard_summary');
    const metrics = await query('SELECT * FROM emr.management_tenant_metrics');
    
    console.log('--- DB STATE ---');
    console.log('Tenants Table (EMR):', tenants.rows[0].count);
    console.log('Management Tenants:', m_tenants.rows[0].count);
    console.log('Management Summary:', summary.rows);
    console.log('Management Metrics:', metrics.rows.length);
    
    if (metrics.rows.length > 0) {
      console.log('First Metric Row Doctors:', metrics.rows[0].doctors_count);
    }
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    process.exit(0);
  }
}

check();
