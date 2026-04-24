const { query } = require('./server/db/connection.js');

(async () => {
  try {
    console.log('=== All Tenants with Code, Admin Email ===');
    const result = await query(`
      SELECT 
        mt.id, mt.name, mt.code, mt.schema_name,
        u.email as admin_email, u.role, u.is_active
      FROM emr.management_tenants mt
      LEFT JOIN emr.users u ON mt.id = u.tenant_id AND u.role = 'Admin' AND u.is_active = true
      ORDER BY mt.name
    `);
    result.rows.forEach(t => {
      console.log(`${t.name} (${t.code}): admin@${t.code || 'unknown'}.com -> ${t.admin_email || 'NO ADMIN'}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
})();

