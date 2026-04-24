const bcrypt = require('bcryptjs');
const { query } = require('../server/db/connection.js'); // adjust path if needed

const PASSWORD = 'Admin@123';
const hashedPassword = bcrypt.hashSync(PASSWORD, 10);

(async () => {
  try {
    const tenants = await query('SELECT id, code FROM emr.management_tenants WHERE status = \'active\'');
    for (const t of tenants.rows) {
      const standardEmail = `admin@${t.code}.com`;
      const name = `${t.code.toUpperCase()} Admin`;
      
      // UPSERT emr.users
      await query(`
        INSERT INTO emr.users (id, tenant_id, email, password_hash, name, role, is_active)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, 'Admin', true)
        ON CONFLICT (email) DO UPDATE SET 
          tenant_id = $1, password_hash = $3, name = $4, role = 'Admin', is_active = true
      `, [t.id, standardEmail, hashedPassword, name]);
      
      console.log(`Updated ${standardEmail} for ${t.code} (${t.id.slice(0,8)})`);
    }
    console.log('Standardization complete!');
  } catch (error) {
    console.error('Error:', error.message);
  }
})();

