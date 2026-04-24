const { query } = require('../server/db/connection.js');

(async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS emr.mrn_sequences (
        tenant_id UUID PRIMARY KEY,
        sequence_value BIGINT DEFAULT 0
      );
    `);
    console.log('✅ emr.mrn_sequences created');
    
    await query(`
      CREATE TABLE IF NOT EXISTS emr.invoice_sequences (
        tenant_id UUID PRIMARY KEY,
        sequence_value BIGINT DEFAULT 0
      );
    `);
    console.log('✅ emr.invoice_sequences created');
    
    // Seed for magnum if empty
    const magRes = await query('SELECT id FROM emr.management_tenants WHERE code = $1', ['MAGNUM']);
    if (magRes.rows.length > 0) {
      await query('INSERT INTO emr.mrn_sequences (tenant_id) VALUES ($1) ON CONFLICT DO NOTHING', [magRes.rows[0].id]);
      console.log('✅ Seeded magnum MRN sequence');
    }
    
    console.log('🎉 MRN sequences ready!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  }
})();

