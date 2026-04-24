const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== Checking Starlight Data Details ===');
    
    // Check patients with tenant_id
    const patients = await query('SELECT id, tenant_id, created_at FROM smcmega.patients LIMIT 3');
    console.log('Patients sample:');
    patients.rows.forEach(p => console.log('  ID:', p.id, 'Tenant:', p.tenant_id, 'Created:', p.created_at));
    
    // Check invoices with tenant_id and dates
    const invoices = await query('SELECT id, tenant_id, total, created_at, status FROM smcmega.invoices LIMIT 3');
    console.log('\nInvoices sample:');
    invoices.rows.forEach(i => console.log('  ID:', i.id, 'Tenant:', i.tenant_id, 'Total:', i.total, 'Created:', i.created_at, 'Status:', i.status));
    
    // Check today's date vs created dates
    const today = new Date().toISOString().split('T')[0];
    console.log('\nToday:', today);
    
    // Check for any invoices created today
    const todayInvoices = await query('SELECT COUNT(*) as count FROM smcmega.invoices WHERE DATE(created_at) = $1', [today]);
    console.log('Invoices created today:', todayInvoices.rows[0].count);
    
    // Check total patients and invoices (all time)
    const totalPatients = await query('SELECT COUNT(*) as count FROM smcmega.patients');
    const totalInvoices = await query('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM smcmega.invoices WHERE status = $1', ['paid']);
    console.log('\nTotal patients (all time):', totalPatients.rows[0].count);
    console.log('Total paid invoices (all time):', totalInvoices.rows[0].count, 'Total revenue:', totalInvoices.rows[0].total);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
