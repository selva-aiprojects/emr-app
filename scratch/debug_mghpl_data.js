const { query } = require('../server/db/connection');

async function debugMGHPL() {
  try {
    console.log('--- MGHPL DIAGNOSTIC ---');
    
    const mgmt = await query('SELECT id, name, code, schema_name FROM emr.management_tenants WHERE code = $1', ['MGHPL']);
    console.log('Management Tenant:', mgmt.rows);

    const legacy = await query('SELECT id, name, code, subscription_tier FROM emr.tenants WHERE code = $1', ['MGHPL']);
    console.log('Legacy Tenant:', legacy.rows);

    if (mgmt.rows.length > 0) {
        const schema = mgmt.rows[0].schema_name;
        console.log(`Checking schema: ${schema}`);
        
        // Check for metrics
        const metrics = await query('SELECT * FROM emr.management_tenant_metrics WHERE tenant_id = $1', [mgmt.rows[0].id]);
        console.log('Metrics:', metrics.rows);
        
        // Count some stuff in the schema if it exists
        try {
            const patients = await query(`SELECT count(*) FROM ${schema}.patients`);
            console.log(`Patients in ${schema}:`, patients.rows[0].count);
        } catch (e) {
            console.log(`Error reading from ${schema}.patients:`, e.message);
        }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

debugMGHPL();
