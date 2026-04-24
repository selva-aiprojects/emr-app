const { query } = require('../server/db/connection.js');
const bcrypt = require('bcryptjs');

const NEW_PASSWORD = 'Admin@123';
const NEW_HASH = bcrypt.hashSync(NEW_PASSWORD, 10); // Use same salt rounds

async function fixHashes() {
  console.log('🔧 Fixing lower case admin hashes...');
  
  // Find all lower case admin emails
  const admins = await query(`
    SELECT id, tenant_id, email, name FROM emr.users 
    WHERE LOWER(email) LIKE 'admin@%.com' AND email = LOWER(email)
  `);

  console.log(`Found ${admins.rows.length} lower case admins to fix.`);

  let fixed = 0;
  for (const admin of admins.rows) {
    await query(`
      UPDATE emr.users 
      SET password_hash = $1 
      WHERE id = $2
    `, [NEW_HASH, admin.id]);
    console.log(`✅ Fixed ${admin.email} for tenant ${admin.tenant_id?.slice(0,8)}`);
    fixed++;
  }

  console.log(`Complete! Fixed ${fixed} lower case admin passwords.`);
}

fixHashes().catch(console.error);

